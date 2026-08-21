import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Folder,
  PlusCircle,
  ClipboardList,
  Target,
  FileText,
  Clock
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { path: '/projects', label: 'All Projects', icon: <Folder size={18} /> },
    ];

    if (user?.role === 'GOVERNMENT') {
      baseItems.push(
        { path: '/projects/create', label: 'Create Project', icon: <PlusCircle size={18} /> },
        { path: '/projects/my-projects', label: 'My Projects', icon: <ClipboardList size={18} /> }
      );
    }

    if (user?.role === 'CONTRACTOR') {
      baseItems.push(
        { path: '/milestones/create', label: 'Create Milestone', icon: <Target size={18} /> },
        { path: '/milestones/my-milestones', label: 'My Milestones', icon: <FileText size={18} /> }
      );
    }

    if (user?.role === 'AUDITOR') {
      baseItems.push(
        { path: '/milestones/pending', label: 'Pending Reviews', icon: <Clock size={18} /> }
      );
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <div
            key={item.path}
            className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
