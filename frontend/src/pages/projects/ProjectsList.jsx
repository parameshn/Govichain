import React, { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProjectCard from '../../components/ProjectCard';
import { projectsAPI } from '../../services/api';
import './ProjectsList.css';

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      let response;

      if (filter === 'ALL') {
        response = await projectsAPI.getAll();
      } else {
        response = await projectsAPI.filterByStatus(filter);
      }

      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="projects-list-page">
      <div className="page-header">
        <h1>All Projects</h1>
        <div className="filter-controls">
          <label>Filter by Status:</label>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="ALL">All Projects</option>
            <option value="CREATED">Created</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading projects..." />
      ) : projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No projects found.</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
