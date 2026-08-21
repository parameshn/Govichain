import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { milestonesAPI, projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AIReportCard from '../../components/AIReportCard';
import {
  formatCurrency,
  formatEthEstimateFromInr,
  getEthEstimateLabel,
  getChainLabel,
  getExplorerUrl,
  shortenHash,
} from '../../utils/formatters';
import {
  approveMilestoneOnChain,
  flagMilestoneOnChain,
  rejectMilestoneOnChain,
} from '../../services/web3Service';
import './MilestoneReview.css';

const AIRecommendationCard = ({ report }) => {
  if (!report?.auditor_recommendation) return null;

  const isAccept = report.auditor_recommendation === 'ACCEPT';

  return (
    <div className="ai-rec-card-inline">
      <div className="ai-rec-header">
        <span className="ai-label">AI Recommendation</span>
        <span className={`rec-badge ${isAccept ? 'accept' : 'flag'}`}>
          {report.auditor_recommendation}
        </span>
      </div>

      <p className="ai-rec-text">{report.reason}</p>

      <div className="confidence-section">
        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{ width: `${report.confidence}%` }}
          />
        </div>
        <span className="confidence-text">
          Confidence: {report.confidence}%
        </span>
      </div>
    </div>
  );
};

const getFriendlyReviewError = (error) => {
  const rawMessage = [
    error?.reason,
    error?.shortMessage,
    error?.message,
    error?.info?.error?.message,
  ]
    .filter(Boolean)
    .join(' ');

  if (rawMessage.includes('Only flagged milestones can be rejected')) {
    return 'Blockchain rejected this action because this milestone was not flagged on-chain first. Uncheck "Record this review decision on blockchain" to reject it in the app, or flag it on-chain before rejecting on-chain.';
  }

  if (rawMessage.includes('user rejected') || rawMessage.includes('User denied')) {
    return 'Wallet transaction was cancelled.';
  }

  if (rawMessage.includes('insufficient funds')) {
    return 'The connected wallet does not have enough funds for gas.';
  }

  return error?.message || 'Review action failed. Please try again.';
};

const MilestoneReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, chainInfo, connectWallet, isWalletAvailable, isContractConfigured } = useWallet();

  const [milestone, setMilestone] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAIReport, setShowAIReport] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [recordReviewOnChain, setRecordReviewOnChain] = useState(false);

  const loadMilestoneDetails = useCallback(async () => {
    try {
      setLoading(true);
      const milestoneRes = await milestonesAPI.getById(id);
      setMilestone(milestoneRes.data);

      const projectRes = await projectsAPI.getById(milestoneRes.data.project_id);
      setProject(projectRes.data);
    } catch (error) {
      console.error('Failed to load milestone data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMilestoneDetails();
  }, [loadMilestoneDetails]);

  const runReviewAction = async (actionName, onChainFn, apiFn, successMessage) => {
    if (!window.confirm(`Are you sure you want to ${actionName.toLowerCase()} this milestone?`)) {
      return;
    }

    try {
      setActionLoading(true);
      let payload = {};

      if (recordReviewOnChain) {
        if (!milestone.chain_milestone_id) {
          throw new Error('This milestone is not recorded on blockchain yet.');
        }
        if (!account) {
          const connected = await connectWallet();
          if (!connected) {
            throw new Error('Connect your wallet before recording this review on-chain.');
          }
        }
        if (!isContractConfigured) {
          throw new Error('Contract address is not configured yet.');
        }

        const chainMeta = await onChainFn(milestone.chain_milestone_id);
        payload = {
          wallet_address: chainMeta.walletAddress,
          review_tx_hash: chainMeta.txHash,
          chain_network: chainMeta.chainNetwork,
          chain_id: chainMeta.chainId,
          chain_project_id: milestone.chain_project_id || chainMeta.chainProjectId,
          chain_milestone_id: milestone.chain_milestone_id || chainMeta.chainMilestoneId,
          contract_address: chainMeta.contractAddress,
        };
      }

      await apiFn(id, payload);
      alert(successMessage);
      navigate('/milestones/pending');
    } catch (error) {
      alert(getFriendlyReviewError(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () =>
    runReviewAction(
      'Approve',
      approveMilestoneOnChain,
      milestonesAPI.approve,
      recordReviewOnChain
        ? `Milestone approved and approximately ${formatEthEstimateFromInr(milestone.requested_amount)} released to the contractor on-chain.`
        : 'Milestone approved successfully.'
    );

  const handleFlag = async () =>
    runReviewAction('Flag', flagMilestoneOnChain, milestonesAPI.flag, 'Milestone flagged successfully.');

  if (loading) return <LoadingSpinner message="Fetching milestone details..." />;
  if (!milestone) return <div className="error-state">Milestone not found.</div>;

  const canApprove = ['PENDING', 'FLAGGED'].includes(milestone.status);
  const canFlag = milestone.status === 'PENDING';
  const canReject = milestone.status === 'FLAGGED';
  const isCompletedReview = ['APPROVED', 'REJECTED'].includes(milestone.status);
  const wasFlaggedOnChain = Boolean(milestone.review_tx_hash);
  const canRejectOnChain = canReject && wasFlaggedOnChain;

  const handleReject = async () => {
    if (recordReviewOnChain && !canRejectOnChain) {
      alert(
        'This milestone was flagged in the app, but it was not flagged on-chain. Uncheck blockchain recording to reject it in the app, or flag it on-chain before rejecting on-chain.'
      );
      return;
    }

    return runReviewAction('Reject', rejectMilestoneOnChain, milestonesAPI.reject, 'Milestone rejected successfully.');
  };

  return (
    <div className="milestone-review-page">
      <div className="page-header">
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          Back
        </button>
        <div className="header-titles">
          <h1>Review Milestone</h1>
          <span className="milestone-id">Milestone Ref: #{id}</span>
        </div>
      </div>

      <div className="review-container">
        <div className="left-panel">
          <div className="milestone-card card">
            <div className="card-header-flex">
              <h2 className="section-title">Milestone Details</h2>
              <span className={`status-pill ${milestone.status?.toLowerCase()}`}>
                {milestone.status}
              </span>
            </div>

            <div className="info-grid">
              <div className="info-item full-width">
                <label>Title</label>
                <p className="title-text">{milestone.title}</p>
              </div>

              <div className="info-item full-width">
                <label>Description</label>
                <div className={`description-container ${isDescExpanded ? 'expanded' : ''}`}>
                  <p>{milestone.description}</p>
                </div>
                {milestone.description?.length > 150 && (
                  <button
                    className="text-toggle-btn"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                  >
                    {isDescExpanded ? 'Show Less' : 'Read Full Description'}
                  </button>
                )}
              </div>

              <div className="info-item">
                <label>Requested Amount</label>
                <p className="amount-highlighted">{formatCurrency(milestone.requested_amount)}</p>
              </div>

              <div className="info-item">
                <label>Submission Date</label>
                <p>{new Date(milestone.created_at || Date.now()).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</p>
              </div>
            </div>

            {project && (
              <div className="project-sub-section">
                <h3 className="sub-section-title">Project Context</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Project Name</label>
                    <p className="semi-bold">{project.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Total Project Budget</label>
                    <p>{formatCurrency(project.budget)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="project-sub-section">
              <h3 className="sub-section-title">Blockchain Record</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Submission Status</label>
                  <p>{milestone.submission_tx_hash ? 'Recorded on blockchain' : 'Off-chain only'}</p>
                </div>
                <div className="info-item">
                  <label>Network</label>
                  <p>{getChainLabel(milestone.chain_network, milestone.chain_id)}</p>
                </div>
                <div className="info-item full-width">
                  <label>Submission Transaction</label>
                  {milestone.submission_tx_hash ? (
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
                      <p>{shortenHash(milestone.submission_tx_hash, 10, 8)}</p>
                    )
                  ) : (
                    <p>No on-chain submission record</p>
                  )}
                </div>
                {milestone.review_tx_hash && (
                  <div className="info-item full-width">
                    <label>Latest Review Transaction</label>
                    {getExplorerUrl(milestone.review_tx_hash, milestone.chain_id) ? (
                      <a
                        href={getExplorerUrl(milestone.review_tx_hash, milestone.chain_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="chain-link"
                      >
                        {shortenHash(milestone.review_tx_hash, 10, 8)}
                      </a>
                    ) : (
                      <p>{shortenHash(milestone.review_tx_hash, 10, 8)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="right-panel card">
          <h3 className="right-panel-title">Review Actions</h3>
          <p className="instruction-text">
            Carefully review the deliverables. Pending milestones can be flagged for concern, and flagged milestones can be either approved or rejected.
          </p>

          {!isCompletedReview ? (
            <div className="action-buttons">
              <button
                className="btn btn-success btn-full"
                onClick={handleApprove}
                disabled={actionLoading || !canApprove}
              >
                Approve Milestone
              </button>

              {canFlag && (
                <button
                  className="btn btn-danger btn-full"
                  onClick={handleFlag}
                  disabled={actionLoading}
                >
                  Flag as Suspicious
                </button>
              )}

              {canReject && (
                <button
                  className="btn btn-danger btn-full"
                  onClick={handleReject}
                  disabled={actionLoading || (recordReviewOnChain && !canRejectOnChain)}
                >
                  Reject Milestone
                </button>
              )}
            </div>
          ) : (
            <div className="review-status-note">
              This milestone has already been {milestone.status.toLowerCase()}.
            </div>
          )}

          <div className="review-guidelines">
            <p>AUDITOR GUIDELINES:</p>
            <ul>
              <li>Confirm evidence matches description</li>
              <li>Validate amount against budget</li>
              <li>Check for regulatory compliance</li>
            </ul>
          </div>

          <div className="chain-review-box">
            <div className="chain-review-header">
              <strong>Blockchain Review Recording</strong>
              <span className={`chain-state ${milestone.chain_milestone_id ? 'connected' : 'muted'}`}>
                {milestone.chain_milestone_id ? 'Milestone linked on-chain' : 'Off-chain milestone'}
              </span>
            </div>

            <label className="chain-toggle">
              <input
                type="checkbox"
                checked={recordReviewOnChain}
                onChange={(event) => setRecordReviewOnChain(event.target.checked)}
                disabled={!milestone.chain_milestone_id || !isWalletAvailable || !isContractConfigured}
              />
              <span>Record this review decision on blockchain</span>
            </label>

            {isWalletAvailable && !account && (
              <div className="chain-wallet-row">
                <button type="button" className="btn btn-outline" onClick={connectWallet}>
                  Connect Wallet
                </button>
                <span className="chain-help-text">
                  Wallet is only needed if you choose to record the review on-chain.
                </span>
              </div>
            )}

            {account && (
              <p className="chain-help-text">
                Connected to {chainInfo?.networkName || 'wallet network'} as {account.slice(0, 6)}...{account.slice(-4)}.
              </p>
            )}

            <div className="chain-note">
              <strong>Approving this milestone can release {formatEthEstimateFromInr(milestone.requested_amount)} to the contractor from project escrow.</strong>
              <span>{getEthEstimateLabel()} is used only for demo conversion. The official project and milestone values remain in rupees.</span>
              <span>Flagging or rejecting keeps the escrow locked. The auditor signs the release decision but does not pay from their own wallet.</span>
              {canReject && !canRejectOnChain && (
                <span className="chain-warning-text">
                  This milestone is flagged in the app, but not on-chain. Keep blockchain recording off to reject it here.
                </span>
              )}
            </div>
          </div>

          <div className="ai-integration-box">
            <AIRecommendationCard report={milestone.ai_report} />

            <button
              className="btn-ai-toggle"
              onClick={() => setShowAIReport(!showAIReport)}
            >
              {showAIReport ? 'Hide Detailed AI Report' : 'View Full AI Report'}
            </button>

            {showAIReport && (
              <AIReportCard
                report={milestone.ai_report}
                score={milestone.ai_score}
                flags={milestone.ai_flags}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneReview;
