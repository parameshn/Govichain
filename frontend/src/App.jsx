import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GovernmentDashboard from './pages/dashboards/GovernmentDashboard';
import ContractorDashboard from './pages/dashboards/ContractorDashboard';
import AuditorDashboard from './pages/dashboards/AuditorDashboard';
import ProjectsList from './pages/projects/ProjectsList';
import CreateProject from './pages/projects/CreateProject';
import MyProjects from './pages/projects/MyProjects';
import ProjectDetails from './pages/projects/ProjectDetails';
import CreateMilestone from './pages/milestones/CreateMilestone';
import MyMilestones from './pages/milestones/MyMilestones';
import PendingReviews from './pages/milestones/PendingReviews';
import MilestoneReview from './pages/milestones/MilestoneReview';
import PublicDashboard from './pages/public/PublicDashboard';
import PublicProjectDetail from './pages/public/PublicProjectDetail';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Dashboard Router (routes to correct dashboard based on role)
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'GOVERNMENT') {
    return <GovernmentDashboard />;
  } else if (user?.role === 'CONTRACTOR') {
    return <ContractorDashboard />;
  } else if (user?.role === 'AUDITOR') {
    return <AuditorDashboard />;
  }

  return <div>Unknown role</div>;
};

// Layout with Sidebar
const AppLayout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="app-container">
      <Navbar />
      <div className="app-content">
        {user && <Sidebar />}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <Router>
          <Routes>
            {/* Public Routes - No Auth Required */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/public" element={<PublicDashboard />} />
            <Route path="/public/projects/:projectId" element={<PublicProjectDetail />} />

            {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardRouter />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Projects Routes */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectsList />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/create"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateProject />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/my-projects"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyProjects />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectDetails />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Milestones Routes */}
          <Route
            path="/milestones/create"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateMilestone />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/milestones/my-milestones"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyMilestones />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/milestones/pending"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PendingReviews />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/milestones/review/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MilestoneReview />
                </AppLayout>
              </ProtectedRoute>
            }
          />

            {/* Redirect unknown routes to root */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
