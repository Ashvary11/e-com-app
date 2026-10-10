import { useState } from "react";
import { useSelector } from "react-redux";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

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
    <div className="space-y-2">
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
          className="pr-10"
        />

        <button
          type="button"
          onClick={() => setShowPassword((previous) => !previous)}
          className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={showPassword ? "Hide password" : "Show password"}
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
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
    <div className="space-y-6 bg-white p-3 rounded-xl">
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your account secure by using a strong password.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole className="size-5" />
            {hasPassword ? "Change password" : "Set password"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
            {hasPassword && (
              <>
                <PasswordField
                  label="Current password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                />

                {errors.currentPassword && (
                  <p className="-mt-3 text-sm text-destructive">
                    {errors.currentPassword}
                  </p>
                )}
              </>
            )}

            <PasswordField
              label="New password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Enter your new password"
            />

            {errors.newPassword && (
              <p className="-mt-3 text-sm text-destructive">
                {errors.newPassword}
              </p>
            )}

            <PasswordField
              label="Confirm new password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password"
            />

            {errors.confirmPassword && (
              <p className="-mt-3 text-sm text-destructive">
                {errors.confirmPassword}
              </p>
            )}

            <Button type="submit" disabled={loading}>
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
