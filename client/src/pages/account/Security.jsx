import { useState } from "react";
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
import { changePassword } from "../../services/authService";
import { changePasswordSchema } from "../../validators/authValidators";

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
          onClick={() => setShowPassword((value) => !value)}
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
    const result = changePasswordSchema.safeParse(form); 
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
      const response = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      toast.success(response?.message || "Password changed successfully.");

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }); 
      setErrors({});
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to change your password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Security</h2> 
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your account secure by using a strong password.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole className="size-5" />
            Change password
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
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
              {loading ? "Changing password..." : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Security;
