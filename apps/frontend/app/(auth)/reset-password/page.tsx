"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const strength = password.length === 0 ? 0 :
    password.length < 6 ? 1 :
    password.length < 10 ? 2 :
    /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "oklch(0.65 0.22 25)", "oklch(0.75 0.18 70)", "oklch(0.65 0.16 135)", "oklch(0.52 0.18 163)"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      toast.success("Password reset successfully!");
      router.replace("/login");
    }, 1500);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.1 0.02 240) 0%, oklch(0.09 0.03 195) 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 30% 40%, oklch(0.52 0.18 163 / 15%) 0%, transparent 60%)",
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
          <div className="mb-7">
            <h1
              className="text-2xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Create New Password
            </h1>
            <p
              className="text-sm mt-1.5"
              style={{ color: "oklch(0.55 0.02 240)" }}
            >
              Enter a secure password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New password */}
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors p-0.5"
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

            {/* Confirm password */}
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors p-0.5"
                  style={{ color: "oklch(0.45 0.02 240)" }}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && confirmPassword === password && (
                <p
                  className="text-[11px] font-semibold flex items-center gap-1"
                  style={{ color: "oklch(0.65 0.18 163)" }}
                >
                  <CheckCircle className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-70 mt-2"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.52 0.18 163), oklch(0.48 0.18 175))",
                boxShadow: isPending
                  ? "none"
                  : "0 4px 20px oklch(0.52 0.18 163 / 35%)",
              }}
            >
              {isPending ? (
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
          </form>

          <div
            className="mt-6 pt-5 border-t"
            style={{ borderColor: "oklch(0.2 0.02 240)" }}
          >
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              style={{ color: "oklch(0.55 0.02 240)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color =
                  "oklch(0.7 0.15 163)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color =
                  "oklch(0.55 0.02 240)")
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
