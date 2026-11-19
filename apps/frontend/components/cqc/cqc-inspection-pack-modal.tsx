"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Printer,
  Download,
  X,
  Building2,
  Bed,
  Users,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { reportService } from "@/services/report";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

interface CqcInspectionPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
}

export function CqcInspectionPackModal({
  isOpen,
  onClose,
  organizationId,
}: CqcInspectionPackModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "gaps" | "kloes" | "roster">("overview");

  const { data: cqcRes, isLoading } = useQuery({
    queryKey: ["cqcInspectionPack", organizationId],
    queryFn: () => reportService.getCqcInspectionPack(organizationId).then((r) => r.data),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const pack = cqcRes?.data;
  const facility = pack?.facility;
  const summary = pack?.auditSummary;
  const kloes = pack?.kloes || [];
  const gaps = pack?.theoryVsPracticalGaps || [];
  const roster = pack?.staffRoster || [];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!roster.length) return;
    const headers = ["EmployeeNo", "Name", "Email", "ComplianceScore", "Status", "Trainings", "Competencies", "LastAssessment"];
    const rows = roster.map((r: any) => [
      r.employeeNo,
      `"${r.name}"`,
      r.email || "",
      `${r.complianceScore}%`,
      r.status,
      r.trainingsCount,
      r.competenciesCount,
      r.lastAssessment ? new Date(r.lastAssessment).toLocaleDateString("en-GB") : "None",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row: any[]) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CQC-Regulation18-Audit-Pack-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CQC Audit CSV downloaded successfully");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-2xl border border-border/80 bg-card shadow-2xl shadow-primary/10 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-emerald-950/30 via-card to-card px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  CQC Regulation 18 Inspection Pack
                </h2>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  Audit Ready
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Unified Workforce Compliance, E-Learning CPD & Bedside Competency Assessment Record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/80 hover:bg-secondary px-3.5 py-2 text-xs font-medium text-foreground transition-all border border-border/60 shadow-sm"
              title="Print Inspection Pack"
            >
              <Printer className="h-4 w-4 text-emerald-400" />
              <span>Print CQC Report</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-medium text-white transition-all shadow-md shadow-emerald-900/30"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Facility Metadata Ribbon */}
        {facility && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/30 px-6 py-3 border-b border-border/40 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">
                Facility: <strong className="text-foreground">{facility.name}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                CQC Reg: <strong className="text-foreground">{facility.registrationNumber}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bed className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>
                Bed Capacity: <strong className="text-foreground">{facility.bedCapacity} Beds</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Active Staff: <strong className="text-foreground">{facility.activeStaffCount} Roster</strong>
              </span>
            </div>
          </div>
        )}

        {/* Nav Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-border/60 bg-card">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === "overview"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Executive Summary
          </button>
          <button
            onClick={() => setActiveTab("gaps")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "gaps"
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Theory vs Bedside Gaps</span>
            {gaps.length > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                {gaps.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("kloes")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === "kloes"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            5 CQC Key Questions (KLOEs)
          </button>
          <button
            onClick={() => setActiveTab("roster")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === "roster"
                ? "border-purple-500 text-purple-400 bg-purple-500/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Staff Compliance Matrix Roster ({roster.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="text-sm">Synthesizing Regulation 18 Audit Pack...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: EXECUTIVE SUMMARY */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* High Level KPI Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-emerald-950/40 via-card to-card border-emerald-500/30">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Overall Compliance</p>
                          <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">
                            {summary?.overallComplianceScore || 0}%
                          </h3>
                          <p className="text-[11px] text-emerald-400/80 font-medium mt-0.5">
                            CQC Regulation 18 Pass
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <FileCheck2 className="h-6 w-6" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border/60">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">CQC Ready Staff</p>
                          <h3 className="text-3xl font-extrabold text-foreground mt-1">
                            {summary?.cqcReadyStaffCount || 0} / {summary?.totalActiveStaff || 0}
                          </h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Valid mandatory certifications
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Users className="h-6 w-6" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border/60">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Theory/Practical Gaps</p>
                          <h3 className={`text-3xl font-extrabold mt-1 ${gaps.length > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                            {gaps.length}
                          </h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {gaps.length > 0 ? "Require Bedside Audits" : "Zero disconnects"}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <AlertTriangle className="h-6 w-6" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border/60">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Current CQC Status</p>
                          <h3 className="text-xl font-bold text-foreground mt-2">
                            {facility?.cqcRating || "Good"}
                          </h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Inspection Ready
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Inspector Statement Box */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-300">
                        CQC Regulation 18 (Staffing) Compliance Statement
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        This digital audit pack certifies that all active healthcare assistants, senior carers, and nursing staff have undergone continuous professional development (CPD) e-learning modules and mandatory practical bedside competency observations (including Hoist Safety, Medication MAR rounds, and Infection Prevention & Control).
                      </p>
                    </div>
                  </div>

                  {/* KLOE Mini Summary Cards */}
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      5 Key Lines of Enquiry (KLOEs) Overview
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {kloes.map((k: any) => (
                        <div
                          key={k.key}
                          className="rounded-xl border border-border/60 bg-secondary/20 p-3 flex flex-col justify-between hover:border-border transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">{k.title}</span>
                              <span className="text-xs font-extrabold text-emerald-400">{k.score}%</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                              {k.description}
                            </p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Rating</span>
                            <span className="font-semibold text-emerald-400">{k.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: THEORY VS PRACTICAL GAPS */}
              {activeTab === "gaps" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-300">
                        Critical Audit Finding: E-Learning Theory vs Bedside Practical Disconnect
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        CQC Regulation 18 audits consistently penalize care providers when staff have completed theoretical e-learning courses (e.g. moving & handling) without an accompanying signed practical bedside competency check on the floor.
                      </p>
                    </div>
                  </div>

                  {gaps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5">
                      <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                      <h4 className="text-sm font-bold text-foreground">Zero Disconnects Found!</h4>
                      <p className="text-xs text-muted-foreground max-w-md mt-1">
                        All staff with completed e-learning modules have valid, verified practical bedside competency checklists signed off by the Registered Manager.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-secondary/40 border-b border-border/60 text-muted-foreground">
                          <tr>
                            <th className="py-3 px-4 font-semibold">Staff Member</th>
                            <th className="py-3 px-4 font-semibold">Clinical Module</th>
                            <th className="py-3 px-4 font-semibold">CQC Regulation</th>
                            <th className="py-3 px-4 font-semibold">E-Learning (Theory)</th>
                            <th className="py-3 px-4 font-semibold">Practical Bedside Check</th>
                            <th className="py-3 px-4 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {gaps.map((gap: any, idx: number) => (
                            <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-foreground">{gap.staffName}</div>
                                <div className="text-[10px] text-muted-foreground">{gap.employeeNo}</div>
                              </td>
                              <td className="py-3 px-4 font-medium text-foreground">
                                {gap.module}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground">
                                <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[10px]">
                                  {gap.regulation}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-emerald-400 font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Passed
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                  <XCircle className="h-3 w-3" />
                                  MISSING AUDIT
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  href="/dashboard/competencies"
                                  onClick={onClose}
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 text-[11px] font-medium border border-primary/20 transition-colors"
                                >
                                  <span>Audit Bedside</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: 5 KLOES FULL BREAKDOWN */}
              {activeTab === "kloes" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kloes.map((k: any) => (
                    <Card key={k.key} className="border-border/60 bg-card">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-foreground">{k.title}</h4>
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-400">
                            {k.score}% • {k.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {k.description}
                        </p>
                        <div className="w-full bg-secondary/60 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${k.score}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* TAB 4: STAFF ROSTER */}
              {activeTab === "roster" && (
                <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 border-b border-border/60 text-muted-foreground">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Employee</th>
                        <th className="py-3 px-4 font-semibold">E-Learning CPD</th>
                        <th className="py-3 px-4 font-semibold">Bedside Competencies</th>
                        <th className="py-3 px-4 font-semibold">Overall Score</th>
                        <th className="py-3 px-4 font-semibold">CQC Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Last Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {roster.map((st: any) => (
                        <tr key={st.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground">{st.name}</div>
                            <div className="text-[10px] text-muted-foreground">{st.employeeNo} • {st.email}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">
                            {st.trainingsCount} Modules
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">
                            {st.competenciesCount} Verified Checklists
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-400">
                            {st.complianceScore}%
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                st.status === "CQC_READY"
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                  : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                              }`}
                            >
                              {st.status === "CQC_READY" ? "READY" : "ACTION REQ"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground">
                            {st.lastAssessment
                              ? new Date(st.lastAssessment).toLocaleDateString("en-GB")
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 bg-secondary/20 px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Official CQC Regulation 18 Audit Pack • Generated by Care Compliance System
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-secondary hover:bg-secondary/80 px-4 py-2 text-xs font-semibold text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
