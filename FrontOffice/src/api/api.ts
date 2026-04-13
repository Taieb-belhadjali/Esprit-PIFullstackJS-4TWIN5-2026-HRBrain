import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000",
});

API.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('hrbrain_auth') || '{}');
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

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
