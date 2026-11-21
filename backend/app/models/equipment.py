from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field

from app.models.enums import EquipmentLocation, EquipmentType

class Equipment(SQLModel, table=True):
    __tablename__ = "equipments"

    id: Optional[int] = Field(default=None, primary_key= True)

    name: str = Field(index=True)
    model: str
    manufacturer: Optional[str] = Field(default=None, index=True)
    sap_code: Optional[str] = Field(default=None, index=True)
    equipment_type: EquipmentType = Field(default=EquipmentType.ELETRONICO, index=True)
    serial_number: Optional[str] = Field(default= None, index=True)
    status: str
    quantity: int 
    location: EquipmentLocation = Field(
        default=EquipmentLocation.LAB_ELETRONICA,
        index=True
    )
    description: Optional[str] = None
    photo_url: Optional[str] = None
    created_by_user_id: int = Field(foreign_key="users.id")
    is_active: bool = True
    owner_area: Optional[str] = Field(default = None, index = True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))