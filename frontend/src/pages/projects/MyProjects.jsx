import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProjectCard from '../../components/ProjectCard';
import { projectsAPI } from '../../services/api';
import './MyProjects.css';

const MyProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyProjects();
  }, []);

  const loadMyProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getMyProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-projects-page">
      <div className="page-header">
        <h1>My Projects</h1>
        <button className="btn btn-primary" onClick={() => navigate('/projects/create')}>
          Create New Project
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading your projects..." />
      ) : projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>You have not created any projects yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/projects/create')}>
            Create Your First Project
          </button>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
