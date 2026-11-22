from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func

from app.db.session import get_session
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationRead, NotificationUnreadCount
from app.api.deps import get_current_active_user


router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=list[NotificationRead])
def list_my_notifications(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    notifications = session.exec(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    ).all()

    return notifications


@router.get("/unread-count", response_model=NotificationUnreadCount)
def get_unread_count(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    unread_count = session.exec(
        select(func.count(Notification.id))
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
    ).one()

    return NotificationUnreadCount(unread_count=unread_count)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_as_read(
    notification_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    notification = session.get(Notification, notification_id)

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificação não encontrada.",
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para alterar esta notificação.",
        )

    notification.is_read = True

    session.add(notification)
    session.commit()
    session.refresh(notification)

    return notification


@router.patch("/read-all")
def mark_all_notifications_as_read(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    notifications = session.exec(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
    ).all()

    for notification in notifications:
        notification.is_read = True
        session.add(notification)

    session.commit()

    return {"message": "Todas as notificações foram marcadas como lidas."}

@router.get("/unread", response_model=list[NotificationRead])
def list_my_unread_notifications(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    notifications = session.exec(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
        .order_by(Notification.created_at.desc())
    ).all()

    return notifications