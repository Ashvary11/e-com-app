import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "../validators/authValidator.js";
import {
  createUser,
  deleteUserAccount,
  loginUser,
  logoutAllSessions,
  logoutUser,
  resendVerification,
  verifyEmail,
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

export const registerFn = async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration data.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, email, password } = result.data;

    const { user, verificationToken } = await createUser({
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
    //   token: verificationToken,
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
      },
    });
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
export const verifyEmailFn = async (req, res) => {
  try {
    const result = verifyEmailSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification data.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { token } = result.data;

    const user = await verifyEmail(token);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
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
export const resendVerificationFn = async (req, res) => {
  try {
    const result = resendVerificationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid email.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { email } = result.data;

    const resultData = await resendVerification(email);

    if (!resultData) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a verification email will be sent.",
      });
    }

    const { verificationToken } = resultData;

    // TODO:
    // Send verificationToken through Brevo/Nodemailer.
    // Never send the raw token to the frontend.

    return res.status(200).json({
      success: true,
      message:
        "If the account is not verified, a new verification email will be sent.",
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
export const loginFn = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login data.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { email, password } = result.data;

    const { user, jwtToken, refreshToken } = await loginUser({
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
export const forgotPasswordFn = async (req, res) => {
  try {
    const result = forgotPasswordSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid email.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { email } = result.data;

    const resultData = await forgotPassword(email);

    if (resultData) {
      const { resetToken } = resultData;

      // TODO:
      // Send resetToken through Brevo/Nodemailer.
      // Never send the raw token to the frontend.
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset email will be sent.",
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
export const resetPasswordFn = async (req, res) => {
  try {
    const result = resetPasswordSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset data.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { token, password } = result.data;

    await resetPassword({
      token,
      password,
    });

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
export const logoutFn = async (req, res) => {
  try {
    await logoutUser(req.user.sessionId);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

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
export const logoutAllFn = async (req, res) => {
  try {
    await logoutAllSessions(req.user.userId);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

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
export const deleteAccountFn = async (req, res) => {
  try {
    await deleteUserAccount(req.user.userId);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

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
