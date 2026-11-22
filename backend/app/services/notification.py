from sqlmodel import Session, select

from app.models.notification import Notification
from app.models.user import User
from app.models.enums import UserRole, EquipmentLocation


def create_notifications(
    session: Session,
    title: str,
    message: str,
    type: str,
    reference_id: int | None = None,
    location: EquipmentLocation | None = None,
):
    roles_to_notify = {UserRole.ITF}

    if location == EquipmentLocation.GEAD:
        roles_to_notify.add(UserRole.GESTOR_GEAD)

    users = session.exec(
        select(User).where(User.role.in_(roles_to_notify))
    ).all()

    notifications = []

    for user in users:
        notification = Notification(
            user_id=user.id,
            title=title,
            message=message,
            type=type,
            reference_id=reference_id,
        )

        session.add(notification)
        notifications.append(notification)

    session.commit()

    return notifications


def create_notification_for_user(
    session: Session,
    user_id: int,
    title: str,
    message: str,
    type: str,
    reference_id: int | None = None,
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        reference_id=reference_id,
    )

    session.add(notification)

    return notification