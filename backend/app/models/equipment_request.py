from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field

from app.models.enums import EquipmentRequestStatus, EquipmentLocation


class EquipmentRequest(SQLModel, table=True):
    __tablename__ = "equipment_requests"

    id: Optional[int] = Field(default=None, primary_key=True)

    equipment_id: int = Field(foreign_key="equipments.id")
    requested_by_user_id: int = Field(foreign_key="users.id")
    validated_by_user_id: Optional[int] = Field(default=None, foreign_key="users.id")

    withdrawn_by_user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    withdrawn_at: Optional[datetime] = None

    requested_quantity: int = Field(default=1)

    location: EquipmentLocation = Field(
        default=EquipmentLocation.LAB_ELETRONICA,
        index=True,
    )

    requested_area: str
    justification: str

    status: EquipmentRequestStatus = Field(default=EquipmentRequestStatus.PENDENTE)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))