import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Expires": "0",
  },
});

let getAccessToken = () => null;
let getRefreshToken = () => null;
let updateAccessToken = () => {};
let globalLogout = () => {};

export const setupInterceptors = (getAccess, getRefresh, updateAccess, logoutFn) => {
  getAccessToken = getAccess;
  getRefreshToken = getRefresh;
  updateAccessToken = updateAccess;
  globalLogout = logoutFn;
};

// --- Interceptor: Attach Access Token & Disable Cache ---
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
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
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        // Attempt to get a new access token
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = res.data.data;

        // Notify AuthContext to update its state & storage
        updateAccessToken(accessToken);

        // Update header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Silent refresh failed:", refreshError);
        globalLogout(); // Force logout via AuthContext if refresh fails
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

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

export const getLeadByPhone = async (phone) => {
  const response = await api.get("/leads/by-phone", {
    params: { phone },
  });
  return response.data;
};

export const getLeadDetails = async (id) => {
  const response = await api.get(`/leads/${id}`);
  return response.data;
};

export const getLeadActivities = async (id) => {
  const response = await api.get(`/leads/${id}/activities`);
  return response.data;
};

export const createActivity = async (data) => {
  const response = await api.post("/activities", data);
  return response.data;
};

export default api;
