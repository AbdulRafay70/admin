import axios from "axios";

// Use Vite env variable when available, otherwise fall back to local dev backend
const baseURL = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  // do NOT set withCredentials by default — use token auth via headers unless you specifically
  // need cookie-based sessions. Setting withCredentials without enabling CORS_ALLOW_CREDENTIALS
  // on the server causes a browser-level network error.
  withCredentials: false,
});

// Attach token automatically from localStorage (if available)
api.interceptors.request.use((config) => {
  try {
    // Support multiple possible storage keys (accessToken or legacy 'token')
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      // if token already contains 'Bearer ' prefix, don't double-prefix
      config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
  } catch (e) {
    // localStorage might be unavailable in some environments
  }
  return config;
});

// Global response handler: on 401 clear tokens and optionally redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } catch (e) {}
      // optional: window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const getPost = () => api.get("/branches/");

export const getFinanceDashboard = (period = "today") => {
  return api.get(`/finance/dashboard`, { params: { period } });
};

export const getUniversalList = (params = {}) => {
  return api.get("/universal/list/", { params });};

export const registerUniversal = (data) => {
  return api.post("/universal/", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const approveUniversal = (id) => {
  return api.post(`/universal/approve/${id}/`);
};

export const rejectUniversal = (id, data = {}) => {
  return api.post(`/universal/reject/${id}/`, data);
};