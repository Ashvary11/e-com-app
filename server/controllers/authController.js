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
  logoutAllSessionsFn,
  logoutFn,
  refreshSessionFn,
  resendEmailOtpFn,
  resetPasswordFn,
  userRegistrationFn,
} from "../services/authService.js";

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
      return res.status(400).json({
        success: false,
        message: "Invalid registration data.",
        errors: reqBody.error.flatten().fieldErrors,
      });
    }

    const { name, email, password } = reqBody.data;

    const { user, otp } = await userRegistrationFn({
      name,
      email,
      password,
    });

    // TODO:
    // Send verificationToken through Brevo/Nodemailer.
    // The raw token is used to build the verification link.
    // Never send the raw token to the frontend.
    //
    // Example later:
    // await sendVerificationEmail({
    //   email: user.email,
    //   name: user.name,
    //   verificationToken: verificationToken,
    // });

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please verify your email.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        otp: otp, //remove later
      },
    });

    // handle duplicate user later. /fake user
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode === 409
          ? error.message
          : "Something went wrong while creating your account.",
    });
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

    // in frontend dont manually fill email insted used that same email when registerd and show only otp fill screen.
    const { otp, email } = reqBody.data;
    const user = await emailVerificationFn(otp, email);
    //------------------

    if (user.isEmailVerified) {
      // Create a new login session.
      const { jwtToken, refreshToken } = await createUserSession({
        user,
        userAgent: req.get("user-agent"),
        ipAddress: req.ip,
      });

      return res
        .cookie("accessToken", jwtToken, jwtCookieOptions)
        .cookie("refreshToken", refreshToken, refreshCookieOptions)
        .status(200)
        .json({
          success: true,
          message: "Email verified successfully.",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            jwtToken, //remove later
          },
        });
    }
  } catch (error) {
    console.error("Verify email error:", error);

    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying your email.",
    });
  }
};
export const resendEmailOtp = async (req, res) => {
  try {
    const reqBody = verifyEmailOnlySchema.safeParse(req.body);

    if (!reqBody.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or Otp",
        errors: reqBody.error.flatten().fieldErrors,
      });
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

    // TODO:
    // Send verificationToken through Brevo/Nodemailer.
    // Never send the raw token to the frontend.

    return res.status(200).json({
      success: true,
      message:
        "If the account is not verified, a new verification email will be sent.",
      otp, //remove later
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while resending the verification email.",
    });
  }
};

// after email verify auto login and set cookies
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

    return res
      .cookie("accessToken", jwtToken, jwtCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Login successful.",
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
    console.error("Login error:", error);

    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in.",
    });
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

    // TODO:
    // Send resetToken through Brevo/Nodemailer.
    // Never send the raw token to the frontend.

    return res.status(200).json({
      success: true,
      message:
        "We have received a request for reset-password, An otp has been sended",
      otp, // remove later
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while processing the password reset request.",
    });
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

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while resetting your password.",
    });
  }
};
export const logout = async (req, res) => {
  try {
    await logoutFn(req.user.userId, req.user.sessionId);

    res.clearCookie("accessToken", jwtCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging out.",
    });
  }
};
export const logoutFromEverywhere = async (req, res) => {
  try {
    await logoutAllSessionsFn(req.user.userId);

    res.clearCookie("accessToken", jwtCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out from all sessions successfully.",
    });
  } catch (error) {
    console.error("Logout all error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging out from all sessions.",
    });
  }
};

export const me = async (req, res) => {
  // no need to call db becuse we are fetching user data from jwt token.
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.userId,
      name: req.user.user.name,
      email: req.user.user.email,
      avatar: req.user.user.avatar,
      role: req.user.user.role,
      isEmailVerified: req.user.user.isEmailVerified,
    },
  });
};

// handle this with care add two step email deletion also later, and
// also delete user order his cart and wishlist.
// save user ac for 30 days and isACtive === false and set deactivatedAt.
// and after 30 days delete user account.
export const deleteAccount = async (req, res) => {
  try {
    await deleteUserAccountFn(req.user.userId);

    res.clearCookie("accessToken", jwtCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Your account has been deleted successfully.",
    });
  } catch (error) {
    console.error("Delete account error:", error);

    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting your account.",
    });
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

    await changePasswordFn({
      userId: req.user.userId,
      currentPassword,
      newPassword,
      currentSessionId: req.user.sessionId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Other sessions have been logged out.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Something went wrong while changing your password.",
    });
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
    console.error("Refresh token error:", error);

    // Clear cookies so the client stops retrying with a dead token
    res.clearCookie("accessToken", jwtCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || "Could not refresh session.",
    });
  }
};
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.userId.toString();
    // console.log(userId, "----------------");

    const sessions = await getActiveSessionsFn(userId);

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || "Something went wrong finding sessions",
    });
  }
};
