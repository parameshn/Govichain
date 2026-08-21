import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { milestonesAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatCurrency, shortenHash } from '../../utils/formatters';
import './MyMilestones.css';

const MyMilestones = () => {
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDesc, setExpandedDesc] = useState({});

  useEffect(() => {
    loadMyMilestones();
  }, []);

  const loadMyMilestones = async () => {
    try {
      setLoading(true);
      const response = await milestonesAPI.getMyMilestones();
      setMilestones(response.data);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'badge-warning',
      APPROVED: 'badge-success',
      FLAGGED: 'badge-danger',
      REJECTED: 'badge-danger',
    };
    return badges[status] || 'badge-info';
  };

  if (loading) {
    return <LoadingSpinner message="Loading your milestones..." />;
  }

  return (
    <div className="my-milestones-page">
      <div className="page-header">
        <h1>My Milestones</h1>
        <button className="btn btn-primary" onClick={() => navigate('/milestones/create')}>
          Create Milestone
        </button>
      </div>

      {milestones.length > 0 ? (
        <div className="milestones-table-container card">
          <table className="milestones-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>AI Score</th>
                <th>Amount</th>
                <th>Status</th>
                <th>On-chain</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone) => (
                <tr key={milestone.id}>
                  <td>{milestone.id}</td>
                  <td>
                    <strong>{milestone.title}</strong>
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
                  </td>
                  <td>{milestone.ai_score != null ? `${Math.round(milestone.ai_score)}%` : '--'}</td>
                  <td>{formatCurrency(milestone.requested_amount)}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </td>
                  <td>{milestone.submission_tx_hash ? shortenHash(milestone.submission_tx_hash) : '--'}</td>
                  <td>{new Date(milestone.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => navigate(`/projects/${milestone.project_id}`)}
                    >
                      View Project
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>You have not created any milestones yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/milestones/create')}>
            Create Your First Milestone
          </button>
        </div>
      )}
    </div>
  );
};

export default MyMilestones;
