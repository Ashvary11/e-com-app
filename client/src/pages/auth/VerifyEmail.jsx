import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; 
import AuthLayout from "../../components/auth/AuthLayout";
import { Button } from "../../components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../../components/ui/input-otp";
import { resendVerification, verifyEmail } from "../../services/authService";
import { verifyEmailSchema } from "../../validators/authValidators";

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();

    const result = verifyEmailSchema.safeParse({
      email,
      otp,
    });

    if (!result.success) {
      setError(result.error.flatten().fieldErrors.otp?.[0] || "");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await verifyEmail(result.data);

      toast.success(response.message || "Email verified successfully.");

      navigate("/login", {
        state: {
          email,
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to verify your email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email address is missing.");
      return;
    }

    try {
      setResending(true);

      const response = await resendVerification({ email });

      toast.success(
        response.message || "A new verification code has been sent.",
      );

      setOtp("");
      setError("");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to resend the verification code.",
      );
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <AuthLayout
        title="Verify your email"
        description="We need your email address to continue."
        footer={
          <>
            Need an account?{" "}
            <Link
              to="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create account
            </Link>
          </>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Please register first so we know which email address to verify.
          </p>

          <Button asChild className="w-full">
            <Link to="/register">Go to registration</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify your email"
      description={`Enter the 6-digit code sent to ${email}.`}
      footer={
        <>
          Already verified?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setError("");
            }}
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

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || resending}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

          {loading ? "Verifying..." : "Verify email"}
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?
          </p>

          <Button
            type="button"
            variant="link"
            className="mt-1 px-0"
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

export default VerifyEmail;
