import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./PublicProjectDetail.css";
import { apiClient } from "../../services/api";
import { formatCompactCurrency as formatCurrency } from "../../utils/formatters";

const PublicProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchProjectDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/public/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  }, [projectId]);

  const fetchTimeline = useCallback(async () => {
    try {
      const response = await apiClient.get(`/public/projects/${projectId}/timeline`);
      setTimeline(response.data);
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetail();
    fetchTimeline();
  }, [fetchProjectDetail, fetchTimeline]);

  if (loading) {
    return (
      <div className="project-detail-loading">
        <div className="spinner" />
        <p>Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-detail-error">
        <p>Project not found</p>
        <button onClick={() => navigate("/public")} type="button">
          Back to Projects
        </button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status.toUpperCase()) {
      case "CREATED":
        return "#f59e0b";
      case "IN_PROGRESS":
        return "#3b82f6";
      case "COMPLETED":
      case "APPROVED":
        return "#22c55e";
      case "PENDING":
        return "#fbbf24";
      case "FLAGGED":
        return "#ef4444";
      case "REJECTED":
        return "#64748b";
      default:
        return "#94a3b8";
    }
  };

  const getStatusLabel = (status) => {
    switch (status.toUpperCase()) {
      case "CREATED":
        return "Created";
      case "IN_PROGRESS":
        return "Ongoing";
      case "COMPLETED":
        return "Completed";
      case "APPROVED":
        return "Approved";
      case "PENDING":
        return "Pending";
      case "FLAGGED":
        return "Flagged";
      case "REJECTED":
        return "Rejected";
      default:
        return status;
    }
  };

  const projectStatus = project.status.toUpperCase();
  const statusColor =
    projectStatus === "COMPLETED"
      ? "#22c55e"
      : projectStatus === "IN_PROGRESS"
      ? "#60a5fa"
      : "#fbbf24";
  const projectStatusLabel =
    projectStatus === "COMPLETED"
      ? "Completed"
      : projectStatus === "IN_PROGRESS"
      ? "Ongoing"
      : "Created";
  const progress = Math.min(
    Math.round((project.progress_percentage || 0) * 100) / 100,
    100
  );

  return (
    <div className="project-detail">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate("/public")} type="button">
          Back
        </button>
        <h1>{project.name}</h1>
        <span
          className="project-status"
          style={{ borderColor: statusColor, color: statusColor }}
        >
          {projectStatusLabel}
        </span>
      </header>

      <div className="detail-container">
        <aside className="detail-sidebar">
          <div className="summary-card">
            <h3>Project Summary</h3>
            <div className="summary-item">
              <span className="label">Status</span>
              <span className="value" style={{ color: statusColor }}>
                {projectStatusLabel}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Progress</span>
              <span className="value">{progress}%</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Budget</span>
              <span className="value">{formatCurrency(project.budget)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Created</span>
              <span className="value">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="breakdown-card">
            <h3>Budget Breakdown</h3>
            <div className="breakdown-item">
              <span className="label">
                <span className="dot" style={{ background: "#22c55e" }} />
                Approved
              </span>
              <span className="amount">
                {formatCurrency(project.budget_breakdown.approved_amount)}
              </span>
            </div>
            <div className="breakdown-item">
              <span className="label">
                <span className="dot" style={{ background: "#fbbf24" }} />
                Pending
              </span>
              <span className="amount">
                {formatCurrency(project.budget_breakdown.pending_amount)}
              </span>
            </div>
            <div className="breakdown-item">
              <span className="label">
                <span className="dot" style={{ background: "#ef4444" }} />
                Flagged
              </span>
              <span className="amount">
                {formatCurrency(project.budget_breakdown.flagged_amount)}
              </span>
            </div>
            <div className="breakdown-item">
              <span className="label">
                <span className="dot" style={{ background: "#64748b" }} />
                Rejected
              </span>
              <span className="amount">
                {formatCurrency(project.budget_breakdown.rejected_amount)}
              </span>
            </div>
            <div className="breakdown-item total">
              <span className="label">Available</span>
              <span className="amount">
                {formatCurrency(project.budget_breakdown.available_amount)}
              </span>
            </div>
          </div>

          <div className="detail-stats-card">
            <h3>Milestone Statistics</h3>
            <div className="stat-row">
              <div className="stat-box">
                <div className="stat-number" style={{ color: "#22c55e" }}>
                  {project.milestones.approved.count}
                </div>
                <div className="stat-label">Approved</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: "#fbbf24" }}>
                  {project.milestones.pending.count}
                </div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: "#ef4444" }}>
                  {project.milestones.flagged.count}
                </div>
                <div className="stat-label">Flagged</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="detail-main">
          <section className="section">
            <h2>Project Description</h2>
            <p className="description">{project.description}</p>
          </section>

          <div className="tabs-container">
            <div className="tabs">
              <button
                className={`tab ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
                type="button"
              >
                Overview
              </button>
              <button
                className={`tab ${activeTab === "timeline" ? "active" : ""}`}
                onClick={() => setActiveTab("timeline")}
                type="button"
              >
                Milestone Timeline
              </button>
            </div>

            {activeTab === "overview" && (
              <div className="tab-content">
                <div className="progress-section">
                  <h3>Budget Utilization</h3>
                  <div className="progress-bar-large">
                    <div
                      className="progress-fill-large"
                      style={{ width: `${Math.min(project.progress_percentage || 0, 100)}%` }}
                    />
                  </div>
                  <div className="progress-stats">
                    <div className="progress-stat">
                      <span className="stat-label">Approved</span>
                      <span className="stat-value">
                        {formatCurrency(project.budget_breakdown.approved_amount)}
                      </span>
                    </div>
                    <div className="progress-stat">
                      <span className="stat-label">Reserved</span>
                      <span className="stat-value">
                        {formatCurrency(project.budget_breakdown.reserved_amount)}
                      </span>
                    </div>
                    <div className="progress-stat">
                      <span className="stat-label">Available</span>
                      <span className="stat-value">
                        {formatCurrency(project.budget_breakdown.available_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="milestones-grid">
                  <div className="milestone-box">
                    <div className="milestone-count">
                      {project.milestones.approved.count}
                    </div>
                    <div className="milestone-label">Approved</div>
                    <div className="milestone-amount">
                      {formatCurrency(project.milestones.approved.amount)}
                    </div>
                  </div>
                  <div className="milestone-box">
                    <div className="milestone-count">
                      {project.milestones.pending.count}
                    </div>
                    <div className="milestone-label">Pending</div>
                    <div className="milestone-amount">
                      {formatCurrency(project.milestones.pending.amount)}
                    </div>
                  </div>
                  <div className="milestone-box">
                    <div className="milestone-count">
                      {project.milestones.flagged.count}
                    </div>
                    <div className="milestone-label">Flagged</div>
                    <div className="milestone-amount">
                      {formatCurrency(project.milestones.flagged.amount)}
                    </div>
                  </div>
                  <div className="milestone-box">
                    <div className="milestone-count">
                      {project.milestones.rejected.count}
                    </div>
                    <div className="milestone-label">Rejected</div>
                    <div className="milestone-amount">
                      {formatCurrency(project.milestones.rejected.amount)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "timeline" && timeline && (
              <div className="tab-content">
                <div className="timeline-view">
                  {timeline.events.length === 0 ? (
                    <p className="no-milestones">No milestones for this project</p>
                  ) : (
                    timeline.events.map((event, index) => (
                      <div key={event.id} className="timeline-event">
                        <div className="event-marker">
                          <div className="marker-dot" />
                          {index !== timeline.events.length - 1 && (
                            <div className="marker-line" />
                          )}
                        </div>
                        <div className="event-content">
                          <div className="event-header">
                            <h4>{event.title}</h4>
                            <span
                              className="event-status"
                              style={{ color: getStatusColor(event.status) }}
                            >
                              {getStatusLabel(event.status)}
                            </span>
                          </div>
                          <p className="event-description">{event.description}</p>
                          <div className="event-meta">
                            <span className="meta-item">
                              Amount: {formatCurrency(event.amount)}
                            </span>
                            <span className="meta-item">
                              Date: {new Date(event.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <section className="signin-cta">
            <h3>Want to Contribute to This Project?</h3>
            <p>
              Sign in as a Government Officer, Contractor, or Auditor to manage
              projects and milestones.
            </p>
            <button className="cta-btn" onClick={() => navigate("/login")} type="button">
              Sign In Now
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default PublicProjectDetail;
