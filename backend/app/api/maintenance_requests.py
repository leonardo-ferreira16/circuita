from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.services.notification import create_notifications

from app.db.session import get_session
from app.models.maintenance_request import MaintenanceRequest
from app.models.user import User
from app.api.deps import (
    require_requester_roles,
    require_viewer_roles,
    require_itf,
    get_current_active_user,
)

from app.schemas.maintenance_request import (
    MaintenanceRequestCreate,
    MaintenanceRequestRead,
    MaintenanceRequestValidate,
    MaintenanceRequestTechnicalUpdate,
)

from app.models.enums import MaintenanceRequestStatus


router = APIRouter(prefix="/maintenance-requests", tags=["Maintenance Requests"])

def build_maintenance_request_read(
    request: MaintenanceRequest,
    session: Session,
):
    requester = session.get(User, request.requested_by_user)

    validator = None
    if request.validated_by_user_id:
        validator = session.get(User, request.validated_by_user_id)

    return {
        "id": request.id,
        "equipment_name": request.equipment_name,
        "symptom_description": request.symptom_description,
        "sap_order": request.sap_order,
        "status": request.status,
        "requested_by_user": request.requested_by_user,
        "requested_by_user_name": requester.name if requester else None,
        "validated_by_user_id": request.validated_by_user_id,
        "validated_by_user_name": validator.name if validator else None,
        "diagnosis": request.diagnosis,
        "repair_status": request.repair_status,
        "cost_avoidance": request.cost_avoidance,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
    }

@router.post("/", response_model=MaintenanceRequestRead)
def create_maintenance_request(
    data: MaintenanceRequestCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_requester_roles),
):
    if not data.sap_order or not data.sap_order.strip():
        raise HTTPException(
            status_code=400,
            detail="A ordem SAP é obrigatória para abrir uma solicitação de manutenção.",
        )

    request = MaintenanceRequest(
        equipment_name=data.equipment_name,
        symptom_description=data.symptom_description,
        sap_order=data.sap_order.strip(),
        requested_by_user=current_user.id,
    )

    session.add(request)
    session.commit()
    session.refresh(request)

    create_notifications(
        session=session,
        title="Nova solicitação de manutenção",
        message=(
            f"Uma nova solicitação de manutenção foi criada para "
            f"{request.equipment_name} e aguarda validação do ITF."
        ),
        type="maintenance_request",
        reference_id=request.id,
    )

    return build_maintenance_request_read(request, session)


@router.get("/", response_model=list[MaintenanceRequestRead])
def list_maintenance_requests(
    status: MaintenanceRequestStatus | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_viewer_roles),
):
    query = select(MaintenanceRequest)

    if status is not None:
        query = query.where(MaintenanceRequest.status == status)

    query = query.order_by(MaintenanceRequest.created_at.desc())

    maintenance_requests = session.exec(query).all()

    return [
        build_maintenance_request_read(request, session)
        for request in maintenance_requests
    ]


@router.get("/{request_id}", response_model=MaintenanceRequestRead)
def get_maintenance_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_viewer_roles),
):
    request = session.get(MaintenanceRequest, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada.")

    return build_maintenance_request_read(request, session)


@router.patch("/{request_id}/validate", response_model=MaintenanceRequestRead)
def validate_maintenance_request(
    request_id: int,
    data: MaintenanceRequestValidate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_itf),
):
    request = session.get(MaintenanceRequest, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada.")

    if request.status != MaintenanceRequestStatus.AGUARDANDO_VALIDACAO_ITF:
        raise HTTPException(
            status_code=400,
            detail="Apenas solicitações aguardando validação podem ser validadas.",
        )

    allowed_status = {
        MaintenanceRequestStatus.VALIDADA,
        MaintenanceRequestStatus.REJEITADA,
    }

    if data.status not in allowed_status:
        raise HTTPException(
            status_code=400,
            detail="Status inválido para validação pelo ITF.",
        )

    request.status = data.status
    request.validated_by_user_id = current_user.id
    request.updated_at = datetime.now(timezone.utc)

    session.add(request)
    session.commit()
    session.refresh(request)

    return build_maintenance_request_read(request, session)


@router.patch("/{request_id}/technical-update", response_model=MaintenanceRequestRead)
def technical_update_maintenance_request(
    request_id: int,
    data: MaintenanceRequestTechnicalUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_itf),
):
    request = session.get(MaintenanceRequest, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada.")

    if request.status == MaintenanceRequestStatus.AGUARDANDO_VALIDACAO_ITF:
        raise HTTPException(
            status_code=400,
            detail="Solicitação precisa ser validada antes de receber atualização técnica.",
        )

    if request.status in {
        MaintenanceRequestStatus.CANCELADA,
        MaintenanceRequestStatus.REJEITADA,
        MaintenanceRequestStatus.FINALIZADA,
        MaintenanceRequestStatus.CONCLUIDA,
    }:
        raise HTTPException(
            status_code=400,
            detail="Solicitação encerrada não pode receber atualização técnica.",
        )

    allowed_technical_status = {
        MaintenanceRequestStatus.VALIDADA,
        MaintenanceRequestStatus.MANUTENCAO_INICIADA,
        MaintenanceRequestStatus.FINALIZADA,
        MaintenanceRequestStatus.CONCLUIDA,
    }

    if data.status is not None and data.status not in allowed_technical_status:
        raise HTTPException(
            status_code=400,
            detail="Status inválido para atualização técnica.",
        )

    if data.cost_avoidance is not None and data.cost_avoidance < 0:
        raise HTTPException(
            status_code=400,
            detail="O valor de cost avoidance não pode ser negativo.",
        )

    if data.diagnosis is not None:
        request.diagnosis = data.diagnosis

    if data.repair_status is not None:
        request.repair_status = data.repair_status

    if data.cost_avoidance is not None:
        request.cost_avoidance = data.cost_avoidance

    if data.status is not None:
        request.status = data.status

    request.updated_at = datetime.now(timezone.utc)

    session.add(request)
    session.commit()
    session.refresh(request)

    return build_maintenance_request_read(request, session)


@router.patch("/{request_id}/cancel", response_model=MaintenanceRequestRead)
def cancel_own_maintenance_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    request = session.get(MaintenanceRequest, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada.")

    if request.requested_by_user != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Você só pode cancelar solicitações criadas por você.",
        )

    if request.status != MaintenanceRequestStatus.AGUARDANDO_VALIDACAO_ITF:
        raise HTTPException(
            status_code=400,
            detail="Solicitação não pode mais ser cancelada.",
        )

    request.status = MaintenanceRequestStatus.CANCELADA
    request.updated_at = datetime.now(timezone.utc)

    session.add(request)
    session.commit()
    session.refresh(request)

    return build_maintenance_request_read(request, session)