from typing import Optional

from sqlmodel import SQLModel

from app.models.enums import UserRole, UserArea


class UserCreate(SQLModel):
    employee_id: str
    name: str
    email: str
    password: str
    role: UserRole
    area: UserArea


class UserRead(SQLModel):
    id: int
    employee_id: str
    name: str
    email: str
    role: UserRole
    area: UserArea
    is_active: bool


class UserUpdate(SQLModel):
    employee_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    area: Optional[UserArea] = None
    is_active: Optional[bool] = None