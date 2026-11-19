"use client";

import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  BookOpen, 
  ShieldAlert, 
  Bot, 
  Sparkles,
  UserPlus
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Soft Ambient glowing mesh backgrounds */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-indigo-600 flex items-center justify-center shadow-md">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-extrabold text-sm tracking-tight leading-none text-slate-900 dark:text-white">
              CareCompliance
            </p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
              CQC Regulation 18
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Register Care Home
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-xl transition-all shadow cursor-pointer hover:scale-102 active:scale-98"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto w-full px-6 py-12 md:py-20 text-center z-10 flex-1 flex flex-col justify-center items-center">
        {/* Sparkle badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-6 animate-fade-in">
          <Sparkles className="h-3 w-3" />
          Audit-Ready Portal
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight max-w-2xl animate-fade-in delay-100">
          CQC Regulation 18 Compliance, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-500">Simplified.</span>
        </h1>

        <p className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base max-w-xl mt-6 leading-relaxed animate-fade-in delay-200">
          Aggregates staff e-learning CPD training and bedside practical competency logs (hoist safety, medication administration) into one unified compliance matrix.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center w-full max-w-md animate-fade-in delay-300">
          <Link
            href="/login"
            className="flex-1 py-3 px-5 text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer hover:scale-102 active:scale-98 flex justify-center items-center gap-2"
            style={{
              background: "linear-gradient(135deg, oklch(0.68 0.16 162), oklch(0.55 0.18 280))",
              boxShadow: "0 6px 20px oklch(0.68 0.16 162 / 30%)"
            }}
          >
            Launch Compliance Portal
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="flex-1 py-3 px-5 text-xs font-bold border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900/60 rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2"
          >
            <UserPlus className="h-4 w-4 text-emerald-500" />
            Register Care Home
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 md:mt-20 w-full animate-fade-in delay-500">
          {[
            {
              title: "CPD e-Learning Sync",
              desc: "Consolidate training matrices in real time, showing up-to-date compliance records for CQC audits.",
              icon: BookOpen,
              color: "text-emerald-500"
            },
            {
              title: "Bedside Safety Auditor",
              desc: "Verify hoisting safety and clinical checklists directly from mobile devices at the resident's bedside.",
              icon: Users,
              color: "text-blue-500"
            },
            {
              title: "AI Compliance Forecasting",
              desc: "Predict training expiration decay models and risk spots before inspectors enter your facility.",
              icon: Bot,
              color: "text-purple-500"
            }
          ].map((feat, idx) => (
            <div
              key={idx}
              className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 text-left shadow-sm hover:shadow-md transition-all group"
            >
              <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 w-fit mb-4 group-hover:scale-115 transition-transform ${feat.color}`}>
                <feat.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100 mb-1">{feat.title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full text-center py-6 border-t border-slate-200 dark:border-zinc-900 text-[10px] text-slate-400 dark:text-zinc-650 z-10">
        Secure Compliance System · Authorized Staff Only · CQC Regulation 18 Complete
      </footer>
    </div>
  );
}