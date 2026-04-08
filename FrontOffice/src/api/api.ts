import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000",
});

// Attacher le token JWT à chaque requête
API.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('hrbrain_auth');
    if (raw) {
      const auth = JSON.parse(raw);
      const token = auth?.token ?? auth?.access_token ?? auth;
      if (token && typeof token === 'string') {
        config.headers = config.headers ?? {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch { /* ignore */ }
  return config;
});

// Si le token est expiré → vider le localStorage et recharger vers /login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hrbrain_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
