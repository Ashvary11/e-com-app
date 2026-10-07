import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;

    if (
      error.response?.status !== 401 ||
      request._retry ||
      request.url.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      refreshing ??= api.post("/auth/refresh");

      await refreshing;
      refreshing = null;
      console.log("Access token expired. Refreshing...");
      return api(request);
    } catch (refreshError) {
      refreshing = null;
      return Promise.reject(refreshError);
    }
  },
);

export default api;
