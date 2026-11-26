import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

const LOCATION_LABELS = {
  LAB_ELETRONICA: "Laboratório de Eletrônica",
  GEAD: "GEAD",
};

function EquipmentRequests() {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();

  const [requests, setRequests] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [locationFilter, setLocationFilter] = useState("");

  const [formData, setFormData] = useState({
    equipment_id: "",
    requested_quantity: 1,
    justification: "",
  });

  async function fetchRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/equipment-requests/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRequests(response.data);
    } catch (err) {
      console.error("Erro ao buscar solicitações de equipamento:", err);
      console.log("Status:", err?.response?.status);
      console.log("Data:", err?.response?.data);

      setError(
        err?.response?.data?.detail ||
          "Não foi possível carregar as solicitações de equipamento."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchEquipments() {
    try {
      const response = await api.get("/equipments/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEquipments(response.data);
    } catch (err) {
      console.error("Erro ao buscar equipamentos:", err);
      console.log("Status:", err?.response?.status);
      console.log("Data:", err?.response?.data);
    }
  }

  useEffect(() => {
    if (token) {
      fetchRequests();
      fetchEquipments();
    }
  }, [token]);

  useEffect(() => {
    const equipmentIdFromUrl = searchParams.get("equipment_id");

    if (equipmentIdFromUrl) {
      setFormData((prev) => ({
        ...prev,
        equipment_id: Number(equipmentIdFromUrl),
      }));

      setShowForm(true);
    }
  }, [searchParams]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "equipment_id" || name === "requested_quantity"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!formData.equipment_id) {
      setFormError("Selecione um equipamento.");
      return;
    }

    if (!formData.requested_quantity || formData.requested_quantity < 1) {
      setFormError("A quantidade solicitada deve ser maior que zero.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/equipment-requests/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFormData({
        equipment_id: "",
        requested_quantity: 1,
        justification: "",
      });

      setShowForm(false);
      await fetchRequests();
      await fetchEquipments();
    } catch (err) {
      console.error("Erro ao criar solicitação de equipamento:", err);
      console.log("Status:", err?.response?.status);
      console.log("Data:", err?.response?.data);

      setFormError(
        err?.response?.data?.detail || "Não foi possível criar a solicitação."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(requestId) {
    try {
      await api.patch(
        `/equipment-requests/${requestId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchRequests();
    } catch (err) {
      console.error("Erro ao cancelar solicitação:", err);
      console.log("Status:", err?.response?.status);
      console.log("Data:", err?.response?.data);

      alert(
        err?.response?.data?.detail ||
          "Não foi possível cancelar a solicitação."
      );
    }
  }

  async function handleValidate(requestId, status) {
    try {
      await api.patch(
        `/equipment-requests/${requestId}/validate`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchRequests();
      await fetchEquipments();
    } catch (err) {
      console.error("Erro ao validar solicitação:", err);
      console.log("Status:", err?.response?.status);
      console.log("Data:", err?.response?.data);

      alert(
        err?.response?.data?.detail ||
          "Não foi possível validar a solicitação."
      );
    }
  }

  async function handleWithdraw(requestId) {
    try {
      await api.patch(
        `/equipment-requests/${requestId}/withdraw`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchRequests();
      await fetchEquipments();
    } catch (err) {
      console.error("Erro ao confirmar retirada:", err);
      console.log("Status:", err?.response?.status);
      console.log("Data:", err?.response?.data);

      alert(
        err?.response?.data?.detail ||
          "Não foi possível confirmar a retirada."
      );
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "APROVADA":
        return "badge badge-success";
      case "RETIRADO":
        return "badge badge-primary";
      case "REJEITADA":
        return "badge badge-danger";
      case "CANCELADA":
        return "badge badge-secondary";
      default:
        return "badge badge-accent";
    }
  }

  function getEquipmentNameById(equipmentId) {
    const equipment = equipments.find((item) => item.id === equipmentId);
    return equipment ? equipment.name : `Equipamento #${equipmentId}`;
  }

  function getEquipmentQuantityById(equipmentId) {
    const equipment = equipments.find((item) => item.id === equipmentId);
    return equipment?.quantity ?? null;
  }

  function getLocationLabel(location) {
    return LOCATION_LABELS[location] || location || "-";
  }

  function formatDateTime(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString("pt-BR");
  }

  const selectedEquipment = equipments.find(
    (equipment) => equipment.id === Number(formData.equipment_id)
  );

  const filteredRequests = requests.filter((request) => {
    if (!locationFilter) return true;

    return request.location === locationFilter;
  });

  const canRequest = [
    "ITF",
    "GESTOR_GEAD",
    "GERENTE",
    "COORDENADOR",
    "SUPERVISOR",
    "TECNICO",
    "OPERADOR",
  ].includes(user?.role);

  const canManageEquipmentRequests = ["ITF", "GESTOR_GEAD"].includes(user?.role);

  return (
    <Layout>
      <h1 className="page-title">Solicitações de Equipamentos</h1>
      <p className="page-subtitle">
        Gerencie as solicitações de equipamentos feitas pelas áreas.
      </p>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <button
          type="button"
          className={locationFilter === "" ? "btn btn-primary" : "btn btn-outline"}
          onClick={() => setLocationFilter("")}
        >
          Todos
        </button>

        <button
          type="button"
          className={
            locationFilter === "LAB_ELETRONICA"
              ? "btn btn-primary"
              : "btn btn-outline"
          }
          onClick={() => setLocationFilter("LAB_ELETRONICA")}
        >
          Laboratório de Eletrônica
        </button>

        <button
          type="button"
          className={
            locationFilter === "GEAD" ? "btn btn-primary" : "btn btn-outline"
          }
          onClick={() => setLocationFilter("GEAD")}
        >
          GEAD
        </button>
      </div>

      {canRequest && (
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? "Fechar formulário" : "Nova solicitação"}
          </button>
        </div>
      )}

      {showForm && canRequest && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Equipamento</label>
            <select
              className="select"
              name="equipment_id"
              value={formData.equipment_id}
              onChange={handleChange}
            >
              <option value="">Selecione um equipamento</option>
              {equipments.map((equipment) => (
                <option
                  key={equipment.id}
                  value={equipment.id}
                  disabled={Number(equipment.quantity || 0) <= 0}
                >
                  {equipment.name} - {equipment.model} |{" "}
                  {getLocationLabel(equipment.location)} | Disponível:{" "}
                  {equipment.quantity}
                </option>
              ))}
            </select>
          </div>

          {selectedEquipment && (
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Local: <strong>{getLocationLabel(selectedEquipment.location)}</strong>{" "}
              | Disponível em estoque:{" "}
              <strong>{selectedEquipment.quantity}</strong>
            </p>
          )}

          <div className="form-group">
            <label>Quantidade solicitada</label>
            <input
              className="input"
              name="requested_quantity"
              type="number"
              min="1"
              max={selectedEquipment?.quantity || undefined}
              value={formData.requested_quantity}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Área solicitante</label>
            <input className="input" value={user?.area || "-"} disabled />
          </div>

          <div className="form-group">
            <label>Justificativa</label>
            <textarea
              className="textarea"
              name="justification"
              value={formData.justification}
              onChange={handleChange}
            />
          </div>

          {formError && <p className="error-text">{formError}</p>}

          <div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Enviar solicitação"}
            </button>
          </div>
        </form>
      )}

      {loading && <p className="empty-state">Carregando solicitações...</p>}

      {error && <p className="error-text">{error}</p>}

      {!loading && !error && requests.length === 0 && (
        <div className="section-card">
          <p className="empty-state">Nenhuma solicitação encontrada.</p>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <>
          {filteredRequests.length === 0 ? (
            <div className="section-card">
              <p className="empty-state">
                Nenhuma solicitação encontrada para o filtro selecionado.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Equipamento</th>
                    <th>Local</th>
                    <th>Quantidade</th>
                    <th>Disponível atual</th>
                    <th>Solicitante</th>
                    <th>Área solicitante</th>
                    <th>Justificativa</th>
                    <th>Status</th>
                    <th>Retirado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request) => {
                    const isOwner = request.requested_by_user_id === user?.id;
                    const isPending = request.status === "PENDENTE";
                    const isApproved = request.status === "APROVADA";
                    const currentQuantity = getEquipmentQuantityById(
                      request.equipment_id
                    );

                    return (
                      <tr key={request.id}>
                        <td>{request.id}</td>

                        <td>{getEquipmentNameById(request.equipment_id)}</td>

                        <td>{getLocationLabel(request.location)}</td>

                        <td>{request.requested_quantity}</td>

                        <td>
                          {currentQuantity !== null &&
                          currentQuantity !== undefined
                            ? currentQuantity
                            : "-"}
                        </td>

                        <td>
                          {request.requested_by_user_name ||
                            `Usuário #${request.requested_by_user_id}`}
                        </td>

                        <td>{request.requested_area}</td>

                        <td>{request.justification}</td>

                        <td>
                          <span className={getStatusBadgeClass(request.status)}>
                            {request.status}
                          </span>
                        </td>

                        <td>{formatDateTime(request.withdrawn_at)}</td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              flexWrap: "wrap",
                            }}
                          >
                            {isOwner && isPending && (
                              <button
                                className="btn btn-danger"
                                type="button"
                                onClick={() => handleCancel(request.id)}
                              >
                                Cancelar
                              </button>
                            )}

                            {canManageEquipmentRequests && isPending && (
                              <>
                                <button
                                  className="btn btn-primary"
                                  type="button"
                                  onClick={() =>
                                    handleValidate(request.id, "APROVADA")
                                  }
                                >
                                  Aprovar
                                </button>

                                <button
                                  className="btn btn-secondary"
                                  type="button"
                                  onClick={() =>
                                    handleValidate(request.id, "REJEITADA")
                                  }
                                >
                                  Rejeitar
                                </button>
                              </>
                            )}

                            {canManageEquipmentRequests && isApproved && (
                              <button
                                className="btn btn-primary"
                                type="button"
                                onClick={() => handleWithdraw(request.id)}
                              >
                                Confirmar retirada
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

export default EquipmentRequests;