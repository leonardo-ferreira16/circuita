from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel

from app.models.enums import EquipmentRequestStatus, EquipmentLocation


class EquipmentRequestCreate(SQLModel):
    equipment_id: int
    requested_quantity: int = 1
    justification: str


class EquipmentRequestRead(SQLModel):
    id: int
    equipment_id: int

    requested_by_user_id: int
    requested_by_user_name: Optional[str]

    validated_by_user_id: Optional[int]
    validated_by_user_name: Optional[str]

    withdrawn_by_user_id: Optional[int]
    withdrawn_by_user_name: Optional[str]
    withdrawn_at: Optional[datetime]

    requested_quantity: int
    location: EquipmentLocation

    requested_area: str
    justification: str
    status: EquipmentRequestStatus

    created_at: datetime
    updated_at: datetime


class EquipmentRequestValidate(SQLModel):
    status: EquipmentRequestStatus