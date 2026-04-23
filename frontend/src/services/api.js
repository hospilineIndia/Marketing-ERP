import axios from "axios";

const ACCESS_TOKEN_KEY = "marketing-erp-access-token";
const REFRESH_TOKEN_KEY = "marketing-erp-refresh-token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Expires": "0",
  },
});

// --- Interceptor: Attach Access Token & Disable Cache ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Requirement: Ensure no-cache on every request
  config.headers["Cache-Control"] = "no-cache";
  
  return config;
});

// --- Interceptor: Silent Refresh on 401 ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) throw new Error("No refresh token");

        // Attempt to get a new access token
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = res.data.data;

        // Store new token
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

        // Update header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Silent refresh failed:", refreshError);
        handleLogout(); // Force logout if refresh fails
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// --- Auth Helpers ---

export const handleLogin = (data) => {
  const { accessToken, refreshToken, user } = data;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  return user;
};

export const handleLogout = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.location.href = "/login";
};

// --- API Functions ---

export const getLeads = async (page = 1, limit = 20) => {
  const response = await api.get("/leads", {
    params: { page, limit },
  });
  return response.data;
};

export const createLead = async (data) => {
  const response = await api.post("/leads", data);
  return response.data;
};

export const searchLeads = async (query) => {
  const response = await api.get("/leads/search", {
    params: { q: query },
  });
  return response.data;
};

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };
export default api;
