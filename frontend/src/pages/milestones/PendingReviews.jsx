import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { milestonesAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatCurrency, shortenHash } from '../../utils/formatters';
import './PendingReviews.css';

const PendingReviews = () => {
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDesc, setExpandedDesc] = useState({});

  useEffect(() => {
    loadPendingMilestones();
  }, []);

  const loadPendingMilestones = async () => {
    try {
      setLoading(true);
      const response = await milestonesAPI.filterByStatus('PENDING');
      setMilestones(response.data);
    } catch (error) {
      console.error('Failed to load pending milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading pending reviews..." />;
  }

  return (
    <div className="pending-reviews-page">
      <div className="page-header">
        <h1>Pending Reviews</h1>
        <span className="pending-count">{milestones.length} pending</span>
      </div>

      {milestones.length > 0 ? (
        <div className="milestones-table-container card">
          <table className="milestones-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>AI Score</th>
                <th>Amount</th>
                <th>Status</th>
                <th>On-chain</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {milestones.map((milestone) => (
                <tr key={milestone.id}>
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

                  <td>
                    <strong>
                      {milestone.ai_score ?? '--'}%
                    </strong>
                  </td>

                  <td>
                    <strong>
                      {formatCurrency(milestone.requested_amount)}
                    </strong>
                  </td>

                  <td>
                    <span className={`status-badge ${milestone.status.toLowerCase()}`}>
                      {milestone.status}
                    </span>
                  </td>

                  <td>
                    {milestone.submission_tx_hash ? shortenHash(milestone.submission_tx_hash) : '--'}
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/milestones/review/${milestone.id}`)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>No pending reviews at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default PendingReviews;
