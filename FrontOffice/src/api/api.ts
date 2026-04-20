import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000",
  // Global timeout: abort requests that take more than 15s.
  // Prevents silent hangs when the backend is slow or unreachable.
  // The LLM/Ollama endpoints override this with their own longer timeout.
  timeout: 15000,
});

// ── In-flight request deduplication ───────────────────────────────────────────
// If the same GET URL is requested while a previous call is still pending,
// return the same Promise instead of firing a second network request.
// This prevents duplicate calls when multiple components mount simultaneously
// (e.g. Activities + Skills both calling GET /departments on the same render).
const pendingRequests = new Map<string, Promise<any>>();

API.interceptors.request.use((config) => {
  // Attach JWT token
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

/**
 * Deduplicated GET — if an identical GET request is already in-flight,
 * returns the same Promise instead of firing a new network request.
 *
 * Use this for read-only endpoints that multiple components may call
 * simultaneously (e.g. /departments, /skills).
 *
 * Usage: apiGet('/departments') instead of API.get('/departments')
 */
export function apiGet<T = any>(url: string): Promise<import('axios').AxiosResponse<T>> {
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url)!;
  }
  const promise = API.get<T>(url).finally(() => {
    pendingRequests.delete(url);
  });
  pendingRequests.set(url, promise);
  return promise;
}

export default API;
