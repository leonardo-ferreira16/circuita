import { Fragment, useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

function MaintenanceRequests() {
  const { token, user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTechnicalFormId, setShowTechnicalFormId] = useState(null);

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [createData, setCreateData] = useState({
    equipment_name: "",
    symptom_description: "",
    sap_order: "",
  });

  const [technicalData, setTechnicalData] = useState({
    diagnosis: "",
    repair_status: "",
    cost_avoidance: "",
    status: "",
  });

  const requesterRoles = [
    "ITF",
    "GERENTE",
    "COORDENADOR",
    "SUPERVISOR",
    "TECNICO",
    "OPERADOR",
  ];

  const canCreate = requesterRoles.includes(user?.role);
  const isITF = user?.role === "ITF";

  async function fetchRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/maintenance-requests/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRequests(response.data);
    } catch (err) {
      console.error("Erro ao buscar solicitações de manutenção:", err);
      setError("Não foi possível carregar as solicitações de manutenção.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchRequests();
    }
  }, [token]);

  function handleCreateChange(event) {
    const { name, value } = event.target;

    setCreateData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleTechnicalChange(event) {
    const { name, value } = event.target;

    setTechnicalData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!createData.sap_order.trim()) {
      setFormError("A ordem SAP é obrigatória para abrir uma solicitação.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post(
        "/maintenance-requests/",
        {
          ...createData,
          sap_order: createData.sap_order.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCreateData({
        equipment_name: "",
        symptom_description: "",
        sap_order: "",
      });

      setShowCreateForm(false);
      await fetchRequests();
    } catch (err) {
      console.error("Erro ao criar solicitação de manutenção:", err);
      console.log(err?.response?.status);
      console.log(err?.response?.data);

      setFormError(
        err?.response?.data?.detail ||
          "Não foi possível criar a solicitação de manutenção."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(requestId) {
    try {
      await api.patch(
        `/maintenance-requests/${requestId}/cancel`,
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
      console.log(err?.response?.status);
      console.log(err?.response?.data);

      alert(
        err?.response?.data?.detail ||
          "Não foi possível cancelar a solicitação."
      );
    }
  }

  async function handleValidate(requestId, status) {
    try {
      console.log("Validando requestId:", requestId, "status:", status);

      await api.patch(
        `/maintenance-requests/${requestId}/validate`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchRequests();
    } catch (err) {
      console.error("Erro ao validar solicitação:", err);
      console.log(err?.response?.status);
      console.log(err?.response?.data);

      alert(
        err?.response?.data?.detail ||
          "Não foi possível validar a solicitação."
      );
    }
  }

  async function handleTechnicalSubmit(event, requestId) {
    event.preventDefault();

    try {
      const payload = {
        diagnosis: technicalData.diagnosis || null,
        repair_status: technicalData.repair_status || null,
        cost_avoidance:
          technicalData.cost_avoidance === ""
            ? null
            : Number(technicalData.cost_avoidance),
        status: technicalData.status || null,
      };

      await api.patch(
        `/maintenance-requests/${requestId}/technical-update`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTechnicalData({
        diagnosis: "",
        repair_status: "",
        cost_avoidance: "",
        status: "",
      });

      setShowTechnicalFormId(null);
      await fetchRequests();
    } catch (err) {
      console.error("Erro ao atualizar tecnicamente:", err);
      console.log(err?.response?.status);
      console.log(err?.response?.data);

      alert(
        err?.response?.data?.detail ||
          "Não foi possível atualizar a solicitação."
      );
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "VALIDADA":
        return "badge badge-primary";
      case "MANUTENCAO_INICIADA":
        return "badge badge-secondary";
      case "FINALIZADA":
        return "badge badge-success";
      case "CANCELADA":
        return "badge badge-secondary";
      case "REJEITADA":
        return "badge badge-danger";
      default:
        return "badge badge-accent";
    }
  }

  return (
    <Layout>
      <h1 className="page-title">Solicitações de Manutenção</h1>
      <p className="page-subtitle">
        Acompanhe e gerencie as solicitações de manutenção corretiva.
      </p>

      {canCreate && (
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
          >
            {showCreateForm ? "Fechar formulário" : "Nova solicitação"}
          </button>
        </div>
      )}

      {showCreateForm && canCreate && (
        <form className="form-card" onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Nome do equipamento</label>
            <input
              className="input"
              name="equipment_name"
              value={createData.equipment_name}
              onChange={handleCreateChange}
            />
          </div>

          <div className="form-group">
            <label>Sintoma</label>
            <textarea
              className="textarea"
              name="symptom_description"
              value={createData.symptom_description}
              onChange={handleCreateChange}
            />
          </div>

          <div className="form-group">
            <label>Ordem SAP</label>
            <input
              className="input"
              name="sap_order"
              value={createData.sap_order}
              onChange={handleCreateChange}
              required
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
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Equipamento</th>
                <th>Solicitante</th>
                <th>Sintoma</th>
                <th>Ordem SAP</th>
                <th>Status</th>
                <th>Diagnóstico</th>
                <th>Reparo</th>
                <th>Cost avoidance</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => {
                const isOwner = request.requested_by_user === user?.id;
                const isPending =
                  request.status === "AGUARDANDO_VALIDACAO_ITF";

                const canTechnicalUpdate =
                  isITF &&
                  ["VALIDADA", "MANUTENCAO_INICIADA"].includes(
                    request.status
                  );

                return (
                  <Fragment key={request.id}>
                    <tr>
                      <td>{request.id}</td>
                      <td>{request.equipment_name}</td>
                      <td>
                        {request.requested_by_user_name ||
                          `Usuário #${request.requested_by_user}`}
                      </td>
                      <td>{request.symptom_description}</td>
                      <td>{request.sap_order}</td>
                      <td>
                        <span className={getStatusBadgeClass(request.status)}>
                          {request.status}
                        </span>
                      </td>
                      <td>{request.diagnosis || "-"}</td>
                      <td>{request.repair_status || "-"}</td>
                      <td>
                        {request.cost_avoidance !== null &&
                        request.cost_avoidance !== undefined
                          ? `R$ ${request.cost_avoidance}`
                          : "-"}
                      </td>
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

                          {isITF && isPending && (
                            <>
                              <button
                                className="btn btn-primary"
                                type="button"
                                onClick={() =>
                                  handleValidate(request.id, "VALIDADA")
                                }
                              >
                                Validar
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

                          {canTechnicalUpdate && (
                            <button
                              className="btn btn-outline"
                              type="button"
                              onClick={() =>
                                setShowTechnicalFormId((prev) =>
                                  prev === request.id ? null : request.id
                                )
                              }
                            >
                              Atualização técnica
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {showTechnicalFormId === request.id && isITF && (
                      <tr>
                        <td colSpan="10" style={{ background: "#fafafa" }}>
                          <form
                            className="form-card"
                            style={{ margin: "1rem" }}
                            onSubmit={(event) =>
                              handleTechnicalSubmit(event, request.id)
                            }
                          >
                            <div className="form-group">
                              <label>Diagnóstico</label>
                              <textarea
                                className="textarea"
                                name="diagnosis"
                                value={technicalData.diagnosis}
                                onChange={handleTechnicalChange}
                              />
                            </div>

                            <div className="form-group">
                              <label>Status do reparo</label>
                              <input
                                className="input"
                                name="repair_status"
                                value={technicalData.repair_status}
                                onChange={handleTechnicalChange}
                              />
                            </div>

                            <div className="form-group">
                              <label>Cost avoidance</label>
                              <input
                                className="input"
                                type="number"
                                name="cost_avoidance"
                                value={technicalData.cost_avoidance}
                                onChange={handleTechnicalChange}
                              />
                            </div>

                            <div className="form-group">
                              <label>Novo status</label>
                              <select
                                className="select"
                                name="status"
                                value={technicalData.status}
                                onChange={handleTechnicalChange}
                              >
                                <option value="">Selecione</option>
                                <option value="VALIDADA">VALIDADA</option>
                                <option value="MANUTENCAO_INICIADA">
                                  MANUTENCAO_INICIADA
                                </option>
                                <option value="FINALIZADA">FINALIZADA</option>
                              </select>
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem" }}>
                              <button className="btn btn-primary" type="submit">
                                Salvar atualização
                              </button>

                              <button
                                className="btn btn-outline"
                                type="button"
                                onClick={() => setShowTechnicalFormId(null)}
                              >
                                Fechar
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

export default MaintenanceRequests;