import googleClient from "../config/googleConfig.js";

export const verifyGoogleToken = async (credential) => {
  if (!credential) {
    const error = new Error("Google credential is required.");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    const error = new Error("Invalid Google credential.");
    error.statusCode = 401;
    throw error;
  }

  return {
    providerAccountId: payload.sub,
    email: payload.email,
    name: payload.name,
    avatar: payload.picture || null,
    emailVerified: payload.email_verified,
  };
};
