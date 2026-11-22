from typing import Optional
from sqlmodel import SQLModel
from datetime import datetime

from app.models.enums import MaintenanceRequestStatus

# Cria a solicitação
class MaintenanceRequestCreate(SQLModel):
    equipment_name: str
    symptom_description: str
    sap_order: str

# Devolve na API
class MaintenanceRequestRead(SQLModel):
    id: int
    equipment_name: str
    symptom_description: str
    sap_order: str
    status: MaintenanceRequestStatus 
    requested_by_user: int
    requested_by_user_name: Optional[str]
    validated_by_user_id: Optional[int]
    validated_by_user_name: Optional[str]  
    diagnosis: Optional[str] 
    repair_status: Optional[str] 
    cost_avoidance: Optional[float]
    created_at: datetime 
    updated_at: datetime 

# Cria a validação feita pelo ITF
class MaintenanceRequestValidate(SQLModel):
    status: MaintenanceRequestStatus

# Cria o update das informações feitas pelo ITF
class MaintenanceRequestTechnicalUpdate(SQLModel):
    diagnosis: Optional[str] 
    repair_status: Optional[str] 
    cost_avoidance: Optional[float]
    status: MaintenanceRequestStatus = None 

