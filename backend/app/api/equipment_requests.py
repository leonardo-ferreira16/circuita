from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from sqlmodel import Session, select

from app.services.notification import (
    create_notifications,
    create_notification_for_user,
)

from app.db.session import get_session
from app.models.equipment_request import EquipmentRequest
from app.models.equipment import Equipment
from app.models.enums import EquipmentRequestStatus, EquipmentLocation, UserRole
from app.models.user import User
from app.api.deps import (
    require_equipment_manager_roles,
    require_requester_roles,
    require_viewer_roles,
    get_current_active_user,
)
from app.schemas.equipment_request import (
    EquipmentRequestCreate,
    EquipmentRequestRead,
    EquipmentRequestValidate,
)

router = APIRouter(prefix="/equipment-requests", tags=["Equipment Requests"])


def build_equipment_request_read(
    request: EquipmentRequest,
    session: Session,
):
    requester = session.get(User, request.requested_by_user_id)

    validator = None
    if request.validated_by_user_id:
        validator = session.get(User, request.validated_by_user_id)

    withdrawn_by_user = None
    if request.withdrawn_by_user_id:
        withdrawn_by_user = session.get(User, request.withdrawn_by_user_id)

    return {
        "id": request.id,
        "equipment_id": request.equipment_id,

        "requested_by_user_id": request.requested_by_user_id,
        "requested_by_user_name": requester.name if requester else None,

        "validated_by_user_id": request.validated_by_user_id,
        "validated_by_user_name": validator.name if validator else None,

        "withdrawn_by_user_id": request.withdrawn_by_user_id,
        "withdrawn_by_user_name": withdrawn_by_user.name if withdrawn_by_user else None,
        "withdrawn_at": request.withdrawn_at,

        "requested_quantity": request.requested_quantity,
        "location": request.location,

        "requested_area": request.requested_area,
        "justification": request.justification,
        "status": request.status,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
    }


def can_manage_equipment_request(
    current_user: User,
    request: EquipmentRequest,
):
    if current_user.role == UserRole.ITF:
        return True

    if (
        current_user.role == UserRole.GESTOR_GEAD
        and request.location == EquipmentLocation.GEAD
    ):
        return True

    return False


@router.post("/", response_model=EquipmentRequestRead)
def create_equipment_requests(
    data: EquipmentRequestCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_requester_roles),
):
    equipment = session.get(Equipment, data.equipment_id)

    if not equipment:
        raise HTTPException(
            status_code=404,
            detail="Equipamento não encontrado.",
        )

    if data.requested_quantity < 1:
        raise HTTPException(
            status_code=400,
            detail="A quantidade solicitada deve ser maior que zero.",
        )

    if data.requested_quantity > equipment.quantity:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Quantidade solicitada maior que o estoque disponível. "
                f"Disponível: {equipment.quantity}."
            ),
        )

    request = EquipmentRequest(
        equipment_id=data.equipment_id,
        requested_by_user_id=current_user.id,
        requested_quantity=data.requested_quantity,
        location=equipment.location,
        requested_area=current_user.area.value,
        justification=data.justification,
    )

    session.add(request)
    session.commit()
    session.refresh(request)

    create_notifications(
        session=session,
        title="Nova solicitação de equipamento",
        message=(
            f"{current_user.name} criou uma solicitação de "
            f"{data.requested_quantity} unidade(s) do equipamento "
            f"{equipment.name} para {request.requested_area}."
        ),
        type="equipment_request",
        reference_id=request.id,
        location=request.location,
    )

    return build_equipment_request_read(request, session)


@router.get("/", response_model=list[EquipmentRequestRead])
def list_equipment_requests(
    location: EquipmentLocation | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_viewer_roles),
):
    query = select(EquipmentRequest)

    if location is not None:
        query = query.where(EquipmentRequest.location == location)

    query = query.order_by(EquipmentRequest.created_at.desc())

    requests = session.exec(query).all()

    return [
        build_equipment_request_read(request, session)
        for request in requests
    ]


@router.get("/{request_id}", response_model=EquipmentRequestRead)
def get_equipment_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_viewer_roles),
):
    request = session.get(EquipmentRequest, request_id)

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Solicitação não encontrada",
        )

    return build_equipment_request_read(request, session)


@router.patch("/{request_id}/validate", response_model=EquipmentRequestRead)
def validate_equipment_request(
    request_id: int,
    data: EquipmentRequestValidate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_equipment_manager_roles),
):
    request = session.get(EquipmentRequest, request_id)

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Solicitação não encontrada.",
        )

    if not can_manage_equipment_request(current_user, request):
        raise HTTPException(
            status_code=403,
            detail="Você não tem permissão para validar esta solicitação.",
        )

    if request.status in {
        EquipmentRequestStatus.CANCELADA,
        EquipmentRequestStatus.REJEITADA,
        EquipmentRequestStatus.APROVADA,
        EquipmentRequestStatus.RETIRADO,
    }:
        raise HTTPException(
            status_code=400,
            detail="Solicitação já encerrada ou já validada.",
        )

    allowed_status = {
        EquipmentRequestStatus.APROVADA,
        EquipmentRequestStatus.REJEITADA,
    }

    if data.status not in allowed_status:
        raise HTTPException(
            status_code=400,
            detail="Status inválido para validação.",
        )

    equipment = session.get(Equipment, request.equipment_id)

    request.status = data.status
    request.validated_by_user_id = current_user.id
    request.updated_at = datetime.now(timezone.utc)

    if data.status == EquipmentRequestStatus.APROVADA:
        notification_title = "Solicitação de equipamento aprovada"
        notification_message = (
            f"Sua solicitação de {request.requested_quantity} unidade(s) "
            f"do equipamento {equipment.name if equipment else request.equipment_id} "
            f"foi aprovada."
        )
    else:
        notification_title = "Solicitação de equipamento rejeitada"
        notification_message = (
            f"Sua solicitação de {request.requested_quantity} unidade(s) "
            f"do equipamento {equipment.name if equipment else request.equipment_id} "
            f"foi rejeitada."
        )

    create_notification_for_user(
        session=session,
        user_id=request.requested_by_user_id,
        title=notification_title,
        message=notification_message,
        type="equipment_request_status",
        reference_id=request.id,
    )

    session.add(request)
    session.commit()
    session.refresh(request)

    return build_equipment_request_read(request, session)


@router.patch("/{request_id}/withdraw", response_model=EquipmentRequestRead)
def withdraw_equipment_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_equipment_manager_roles),
):
    request = session.get(EquipmentRequest, request_id)

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Solicitação não encontrada.",
        )

    if not can_manage_equipment_request(current_user, request):
        raise HTTPException(
            status_code=403,
            detail="Você não tem permissão para confirmar esta retirada.",
        )

    if request.status != EquipmentRequestStatus.APROVADA:
        raise HTTPException(
            status_code=400,
            detail="Apenas solicitações aprovadas podem ter retirada confirmada.",
        )

    equipment = session.get(Equipment, request.equipment_id)

    if not equipment:
        raise HTTPException(
            status_code=404,
            detail="Equipamento não encontrado.",
        )

    if equipment.quantity < request.requested_quantity:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Estoque insuficiente. Disponível: {equipment.quantity}. "
                f"Solicitado: {request.requested_quantity}."
            ),
        )

    equipment.quantity -= request.requested_quantity
    equipment.updated_at = datetime.now(timezone.utc)

    request.status = EquipmentRequestStatus.RETIRADO
    request.withdrawn_at = datetime.now(timezone.utc)
    request.withdrawn_by_user_id = current_user.id
    request.updated_at = datetime.now(timezone.utc)

    create_notification_for_user(
        session=session,
        user_id=request.requested_by_user_id,
        title="Retirada de equipamento confirmada",
        message=(
            f"A retirada de {request.requested_quantity} unidade(s) "
            f"do equipamento {equipment.name} foi confirmada."
        ),
        type="equipment_request_withdraw",
        reference_id=request.id,
    )

    session.add(equipment)
    session.add(request)
    session.commit()
    session.refresh(request)

    return build_equipment_request_read(request, session)


@router.patch("/{request_id}/cancel", response_model=EquipmentRequestRead)
def cancel_own_equipment_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    request = session.get(EquipmentRequest, request_id)

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Solicitação não encontrada",
        )

    if request.requested_by_user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Você só pode cancelar solicitações criadas por você.",
        )

    if request.status in {
        EquipmentRequestStatus.APROVADA,
        EquipmentRequestStatus.CANCELADA,
        EquipmentRequestStatus.REJEITADA,
        EquipmentRequestStatus.RETIRADO,
    }:
        raise HTTPException(
            status_code=400,
            detail="Solicitação não pode mais ser cancelada",
        )

    request.status = EquipmentRequestStatus.CANCELADA
    request.updated_at = datetime.now(timezone.utc)

    session.add(request)
    session.commit()
    session.refresh(request)

    return build_equipment_request_read(request, session)