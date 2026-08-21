import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, projectsAPI } from '../../services/api';
import StatsCard from '../../components/StatsCard';
import ProjectCard from '../../components/ProjectCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Folder, ClipboardList, IndianRupee, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import './GovernmentDashboard.css';

const GovernmentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, myStatsRes, projectsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getMyStats(),
        projectsAPI.getMyProjects()
      ]);

      setStats(statsRes.data);
      setMyStats(myStatsRes.data);
      setRecentProjects(projectsRes.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const totalAllocated = stats?.budget?.total_allocated || 0;
  const totalRequested = stats?.budget?.total_requested || 0;
  const totalApproved = stats?.budget?.total_approved || 0;
  const budgetUtilization = Number(stats?.budget?.utilization_percentage || 0).toFixed(1);
  const approvalRate =
    totalRequested > 0 ? ((totalApproved / totalRequested) * 100).toFixed(1) : '0.0';

  const projectStatusData = stats?.project_status
    ? Object.entries(stats.project_status)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name: name.replace('_', ' '),
          value
        }))
    : [];

  const budgetData = [
    {
      name: 'Budget',
      Allocated: totalAllocated,
      Requested: totalRequested,
      Approved: totalApproved
    }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#64748b'];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.username}.</h1>
          <p>Real-time financial and project performance overview.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/projects/create')}
        >
          Create New Project
        </button>
      </div>

      <div className="stats-grid">
        <StatsCard
          title="Total Projects"
          value={stats?.total_projects || 0}
          icon={<Folder size={28} />}
        />
        <StatsCard
          title="My Projects"
          value={myStats?.projects_created || 0}
          icon={<ClipboardList size={28} />}
        />
        <StatsCard
          title="Total Allocated"
          value={`Rs. ${(totalAllocated / 10000000).toFixed(2)} Cr`}
          subtitle={formatCurrency(totalAllocated)}
          icon={<IndianRupee size={28} />}
        />
        <StatsCard
          title="Pending Approvals"
          value={stats?.pending_approvals || 0}
          icon={<Clock size={28} />}
        />
      </div>

      <div className="dual-section">
        <div className="health-card">
          <h3>Project Health</h3>

          <div className="health-top">
            <div className="health-main-metric">
              <span className="health-percent">{budgetUtilization}%</span>
              <span className="health-label">Budget Utilized</span>
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(Number(budgetUtilization), 100)}%`,
              }}
            />
          </div>

          <div className="health-grid">
            <div>
              <span className="metric-label">Approved</span>
              <strong>
                {formatCurrency(stats?.budget?.total_approved || 0)}
              </strong>
            </div>

            <div>
              <span className="metric-label">Requested</span>
              <strong>
                {formatCurrency(stats?.budget?.total_requested || 0)}
              </strong>
            </div>

            <div>
              <span className="metric-label">Approval Rate</span>
              <strong>{approvalRate}%</strong>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <h3>Budget Overview (Rs. Crores)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={budgetData}
            margin={{ top: 20, right: 20, left: 40, bottom: 10 }}
          >
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis width={80} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Allocated" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Requested" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Approved" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="utilization-text">
          {budgetUtilization}% of allocated budget has been approved.
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Recent Projects</h2>
          <button
            className="btn btn-outline"
            onClick={() => navigate('/projects/my-projects')}
          >
            View All
          </button>
        </div>

        <div className="projects-grid">
          {recentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboard;
