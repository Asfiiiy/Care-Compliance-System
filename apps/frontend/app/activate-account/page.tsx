"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  AlertTriangle 
} from "lucide-react";
import { api } from "@/lib/axios";

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<{ email: string; organizationName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch token info on load
  useEffect(() => {
    if (!token) {
      setErrorMsg("Activation token is missing. Please check your invitation link.");
      setIsLoadingInfo(false);
      return;
    }

    api.get(`/auth/invitation-info/${token}`)
      .then((res) => {
        setInviteInfo(res.data);
        setIsLoadingInfo(false);
      })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.message || "Invitation link is invalid or has expired (valid for 24 hours).");
        setIsLoadingInfo(false);
      });
  }, [token]);

  const activateMutation = useMutation({
    mutationFn: () => api.post("/auth/activate-account", { token, password }),
    onSuccess: (res) => {
      toast.success("Account activated successfully! Please log in with your new password.");
      router.replace("/login");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to activate account. Please try again.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter a password");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    activateMutation.mutate();
  };

  if (isLoadingInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Verifying secure activation token...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">Invalid Invitation Link</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            {errorMsg}
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2.5 bg-slate-900 dark:bg-zinc-50 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
        >
          Return to Landing Page
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Email Address
        </label>
        <input
          type="email"
          disabled
          value={inviteInfo?.email || ""}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-400 dark:text-zinc-500 font-semibold cursor-not-allowed select-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Care Facility
        </label>
        <input
          type="text"
          disabled
          value={inviteInfo?.organizationName || ""}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-400 dark:text-zinc-500 font-semibold cursor-not-allowed select-none"
        />
      </div>

      <div className="space-y-1 relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Choose Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-zinc-100"
          />
          <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      <div className="space-y-1 relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-zinc-100"
          />
          <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
        </div>
      </div>

      <button
        type="submit"
        disabled={activateMutation.isPending}
        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-102 active:scale-98"
      >
        {activateMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        Activate Account
      </button>
    </form>
  );
}

export default function ActivateAccountPage() {
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, oklch(0.1 0.02 240) 0%, oklch(0.12 0.025 220) 40%, oklch(0.09 0.03 195) 100%)"
      }}
    >
      {/* Mesh gradients */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-8 space-y-6">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Activate CareCompliance Account</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
              You have been invited to access the CQC compliance workspace. Set your new security credentials to begin.
            </p>
          </div>
        </div>

        {/* Suspense Wrapper for SearchParams */}
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Loading activation layout...</p>
          </div>
        }>
          <ActivateForm />
        </Suspense>
      </div>
    </div>
  );
}
