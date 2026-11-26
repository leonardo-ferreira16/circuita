import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1 className="sidebar-title">Corretiva Lab</h1>
          <p className="sidebar-subtitle">Manutenção Corretiva</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/equipments"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Equipamentos
          </NavLink>

          <NavLink
            to="/equipment-requests"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Solicitações de Equipamentos
          </NavLink>

          <NavLink
            to="/maintenance-requests"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Solicitações de Manutenção
          </NavLink>
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Painel</h2>
            <p className="page-subtitle" style={{ margin: 0 }}>
              Acompanhe os módulos do sistema.
            </p>
          </div>

          <div className="header-user">
            <NotificationBell />

            <div className="user-badge">{userInitials}</div>

            <div className="header-user-info">
              <strong>{user?.name || "Usuário"}</strong>
              <span>{user?.role || "-"}</span>
            </div>

            <button className="btn btn-outline" onClick={handleLogout} type="button">
              Sair
            </button>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;