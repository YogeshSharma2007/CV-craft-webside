import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Request Interceptor: Automatically inject Auth Header
api.interceptors.request.use(
  (config) => {
    // If route goes to admin API, inject adminToken, otherwise standard user token
    if (config.url.includes('/admin')) {
      const adminToken = localStorage.getItem('cvcraft_admin_token');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      const token = localStorage.getItem('cvcraft_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 and redirect to Login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (error.config.url.includes('/admin')) {
        localStorage.removeItem('cvcraft_admin_token');
        localStorage.removeItem('cvcraft_admin');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('cvcraft_token');
        localStorage.removeItem('cvcraft_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
