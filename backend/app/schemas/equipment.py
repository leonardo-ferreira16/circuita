from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime

from app.models.enums import EquipmentLocation, EquipmentType


class EquipmentCreate(SQLModel):
    name: str
    model: str
    manufacturer: Optional[str] = None
    sap_code: Optional[str] = None
    equipment_type: EquipmentType = EquipmentType.ELETRONICO
    serial_number: Optional[str] = None
    status: str
    quantity: int
    location: EquipmentLocation = EquipmentLocation.LAB_ELETRONICA
    photo_url: Optional[str] = None
    owner_area: Optional[str] = None
    description: Optional[str] = None


class EquipmentRead(SQLModel):
    id: int
    name: str
    model: str
    manufacturer: Optional[str] = None
    sap_code: Optional[str] = None
    equipment_type: EquipmentType
    serial_number: Optional[str]
    status: str
    quantity: int
    location: EquipmentLocation
    photo_url: Optional[str] = None
    owner_area: Optional[str]
    created_by_user_id: int
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class EquipmentUpdate(SQLModel):
    name: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    sap_code: Optional[str] = None
    equipment_type: Optional[EquipmentType] = None
    serial_number: Optional[str] = None
    status: Optional[str] = None
    photo_url: Optional[str] = None
    quantity: Optional[int] = None
    location: Optional[EquipmentLocation] = None
    owner_area: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None