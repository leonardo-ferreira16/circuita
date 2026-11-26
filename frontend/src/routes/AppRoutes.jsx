import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Equipments from "../pages/Equipments";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout";

function EmDesenvolvimento({ title }) {
  return (
    <Layout>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">Módulo em fase de integração pela equipe.</p>
      <div className="card" style={{ padding: "2rem", marginTop: "1rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-soft)" }}>
          Esta funcionalidade faz parte das próximas etapas do projeto.
        </p>
      </div>
    </Layout>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Navigate to="/" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/equipments"
          element={
            <ProtectedRoute>
              <Equipments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/equipment-requests"
          element={
            <ProtectedRoute>
              <EmDesenvolvimento title="Solicitações de Equipamentos" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/maintenance-requests"
          element={
            <ProtectedRoute>
              <EmDesenvolvimento title="Solicitações de Manutenção" />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;

