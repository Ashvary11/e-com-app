import { useState } from "react";
import { useSelector } from "react-redux";
import { Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { changePassword, setPassword } from "../../services/authService";
import {
  changePasswordSchema,
  setPasswordSchema,
} from "../../validators/authValidators";

function PasswordField({ label, name, value, onChange, placeholder }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>

      <div className="relative">
        <Input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={
            name === "currentPassword" ? "current-password" : "new-password"
          }
          className="h-10 pr-10 sm:h-11"
        />

        <button
          type="button"
          onClick={() => setShowPassword((previous) => !previous)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function Security() {
  const { user } = useSelector((state) => state.auth);
  const [hasPassword, setHasPassword] = useState(user?.hasPassword === true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const schema = hasPassword ? changePasswordSchema : setPasswordSchema;

    const dataToValidate = hasPassword
      ? form
      : {
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        };

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const fieldErrors = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }

    try {
      setLoading(true);

      const response = hasPassword
        ? await changePassword({
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
            confirmPassword: form.confirmPassword,
          })
        : await setPassword({
            newPassword: form.newPassword,
            confirmPassword: form.confirmPassword,
          });

      if (!hasPassword) {
        setHasPassword(true);
      }

      toast.success(
        response?.message ||
          (hasPassword
            ? "Password changed successfully."
            : "Password set successfully."),
      );

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setErrors({});
    } catch (error) {
      setShowForgotPassword(true);

      toast.error(
        error.response?.data?.message ||
          (hasPassword
            ? "Unable to change your password."
            : "Unable to set your password."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 rounded-xl border bg-background p-3 sm:space-y-6 sm:p-5 lg:p-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Security
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Keep your account secure by using a strong password.
        </p>
      </div>

      {/* Password form */}
      <Card className="min-w-0">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <LockKeyhole className="size-5 shrink-0" />
            {hasPassword ? "Change password" : "Set password"}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-5">
            {hasPassword && (
              <>
                <div className="space-y-2">
                  <PasswordField
                    label="Current password"
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter your current password"
                  />

                  {errors.currentPassword && (
                    <p className="text-sm leading-relaxed text-destructive">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>

                {showForgotPassword && (
                  <div className="-mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto gap-1 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => navigate("/forgot-password")}
                    >
                      <KeyRound className="size-4" />
                      Forgot password?
                    </Button>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <PasswordField
                label="New password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
              />

              {errors.newPassword && (
                <p className="text-sm leading-relaxed text-destructive">
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <PasswordField
                label="Confirm new password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
              />

              {errors.confirmPassword && (
                <p className="text-sm leading-relaxed text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-fit"
            >
              {loading
                ? hasPassword
                  ? "Changing password..."
                  : "Setting password..."
                : hasPassword
                  ? "Change password"
                  : "Set password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Security;
