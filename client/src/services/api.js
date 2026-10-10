import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshing = null;

const skipRefreshUrls = [
  "/auth/refresh",
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/logout-all",
  "/auth/sessions",
];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;

    if (
      !request ||
      error.response?.status !== 401 ||
      request._retry ||
      skipRefreshUrls.some((url) => request.url?.includes(url))
    ) {
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      if (!refreshing) {
        refreshing = api.post("/auth/refresh").finally(() => {
          refreshing = null;
        });
      }

      await refreshing;
      return api(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
