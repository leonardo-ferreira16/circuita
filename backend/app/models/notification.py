from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key='users.id')
    title: str
    message: str
    type: str
    reference_id: Optional[int] = None

    is_read: bool = False
    created_at:   datetime = Field(default_factory=lambda: datetime.now(timezone.utc))