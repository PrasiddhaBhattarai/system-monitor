import { useState, useEffect } from "react";

function formatBytes(bytes) {
  const gb = bytes / (1024 ** 3);
  return gb.toFixed(2) + " GB";
}

function MetricCard({ title, percent, details }) {
  const getColor = (pct) => {
    if (pct > 80) return "#d32f2f";
    if (pct > 60) return "#f59e0b";
    return "#038e43";
  };

  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="gauge-container">
        <div
          className="gauge-fill"
          style={{
            width: `${percent}%`,
            backgroundColor: getColor(percent),
          }}
        />
      </div>
      <p className="percent">{percent.toFixed(1)}%</p>
      <div className="details">
        {details.map((d, i) => (
          <p key={i}>{d}</p>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || "";
        const res = await fetch(`${apiUrl}/api/stats`, {
          headers: {
            "X-API-Key": "my-secret"
          }
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError("Cannot connect to backend. Is it running?");
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="app">
        <h1>System Monitor</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="app">
        <h1>System Monitor</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>System Monitor</h1>
      <div className="grid">
        <MetricCard
          title="CPU"
          percent={stats.cpu.percent}
          details={[`Cores: ${stats.cpu.cores}`]}
        />
        <MetricCard
          title="Memory"
          percent={stats.memory.percent}
          details={[
            `Used: ${formatBytes(stats.memory.used)}`,
            `Total: ${formatBytes(stats.memory.total)}`,
          ]}
        />
        <MetricCard
          title="Disk"
          percent={stats.disk.percent}
          details={[
            `Used: ${formatBytes(stats.disk.used)}`,
            `Total: ${formatBytes(stats.disk.total)}`,
          ]}
        />
      </div>
    </div>
  );
}

export default App;
