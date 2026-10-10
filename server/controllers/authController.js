import {
  registerSchema,
  verifyEmailSchema,
  loginWithEmailSchema,
  verifyEmailOnlySchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  changePasswordSchema,
} from "../validators/authValidator.js";
import {
  changePasswordFn,
  createUserSession,
  deleteUserAccountFn,
  emailLoginFn,
  emailVerificationFn,
  forgotPasswordFn,
  getActiveSessionsFn,
  googleLoginFn,
  logoutAllSessionsFn,
  logoutFn,
  refreshSessionFn,
  resendEmailOtpFn,
  resetPasswordFn,
  userRegistrationFn,
} from "../services/authService.js";
import { sendEmail } from "../utils/email/sendEmail.js";
import { handleError, throwError } from "../utils/errors.js";

const isProduction = process.env.NODE_ENV === "production";

const jwtCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge:
    Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 30) *
    24 *
    60 *
    60 *
    1000,
};

export const registerEmailUser = async (req, res) => {
  try {
    const reqBody = registerSchema.safeParse(req.body);

    if (!reqBody.success) {
      throwError(
        "Validation failed.",
        400,
        reqBody.error.flatten().fieldErrors,
      );
    }

    const { name, email, password } = reqBody.data;

    const { otp } = await userRegistrationFn({
      name,
      email,
      password,
    });

    await sendEmail("verifyMail", otp, email);

    return res.status(201).json({
      success: true,
      message: "OTP Sent | Please verify your email.",
    });
  } catch (error) {
    return handleError(error, res);
  }
};
export const verifyEmail = async (req, res) => {
  try {
    const reqBody = verifyEmailSchema.safeParse(req.body);

    if (!reqBody.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification data.",
        errors: reqBody.error.flatten().fieldErrors,
      });
    }

    const { otp, email } = reqBody.data;
    const user = await emailVerificationFn(otp, email);

    if (user.isEmailVerified) {
      // Create a new login session.
      const { jwtToken, refreshToken } = await createUserSession({
        user,
        userAgent: req.get("user-agent"),
        ipAddress: req.ip,
      });

      await sendEmail("welcomeMail", user, user.email);

      return res
        .cookie("accessToken", jwtToken, jwtCookieOptions)
        .cookie("refreshToken", refreshToken, refreshCookieOptions)
        .status(200)
        .json({
          success: true,
          message: "Email verified successfully.",
          // user: {
          //   id: user._id,
          //   name: user.name,
          //   email: user.email,
          //   avatar: user.avatar,
          //   role: user.role,
          //   isEmailVerified: user.isEmailVerified,
          // },
        });
    }
  } catch (error) {
    return handleError(error, res);
  }
};
export const me = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const resendEmailOtp = async (req, res) => {
  try {
    const reqBody = verifyEmailOnlySchema.safeParse(req.body);

    if (!reqBody.success) {
      throwError("Invalid email or Otp.", 400);
    }

    const { email } = reqBody.data;

    const resultData = await resendEmailOtpFn(email);

    if (!resultData) {
      return res.status(200).json({
        success: false,
        message: "user not found.",
      });
    }

    const { otp } = resultData;

    await sendEmail("verifyMail", otp, email);

    return res.status(200).json({
      success: true,
      message: "Please verify your account using the OTP sent to your email.",
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const emailLogin = async (req, res) => {
  try {
    const reqBody = loginWithEmailSchema.safeParse(req.body);

    if (!reqBody.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login data.",
        errors: reqBody.error.flatten().fieldErrors,
      });
    }

    const { email, password } = reqBody.data;

    const { user, jwtToken, refreshToken } = await emailLoginFn({
      email,
      password,
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    });
    // sendEmail("newLoginMail", user, email);

    return res
      .cookie("accessToken", jwtToken, jwtCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Login successful.",
      });
  } catch (error) {
    return handleError(error, res);
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const reqBody = forgotPasswordSchema.safeParse(req.body);

    if (!reqBody.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid email.",
        errors: reqBody.error.flatten().fieldErrors,
      });
    }

    const { email } = reqBody.data;

    const { otp } = await forgotPasswordFn(email);

    sendEmail("resetPasswordMail", { otp }, email);

    return res.status(200).json({
      success: true,
      message:
        "We have received a request for reset-password, An otp has been sended",
    });
  } catch (error) {
    return handleError(error, res);
  }
};
export const resetPassword = async (req, res) => {
  try {
    const reqBody = resetPasswordSchema.safeParse(req.body);

    if (!reqBody.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset data.",
        errors: reqBody.error.flatten().fieldErrors,
      });
    }
    const { email, otp, newPassword, confirmPassword } = reqBody.data;

    await resetPasswordFn({
      email,
      otp,
      newPassword,
      confirmPassword,
    });

    res.clearCookie("accessToken", jwtCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);

    await sendEmail("passwordResetSuccessMail", {}, email);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    return handleError(error, res);
  }
};
export const changePassword = async (req, res) => {
  try {
    const reqBody = changePasswordSchema.safeParse(req.body);

    if (!reqBody.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid password change data.",
        errors: reqBody.error.flatten().fieldErrors,
      });
    }

    const { currentPassword, newPassword } = reqBody.data;

    const user = await changePasswordFn({
      userId: req.user.id,
      currentPassword,
      newPassword,
      currentSessionId: req.user.sessionId,
    });
    
    sendEmail("passwordResetSuccessMail", { user }, user.email);

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Other sessions have been logged out.",
    });
  } catch (error) {
    return handleError(error, res);
  }
};
export const logout = async (req, res) => {
  try {
    await logoutFn(req.user.id, req.user.sessionId);

    res.clearCookie("accessToken", jwtCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return handleError(error, res);
  }
};
export const logoutFromEverywhere = async (req, res) => {
  try {
    await logoutAllSessionsFn(req.user.id);

    res.clearCookie("accessToken", jwtCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out from all sessions successfully.",
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await deleteUserAccountFn(req.user.id);

    res.clearCookie("accessToken", jwtCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);

    // await sendEmail("accountDeletedMail", {}, req.user.email);
    return res.status(200).json({
      success: true,
      message: "Your account has been deleted successfully.",
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;

    const { user, jwtToken, refreshToken } = await refreshSessionFn({
      refreshToken: incomingRefreshToken,
    });

    return res
      .cookie("accessToken", jwtToken, jwtCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Session refreshed.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      });
  } catch (error) {
    res.clearCookie("accessToken", jwtCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);
    return handleError(error, res);
  }
};
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const sessions = await getActiveSessionsFn(userId);

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    return handleError(error, res);
  }
};
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      throwError("Google credential is required.", 400);
    }

    const { user, jwtToken, refreshToken ,isNewUser} = await googleLoginFn({
      credential,
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    });

    return res
      .cookie("accessToken", jwtToken, jwtCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Google login successful.",
        isNewUser
      });
  } catch (error) {
    return handleError(error, res);
  }
};