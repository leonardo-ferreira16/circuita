import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

const API_BASE_URL = "http://127.0.0.1:8000";

const LOCATION_LABELS = {
  LAB_ELETRONICA: "Laboratório de Eletrônica",
  GEAD: "GEAD",
};

const EQUIPMENT_TYPE_LABELS = {
  ELETRONICO: "Eletrônico",
  ELETRICO: "Elétrico",
  MECANICO: "Mecânico",
};

function Equipments() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const canManageEquipments = ["ITF", "GESTOR_GEAD"].includes(user?.role);
  const defaultLocation =
    user?.role === "GESTOR_GEAD" ? "GEAD" : "LAB_ELETRONICA";

  const defaultEquipmentType =
    defaultLocation === "GEAD" ? "ELETRICO" : "ELETRONICO";

  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState("");

  const [openMenuId, setOpenMenuId] = useState(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);

  const [editingEquipmentId, setEditingEquipmentId] = useState(null);
  const [editError, setEditError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    model: "",
    manufacturer: "",
    sap_code: "",
    equipment_type: defaultEquipmentType,
    serial_number: "",
    status: "DISPONÍVEL PARA USO",
    quantity: 1,
    location: defaultLocation,
    photo_url: "",
    owner_area: "",
    description: "",
  });

  const [editData, setEditData] = useState({
    name: "",
    model: "",
    manufacturer: "",
    sap_code: "",
    equipment_type: defaultEquipmentType,
    serial_number: "",
    status: "",
    quantity: 1,
    location: defaultLocation,
    photo_url: "",
    owner_area: "",
    description: "",
    is_active: true,
  });

  async function fetchEquipments() {
    try {
      setLoading(true);
      setError("");

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

      setError(
        err?.response?.data?.detail ||
          "Não foi possível carregar os equipamentos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchEquipments();
    }
  }, [token]);

  function resetCreateForm() {
    setFormData({
      name: "",
      model: "",
      manufacturer: "",
      sap_code: "",
      equipment_type: defaultEquipmentType,
      serial_number: "",
      status: "DISPONÍVEL PARA USO",
      quantity: 1,
      location: defaultLocation,
      photo_url: "",
      owner_area: "",
      description: "",
    });
  }

  function normalizeEquipmentTypeByLocation(location, currentType) {
    if (location === "LAB_ELETRONICA") {
      return "ELETRONICO";
    }

    if (location === "GEAD" && currentType === "ELETRONICO") {
      return "ELETRICO";
    }

    return currentType || "ELETRICO";
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => {
      const nextData = {
        ...prev,
        [name]: name === "quantity" ? Number(value) : value,
      };

      if (name === "location") {
        nextData.equipment_type = normalizeEquipmentTypeByLocation(
          value,
          nextData.equipment_type
        );
      }

      if (name === "sap_code") {
        nextData.sap_code = value.replace(/\D/g, "");
      }

      return nextData;
    });
  }

  function handleEditChange(event) {
    const { name, value, type, checked } = event.target;

    setEditData((prev) => {
      const nextData = {
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : name === "quantity"
            ? Number(value)
            : value,
      };

      if (name === "location") {
        nextData.equipment_type = normalizeEquipmentTypeByLocation(
          value,
          nextData.equipment_type
        );
      }

      if (name === "sap_code") {
        nextData.sap_code = value.replace(/\D/g, "");
      }

      return nextData;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        equipment_type: normalizeEquipmentTypeByLocation(
          formData.location,
          formData.equipment_type
        ),
      };

      await api.post("/equipments/", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      resetCreateForm();
      setShowForm(false);
      await fetchEquipments();
    } catch (err) {
      console.error("Erro ao criar equipamento:", err);
      console.log("Status:", err?.response?.status);
      console.log("Data:", err?.response?.data);

      setFormError(
        err?.response?.data?.detail || "Não foi possível criar o equipamento."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    setEditError("");

    if (!editingEquipmentId) {
      setEditError("Equipamento não identificado para edição.");
      return;
    }

    try {
      setUpdating(true);

      const payload = {
        ...editData,
        equipment_type: normalizeEquipmentTypeByLocation(
          editData.location,
          editData.equipment_type
        ),
      };

      await api.patch(`/equipments/${editingEquipmentId}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      handleCancelEdit();
      await fetchEquipments();
    } catch (err) {
      console.error("Erro ao editar equipamento:", err);
      console.log("Status:", err?.response?.status);
      console.log("Data:", err?.response?.data);

      setEditError(
        err?.response?.data?.detail ||
          "Não foi possível atualizar o equipamento."
      );
    } finally {
      setUpdating(false);
    }
  }

  function normalizeText(value) {
    return String(value || "").toLowerCase().trim();
  }

  function getLocationLabel(location) {
    return LOCATION_LABELS[location] || location || "Sem local";
  }

  function getEquipmentTypeLabel(type) {
    return EQUIPMENT_TYPE_LABELS[type] || type || "-";
  }

  function isEquipmentOutOfStock(equipment) {
    return Number(equipment?.quantity || 0) <= 0;
  }

  function getImageSrc(photoUrl, equipmentName) {
    if (!photoUrl) {
      return getFallbackImage(equipmentName);
    }

    if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
      return photoUrl;
    }

    return `${API_BASE_URL}${photoUrl}`;
  }

  function getStatusBadgeClass(status) {
    const normalizedStatus = normalizeText(status);

    if (normalizedStatus.includes("sem estoque")) {
      return "equipment-status out-of-stock";
    }

    if (
      normalizedStatus.includes("disponível") ||
      normalizedStatus.includes("disponivel") ||
      normalizedStatus.includes("uso")
    ) {
      return "equipment-status available";
    }

    if (
      normalizedStatus.includes("manutenção") ||
      normalizedStatus.includes("manutencao")
    ) {
      return "equipment-status maintenance";
    }

    if (
      normalizedStatus.includes("indisponível") ||
      normalizedStatus.includes("indisponivel") ||
      normalizedStatus.includes("bloqueado")
    ) {
      return "equipment-status unavailable";
    }

    return "equipment-status default";
  }

  function getEquipmentIcon(equipmentName) {
    const name = normalizeText(equipmentName);

    if (name.includes("fonte")) return "🔌";
    if (name.includes("motor")) return "⚙️";
    if (name.includes("painel")) return "🧰";
    if (name.includes("bomba")) return "🚰";
    if (name.includes("ar")) return "❄️";
    if (name.includes("mult")) return "🛠️";

    return "📦";
  }

  function getFallbackImage(equipmentName) {
    const name = normalizeText(equipmentName);

    if (name.includes("fonte")) {
      return "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80";
    }

    if (name.includes("motor")) {
      return "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80";
    }

    if (name.includes("painel")) {
      return "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80";
    }

    if (name.includes("bomba")) {
      return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80";
    }

    if (name.includes("mult")) {
      return "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=900&q=80";
    }

    return "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=900&q=80";
  }

  function toggleEquipmentMenu(equipmentId) {
    setOpenMenuId((prev) => (prev === equipmentId ? null : equipmentId));
  }

  function closeEquipmentMenu() {
    setOpenMenuId(null);
  }

  async function handlePhotoUpload(equipmentId, file) {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Envie uma imagem JPG, PNG ou WEBP.");
      return;
    }

    try {
      setUploadingPhotoId(equipmentId);

      const uploadData = new FormData();
      uploadData.append("file", file);

      await api.post(`/equipments/${equipmentId}/photo`, uploadData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      closeEquipmentMenu();
      await fetchEquipments();
    } catch (err) {
      console.error("Erro ao enviar foto:", err);
      alert(
        err?.response?.data?.detail ||
          "Não foi possível atualizar a foto do equipamento."
      );
    } finally {
      setUploadingPhotoId(null);
    }
  }

  function handleRequestEquipment(equipment) {
    closeEquipmentMenu();
    closeDetailsModal();

    if (isEquipmentOutOfStock(equipment)) {
      alert("Este equipamento está sem estoque no momento.");
      return;
    }

    navigate(`/equipment-requests?equipment_id=${equipment.id}`);
  }

  function handleViewDetails(equipment) {
    closeEquipmentMenu();
    setSelectedEquipment(equipment);
  }

  function closeDetailsModal() {
    setSelectedEquipment(null);
  }

  function handleEditEquipment(equipment) {
    closeEquipmentMenu();
    closeDetailsModal();
    setShowForm(false);
    setEditError("");
    setEditingEquipmentId(equipment.id);

    setEditData({
      name: equipment.name || "",
      model: equipment.model || "",
      manufacturer: equipment.manufacturer || "",
      sap_code: equipment.sap_code || "",
      equipment_type: equipment.equipment_type || "ELETRONICO",
      serial_number: equipment.serial_number || "",
      status: equipment.status || "",
      quantity: equipment.quantity ?? 1,
      location: equipment.location || defaultLocation,
      photo_url: equipment.photo_url || "",
      owner_area: equipment.owner_area || "",
      description: equipment.description || "",
      is_active: equipment.is_active ?? true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingEquipmentId(null);
    setEditError("");

    setEditData({
      name: "",
      model: "",
      manufacturer: "",
      sap_code: "",
      equipment_type: defaultEquipmentType,
      serial_number: "",
      status: "",
      quantity: 1,
      location: defaultLocation,
      photo_url: "",
      owner_area: "",
      description: "",
      is_active: true,
    });
  }

  function handleDeactivateEquipment(equipment) {
    closeEquipmentMenu();
    alert(`Desativação do equipamento "${equipment.name}" será implementada depois.`);
  }

  function handleLocationFilterChange(location) {
    setLocationFilter(location);

    if (location !== "GEAD") {
      setEquipmentTypeFilter("");
    }
  }

  const availableAreas = useMemo(() => {
    const areas = equipments
      .map((equipment) => equipment.owner_area)
      .filter(Boolean);

    return [...new Set(areas)];
  }, [equipments]);

  const availableStatuses = useMemo(() => {
    const statuses = equipments
      .map((equipment) => equipment.status)
      .filter(Boolean);

    return [...new Set(statuses)];
  }, [equipments]);

  const filteredEquipments = useMemo(() => {
    return equipments.filter((equipment) => {
      const searchableText = normalizeText(
        `${equipment.name} ${equipment.model} ${equipment.manufacturer} ${equipment.sap_code} ${equipment.equipment_type} ${equipment.owner_area} ${equipment.status} ${equipment.location}`
      );

      const matchesSearch = searchableText.includes(normalizeText(searchTerm));

      const isOutOfStock = Number(equipment.quantity || 0) <= 0;

      const isAvailableFilter =
        statusFilter === "DISPONÍVEL PARA USO" ||
        statusFilter === "DISPONIVEL PARA USO";

      const matchesStatus = statusFilter
        ? isAvailableFilter
          ? equipment.status === statusFilter && !isOutOfStock
          : equipment.status === statusFilter
        : true;

      const matchesArea = areaFilter ? equipment.owner_area === areaFilter : true;

      const matchesLocation = locationFilter
        ? equipment.location === locationFilter
        : true;

      const matchesEquipmentType = equipmentTypeFilter
        ? equipment.equipment_type === equipmentTypeFilter
        : true;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesArea &&
        matchesLocation &&
        matchesEquipmentType
      );
    });
  }, [
    equipments,
    searchTerm,
    statusFilter,
    areaFilter,
    locationFilter,
    equipmentTypeFilter,
  ]);

  const editingEquipment = equipments.find(
    (equipment) => equipment.id === editingEquipmentId
  );

  return (
    <Layout>
      <section className="equipments-page">
        <div className="equipment-page-header">
          <div>
            <h1 className="page-title">Equipamentos</h1>
            <p className="page-subtitle">
              Lista de equipamentos cadastrados no sistema.
            </p>
          </div>
        </div>

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
            onClick={() => handleLocationFilterChange("")}
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
            onClick={() => handleLocationFilterChange("LAB_ELETRONICA")}
          >
            Laboratório de Eletrônica
          </button>

          <button
            type="button"
            className={
              locationFilter === "GEAD" ? "btn btn-primary" : "btn btn-outline"
            }
            onClick={() => handleLocationFilterChange("GEAD")}
          >
            GEAD
          </button>
        </div>

        <div className="equipment-toolbar">
          {canManageEquipments && (
            <button
              className="btn btn-primary equipment-new-button"
              onClick={() => {
                handleCancelEdit();

                if (!showForm) {
                  setFormData((prev) => ({
                    ...prev,
                    location: defaultLocation,
                    equipment_type: defaultEquipmentType,
                  }));
                }

                setShowForm((prev) => !prev);
              }}
              type="button"
            >
              <span className="equipment-button-icon">+</span>
              {showForm ? "Fechar formulário" : "Novo equipamento"}
            </button>
          )}

          <div className="equipment-search">
            <span>🔎</span>
            <input
              type="text"
              placeholder="Buscar equipamento, SAP, modelo, fabricante, área ou local..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            className="equipment-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Status: Todos</option>
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            className="equipment-filter"
            value={areaFilter}
            onChange={(event) => setAreaFilter(event.target.value)}
          >
            <option value="">Área: Todas</option>
            {availableAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          {locationFilter === "GEAD" && (
            <select
              className="equipment-filter"
              value={equipmentTypeFilter}
              onChange={(event) => setEquipmentTypeFilter(event.target.value)}
            >
              <option value="">Tipo: Todos</option>
              <option value="ELETRICO">Elétrico</option>
              <option value="MECANICO">Mecânico</option>
            </select>
          )}
        </div>

        {showForm && canManageEquipments && (
          <form className="form-card equipment-form-card" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome</label>
              <input
                className="input"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Modelo</label>
              <input
                className="input"
                name="model"
                value={formData.model}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Fabricante</label>
              <input
                className="input"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                placeholder="Ex: Siemens, WEG, Schneider..."
              />
            </div>

            <div className="form-group">
              <label>Código SAP</label>
              <input
                className="input"
                name="sap_code"
                value={formData.sap_code}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ex: 40028922"
              />
            </div>

            <div className="form-group">
              <label>Número de série</label>
              <input
                className="input"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <input
                className="input"
                name="status"
                value={formData.status}
                onChange={handleChange}
                placeholder="Ex: DISPONÍVEL PARA USO"
              />
            </div>

            <div className="form-group">
              <label>Quantidade</label>
              <input
                className="input"
                name="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Local</label>
              <select
                className="select"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={user?.role === "GESTOR_GEAD"}
              >
                {user?.role !== "GESTOR_GEAD" && (
                  <option value="LAB_ELETRONICA">
                    Laboratório de Eletrônica
                  </option>
                )}
                <option value="GEAD">GEAD</option>
              </select>
            </div>

            {formData.location === "GEAD" ? (
              <div className="form-group">
                <label>Tipo de equipamento</label>
                <select
                  className="select"
                  name="equipment_type"
                  value={formData.equipment_type}
                  onChange={handleChange}
                >
                  <option value="ELETRICO">Elétrico</option>
                  <option value="MECANICO">Mecânico</option>
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Tipo de equipamento</label>
                <input className="input" value="Eletrônico" disabled />
              </div>
            )}

            <div className="form-group">
              <label>URL da foto</label>
              <input
                className="input"
                name="photo_url"
                value={formData.photo_url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label>Área dona</label>
              <input
                className="input"
                name="owner_area"
                value={formData.owner_area}
                onChange={handleChange}
                placeholder="Ex: L502"
              />
            </div>

            <div className="form-group equipment-form-description">
              <label>Descrição</label>
              <textarea
                className="textarea"
                name="description"
                value={formData.description}
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
                {submitting ? "Salvando..." : "Salvar equipamento"}
              </button>
            </div>
          </form>
        )}

        {editingEquipmentId && canManageEquipments && (
          <form className="form-card equipment-form-card" onSubmit={handleEditSubmit}>
            <div className="form-group equipment-form-description">
              <h2 style={{ color: "var(--color-primary)", marginBottom: "0.25rem" }}>
                Editando equipamento
              </h2>
              <p className="page-subtitle" style={{ marginBottom: 0 }}>
                {editingEquipment?.name || `Equipamento #${editingEquipmentId}`}
              </p>
            </div>

            <div className="form-group">
              <label>Nome</label>
              <input className="input" name="name" value={editData.name} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label>Modelo</label>
              <input className="input" name="model" value={editData.model} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label>Fabricante</label>
              <input className="input" name="manufacturer" value={editData.manufacturer} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label>Código SAP</label>
              <input className="input" name="sap_code" value={editData.sap_code} onChange={handleEditChange} inputMode="numeric" pattern="[0-9]*" />
            </div>

            <div className="form-group">
              <label>Número de série</label>
              <input className="input" name="serial_number" value={editData.serial_number} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label>Status</label>
              <input className="input" name="status" value={editData.status} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label>Quantidade</label>
              <input className="input" name="quantity" type="number" min="0" value={editData.quantity} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label>Local</label>
              <select className="select" name="location" value={editData.location} onChange={handleEditChange} disabled={user?.role === "GESTOR_GEAD"}>
                {user?.role !== "GESTOR_GEAD" && <option value="LAB_ELETRONICA">Laboratório de Eletrônica</option>}
                <option value="GEAD">GEAD</option>
              </select>
            </div>

            {editData.location === "GEAD" ? (
              <div className="form-group">
                <label>Tipo de equipamento</label>
                <select className="select" name="equipment_type" value={editData.equipment_type} onChange={handleEditChange}>
                  <option value="ELETRICO">Elétrico</option>
                  <option value="MECANICO">Mecânico</option>
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Tipo de equipamento</label>
                <input className="input" value="Eletrônico" disabled />
              </div>
            )}

            <div className="form-group">
              <label>URL da foto</label>
              <input className="input" name="photo_url" value={editData.photo_url} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label>Área dona</label>
              <input className="input" name="owner_area" value={editData.owner_area} onChange={handleEditChange} />
            </div>

            <div className="form-group equipment-form-description">
              <label>Descrição</label>
              <textarea className="textarea" name="description" value={editData.description} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="checkbox" name="is_active" checked={editData.is_active} onChange={handleEditChange} />
                Equipamento ativo
              </label>
            </div>

            {editError && <p className="error-text">{editError}</p>}

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button className="btn btn-primary" type="submit" disabled={updating}>
                {updating ? "Salvando..." : "Salvar alterações"}
              </button>

              <button className="btn btn-outline" type="button" onClick={handleCancelEdit}>
                Cancelar edição
              </button>
            </div>
          </form>
        )}

        {loading && <p className="empty-state">Carregando equipamentos...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && equipments.length === 0 && (
          <div className="section-card">
            <p className="empty-state">Nenhum equipamento encontrado.</p>
          </div>
        )}

        {!loading && !error && equipments.length > 0 && (
          <>
            {filteredEquipments.length === 0 ? (
              <div className="section-card">
                <p className="empty-state">Nenhum equipamento encontrado com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="equipment-feed-grid">
                {filteredEquipments.map((equipment) => (
                  <article className={isEquipmentOutOfStock(equipment) ? "equipment-card equipment-card-out-of-stock" : "equipment-card"} key={equipment.id}>
                    <div className="equipment-image-wrapper">
                      <img
                        src={getImageSrc(equipment.photo_url, equipment.name)}
                        alt={equipment.name}
                        className={isEquipmentOutOfStock(equipment) ? "equipment-image equipment-image-out-of-stock" : "equipment-image"}
                      />

                      <span className={isEquipmentOutOfStock(equipment) ? "equipment-status out-of-stock" : getStatusBadgeClass(equipment.status)}>
                        {isEquipmentOutOfStock(equipment) ? "SEM ESTOQUE" : equipment.status || "SEM STATUS"}
                      </span>

                      <div className="equipment-menu-wrapper">
                        <button className="equipment-card-menu" type="button" title="Mais opções" onClick={() => toggleEquipmentMenu(equipment.id)}>⋮</button>
                        {openMenuId === equipment.id && (
                          <div className="equipment-dropdown-menu">
                            <button type="button" onClick={() => handleViewDetails(equipment)}>👁️ Ver detalhes</button>
                            {canManageEquipments ? (
                              <>
                                <label className="equipment-dropdown-upload">
                                  📷 {uploadingPhotoId === equipment.id ? "Enviando..." : "Trocar foto"}
                                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingPhotoId === equipment.id} onChange={(event) => handlePhotoUpload(equipment.id, event.target.files?.[0])} />
                                </label>
                                <button type="button" onClick={() => handleEditEquipment(equipment)}>✏️ Editar equipamento</button>
                                <button type="button" className="equipment-dropdown-danger" onClick={() => handleDeactivateEquipment(equipment)}>🚫 Desativar equipamento</button>
                              </>
                            ) : (
                              <button type="button" disabled={isEquipmentOutOfStock(equipment)} onClick={() => handleRequestEquipment(equipment)}>
                                {isEquipmentOutOfStock(equipment) ? "Sem estoque" : "⊞ Solicitar equipamento"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="equipment-card-body">
                      <div className="equipment-card-main">
                        <div className="equipment-icon">{getEquipmentIcon(equipment.name)}</div>
                        <div>
                          <h2>{equipment.name}</h2>
                          <p>{equipment.manufacturer ? `${equipment.manufacturer} • ${equipment.model || "Modelo não informado"}` : equipment.model || "Modelo não informado"}</p>
                        </div>
                      </div>

                      <div className="equipment-meta">
                        <span>📍 {getLocationLabel(equipment.location)}</span>
                        <span>🧩 {getEquipmentTypeLabel(equipment.equipment_type)}</span>
                        <span>🔢 SAP: {equipment.sap_code || "-"}</span>
                        <span>🏷️ Dono: {equipment.owner_area || "-"}</span>
                        <span>📦 Qtd.: {equipment.quantity ?? 0}</span>
                      </div>

                      {equipment.description && <p className="equipment-description">{equipment.description}</p>}

                      <div className="equipment-actions">
                        <button className="btn btn-outline equipment-action-button" type="button" onClick={() => handleViewDetails(equipment)}>👁️ Ver detalhes</button>
                        <button className="btn btn-primary equipment-action-button" type="button" disabled={isEquipmentOutOfStock(equipment)} onClick={() => handleRequestEquipment(equipment)}>
                          {isEquipmentOutOfStock(equipment) ? "Sem estoque" : "Solicitar"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p className="equipment-feed-footer">ⓘ Exibindo {filteredEquipments.length} de {equipments.length} equipamentos</p>
          </>
        )}

        {selectedEquipment && (
          <div className="equipment-modal-overlay" onClick={closeDetailsModal}>
            <div className="equipment-modal" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="equipment-modal-close" onClick={closeDetailsModal} aria-label="Fechar detalhes">×</button>

              <div className="equipment-modal-image-wrapper">
                <img src={getImageSrc(selectedEquipment.photo_url, selectedEquipment.name)} alt={selectedEquipment.name} className={isEquipmentOutOfStock(selectedEquipment) ? "equipment-modal-image equipment-image-out-of-stock" : "equipment-modal-image"} />
                <span className={isEquipmentOutOfStock(selectedEquipment) ? "equipment-status out-of-stock" : getStatusBadgeClass(selectedEquipment.status)}>
                  {isEquipmentOutOfStock(selectedEquipment) ? "SEM ESTOQUE" : selectedEquipment.status || "SEM STATUS"}
                </span>
              </div>

              <div className="equipment-modal-content">
                <div className="equipment-modal-title-row">
                  <div className="equipment-icon">{getEquipmentIcon(selectedEquipment.name)}</div>
                  <div>
                    <h2>{selectedEquipment.name}</h2>
                    <p>{selectedEquipment.manufacturer ? `${selectedEquipment.manufacturer} • ${selectedEquipment.model || "Modelo não informado"}` : selectedEquipment.model || "Modelo não informado"}</p>
                  </div>
                </div>

                <div className="equipment-modal-info-grid">
                  <div className="equipment-modal-info-item"><span>Fabricante</span><strong>{selectedEquipment.manufacturer || "-"}</strong></div>
                  <div className="equipment-modal-info-item"><span>Modelo</span><strong>{selectedEquipment.model || "-"}</strong></div>
                  <div className="equipment-modal-info-item"><span>Código SAP</span><strong>{selectedEquipment.sap_code || "-"}</strong></div>
                  <div className="equipment-modal-info-item"><span>Tipo</span><strong>{getEquipmentTypeLabel(selectedEquipment.equipment_type)}</strong></div>
                  <div className="equipment-modal-info-item"><span>Nº de série</span><strong>{selectedEquipment.serial_number || "-"}</strong></div>
                  <div className="equipment-modal-info-item"><span>Local</span><strong>{getLocationLabel(selectedEquipment.location)}</strong></div>
                  <div className="equipment-modal-info-item"><span>Área dona</span><strong>{selectedEquipment.owner_area || "Sem dono"}</strong></div>
                  <div className="equipment-modal-info-item"><span>Quantidade</span><strong>{selectedEquipment.quantity ?? 0}</strong></div>
                  <div className="equipment-modal-info-item"><span>ID do equipamento</span><strong>#{selectedEquipment.id}</strong></div>
                </div>

                {isEquipmentOutOfStock(selectedEquipment) && <div className="equipment-stock-warning">⚠️ Este equipamento está sem estoque no momento.</div>}

                <div className="equipment-modal-description">
                  <h3>Descrição</h3>
                  <p>{selectedEquipment.description || "Nenhuma descrição cadastrada."}</p>
                </div>

                <div className="equipment-modal-actions">
                  {canManageEquipments && <button type="button" className="btn btn-outline" onClick={() => { closeDetailsModal(); handleEditEquipment(selectedEquipment); }}>✏️ Editar equipamento</button>}

                  {!isEquipmentOutOfStock(selectedEquipment) && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleRequestEquipment(selectedEquipment)}
                    >
                      Solicitar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}

export default Equipments;