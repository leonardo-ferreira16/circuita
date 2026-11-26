import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUnreadNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notifications";

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  async function loadUnreadCount() {
    try {
      const data = await getUnreadNotificationsCount();
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error("Erro ao buscar contador de notificações:", error);
    }
  }

  async function loadNotifications() {
  try {
    setLoading(true);
    const data = await getUnreadNotifications();
    setNotifications(data);
  } catch (error) {
    console.error("Erro ao carregar notificações:", error);
  } finally {
    setLoading(false);
  }
}

  async function handleToggle() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications();
      await loadUnreadCount();
    }
  }

  async function handleNotificationClick(notification) {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      );

      await loadUnreadCount();
      setOpen(false);

      if (notification.type === "equipment_request") {
        navigate("/equipment-requests");
        return;
      }

      if (notification.type === "maintenance_request") {
        navigate("/maintenance-requests");
        return;
      }
    } catch (error) {
      console.error("Erro ao abrir notificação:", error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  }

  useEffect(() => {
    loadUnreadCount();

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="notification-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notification-bell"
        onClick={handleToggle}
        title="Notificações"
      >
        <span className="notification-bell-icon">🔔</span>

        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-popover">
          <div className="notification-popover-header">
            <div>
              <h3>Notificações</h3>
              <p>Solicitações recentes para análise do ITF</p>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                className="notification-action"
                onClick={handleMarkAllAsRead}
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="notification-popover-body">
            {loading ? (
              <p className="notification-empty">Carregando...</p>
            ) : notifications.length === 0 ? (
              <p className="notification-empty">
                Nenhuma notificação encontrada.
              </p>
            ) : (
              notifications.slice(0, 6).map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={
                    notification.is_read
                      ? "notification-card"
                      : "notification-card unread"
                  }
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-card-content">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <span>
                      {new Date(notification.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>

                  {!notification.is_read && (
                    <span className="notification-pill">Nova</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;