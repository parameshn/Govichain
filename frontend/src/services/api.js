import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => {
    // Convert to form data for OAuth2PasswordRequestForm
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  getCurrentUser: () => api.get('/users/me'),
};

// Projects APIs
export const projectsAPI = {
  getAll: () => api.get('/projects/'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (projectData) => api.post('/projects/', projectData),
  updateStatus: (id, status) => api.put(`/projects/${id}/status?new_status=${status}`),
  getProgress: (id) => api.get(`/projects/${id}/progress`),
  getMyProjects: () => api.get('/projects/my-projects'),
  filterByStatus: (status) => api.get(`/projects/filter/by-status?status=${status}`),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Milestones APIs
export const milestonesAPI = {
  create: (milestoneData) => api.post('/milestones/', milestoneData),
  evaluate: (payload) => api.post('/milestones/evaluate', payload),
  getByProject: (projectId) => api.get(`/milestones/project/${projectId}`),
  getById: (id) => api.get(`/milestones/${id}`),
  approve: (id, payload = {}) => api.put(`/milestones/${id}/approve`, payload),
  flag: (id, payload = {}) => api.put(`/milestones/${id}/flag`, payload),
  reject: (id, payload = {}) => api.put(`/milestones/${id}/reject`, payload),
  getMyMilestones: () => api.get('/milestones/my-milestones'),
  filterByStatus: (status) => api.get(`/milestones/filter/by-status?status=${status}`),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getMyStats: () => api.get('/dashboard/my-stats'),
};

// Users APIs
export const usersAPI = {
  getAll: () => api.get('/users/'),
  getById: (id) => api.get(`/users/${id}`),
};

// Export api instance for public endpoints (no auth required)
export const apiClient = api;

export default api;
