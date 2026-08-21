import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  formatCurrency,
  getChainLabel,
  getExplorerUrl,
  shortenHash,
} from '../utils/formatters';
import './ProjectCard.css';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const badges = {
      CREATED: 'badge-info',
      IN_PROGRESS: 'badge-warning',
      COMPLETED: 'badge-success',
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
      <div className="project-card-header">
        <h3>{project.name}</h3>
        <span className={`badge ${getStatusBadge(project.status)}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>

      <div className="project-chain-row">
        {project.on_chain_tx_hash ? (
          <>
            <span className="chain-badge chain-badge-live">
              On-chain • {getChainLabel(project.chain_network, project.chain_id)}
            </span>
            {getExplorerUrl(project.on_chain_tx_hash, project.chain_id) ? (
              <a
                href={getExplorerUrl(project.on_chain_tx_hash, project.chain_id)}
                target="_blank"
                rel="noreferrer"
                className="tx-preview-link"
                onClick={(event) => event.stopPropagation()}
              >
                {shortenHash(project.on_chain_tx_hash)}
              </a>
            ) : (
              <span className="tx-preview-link">
                {shortenHash(project.on_chain_tx_hash)}
              </span>
            )}
          </>
        ) : (
          <span className="chain-badge chain-badge-muted">Off-chain only</span>
        )}
      </div>
      
      <p className="project-description">{project.description || 'No description'}</p>
      
      <div className="project-card-footer">
        <div className="project-budget">
          <span className="label">Budget:</span>
          <span className="value">{formatCurrency(project.budget)}</span>
        </div>
        <button className="btn btn-primary btn-sm">View Details</button>
      </div>
    </div>
  );
};

export default ProjectCard;
