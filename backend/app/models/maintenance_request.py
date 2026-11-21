from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field
from app.models.enums import MaintenanceRequestStatus

class MaintenanceRequest(SQLModel, table = True):
    __tablename__ = "maintenance_requests"

    id: Optional[int] = Field(default=None, primary_key = True)
    equipment_name: str
    symptom_description: str 
    sap_order: str = Field(index=True)
    status: MaintenanceRequestStatus = Field(
        default=MaintenanceRequestStatus.AGUARDANDO_VALIDACAO_ITF
    )
    requested_by_user: int = Field(foreign_key="users.id")
    validated_by_user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    diagnosis: Optional[str] = None
    repair_status: Optional[str] = None
    cost_avoidance: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))