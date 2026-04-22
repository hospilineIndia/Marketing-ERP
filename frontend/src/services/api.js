import axios from "axios";

const storageKey = "marketing-erp-token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(storageKey);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export { storageKey };

export const getLeads = async (page = 1, limit = 20) => {
  const response = await api.get("/leads", {
    params: { page, limit },
  });
  return response.data;
};

export default api;
