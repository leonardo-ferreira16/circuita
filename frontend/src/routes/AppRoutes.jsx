import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Equipments from "../pages/Equipments";
import EquipmentRequests from "../pages/EquipmentRequests";
import MaintenanceRequests from "../pages/MaintenanceRequests";
import ProtectedRoute from "../components/ProtectedRoute";

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
              <EquipmentRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/maintenance-requests"
          element={
            <ProtectedRoute>
              <MaintenanceRequests />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;

