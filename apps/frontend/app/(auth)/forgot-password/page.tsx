"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Mutations
  const forgotPasswordMutation = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const res = await authService.forgotPassword(payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "OTP sent to your email address!");
      setStep("verify");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to request password reset. Please try again.";
      toast.error(message);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (payload: { email: string; otp: string; password: string }) => {
      const res = await authService.resetPassword(payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Password reset successfully!");
      router.replace("/login");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to reset password. Please check your OTP and try again.";
      toast.error(message);
    },
  });

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    // Block admin email early (optional client-side validation, backend blocks too)
    if (email.toLowerCase().includes("admin@")) {
      toast.error("Password reset is not allowed for Admin accounts.");
      return;
    }
    forgotPasswordMutation.mutate({ email });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    resetPasswordMutation.mutate({
      email,
      otp,
      password,
    });
  };

  // Password strength meter
  const strength = password.length === 0 ? 0 :
    password.length < 6 ? 1 :
    password.length < 10 ? 2 :
    /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "oklch(0.65 0.22 25)", "oklch(0.75 0.18 70)", "oklch(0.65 0.16 135)", "oklch(0.52 0.18 163)"];

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.1 0.02 240) 0%, oklch(0.09 0.03 195) 100%)",
      }}
    >
      {/* Decorative glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 30% 40%, oklch(0.52 0.18 163 / 15%) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, oklch(0.55 0.15 220 / 10%) 0%, transparent 55%)",
        }}
      />

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="h-10 w-10 rounded-2xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.52 0.18 163), oklch(0.55 0.15 190))",
              boxShadow: "0 0 24px oklch(0.52 0.18 163 / 40%)",
            }}
          >
            <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">
              CareCompliance
            </p>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.12em] mt-0.5"
              style={{ color: "oklch(0.72 0.15 163)" }}
            >
              CQC Regulation 18
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-2xl border"
          style={{
            background: "oklch(0.14 0.018 240)",
            borderColor: "oklch(0.22 0.02 240)",
          }}
        >
          {step === "request" ? (
            <>
              <div className="mb-7">
                <h1
                  className="text-2xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Reset Password
                </h1>
                <p
                  className="text-sm mt-1.5 leading-relaxed"
                  style={{ color: "oklch(0.55 0.02 240)" }}
                >
                  Enter your care home email and we'll send a 6-digit OTP code to verify your identity.
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold"
                    style={{ color: "oklch(0.75 0.015 240)" }}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                      style={{ color: "oklch(0.45 0.02 240)" }}
                    />
                    <input
                      id="email"
                      type="email"
                      placeholder="manager@carehome.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                      style={{
                        background: "oklch(0.18 0.022 240)",
                        border: "1px solid oklch(0.25 0.02 240)",
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor =
                          "oklch(0.52 0.18 163)";
                        (e.target as HTMLInputElement).style.boxShadow =
                          "0 0 0 3px oklch(0.52 0.18 163 / 15%)";
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor =
                          "oklch(0.25 0.02 240)";
                        (e.target as HTMLInputElement).style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-70 cursor-pointer"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.52 0.18 163), oklch(0.48 0.18 175))",
                    boxShadow: forgotPasswordMutation.isPending
                      ? "none"
                      : "0 4px 20px oklch(0.52 0.18 163 / 35%)",
                  }}
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending OTP…
                    </>
                  ) : (
                    <>
                      Send OTP Code
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-7">
                <h1
                  className="text-2xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Verify Code & Reset
                </h1>
                <p
                  className="text-sm mt-1.5 leading-relaxed"
                  style={{ color: "oklch(0.55 0.02 240)" }}
                >
                  We have sent a 6-digit OTP code to <strong style={{ color: "oklch(0.72 0.15 163)" }}>{email}</strong>.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* OTP Code */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="otp"
                    className="text-sm font-semibold"
                    style={{ color: "oklch(0.75 0.015 240)" }}
                  >
                    6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <ShieldCheck
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                      style={{ color: "oklch(0.45 0.02 240)" }}
                    />
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-mono text-white placeholder:text-zinc-600 outline-none transition-all tracking-[0.25em]"
                      style={{
                        background: "oklch(0.18 0.022 240)",
                        border: "1px solid oklch(0.25 0.02 240)",
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor =
                          "oklch(0.52 0.18 163)";
                        (e.target as HTMLInputElement).style.boxShadow =
                          "0 0 0 3px oklch(0.52 0.18 163 / 15%)";
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor =
                          "oklch(0.25 0.02 240)";
                        (e.target as HTMLInputElement).style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold"
                    style={{ color: "oklch(0.75 0.015 240)" }}
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                      style={{ color: "oklch(0.45 0.02 240)" }}
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                      style={{
                        background: "oklch(0.18 0.022 240)",
                        border: "1px solid oklch(0.25 0.02 240)",
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = "oklch(0.52 0.18 163)";
                        (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px oklch(0.52 0.18 163 / 15%)";
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = "oklch(0.25 0.02 240)";
                        (e.target as HTMLInputElement).style.boxShadow = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors p-0.5 cursor-pointer"
                      style={{ color: "oklch(0.45 0.02 240)" }}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              background: i <= strength ? strengthColor[strength] : "oklch(0.22 0.02 240)",
                            }}
                          />
                        ))}
                      </div>
                      <p
                        className="text-[11px] font-semibold"
                        style={{ color: strengthColor[strength] }}
                      >
                        {strengthLabel[strength]} password
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirm"
                    className="text-sm font-semibold"
                    style={{ color: "oklch(0.75 0.015 240)" }}
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                      style={{ color: "oklch(0.45 0.02 240)" }}
                    />
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                      style={{
                        background: "oklch(0.18 0.022 240)",
                        border: `1px solid ${
                          confirmPassword.length > 0 && confirmPassword !== password
                            ? "oklch(0.65 0.22 25)"
                            : "oklch(0.25 0.02 240)"
                        }`,
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px oklch(0.52 0.18 163 / 15%)";
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.boxShadow = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors p-0.5 cursor-pointer"
                      style={{ color: "oklch(0.45 0.02 240)" }}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && confirmPassword === password && (
                    <p
                      className="text-[11px] font-semibold flex items-center gap-1 mt-1"
                      style={{ color: "oklch(0.65 0.18 163)" }}
                    >
                      <CheckCircle className="h-3 w-3" />
                      Passwords match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-70 cursor-pointer mt-2"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.52 0.18 163), oklch(0.48 0.18 175))",
                    boxShadow: resetPasswordMutation.isPending
                      ? "none"
                      : "0 4px 20px oklch(0.52 0.18 163 / 35%)",
                  }}
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting…
                    </>
                  ) : (
                    <>
                      Set New Password
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => forgotPasswordMutation.mutate({ email })}
                    disabled={forgotPasswordMutation.isPending}
                    className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold underline transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Didn't receive code? Resend OTP
                  </button>
                </div>
              </form>
            </>
          )}

          <div
            className="mt-6 pt-5 border-t"
            style={{ borderColor: "oklch(0.2 0.02 240)" }}
          >
            <button
              onClick={() => {
                if (step === "verify") {
                  setStep("request");
                } else {
                  router.push("/login");
                }
              }}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium transition-colors cursor-pointer"
              style={{ color: "oklch(0.55 0.02 240)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "oklch(0.7 0.15 163)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "oklch(0.55 0.02 240)")
              }
            >
              <ArrowLeft className="h-4 w-4" />
              {step === "verify" ? "Back to Email Request" : "Back to Sign In"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
