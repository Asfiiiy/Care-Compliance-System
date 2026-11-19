"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle,
  Loader2,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { useLogin } from "@/hooks/auth/use-login";
import { token } from "@/lib/token";
import { loginSchema, type LoginSchema } from "@/lib/validations/auth";

export function LoginForm({ modal = false }: { modal?: boolean }) {
  const router = useRouter();
  const auth = useAuth();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleDemoFill = (email: string) => {
    setValue("email", email);
    setValue("password", "Password123!");
    toast.info(`Pre-filled login details for ${email}`);
  };

  const onSubmit = (values: LoginSchema) => {
    login.mutate(values, {
      onSuccess: (response) => {
        token.setTokens(response.data.accessToken, response.data.refreshToken);
        auth.login(response.data.user);
        toast.success("Welcome back! Redirecting to dashboard…");
        router.replace("/dashboard");
      },
      onError: (error: Error) => {
        toast.error(error.message || "Invalid credentials. Please try again.");
      },
    });
  };

  return (
    <div className={modal ? "w-full" : "min-h-screen w-full flex"}>
      {/* ── Left Panel: Branding ── */}
      {!modal && (
        <div
          className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden flex-col justify-between p-12"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.1 0.02 240) 0%, oklch(0.12 0.025 220) 40%, oklch(0.09 0.03 195) 100%)",
          }}
        >
          {/* Decorative mesh gradient */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                radial-gradient(ellipse at 20% 30%, oklch(0.52 0.18 163 / 35%) 0%, transparent 55%),
                radial-gradient(ellipse at 80% 70%, oklch(0.55 0.15 220 / 25%) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 90%, oklch(0.48 0.2 300 / 20%) 0%, transparent 50%)
              `,
            }}
          />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(oklch(0.7 0.1 163) 1px, transparent 1px),
                                linear-gradient(90deg, oklch(0.7 0.1 163) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-16 animate-fade-in">
              <div
                className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.52 0.18 163), oklch(0.55 0.15 190))",
                  boxShadow: "0 0 30px oklch(0.52 0.18 163 / 40%)",
                }}
              >
                <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-white font-bold text-xl tracking-tight leading-none">
                  CareCompliance
                </p>
                <p className="text-emerald-400 text-[11px] font-semibold uppercase tracking-[0.15em] mt-0.5">
                  CQC Regulation 18
                </p>
              </div>
            </div>

            {/* Hero text */}
            <div className="animate-fade-in delay-100">
              <h1
                className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Stay Ahead of{" "}
                <span
                  className="block"
                  style={{
                    background:
                      "linear-gradient(90deg, oklch(0.72 0.16 163), oklch(0.7 0.14 190))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Compliance.
                </span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
                The intelligent care home compliance portal for CQC Regulation 18.
                Real-time tracking. Audit-ready. Always.
              </p>
            </div>
          </div>

          {/* Feature list */}
          <div className="relative z-10 space-y-4 animate-fade-in delay-200">
            {[
              "Automated expiry tracking & smart alerts",
              "Live CQC readiness score dashboard",
              "Bedside competency audit logs",
              "Certificate store with document upload",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                </div>
                <span className="text-slate-300 text-sm">{feature}</span>
              </div>
            ))}

            {/* Live status bar */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
              <div className="relative">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
              </div>
              <span className="text-slate-400 text-xs">
                System operational — All services running
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Right Panel: Login Form ── */}
      <div className={modal ? "w-full" : "flex-1 flex items-center justify-center bg-slate-50 dark:bg-zinc-950 px-6 py-12"}>
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile logo (visible only on small screens) */}
          {!modal && (
            <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.52 0.18 163), oklch(0.55 0.15 190))",
                }}
              >
                <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">
                CareCompliance
              </span>
            </div>
          )}

          {/* Form card */}
          <div className={modal ? "bg-transparent shadow-none border-none p-0" : "bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-zinc-800 p-8"}>
            {/* Header */}
            <div className="mb-8">
              <h2
                className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Welcome back
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1.5">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Register Care Home
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@carehome.com"
                    autoComplete="email"
                    {...register("email")}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none
                      ${
                        errors.email
                          ? "border-red-400 dark:border-red-500/70 ring-2 ring-red-400/20"
                          : "border-slate-200 dark:border-zinc-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700 dark:text-zinc-300"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline transition-all"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none
                      ${
                        errors.password
                          ? "border-red-400 dark:border-red-500/70 ring-2 ring-red-400/20"
                          : "border-slate-200 dark:border-zinc-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={login.isPending}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 mt-4 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.68 0.16 162), oklch(0.55 0.18 280))",
                  boxShadow: login.isPending
                    ? "none"
                    : "0 4px 20px oklch(0.52 0.18 163 / 35%)",
                }}
              >
                {login.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          {!modal && (
            <p className="text-center text-xs text-slate-400 dark:text-zinc-600 mt-6">
              Protected by CQC-grade security · v1.0.0
            </p>
          )}
        </div>
      </div>
    </div>
  );
}