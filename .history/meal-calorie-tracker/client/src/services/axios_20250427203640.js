import axios from 'axios';

// Get the API URL from environment variables with a fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a configured axios instance
const instance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token for every request
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export default instance;