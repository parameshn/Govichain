import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";
import { apiClient } from "../services/api";
import { formatCompactCurrency } from "../utils/formatters";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Gauge,
  IndianRupee,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_projects: 0,
    projects_by_status: { created: 0, in_progress: 0, completed: 0 },
    total_budget: 0,
    completion_rate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get("/public/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const metricCards = [
    {
      icon: <BarChart3 size={18} />,
      value: loading ? "--" : stats.total_projects,
      label: "Total Projects",
    },
    {
      icon: <IndianRupee size={18} />,
      value: loading ? "--" : formatCompactCurrency(stats.total_budget),
      label: "Total Budget",
    },
    {
      icon: <CheckCircle2 size={18} />,
      value: loading ? "--" : `${stats.completion_rate}%`,
      label: "Completion Rate",
    },
    {
      icon: <Gauge size={18} />,
      value: loading ? "--" : stats.projects_by_status.in_progress,
      label: "Ongoing Projects",
    },
  ];

  const statusRows = [
    {
      color: "#10b981",
      label: "Projects created",
      value: loading ? "--" : stats.projects_by_status.created,
    },
    {
      color: "#3b82f6",
      label: "Milestones verified",
      value: loading ? "--" : stats.projects_by_status.completed,
    },
    {
      color: "#1e3a8a",
      label: "Funds released",
      value: loading ? "--" : stats.projects_by_status.in_progress,
    },
  ];

  const featureCards = [
    {
      icon: <BarChart3 size={18} />,
      title: "Live Performance",
      desc: "Track every project in real-time.",
    },
    {
      icon: <IndianRupee size={18} />,
      title: "Budget Clarity",
      desc: "Understand spending at a glance.",
    },
    {
      icon: <FileSearch size={18} />,
      title: "Audit Trail",
      desc: "Trace every action clearly.",
    },
    {
      icon: <Users size={18} />,
      title: "Public Access",
      desc: "Open to everyone.",
    },
  ];

  return (
    <div className="landing-shell">
      <aside className="landing-trust-panel">
        <div className="trust-panel-glow" />
        <div className="landing-brand">GOVICHAIN</div>

        <div className="trust-copy">
          <span className="trust-eyebrow">
            <Landmark size={15} />
            Public works transparency
          </span>
          <h1>Transparency You Can Trust</h1>
          <p>
            Real-time tracking of public works with complete budget transparency,
            milestone progress, and accountability.
          </p>
        </div>

        <div className="landing-actions">
          <button className="btn landing-login-btn" onClick={() => navigate("/login")}>
            <LockKeyhole size={16} />
            Login as Official
          </button>
          <button className="btn landing-explore-btn" onClick={() => navigate("/public")}>
            Explore Projects
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="trust-divider" />

        <div className="trust-points">
          <div>
            <span className="trust-point-icon">
              <BarChart3 size={18} />
            </span>
            <strong>Live Tracking</strong>
            <p>Real-time updates on every created project.</p>
          </div>
          <div>
            <span className="trust-point-icon">
              <ClipboardCheck size={18} />
            </span>
            <strong>Full Accountability</strong>
            <p>Complete audit trail and verification.</p>
          </div>
          <div>
            <span className="trust-point-icon">
              <ShieldCheck size={18} />
            </span>
            <strong>Open Access</strong>
            <p>Public access to created projects.</p>
          </div>
        </div>
      </aside>

      <main className="landing-dashboard-preview">
        <section className="preview-section">
          <h2>Real-time Project Metrics</h2>
          <div className="preview-metrics-grid">
            {metricCards.map((card) => (
              <div className="preview-metric-card" key={card.label}>
                <span>{card.icon}</span>
                <strong>{card.value}</strong>
                <small>{card.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="budget-preview">
          <h2>Budget Overview</h2>
          <div className="budget-preview-grid">
            <div className="budget-chart-card">
              <strong>{formatCompactCurrency(stats.total_budget)}</strong>
              <span>Total Budget</span>
              <div className="month-bars" aria-hidden="true">
                <div style={{ height: "30%" }}><span>Jan</span></div>
                <div style={{ height: "36%" }}><span>Feb</span></div>
                <div style={{ height: "44%" }}><span>Mar</span></div>
                <div style={{ height: "52%" }}><span>Apr</span></div>
                <div style={{ height: "66%" }}><span>May</span></div>
                <div style={{ height: "62%" }}><span>Jun</span></div>
                <div style={{ height: "88%" }}><span>Jul</span></div>
              </div>
            </div>

            <div className="status-summary-card">
              <h3>Status Summary</h3>
              {statusRows.map((row) => (
                <div className="status-summary-row" key={row.label}>
                  <span className="status-dot" style={{ background: row.color }} />
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="preview-section">
          <h2>Explore More</h2>
          <div className="landing-feature-grid">
            {featureCards.map((feature) => (
              <button
                className="landing-feature-card"
                key={feature.title}
                onClick={() => navigate("/public")}
                type="button"
              >
                <span>{feature.icon}</span>
                <strong>{feature.title}</strong>
                <small>{feature.desc}</small>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
