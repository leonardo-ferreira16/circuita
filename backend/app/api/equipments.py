from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select

from app.api.deps import require_equipment_manager_roles, require_viewer_roles
from app.db.session import get_session
from app.models.equipment import Equipment
from app.models.enums import EquipmentLocation, EquipmentType, UserRole
from app.models.user import User
from app.schemas.equipment import EquipmentCreate, EquipmentRead, EquipmentUpdate


router = APIRouter(prefix="/equipments", tags=["Equipments"])

UPLOAD_DIR = Path("app/static/equipments")

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

OUT_OF_STOCK_STATUS = "SEM ESTOQUE"
DEFAULT_AVAILABLE_STATUS = "DISPONÍVEL PARA USO"


def can_manage_equipment_location(
    current_user: User,
    equipment_location: EquipmentLocation,
):
    if current_user.role == UserRole.ITF:
        return True

    if (
        current_user.role == UserRole.GESTOR_GEAD
        and equipment_location == EquipmentLocation.GEAD
    ):
        return True

    return False


def normalize_equipment_type(
    location: EquipmentLocation,
    equipment_type: EquipmentType | None,
):
    if location == EquipmentLocation.LAB_ELETRONICA:
        return EquipmentType.ELETRONICO

    if location == EquipmentLocation.GEAD:
        if equipment_type is None:
            return EquipmentType.ELETRICO

        if equipment_type == EquipmentType.ELETRONICO:
            raise HTTPException(
                status_code=400,
                detail="Equipamentos do GEAD devem ser ELÉTRICOS ou MECÂNICOS.",
            )

        return equipment_type

    return equipment_type or EquipmentType.ELETRONICO


def sync_equipment_stock_status(equipment: Equipment):
    """
    Mantém o status coerente com a quantidade.
    - quantity <= 0: força SEM ESTOQUE.
    - quantity > 0 e status estava SEM ESTOQUE: volta para DISPONÍVEL PARA USO.
    """
    if equipment.quantity <= 0:
        equipment.quantity = 0
        equipment.status = OUT_OF_STOCK_STATUS
        return

    if equipment.status == OUT_OF_STOCK_STATUS:
        equipment.status = DEFAULT_AVAILABLE_STATUS


@router.post("/", response_model=EquipmentRead)
def create_equipment(
    data: EquipmentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_equipment_manager_roles),
):
    if not can_manage_equipment_location(current_user, data.location):
        raise HTTPException(
            status_code=403,
            detail="Você não tem permissão para criar equipamento neste local.",
        )

    equipment_type = normalize_equipment_type(
        location=data.location,
        equipment_type=data.equipment_type,
    )

    equipment = Equipment(
        name=data.name,
        model=data.model,
        manufacturer=data.manufacturer,
        sap_code=data.sap_code,
        equipment_type=equipment_type,
        serial_number=data.serial_number,
        status=data.status,
        quantity=data.quantity,
        location=data.location,
        photo_url=data.photo_url,
        owner_area=data.owner_area,
        description=data.description,
        created_by_user_id=current_user.id,
    )

    sync_equipment_stock_status(equipment)

    session.add(equipment)
    session.commit()
    session.refresh(equipment)

    return equipment


@router.get("/", response_model=list[EquipmentRead])
def list_equipment(
    location: EquipmentLocation | None = None,
    equipment_type: EquipmentType | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_viewer_roles),
):
    query = select(Equipment)

    if location is not None:
        query = query.where(Equipment.location == location)

    if equipment_type is not None:
        query = query.where(Equipment.equipment_type == equipment_type)

    query = query.order_by(Equipment.created_at.desc())

    equipments = session.exec(query).all()

    return equipments


@router.get("/{equipment_id}", response_model=EquipmentRead)
def get_equipment(
    equipment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_viewer_roles),
):
    equipment = session.get(Equipment, equipment_id)

    if not equipment:
        raise HTTPException(
            status_code=404,
            detail="Equipamento não encontrado.",
        )

    return equipment


@router.patch("/{equipment_id}", response_model=EquipmentRead)
def update_equipment(
    equipment_id: int,
    data: EquipmentUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_equipment_manager_roles),
):
    equipment = session.get(Equipment, equipment_id)

    if not equipment:
        raise HTTPException(
            status_code=404,
            detail="Equipamento não encontrado.",
        )

    if not can_manage_equipment_location(current_user, equipment.location):
        raise HTTPException(
            status_code=403,
            detail="Você não tem permissão para editar este equipamento.",
        )

    if data.name is not None:
        equipment.name = data.name

    if data.model is not None:
        equipment.model = data.model

    if data.manufacturer is not None:
        equipment.manufacturer = data.manufacturer

    if data.sap_code is not None:
        equipment.sap_code = data.sap_code

    if data.serial_number is not None:
        equipment.serial_number = data.serial_number

    if data.status is not None:
        equipment.status = data.status

    if data.photo_url is not None:
        equipment.photo_url = data.photo_url

    if data.quantity is not None:
        equipment.quantity = data.quantity

    if data.location is not None:
        if not can_manage_equipment_location(current_user, data.location):
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para mover equipamento para este local.",
            )

        equipment.location = data.location

    if data.equipment_type is not None:
        equipment.equipment_type = data.equipment_type

    equipment.equipment_type = normalize_equipment_type(
        location=equipment.location,
        equipment_type=equipment.equipment_type,
    )

    if data.owner_area is not None:
        equipment.owner_area = data.owner_area

    if data.description is not None:
        equipment.description = data.description

    if data.is_active is not None:
        equipment.is_active = data.is_active

    sync_equipment_stock_status(equipment)

    equipment.updated_at = datetime.now(timezone.utc)

    session.add(equipment)
    session.commit()
    session.refresh(equipment)

    return equipment


@router.post("/{equipment_id}/photo", response_model=EquipmentRead)
async def upload_equipment_photo(
    equipment_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_equipment_manager_roles),
):
    equipment = session.get(Equipment, equipment_id)

    if not equipment:
        raise HTTPException(
            status_code=404,
            detail="Equipamento não encontrado.",
        )

    if not can_manage_equipment_location(current_user, equipment.location):
        raise HTTPException(
            status_code=403,
            detail="Você não tem permissão para alterar a foto deste equipamento.",
        )

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Formato inválido. Envie uma imagem JPG, PNG ou WEBP.",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    extension = ALLOWED_IMAGE_TYPES[file.content_type]
    safe_name = equipment.name.lower().replace(" ", "_")
    filename = f"equipment_{equipment.id}_{safe_name}_{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    content = await file.read()

    max_size_mb = 5

    if len(content) > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"A imagem deve ter no máximo {max_size_mb}MB.",
        )

    with open(file_path, "wb") as image_file:
        image_file.write(content)

    equipment.photo_url = f"/static/equipments/{filename}"
    equipment.updated_at = datetime.now(timezone.utc)

    session.add(equipment)
    session.commit()
    session.refresh(equipment)

    return equipment
