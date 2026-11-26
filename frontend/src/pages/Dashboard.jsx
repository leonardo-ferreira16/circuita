import Layout from "../components/Layout";

function Dashboard() {
  return (
    <Layout>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Bem-vindo ao sistema de gestão corretiva.
      </p>

      <div className="dashboard-grid">
        <div className="metric-card">
          <p className="metric-label">Solicitações abertas</p>
          <h2 className="metric-value">0</h2>
        </div>

        <div className="metric-card">
          <p className="metric-label">Em andamento</p>
          <h2 className="metric-value secondary">0</h2>
        </div>

        <div className="metric-card">
          <p className="metric-label">Concluídas</p>
          <h2 className="metric-value accent">0</h2>
        </div>

        <div className="metric-card">
          <p className="metric-label">Cost avoidance</p>
          <h2 className="metric-value secondary">R$ --</h2>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;