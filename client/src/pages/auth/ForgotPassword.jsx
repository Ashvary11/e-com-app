import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import AuthLayout from "@/components/layout/AuthLayout";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../../components/ui/input-otp";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { forgotPassword, resetPassword } from "../../services/authService";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../validators/authValidators";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleOtpChange = (value) => {
    setFormData((previous) => ({
      ...previous,
      otp: value,
    }));

    setErrors((previous) => ({
      ...previous,
      otp: "",
    }));
  };

  const handleSendCode = async (event) => {
    event.preventDefault();

    const result = forgotPasswordSchema.safeParse({
      email: formData.email,
    });

    if (!result.success) {
      setErrors({
        email:
          result.error.flatten().fieldErrors.email?.[0] ||
          "Enter a valid email address.",
      });

      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const response = await forgotPassword(result.data);

      toast.success(
        response.message ||
          "If an account exists with this email, a reset code has been sent.",
      );

      setStep("reset");
    } catch (error) {
      setErrors({
        email:
          error.response?.data?.message ||
          "Unable to send the reset code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    const result = resetPasswordSchema.safeParse({
      email: formData.email,
      otp: formData.otp,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors({
        otp: fieldErrors.otp?.[0] || "",
        newPassword: fieldErrors.newPassword?.[0] || "",
        confirmPassword: fieldErrors.confirmPassword?.[0] || "",
      });

      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const response = await resetPassword({
        email: result.data.email,
        otp: result.data.otp,
        newPassword: result.data.newPassword,
        confirmPassword: result.data.confirmPassword,
      });

      toast.success(response.message || "Password reset successfully.");

      navigate("/login", {
        state: {
          email: formData.email,
        },
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to reset your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setErrors({});

      const response = await forgotPassword({
        email: formData.email,
      });

      toast.success(response.message || "A new reset code has been sent.");

      setFormData((previous) => ({
        ...previous,
        otp: "",
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to resend the reset code.",
      );
    } finally {
      setResending(false);
    }
  };

  if (step === "reset") {
    return (
      <AuthLayout
        title="Reset your password"
        description={`Enter the code sent to ${formData.email} and create a new password.`}
        footer={
          <>
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        }
      >
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Reset code
            </label>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={formData.otp}
                onChange={handleOtpChange}
                disabled={loading || resending}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {errors.otp && (
              <p className="text-center text-sm text-destructive">
                {errors.otp}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="newPassword"
              className="text-sm font-medium leading-none"
            >
              New password
            </label>

            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Create a new password"
              autoComplete="new-password"
              value={formData.newPassword}
              onChange={handleChange}
              disabled={loading || resending}
            />

            {errors.newPassword ? (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                At least 8 characters with uppercase, lowercase, and a number.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium leading-none"
            >
              Confirm password
            </label>

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading || resending}
            />

            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || resending}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

            {loading ? "Resetting password..." : "Reset password"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>

            <Button
              type="button"
              variant="link"
              className="px-0"
              disabled={loading || resending}
              onClick={handleResend}
            >
              {resending ? "Sending..." : "Resend code"}
            </Button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email and we'll send you a password reset code."
      footer={
        <>
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSendCode} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium leading-none">
            Email
          </label>

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />

          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

          {loading ? "Sending code..." : "Send reset code"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
