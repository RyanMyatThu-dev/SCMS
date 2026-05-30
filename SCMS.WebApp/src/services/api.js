import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7072/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("scms_token") || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("scms_token");
      localStorage.removeItem("token");
      localStorage.removeItem("scms_user");
      localStorage.removeItem("userRole");
    }

    return Promise.reject(error);
  },
);

export const unwrap = (response) => response?.data;

export default api;
