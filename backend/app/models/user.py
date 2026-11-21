from typing import Optional
from sqlmodel import SQLModel, Field

from app.models.enums import UserRole, UserArea


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: str = Field(index=True, unique=True)
    name: str
    email: str = Field(index=True, unique=True)
    hashed_password: str
    role: UserRole
    area: UserArea
    is_active: bool = True