import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

import { useDispatch } from "react-redux";
import { googleLogin, login } from "../../store/slices/authSlice";

import AuthLayout from "@/components/layout/AuthLayout";
import { loginWithEmailSchema } from "@/validators/authValidators";
import { mergeGuestCart } from "@/store/slices/cartSlice";
 

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.74 9.74 0 0 0 12 21.5Z"
      />
      <path
        fill="#FBBC05"
        d="M6.53 13.58A5.85 5.85 0 0 1 6.22 12c0-.55.1-1.09.31-1.58V7.89H3.28A9.73 9.73 0 0 0 2.25 12c0 1.57.38 3.05 1.03 4.11l3.25-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.39c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.49 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.72 5.39l3.25 2.53C7.3 8.11 9.46 6.39 12 6.39Z"
      />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const googleButtonRef = useRef(null);
  const googleInitializedRef = useRef(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

  const onSubmit = async (event) => {
    event.preventDefault();

    const result = loginWithEmailSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors({
        email: fieldErrors.email?.[0] || "",
        password: fieldErrors.password?.[0] || "",
      });

      return;
    }

    try {
      setLoading(true);

      await dispatch(login(result.data)).unwrap();

      toast.success("Login successful.");

     await dispatch(mergeGuestCart()).unwrap();

      navigate("/");
    } catch (error) {
      toast.error(error || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (response) => {
    try {
      await dispatch(googleLogin(response.credential)).unwrap();

      toast.success("Google login successful.");

      await dispatch(mergeGuestCart()).unwrap();

      navigate("/");
    } catch (error) {
      toast.error(error || "Unable to sign in with Google.");
    }
  };

  useEffect(() => {
    if (googleInitializedRef.current) {
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        return false;
      }

      if (googleInitializedRef.current) {
        return true;
      }

      googleInitializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: 400,
      });

      return true;
    };

    if (initializeGoogle()) {
      return;
    }

    const interval = setInterval(() => {
      if (initializeGoogle()) {
        clearInterval(interval);
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your CartSphere account."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
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
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none"
            >
              Password
            </label>

            <Link
              to="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
          />

          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>

          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="relative w-full">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            <GoogleIcon />
            Sign in with Google
          </Button>

          {/* Google's real authentication button */}
          <div
            ref={googleButtonRef}
            className="absolute inset-0 flex w-full justify-center overflow-hidden opacity-0"
            aria-hidden="true"
          />
        </div>
      </form>
    </AuthLayout>
  );
}

export default Login;
