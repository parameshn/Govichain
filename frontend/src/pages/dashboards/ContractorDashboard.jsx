import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, milestonesAPI } from '../../services/api';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Target,
  CheckCircle,
  Clock,
  IndianRupee
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import './ContractorDashboard.css';

const ContractorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myStats, setMyStats] = useState(null);
  const [recentMilestones, setRecentMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDesc, setExpandedDesc] = useState({});

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [myStatsRes, milestonesRes] = await Promise.all([
        dashboardAPI.getMyStats(),
        milestonesAPI.getMyMilestones(),
      ]);

      setMyStats(myStatsRes.data);
      setRecentMilestones(milestonesRes.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.username}.</h1>
          <p>Track your milestones and project progress.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/milestones/create')}
        >
          Create New Milestone
        </button>
      </div>

      <div className="stats-grid">
        <StatsCard
          title="Total Milestones"
          value={myStats?.total_milestones || 0}
          icon={<Target size={26} />}
          color="blue"
        />

        <StatsCard
          title="Approved"
          value={myStats?.approved_milestones || 0}
          icon={<CheckCircle size={26} />}
          color="green"
        />

        <StatsCard
          title="Pending Review"
          value={myStats?.pending_milestones || 0}
          icon={<Clock size={26} />}
          color="yellow"
        />

        <StatsCard
          title="Total Approved Amount"
          value={formatCurrency(myStats?.total_approved_amount || 0)}
          icon={<IndianRupee size={26} />}
          color="green"
        />
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Recent Milestones</h2>
          <button
            className="btn btn-outline"
            onClick={() => navigate('/milestones/my-milestones')}
          >
            View All
          </button>
        </div>

        {recentMilestones.length > 0 ? (
          <div className="milestones-table-container card">
            <table className="milestones-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentMilestones.map((milestone) => (
                  <tr key={milestone.id}>
                    <td>
                      <strong>{milestone.title}</strong>
                      <p className="milestone-desc">
                        {expandedDesc[milestone.id]
                          ? milestone.description
                          : milestone.description?.slice(0, 100) + '...'}

                        {milestone.description?.length > 100 && (
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
                      {formatCurrency(milestone.requested_amount)}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(milestone.status)}`}>
                        {milestone.status}
                      </span>
                    </td>
                    <td>
                      {new Date(milestone.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No milestones yet.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/milestones/create')}
            >
              Create Milestone
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorDashboard;
