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
  Building,
  User,
  Phone,
  MapPin,
  ArrowRight,
  CheckCircle,
  Loader2,
  Sparkles,
  HeartHandshake,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { useRegister } from "@/hooks/auth/use-register";
import { token } from "@/lib/token";
import { registerSchema, type RegisterSchema } from "@/lib/validations/auth";

export function RegisterForm({ modal = false }: { modal?: boolean }) {
  const router = useRouter();
  const auth = useAuth();
  const registerMutation = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "MANAGER",
      organizationName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: "",
      postcode: "",
    },
  });

  const onSubmit = (values: RegisterSchema) => {
    const { confirmPassword, ...payload } = values;
    registerMutation.mutate(payload as any, {
      onSuccess: (response) => {
        token.setTokens(response.data.accessToken, response.data.refreshToken);
        auth.login(response.data.user);
        toast.success("Care Home workspace registered! Welcome to CareCompliance.");
        router.replace("/dashboard");
      },
      onError: (error: any) => {
        const msg =
          error?.response?.data?.message ||
          error.message ||
          "Failed to register. Please check your details.";
        toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
      },
    });
  };

  return (
    <div className={modal ? "w-full" : "min-h-screen w-full flex"}>
      {/* ── Left Panel: Branding (Desktop) ── */}
      {!modal && (
        <div
          className="hidden lg:flex lg:w-1/2 xl:w-[48%] relative overflow-hidden flex-col justify-between p-12"
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
            <div className="flex items-center gap-3 mb-10 animate-fade-in">
              <div
                className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.68 0.16 162), oklch(0.55 0.18 280))",
                }}
              >
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Care<span className="text-emerald-400">Compliance</span>
                </span>
                <span className="text-[10px] block font-semibold tracking-widest text-emerald-300/80 uppercase">
                  CQC Regulation 18 Platform
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Onboard Your Care Home</span>
              </div>

              <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
                CQC-Ready Training Matrix & Bedside Competency Auditor
              </h2>

              <p className="text-slate-400 text-sm leading-relaxed">
                Connect online CPD e-learning with live practical bedside competency checklists into a unified inspection-ready compliance portal.
              </p>
            </div>

            {/* Value Props */}
            <div className="mt-8 space-y-3">
              {[
                "1-Click CQC Regulation 18 Inspection Audit Pack Generator",
                "Automated E-Learning vs Bedside Observation Disconnect Flags",
                "Digital Signature Sign-Off for Hoist & Medication Practical Checks",
                "Secure Staff Onboarding & Mandatory Training Auto-Provisioning",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-300 text-xs">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Card */}
          <div className="relative z-10 mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Registered Manager Workspace</p>
                <p className="text-[11px] text-slate-400">
                  Full administrative control, CQC KLOE dashboards & staff invitations
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Right Panel: Form ── */}
      <div
        className={
          modal
            ? "w-full"
            : "flex-1 flex flex-col justify-center items-center p-6 md:p-10 overflow-y-auto"
        }
      >
        <div className="w-full max-w-lg mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
              <Building className="h-3.5 w-3.5" />
              <span>Facility Onboarding</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Register Care Home
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Care Home Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Care Home / Facility Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Sunrise Care Home"
                  {...register("organizationName")}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none ${
                    errors.organizationName
                      ? "border-red-400 ring-2 ring-red-400/20"
                      : "border-slate-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  }`}
                />
              </div>
              {errors.organizationName && (
                <p className="text-xs text-red-500">{errors.organizationName.message}</p>
              )}
            </div>

            {/* Manager Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Manager First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="First Name"
                    {...register("firstName")}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none ${
                      errors.firstName
                        ? "border-red-400 ring-2 ring-red-400/20"
                        : "border-slate-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Manager Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Last Name"
                  {...register("lastName")}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none ${
                    errors.lastName
                      ? "border-red-400 ring-2 ring-red-400/20"
                      : "border-slate-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  }`}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Manager Work Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="manager@carehome.co.uk"
                    {...register("email")}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none ${
                      errors.email
                        ? "border-red-400 ring-2 ring-red-400/20"
                        : "border-slate-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="07700900123"
                    {...register("phone")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Address & Postcode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Facility Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="124 High Street"
                    {...register("address")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Postcode
                </label>
                <input
                  type="text"
                  placeholder="SW1A 1AA"
                  {...register("postcode")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    {...register("password")}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none ${
                      errors.password
                        ? "border-red-400 ring-2 ring-red-400/20"
                        : "border-slate-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    {...register("confirmPassword")}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none ${
                      errors.confirmPassword
                        ? "border-red-400 ring-2 ring-red-400/20"
                        : "border-slate-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-3 rounded-xl text-white font-bold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-2 mt-4 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: "linear-gradient(135deg, oklch(0.68 0.16 162), oklch(0.55 0.18 280))",
                boxShadow: registerMutation.isPending
                  ? "none"
                  : "0 4px 20px oklch(0.52 0.18 163 / 35%)",
              }}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Care Home Workspace…</span>
                </>
              ) : (
                <>
                  <span>Register & Launch Compliance Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* ── Guidance for Care Staff / Carers ── */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-start gap-3 mt-6">
            <HeartHandshake className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                Are you a Care Assistant, Nurse, or Staff Member?
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                In compliance with CQC Regulation 18 & healthcare data governance, staff accounts are provisioned directly by your Registered Manager. Please check your email for an invitation link to activate your personal Staff Portal.
              </p>
              <Link
                href="/activate-account"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-300 pt-1"
              >
                Have an invitation token? Activate Account Here →
              </Link>
            </div>
          </div>

          {!modal && (
            <p className="text-center text-[10px] text-slate-400 dark:text-zinc-600 mt-6">
              Compliant with CQC Regulation 18 · Health & Social Care Act 2008
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
