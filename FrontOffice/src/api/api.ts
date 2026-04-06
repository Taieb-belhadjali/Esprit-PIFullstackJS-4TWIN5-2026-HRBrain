import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000",
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
