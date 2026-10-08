import api from "./api";

export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const verifyEmail = async (data) => {
  const response = await api.post("/auth/verify-email", data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};
export const googleLoginUser = async (credential) => {
  const response = await api.post("/auth/google", {
    credential,
  });

  return response.data;
};
export const resendVerification = async (data) => {
  const response = await api.post("/auth/resend-verification", data);
  return response.data;
};

export const forgotPassword = async (data) => {
  const response = await api.post("/auth/forgot-password", data);
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await api.post("/auth/reset-password", data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const logoutAllSessions = async () => {
  const response = await api.post("/auth/logout-all");
  return response.data;
};
export const changePassword = async (data) => {
  const response = await api.patch("/auth/change-password", data);
  return response.data;
};
export const getActiveSessions = async () => {
  const response = await api.get("/auth/active-sessions");
  return response.data;
};
