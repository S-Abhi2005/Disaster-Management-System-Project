import axios from 'axios';
import useAuthStore from '../store/authStore';

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────
// When backend is ready, set VITE_API_BASE_URL in .env
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
});

// ── Request interceptor: attach JWT ────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 auto-logout ──────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login?reason=session_expired';
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
