import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { projectsAPI } from '../../services/api';
import { createProjectOnChain } from '../../services/web3Service';
import {
  formatCurrency,
  formatEthEstimateFromInr,
  getEthEstimateLabel,
  parseRuleList,
} from '../../utils/formatters';
import './CreateProject.css';

const CreateProject = () => {
  const navigate = useNavigate();
  const { account, chainInfo, connectWallet, isWalletAvailable, isContractConfigured } = useWallet();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedRules, setGeneratedRules] = useState('');
  const [recordOnChain, setRecordOnChain] = useState(false);

  const rulesList = parseRuleList(generatedRules);
  const budgetValue = parseFloat(formData.budget);
  const hasBudgetValue = Number.isFinite(budgetValue) && budgetValue > 0;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const budgetValue = parseFloat(formData.budget);
      let chainMeta = null;

      if (recordOnChain) {
        if (!account) {
          const connected = await connectWallet();
          if (!connected) {
            throw new Error('Connect your wallet before recording this project on-chain.');
          }
        }

        if (!isContractConfigured) {
          throw new Error('Contract address is not configured yet.');
        }

        chainMeta = await createProjectOnChain(formData.name, budgetValue);
      }

      const projectData = {
        ...formData,
        budget: budgetValue,
        wallet_address: chainMeta?.walletAddress || null,
        on_chain_tx_hash: chainMeta?.txHash || null,
        chain_network: chainMeta?.chainNetwork || null,
        chain_id: chainMeta?.chainId || null,
        chain_project_id: chainMeta?.chainProjectId || null,
        contract_address: chainMeta?.contractAddress || null,
      };

      const res = await projectsAPI.create(projectData);
      const rules =
        res.data?.compliance_rules ||
        res.data?.project?.compliance_rules;

      setGeneratedRules(rules || '');
      alert(
        recordOnChain
          ? `Project created and blockchain escrow locked at approximately ${formatEthEstimateFromInr(budgetValue)}.`
          : 'Project created successfully.'
      );
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-project-page">
      <div className="page-header">
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          Back
        </button>
        <h1>Create New Project</h1>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="project-form">
          {error && (
            <div className="error-banner">
              <span>Error</span>
              <p>{error}</p>
            </div>
          )}

          <div className="chain-options-card">
            <div className="chain-options-header">
              <div>
                <h3>Blockchain Recording</h3>
                <p>Keep the budget in rupees and optionally lock a demo ETH escrow on-chain.</p>
              </div>
              {account ? (
                <span className="chain-state connected">Wallet connected</span>
              ) : (
                <span className="chain-state muted">Optional</span>
              )}
            </div>

            <label className="chain-toggle">
              <input
                type="checkbox"
                checked={recordOnChain}
                onChange={(event) => setRecordOnChain(event.target.checked)}
                disabled={!isWalletAvailable || !isContractConfigured}
              />
              <span>Record this project on blockchain</span>
            </label>

            {!isWalletAvailable && (
              <p className="chain-help-text">Wallet integration is unavailable in this browser.</p>
            )}

            {isWalletAvailable && !account && (
              <div className="chain-wallet-row">
                <button type="button" className="btn btn-outline" onClick={connectWallet}>
                  Connect Wallet
                </button>
                <span className="chain-help-text">
                  Wallet is only needed if you choose to record this project on-chain.
                </span>
              </div>
            )}

            {account && (
              <p className="chain-help-text">
                Connected to {chainInfo?.networkName || 'wallet network'} as {account.slice(0, 6)}...{account.slice(-4)}.
              </p>
            )}

            {recordOnChain && hasBudgetValue && (
              <div className="chain-note">
                <strong>{formatCurrency(budgetValue)}</strong> stays the official project budget in the app.
                <span>{getEthEstimateLabel()} so project creation will lock roughly {formatEthEstimateFromInr(budgetValue)} from the connected government wallet as demo escrow.</span>
                <span>Approved milestones later release portions of that escrow to the contractor.</span>
              </div>
            )}

            {!isContractConfigured && (
              <p className="chain-help-text">
                Contract address is not configured yet, so on-chain recording is currently disabled.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Highway Construction Project"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={3}
            />
            <small>Minimum 3 characters</small>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Describe the project objectives, scope, and expected outcomes..."
              value={formData.description}
              onChange={handleChange}
              rows={5}
            />
          </div>

          <div className="form-group">
            <label>Budget (Rs.) *</label>
            <input
              type="number"
              name="budget"
              placeholder="e.g., 10000000"
              value={formData.budget}
              onChange={handleChange}
              required
              min="1"
              step="0.01"
            />
            <small>Budget must be greater than 0</small>
          </div>

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
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>

        {rulesList.length > 0 && (
          <div className="ai-rules-card">
            <div className="ai-header">
              <h3>AI Generated Compliance</h3>
              <span className="ai-badge">Smart Rules</span>
            </div>

            <div className="rules-list">
              {rulesList.map((rule, i) => (
                <div key={i} className="rule-item">
                  <span className="rule-icon">{i + 1}</span>
                  <p>{rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="info-card">
          <h3>Project Creation Tips</h3>
          <ul>
            <li>Choose a clear, descriptive project name</li>
            <li>Provide detailed objectives and scope</li>
            <li>Set a realistic budget allocation</li>
            <li>Projects start with "CREATED" status</li>
            <li>AI will generate compliance rules automatically</li>
            <li>Blockchain recording is optional and keeps the rupee budget as the source of truth</li>
            <li>When enabled, a mapped demo ETH escrow is locked from the government wallet</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
