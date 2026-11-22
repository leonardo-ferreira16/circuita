from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel


class NotificationRead(SQLModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    reference_id: Optional[int] = None
    is_read: bool
    created_at: datetime


class NotificationUnreadCount(SQLModel):
    unread_count: int