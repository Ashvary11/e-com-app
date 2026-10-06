import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import AuthLayout from "../../components/auth/AuthLayout";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../../components/ui/input-otp";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { resetPassword } from "../../services/authService";
import { resetPasswordSchema } from "../../validators/authValidators";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = resetPasswordSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors({
        email: fieldErrors.email?.[0] || "",
        otp: fieldErrors.otp?.[0] || "",
        newPassword: fieldErrors.newPassword?.[0] || "",
        confirmPassword: fieldErrors.confirmPassword?.[0] || "",
      });

      return;
    }

    try {
      setLoading(true);

      await resetPassword({
        email: result.data.email,
        otp: result.data.otp,
        newPassword: result.data.newPassword,
      });

      toast.success("Password reset successfully.");

      navigate("/login", {
        state: {
          email: result.data.email,
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

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter the reset code sent to your email and create a new password."
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
      <form onSubmit={handleSubmit} className="space-y-5">
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

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Reset code</label>

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={formData.otp}
              onChange={handleOtpChange}
              disabled={loading}
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
            <p className="text-center text-sm text-destructive">{errors.otp}</p>
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
            disabled={loading}
          />

          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword}</p>
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
            disabled={loading}
          />

          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

          {loading ? "Resetting password..." : "Reset password"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
