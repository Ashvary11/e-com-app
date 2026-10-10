import User from "../models/User.js";
import Session from "../models/Session.js";
import { verifyToken } from "../utils/jwt.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken; //jwtToken

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    let decoded;

    try {
      decoded = verifyToken(accessToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token.",
      });
    }

    const { uid, sid } = decoded;

    if (!uid || !sid) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }
    //  session and user in parallel — saves one round-trip
    const [session, user] = await Promise.all([
      Session.findOne({
        sessionId: sid,
        userId: uid,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      }).select("sessionId"),
      User.findById(uid).select(
        "name email role isActive isBlocked hasPassword ",
      ),
      ,
    ]);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired or revoked.",
      });
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (!user.isActive || user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is not available.",
      });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      sessionId: session.sessionId,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      hasPassword: user.hasPassword,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while authenticating.",
    });
  }
};
