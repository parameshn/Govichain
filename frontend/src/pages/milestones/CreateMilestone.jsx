import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../../context/WalletContext';
import { projectsAPI, milestonesAPI } from '../../services/api';
import { submitMilestoneOnChain } from '../../services/web3Service';
import {
  formatCurrency,
  formatEthEstimateFromInr,
  getEthEstimateLabel,
  parseRuleList,
} from '../../utils/formatters';
import './CreateMilestone.css';

const CreateMilestone = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, chainInfo, connectWallet, isWalletAvailable, isContractConfigured } = useWallet();

  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    project_id: location.state?.projectId || '',
    title: '',
    description: '',
    requested_amount: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [recordOnChain, setRecordOnChain] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.getAll();
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedProject = projects.find(
    (project) => project.id === parseInt(formData.project_id)
  );
  const projectRules = parseRuleList(selectedProject?.compliance_rules);
  const requestedAmountValue = parseFloat(formData.requested_amount);
  const hasRequestedAmount = Number.isFinite(requestedAmountValue) && requestedAmountValue > 0;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setAiResult(null);
    setError('');
  };

  const handleCheckCompliance = async () => {
    if (!formData.description || !selectedProject) return;

    setChecking(true);

    try {
      const res = await milestonesAPI.evaluate({
        rules: selectedProject.compliance_rules,
        milestone: formData.description,
      });
      setAiResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (aiResult?.verdict === 'REJECTED') {
      alert('Fix compliance issues before submitting.');
      return;
    }

    setLoading(true);

    try {
      const requestedAmount = parseFloat(formData.requested_amount);
      let chainMeta = null;
      let descriptionHash = null;

      if (recordOnChain) {
        if (!selectedProject?.chain_project_id) {
          throw new Error('This project is not recorded on blockchain yet.');
        }

        if (!account) {
          const connected = await connectWallet();
          if (!connected) {
            throw new Error('Connect your wallet before recording this milestone on-chain.');
          }
        }

        if (!isContractConfigured) {
          throw new Error('Contract address is not configured yet.');
        }

        descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(formData.description || ''));
        chainMeta = await submitMilestoneOnChain(
          selectedProject.chain_project_id,
          formData.title,
          descriptionHash,
          requestedAmount,
          aiResult?.score || 0
        );
      }

      await milestonesAPI.create({
        ...formData,
        project_id: parseInt(formData.project_id),
        requested_amount: requestedAmount,
        wallet_address: chainMeta?.walletAddress || null,
        submission_tx_hash: chainMeta?.txHash || null,
        chain_network: chainMeta?.chainNetwork || null,
        chain_id: chainMeta?.chainId || null,
        chain_project_id: chainMeta?.chainProjectId || selectedProject?.chain_project_id || null,
        chain_milestone_id: chainMeta?.chainMilestoneId || null,
        contract_address: chainMeta?.contractAddress || null,
        description_hash: descriptionHash,
      });

      alert(
        recordOnChain
          ? `Milestone created. If approved later, it can release approximately ${formatEthEstimateFromInr(requestedAmount)} from project escrow.`
          : 'Milestone created successfully.'
      );
      navigate(`/projects/${formData.project_id}`);
    } catch (err) {
      const detail = err.response?.data?.detail;

      if (detail?.ai) {
        setAiResult(detail.ai);
      }

      setError(
        typeof detail === 'string'
          ? detail
          : detail?.message || 'Failed to create milestone'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-milestone-page">
      <div className="page-header">
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          Back
        </button>
        <h1>Create New Milestone</h1>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="milestone-form">
          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label>Select Project *</label>
            <select
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Choose a project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Milestone Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>

            <div className="description-box">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe milestone..."
              />

              <button
                type="button"
                className="ai-check-btn"
                onClick={handleCheckCompliance}
                disabled={checking || !formData.description}
              >
                {checking ? 'Analyzing...' : 'Analyze with AI'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Requested Amount (Rs.) *</label>
            <input
              type="number"
              name="requested_amount"
              value={formData.requested_amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="chain-options-card">
            <div className="chain-options-header">
              <div>
                <h3>Blockchain Recording</h3>
                <p>Optionally record this milestone submission on-chain for auditability and payout tracking.</p>
              </div>
              <span className={`chain-state ${selectedProject?.chain_project_id ? 'connected' : 'muted'}`}>
                {selectedProject?.chain_project_id ? 'Project linked on-chain' : 'Project off-chain'}
              </span>
            </div>

            <label className="chain-toggle">
              <input
                type="checkbox"
                checked={recordOnChain}
                onChange={(event) => setRecordOnChain(event.target.checked)}
                disabled={!selectedProject?.chain_project_id || !isWalletAvailable || !isContractConfigured}
              />
              <span>Record this milestone on blockchain</span>
            </label>

            {selectedProject && !selectedProject.chain_project_id && (
              <p className="chain-help-text">
                Only projects already recorded on blockchain can have on-chain milestone records.
              </p>
            )}

            {isWalletAvailable && !account && (
              <div className="chain-wallet-row">
                <button type="button" className="btn btn-outline" onClick={connectWallet}>
                  Connect Wallet
                </button>
                <span className="chain-help-text">
                  Wallet is only needed if you choose to record this milestone on-chain.
                </span>
              </div>
            )}

            {account && (
              <p className="chain-help-text">
                Connected to {chainInfo?.networkName || 'wallet network'} as {account.slice(0, 6)}...{account.slice(-4)}.
              </p>
            )}

            {recordOnChain && hasRequestedAmount && (
              <div className="chain-note">
                <strong>{formatCurrency(requestedAmountValue)}</strong> remains the milestone amount in the app.
                <span>{getEthEstimateLabel()} so approval of this milestone would release roughly {formatEthEstimateFromInr(requestedAmountValue)} from the project's demo escrow.</span>
                <span>Submitting the milestone only writes the record on-chain. No ETH moves at submission time.</span>
              </div>
            )}
          </div>

          {aiResult && (
            <div className="ai-result-inline">
              <div className="ai-result-top">
                <span className="ai-title">AI Analysis</span>

                <span className={`verdict-badge ${aiResult.verdict.toLowerCase()}`}>
                  {aiResult.verdict}
                </span>
              </div>

              <div className="ai-score-row">
                <div className="ai-score-circle">
                  {aiResult.score}%
                </div>

                <p className="ai-summary">
                  {aiResult.summary}
                </p>
              </div>

              {aiResult.issues?.length > 0 && (
                <div className="ai-issues-modern">
                  {aiResult.issues.slice(0, 4).map((issue, i) => (
                    <div key={i} className="issue-item">
                      Issue: {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Milestone'}
            </button>
          </div>
        </form>

        <div className="ai-panel">
          {selectedProject?.compliance_rules && (
            <div className="ai-card">
              <h3>Compliance Rules</h3>
              {projectRules.map((rule, i) => (
                <div key={i} className="rule-chip">{rule}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateMilestone;
