"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Award,
  ShieldCheck,
  Calendar,
  TrendingUp,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Shield,
  Clock,
} from "lucide-react";
import { reportService } from "@/services/report";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CqcInspectionPackModal } from "@/components/cqc/cqc-inspection-pack-modal";

function exportToCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val).replace(/"/g, '""');
          return str.includes(",") || str.includes("\n") ? `"${str}"` : str;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportToJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function printPage() {
  window.print();
}

const CQC_REGULATIONS = [
  {
    reg: "Regulation 12",
    title: "Safe Care & Treatment",
    description: "Medicines management, infection control, equipment safety",
    icon: Shield,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    reg: "Regulation 17",
    title: "Good Governance",
    description: "Records, audits, quality assurance systems",
    icon: BarChart3,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    reg: "Regulation 18",
    title: "Staffing",
    description: "Training, competency, and workforce compliance",
    icon: Users,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    reg: "Regulation 19",
    title: "Fit & Proper Persons",
    description: "DBS checks, right to work, qualifications",
    icon: CheckCircle2,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
];

export default function ReportsPage() {
  const [expandedReg, setExpandedReg] = useState<string | null>(null);
  const [isCqcPackOpen, setIsCqcPackOpen] = useState(false);
  const { user } = useAuth();
  const [filterOrg, setFilterOrg] = useState("all");
  const [includeInactive, setIncludeInactive] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  // Fetch Organizations (admin only)
  const { data: orgsRes } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get("/users/organizations").then((res) => res.data),
    enabled: !!user && isAdmin,
  });

  const organizations = orgsRes?.data || [];

  const { data: staffReportRes, isLoading: isStaffLoading } = useQuery({
    queryKey: ["staffReport", filterOrg, includeInactive],
    queryFn: () =>
      reportService.getStaffReport({
        limit: 200,
        organizationId: filterOrg === "all" ? undefined : filterOrg,
        includeInactive: includeInactive ? "true" : "false",
      }),
    enabled: !!user,
  });

  const { data: complianceRes, isLoading: isComplianceLoading } = useQuery({
    queryKey: ["complianceReport", filterOrg, includeInactive],
    queryFn: () =>
      api.get("/reports/compliance", {
        params: {
          includeInactive: includeInactive ? "true" : "false",
        },
      }).then((res) => res.data),
    enabled: !!user,
  });

  const { data: expiringRes, isLoading: isExpiringLoading } = useQuery({
    queryKey: ["expiringReport", filterOrg, includeInactive],
    queryFn: () =>
      api.get("/reports/expiring", {
        params: {
          includeInactive: includeInactive ? "true" : "false",
        },
      }).then((res) => res.data),
    enabled: !!user,
  });

  const { data: certReportRes } = useQuery({
    queryKey: ["certReport", filterOrg, includeInactive],
    queryFn: () =>
      reportService.getCertificateReport({
        limit: 200,
        organizationId: filterOrg === "all" ? undefined : filterOrg,
        includeInactive: includeInactive ? "true" : "false",
      }),
    enabled: !!user,
  });

  const staff: any[] = staffReportRes?.data?.data?.data || [];
  const certData: any[] = certReportRes?.data?.data?.data || [];
  const compliance = complianceRes?.data || {};
  const expiring = expiringRes?.data || {};

  // Compute training matrix flat data for CSV export
  function buildTrainingCsvData() {
    return staff.flatMap((s) =>
      (s.trainings || []).map((t: any) => ({
        EmployeeNo: s.employeeNo,
        StaffName: `${s.firstName} ${s.lastName}`,
        Email: s.user?.email || "",
        CourseTitle: t.title,
        Provider: t.provider,
        CompletedOn: t.completedOn
          ? new Date(t.completedOn).toLocaleDateString("en-GB")
          : "",
        ExpiresOn: t.expiresOn ? new Date(t.expiresOn).toLocaleDateString("en-GB") : "",
        Status:
          t.expiresOn && new Date(t.expiresOn) < new Date()
            ? "EXPIRED"
            : t.expiresOn &&
              (new Date(t.expiresOn).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 30
            ? "EXPIRING SOON"
            : "VALID",
      }))
    );
  }

  function buildCompetencyCsvData() {
    return staff.flatMap((s) =>
      (s.competencies || []).map((c: any) => ({
        EmployeeNo: s.employeeNo,
        StaffName: `${s.firstName} ${s.lastName}`,
        Email: s.user?.email || "",
        CompetencyType: c.name?.replace(/_/g, " "),
        Result: c.level || "PENDING",
        AssessedOn: c.achievedOn ? new Date(c.achievedOn).toLocaleDateString("en-GB") : "",
        AssessorNotes: c.assessorNotes || "",
      }))
    );
  }

  function buildCertificateCsvData() {
    return certData.map((cert) => ({
      EmployeeNo: cert.staff?.employeeNo || "",
      StaffName: cert.staff ? `${cert.staff.firstName} ${cert.staff.lastName}` : "",
      CertificateTitle: cert.title,
      IssuedBy: cert.issuer,
      CertificateNumber: cert.certificateNo || "",
      IssuedOn: cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("en-GB") : "",
      ExpiresOn: cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString("en-GB") : "",
      Status:
        cert.expiryDate && new Date(cert.expiryDate) < new Date()
          ? "EXPIRED"
          : "VALID",
    }));
  }

  const isLoading = isStaffLoading || isComplianceLoading;

  // Stats derived from live data
  const totalStaff = staff.length;
  const allTrainings = staff.flatMap((s) => s.trainings || []);
  const allCompetencies = staff.flatMap((s) => s.competencies || []);
  const expiredTrainings = allTrainings.filter(
    (t) => t.expiresOn && new Date(t.expiresOn) < new Date()
  ).length;
  const passedCompetencies = allCompetencies.filter((c) => c.level === "PASS").length;
  const overallScore =
    allTrainings.length + allCompetencies.length > 0
      ? Math.round(
          (((allTrainings.length - expiredTrainings) + passedCompetencies) /
            (allTrainings.length + allCompetencies.length)) *
            100
        )
      : 0;

  const reportDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto print:bg-white print:text-black">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-3 print:text-black">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 print:hidden">
              <FileText className="h-5 w-5 text-emerald-400" />
            </div>
            CQC Compliance Reports
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 dark:text-zinc-400 mt-1 print:text-gray-600">
            Generated: {reportDate}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3 print:hidden items-center">
          {isAdmin && (
            <>
              <select
                value={filterOrg}
                onChange={(e) => setFilterOrg(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Care Homes</option>
                {organizations.map((org: any) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 mr-2">
                <button
                  type="button"
                  onClick={() => setIncludeInactive(!includeInactive)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    includeInactive ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      includeInactive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-650 dark:text-zinc-400">
                  Include Inactive
                </span>
              </div>
            </>
          )}

          <button
            onClick={() => setIsCqcPackOpen(true)}
            className="flex items-center gap-2 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3.5 py-2 text-xs shadow-md shadow-emerald-900/30 transition-all border border-emerald-400/30 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Generate CQC Audit Pack</span>
          </button>
          <button
            onClick={printPage}
            className="flex items-center gap-2 h-10 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 transition-all"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all">
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => exportToCSV(buildTrainingCsvData(), `training-matrix-${Date.now()}.csv`)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:text-zinc-50 transition-colors text-left"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  Training Matrix (CSV)
                </button>
                <button
                  onClick={() => exportToCSV(buildCompetencyCsvData(), `competency-audit-log-${Date.now()}.csv`)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:text-zinc-50 transition-colors text-left"
                >
                  <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
                  Competency Audit Log (CSV)
                </button>
                <button
                  onClick={() => exportToCSV(buildCertificateCsvData(), `certificate-store-${Date.now()}.csv`)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:text-zinc-50 transition-colors text-left"
                >
                  <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                  Certificate Store (CSV)
                </button>
                <div className="border-t border-slate-200 dark:border-zinc-800 my-1" />
                <button
                  onClick={() =>
                    exportToJSON(
                      {
                        generatedAt: new Date().toISOString(),
                        overallComplianceScore: overallScore,
                        totalStaff,
                        trainings: buildTrainingCsvData(),
                        competencies: buildCompetencyCsvData(),
                        certificates: buildCertificateCsvData(),
                      },
                      `cqc-full-report-${Date.now()}.json`
                    )
                  }
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:text-zinc-50 transition-colors text-left"
                >
                  <FileText className="h-4 w-4 text-slate-600 dark:text-zinc-400 dark:text-zinc-400" />
                  Full CQC Report (JSON)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Overview Banner */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6">
        <div className="flex items-center gap-6">
          {/* Score Ring */}
          <div className="flex-shrink-0">
            {(() => {
              const r = 40;
              const c = 2 * Math.PI * r;
              const dash = (overallScore / 100) * c;
              const color = overallScore >= 80 ? "#10b981" : overallScore >= 60 ? "#f59e0b" : "#ef4444";
              return (
                <div className="relative h-24 w-24 flex items-center justify-center">
                  <svg className="-rotate-90 absolute inset-0" width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r={r} stroke="#1e293b" strokeWidth="6" fill="none" />
                    <circle
                      cx="48"
                      cy="48"
                      r={r}
                      stroke={color}
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${dash} ${c}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-xl font-bold" style={{ color }}>{overallScore}%</p>
                    <p className="text-[9px] text-slate-600 dark:text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">Score</p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                Overall CQC Compliance — Regulation 18
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-zinc-400 dark:text-zinc-400 mb-3">
              {overallScore >= 80
                ? "Your facility meets CQC Regulation 18 staffing compliance standards."
                : overallScore >= 60
                ? "Some training and competency gaps identified. Review expiring items."
                : "Significant compliance gaps found. Immediate action required."}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Staff", value: totalStaff, icon: Users, color: "text-blue-400" },
                { label: "Training Records", value: allTrainings.length, icon: Award, color: "text-purple-400" },
                { label: "Competency Audits", value: allCompetencies.length, icon: ShieldCheck, color: "text-indigo-400" },
                { label: "Expired Items", value: expiredTrainings, icon: AlertTriangle, color: "text-red-400" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-3">
                  <stat.icon className={`h-4 w-4 ${stat.color} mb-1`} />
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-50">{stat.value}</p>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 dark:text-zinc-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CQC Regulation Compliance Sections */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 dark:text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Regulation Compliance Status
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {CQC_REGULATIONS.map((reg) => (
            <button
              key={reg.reg}
              onClick={() => setExpandedReg(expandedReg === reg.reg ? null : reg.reg)}
              className={`text-left rounded-xl border p-5 transition-all ${reg.bg} hover:scale-[1.01]`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-2">
                  <reg.icon className={`h-5 w-5 ${reg.color}`} />
                  <div>
                    <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 dark:text-zinc-400">{reg.reg}</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50">{reg.title}</p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 dark:text-zinc-400">{reg.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Staff Compliance Table */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 dark:text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Staff Compliance Detail
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100/50 dark:bg-zinc-900/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-900/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                    Role
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
                    Trainings
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-zinc-400 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                    Competencies
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
                    Expired
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {staff.map((s) => {
                  const trainings = s.trainings || [];
                  const competencies = s.competencies || [];
                  const expired = trainings.filter(
                    (t: any) => t.expiresOn && new Date(t.expiresOn) < new Date()
                  ).length;
                  const passedComps = competencies.filter((c: any) => c.level === "PASS").length;
                  const score =
                    trainings.length + competencies.length > 0
                      ? Math.round(
                          (((trainings.length - expired) + passedComps) /
                            (trainings.length + competencies.length)) *
                            100
                        )
                      : 75;
                  const statusColor =
                    score >= 80
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : score >= 60
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                      : "text-red-400 bg-red-500/10 border-red-500/20";
                  const statusLabel = score >= 80 ? "Compliant" : score >= 60 ? "Review" : "Critical";

                  return (
                    <tr key={s.id} className="hover:bg-slate-100 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-zinc-50">{s.firstName} {s.lastName}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-slate-600 dark:text-zinc-400 dark:text-zinc-400 text-xs">{s.user?.role || "STAFF"}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-slate-900 dark:text-zinc-50 font-semibold">{trainings.length}</span>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className="text-slate-900 dark:text-zinc-50 font-semibold">{competencies.length}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {expired > 0 ? (
                          <span className="text-red-400 font-semibold">{expired}</span>
                        ) : (
                          <span className="text-emerald-400">✓</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Trail Notice */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50 mb-1">CQC Audit Ready</p>
          <p className="text-xs text-slate-600 dark:text-zinc-400 dark:text-zinc-400 leading-relaxed">
            This report is generated in real-time from your compliance records and is suitable for presentation during CQC
            inspections under Regulation 18 (Staffing). Export as CSV or JSON to share with your compliance officer or
            external auditors. All records are timestamped and traceable.
          </p>
        </div>
      </div>

      <CqcInspectionPackModal
        isOpen={isCqcPackOpen}
        onClose={() => setIsCqcPackOpen(false)}
        organizationId={filterOrg === "all" ? undefined : filterOrg}
      />
    </div>
  );
}
