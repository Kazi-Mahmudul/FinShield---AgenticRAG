import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('finshield_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('finshield_token');
      sessionStorage.removeItem('finshield_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---------- Auth ----------
export const loginSimple = (name, phone) =>
  client.post('/auth/login', { name, phone });

export const verifySession = () =>
  client.get('/api/v1/verify-session');

// ---------- User ----------
export const getMyProfile = () =>
  client.get('/users/me');

// ---------- Chat ----------
export const sendMessage = (message) =>
  client.post('/chat', { message });

export const getChatHistory = (limit = 50, offset = 0) =>
  client.get('/chat/history', { params: { limit, offset } });

export default client;
