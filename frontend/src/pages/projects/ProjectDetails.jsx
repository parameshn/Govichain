import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, milestonesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AIReportCard from '../../components/AIReportCard';
import {
  formatCurrency,
  formatEthEstimateFromInr,
  getChainLabel,
  getEthEstimateLabel,
  getExplorerUrl,
  parseRuleList,
  shortenHash,
} from '../../utils/formatters';
import './ProjectDetails.css';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [showBlockchainDetails, setShowBlockchainDetails] = useState(false);

  const loadProjectDetails = useCallback(async () => {
    try {
      setLoading(true);

      const [projectRes, progressRes, milestonesRes] = await Promise.all([
        projectsAPI.getById(id),
        projectsAPI.getProgress(id),
        milestonesAPI.getByProject(id),
      ]);

      setProject(projectRes.data);
      setProgress(progressRes.data);
      setMilestones(milestonesRes.data);
    } catch (error) {
      console.error('Failed to load project details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProjectDetails();
  }, [loadProjectDetails]);

  const getStatusBadge = (status) => {
    const badges = {
      CREATED: 'badge-info',
      IN_PROGRESS: 'badge-warning',
      COMPLETED: 'badge-success',
      PENDING: 'badge-warning',
      APPROVED: 'badge-success',
      FLAGGED: 'badge-danger',
      REJECTED: 'badge-danger',
    };
    return badges[status] || 'badge-info';
  };

  const projectRules = parseRuleList(project?.compliance_rules);
  const totalMilestones = progress?.milestones?.total || 0;
  const approvedMilestones = progress?.milestones?.approved || 0;
  const pendingMilestones = progress?.milestones?.pending || 0;
  const flaggedMilestones = progress?.milestones?.flagged || 0;
  const rejectedMilestones = progress?.milestones?.rejected || 0;

  if (loading) return <LoadingSpinner message="Loading project details..." />;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="project-details-page">
      <div className="page-header">
        <button className="btn btn-outline" onClick={() => navigate(-1)}>Back</button>
        <h1>{project.name}</h1>
      </div>

      <div className="project-info-card card">
        <div className="project-header">
          <div>
            <h2>{project.name}</h2>
            <span className={`badge ${getStatusBadge(project.status)}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <div className="project-budget-large">{formatCurrency(project.budget)}</div>
        </div>

        <p className="project-description">
          {project.description || 'No description provided'}
        </p>

        <div className="blockchain-summary">
          <div className="blockchain-summary-header">
            <div className="blockchain-header-content">
              <h3>Blockchain Record</h3>
              <span className={`blockchain-pill ${project.on_chain_tx_hash ? 'live' : 'muted'}`}>
                {project.on_chain_tx_hash ? 'Recorded on-chain' : 'Off-chain only'}
              </span>
            </div>
            <button
              type="button"
              className="blockchain-toggle-btn"
              onClick={() => setShowBlockchainDetails(!showBlockchainDetails)}
              title={showBlockchainDetails ? 'Hide details' : 'Show details'}
            >
              <span className="toggle-icon">{showBlockchainDetails ? '−' : '+'}</span>
            </button>
          </div>

          {showBlockchainDetails && (
            <>
              <div className="blockchain-grid">
                <div className="meta-item">
                  <span className="label">Network</span>
                  <span className="value">{getChainLabel(project.chain_network, project.chain_id)}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Chain Project ID</span>
                  <span className="value">{project.chain_project_id ?? '--'}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Demo Escrow</span>
                  <span className="value">
                    {project.on_chain_tx_hash ? formatEthEstimateFromInr(project.budget) : '--'}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="label">Wallet</span>
                  <span className="value">
                    {project.wallet_address ? shortenHash(project.wallet_address, 8, 6) : '--'}
                  </span>
                </div>
                <div className="meta-item blockchain-meta-wide">
                  <span className="label">Transaction</span>
                  {project.on_chain_tx_hash ? (
                    getExplorerUrl(project.on_chain_tx_hash, project.chain_id) ? (
                      <a
                        href={getExplorerUrl(project.on_chain_tx_hash, project.chain_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="chain-link"
                      >
                        {shortenHash(project.on_chain_tx_hash, 10, 8)}
                      </a>
                    ) : (
                      <span className="value">{shortenHash(project.on_chain_tx_hash, 10, 8)}</span>
                    )
                  ) : (
                    <span className="value">No on-chain transaction recorded</span>
                  )}
                </div>
              </div>
              <div className="blockchain-note">
                <strong>{formatCurrency(project.budget)}</strong> remains the project budget in the app.
                <span>{getEthEstimateLabel()} so project creation locks roughly {formatEthEstimateFromInr(project.budget)} as demo escrow when recorded on-chain.</span>
                <span>Approved milestones release mapped portions of that escrow to the contractor. Flagged or rejected milestones do not release funds.</span>
              </div>
            </>
          )}
        </div>
      </div>

      {projectRules.length > 0 && (
        <div className="ai-rules-card">
          <div className="ai-header">
            <h3>AI Compliance Rules</h3>
            <span className="ai-badge">AI Generated</span>
          </div>

          <div className="rules-list">
            {projectRules.map((rule, i) => (
              <div key={i} className="rule-item">
                <span className="rule-icon">{i + 1}</span>
                <p>{rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {progress && (
        <div className="progress-section">
          <div className="progress-card card">
            <h3>Project Progress</h3>

            {totalMilestones > 0 ? (
              <>
                <div className="progress-bar-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress.progress.completion_percentage}%` }}
                    >
                      {progress.progress.completion_percentage}%
                    </div>
                  </div>
                </div>

                <div className="progress-stats">
                  <div className="stat">
                    <span className="stat-value">{approvedMilestones}</span>
                    <span className="stat-label">Approved</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{pendingMilestones + flaggedMilestones}</span>
                    <span className="stat-label">Under Review</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{rejectedMilestones}</span>
                    <span className="stat-label">Rejected</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{totalMilestones}</span>
                    <span className="stat-label">Total</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="progress-empty-state">
                <strong>No milestones submitted yet.</strong>
                <p>Progress will update once milestones are created and reviewed.</p>
              </div>
            )}
          </div>

          <div className="budget-card card">
            <h3>Budget Overview</h3>
            <div className="budget-stats">
              <div className="budget-item">
                <span className="label">Total Budget</span>
                <span className="value">{formatCurrency(progress.funds.total_budget)}</span>
              </div>
              <div className="budget-item">
                <span className="label">Reserved Budget</span>
                <span className="value">{formatCurrency(progress.funds.reserved_amount)}</span>
              </div>
              <div className="budget-item">
                <span className="label">Under Review</span>
                <span className="value">{formatCurrency(progress.funds.under_review_amount)}</span>
              </div>
              <div className="budget-item">
                <span className="label">Approved</span>
                <span className="value">{formatCurrency(progress.funds.approved_amount)}</span>
              </div>
              <div className="budget-item">
                <span className="label">Available</span>
                <span className="value green">{formatCurrency(progress.funds.available_budget)}</span>
              </div>
            </div>
            <div className="utilization-bar">
              <div
                className="utilization-fill"
                style={{ width: `${Math.min(progress.progress.budget_utilization, 100)}%` }}
              />
            </div>
            <div className="utilization-text">
              Approved and under-review milestones reserve budget until explicitly rejected.
            </div>
            <div className="budget-caption">
              Project completes automatically when approved budget reaches the total budget and no milestones are pending or flagged.
            </div>
          </div>
        </div>
      )}

      <div className="milestones-section card">
        <div className="section-header">
          <h3>Milestones ({milestones.length})</h3>

          {user?.role === 'CONTRACTOR' && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/milestones/create', { state: { projectId: id } })}
            >
              Add Milestone
            </button>
          )}
        </div>

        {milestones.length > 0 ? (
          <div className="milestones-grid">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="milestone-card">
                <div className="milestone-top">
                  <div>
                    <h4>{milestone.title}</h4>
                    <p className="milestone-desc">
                      {expandedDesc[milestone.id]
                        ? milestone.description
                        : milestone.description?.slice(0, 120) + '...'}

                      {milestone.description?.length > 120 && (
                        <span
                          className="read-more"
                          onClick={() =>
                            setExpandedDesc((prev) => ({
                              ...prev,
                              [milestone.id]: !prev[milestone.id]
                            }))
                          }
                        >
                          {expandedDesc[milestone.id] ? ' Show less' : ' Show more'}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="milestone-amount">
                    {formatCurrency(milestone.requested_amount)}
                  </div>
                </div>

                <div className="milestone-middle">
                  {(() => {
                    const currentScore = milestone.ai_score || 0;

                    let colorClass = 'green';
                    let verdictText = 'APPROVED';

                    if (currentScore < 75 && currentScore >= 50) {
                      colorClass = 'yellow';
                      verdictText = 'REVIEW';
                    } else if (currentScore < 50) {
                      colorClass = 'red';
                      verdictText = 'REJECTED';
                    }

                    return (
                      <div className={`fancy-score ${colorClass}`}>
                        <div className="circle-wrapper">
                          <svg className="progress-ring" width="70" height="70">
                            <circle
                              className="progress-bg"
                              cx="35"
                              cy="35"
                              r="30"
                            />
                            <circle
                              className="progress-bar"
                              cx="35"
                              cy="35"
                              r="30"
                              style={{
                                strokeDasharray: 2 * Math.PI * 30,
                                strokeDashoffset:
                                  2 * Math.PI * 30 * (1 - (currentScore / 100))
                              }}
                            />
                          </svg>

                          <div className="circle-text">
                            {Math.round(currentScore)}%
                          </div>
                        </div>
                        <p className="score-label">Compliance</p>
                        <p className="score-verdict">{verdictText}</p>
                      </div>
                    );
                  })()}

                  <span className={`status-pill ${milestone.status.toLowerCase()}`}>
                    {milestone.status}
                  </span>

                  <span className={`mini-chain-pill ${milestone.submission_tx_hash ? 'live' : 'muted'}`}>
                    {milestone.submission_tx_hash ? 'On-chain' : 'Off-chain'}
                  </span>

                  {milestone.ai_report && (
                    <button
                      className="btn btn-outline"
                      onClick={() =>
                        setExpandedMilestone(
                          expandedMilestone === milestone.id ? null : milestone.id
                        )
                      }
                    >
                      AI Report
                    </button>
                  )}
                </div>

                {expandedMilestone === milestone.id && (
                  <div className="ai-expanded">
                    <div className="milestone-chain-details">
                      <div>
                        <strong>Submission Record</strong>
                        <p>
                          {milestone.submission_tx_hash
                            ? 'Recorded on blockchain'
                            : 'No on-chain submission record'}
                        </p>
                      </div>
                      {milestone.submission_tx_hash && (
                        getExplorerUrl(milestone.submission_tx_hash, milestone.chain_id) ? (
                          <a
                            href={getExplorerUrl(milestone.submission_tx_hash, milestone.chain_id)}
                            target="_blank"
                            rel="noreferrer"
                            className="chain-link"
                          >
                            {shortenHash(milestone.submission_tx_hash, 10, 8)}
                          </a>
                        ) : (
                          <span className="chain-inline-hash">
                            {shortenHash(milestone.submission_tx_hash, 10, 8)}
                          </span>
                        )
                      )}
                    </div>
                    <AIReportCard
                      report={milestone.ai_report}
                      score={milestone.ai_score}
                      flags={milestone.ai_flags}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No milestones yet</p>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
