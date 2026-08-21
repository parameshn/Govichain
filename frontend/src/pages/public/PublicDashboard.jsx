import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PublicDashboard.css";
import { apiClient } from "../../services/api";
import { formatCompactCurrency } from "../../utils/formatters";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Folder,
  IndianRupee,
  LockKeyhole,
  Search,
} from "lucide-react";

const PublicDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/public/projects", {
        params: { limit: 100 },
      });
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = useCallback(() => {
    let filtered = [...projects];

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (project) => project.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (budgetFilter !== "all") {
      filtered = filtered.filter((project) => {
        const budget = Number(project.budget || 0);
        if (budgetFilter === "small") return budget < 10000000;
        if (budgetFilter === "medium") return budget >= 10000000 && budget < 50000000;
        if (budgetFilter === "large") return budget >= 50000000;
        return true;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          (project.description && project.description.toLowerCase().includes(query))
      );
    }

    setFilteredProjects(filtered);
  }, [projects, statusFilter, budgetFilter, searchQuery]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [filterProjects]);

  const summary = useMemo(() => {
    const totalBudget = projects.reduce(
      (sum, project) => sum + Number(project.budget || 0),
      0
    );
    const completed = projects.filter(
      (project) => project.status.toUpperCase() === "COMPLETED"
    ).length;
    const inProgress = projects.filter(
      (project) => project.status.toUpperCase() === "IN_PROGRESS"
    ).length;

    return { totalBudget, completed, inProgress };
  }, [projects]);

  const getStatusClass = (status) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "status-completed";
      case "IN_PROGRESS":
        return "status-in-progress";
      case "CREATED":
        return "status-created";
      default:
        return "status-default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "Completed";
      case "IN_PROGRESS":
        return "Ongoing";
      case "CREATED":
        return "Created";
      default:
        return status;
    }
  };

  const getStatusPercentage = (project) => {
    const budget = Number(project.budget || 0);
    const approved = Number(project.approved_amount || 0);
    if (!budget) return 0;
    return Math.min((approved / budget) * 100, 100);
  };

  return (
    <div className="pub-dashboard">
      <div className="pub-header">
        <div className="pub-header-inner">
          <div>
            <span className="pub-eyebrow">Public transparency portal</span>
            <h1>Public Project Dashboard</h1>
            <p>Explore created government projects, budgets, and milestone progress.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            <LockKeyhole size={18} />
            Sign In
          </button>
        </div>
      </div>

      <div className="pub-content">
        <div className="pub-summary-grid">
          <div className="pub-summary-card">
            <span className="pub-summary-icon">
              <ClipboardList size={22} />
            </span>
            <div>
              <span className="pub-summary-label">Created Projects</span>
              <strong>{projects.length}</strong>
            </div>
          </div>
          <div className="pub-summary-card">
            <span className="pub-summary-icon">
              <IndianRupee size={22} />
            </span>
            <div>
              <span className="pub-summary-label">Total Budget</span>
              <strong>{formatCompactCurrency(summary.totalBudget)}</strong>
            </div>
          </div>
          <div className="pub-summary-card">
            <span className="pub-summary-icon">
              <CheckCircle2 size={22} />
            </span>
            <div>
              <span className="pub-summary-label">Completed</span>
              <strong>{summary.completed}</strong>
            </div>
          </div>
          <div className="pub-summary-card">
            <span className="pub-summary-icon">
              <CalendarDays size={22} />
            </span>
            <div>
              <span className="pub-summary-label">Ongoing</span>
              <strong>{summary.inProgress}</strong>
            </div>
          </div>
        </div>

        <div className="pub-filters-bar">
          <div className="pub-search-wrap">
            <Search size={16} className="pub-search-icon" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pub-search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="pub-select"
          >
            <option value="all">All Status</option>
            <option value="created">Created</option>
            <option value="in_progress">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={budgetFilter}
            onChange={(event) => setBudgetFilter(event.target.value)}
            className="pub-select"
          >
            <option value="all">All Budgets</option>
            <option value="small">Small (&lt; Rs. 1 Cr)</option>
            <option value="medium">Medium (Rs. 1 Cr - 5 Cr)</option>
            <option value="large">Large (&gt; Rs. 5 Cr)</option>
          </select>
          <span className="pub-count">
            Showing <strong>{filteredProjects.length}</strong> of{" "}
            <strong>{projects.length}</strong>
          </span>
        </div>

        {loading ? (
          <div className="pub-loading">
            <div className="pub-spinner" />
            <p>Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="pub-empty">
            <Folder size={48} color="#94a3b8" />
            <p>No projects found matching your filters.</p>
          </div>
        ) : (
          <div className="pub-grid">
            {filteredProjects.map((project) => {
              const progress = getStatusPercentage(project);

              return (
                <button
                  key={project.id}
                  className="pub-card"
                  onClick={() => navigate(`/public/projects/${project.id}`)}
                  type="button"
                >
                  <div className="pub-card-header">
                    <h3 className="pub-card-title">{project.name}</h3>
                    <span className={`pub-badge ${getStatusClass(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  <p className="pub-card-desc">
                    {project.description
                      ? project.description.substring(0, 130) +
                        (project.description.length > 130 ? "..." : "")
                      : "No description available."}
                  </p>

                  <div className="pub-progress-section">
                    <div className="pub-progress-header">
                      <span>Budget utilization</span>
                      <span className="pub-progress-pct">{Math.round(progress)}%</span>
                    </div>
                    <div className="pub-progress-bar">
                      <div
                        className="pub-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pub-card-footer">
                    <div className="pub-footer-item">
                      <span className="pub-footer-label">Budget</span>
                      <span className="pub-footer-value">
                        {formatCompactCurrency(project.budget)}
                      </span>
                    </div>
                    <div className="pub-footer-item">
                      <span className="pub-footer-label">Milestones</span>
                      <span className="pub-footer-value">
                        {project.milestone_count || 0}
                      </span>
                    </div>
                    <div className="pub-footer-item">
                      <span className="pub-footer-label">Created</span>
                      <span className="pub-footer-value">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span className="pub-card-cta">
                    View Details
                    <ArrowRight size={16} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicDashboard;
