import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("crm_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("crm_token");
      localStorage.removeItem("crm_user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default client;
