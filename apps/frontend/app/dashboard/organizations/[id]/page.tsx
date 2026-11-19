"use client";

import { use, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building,
  MapPin,
  Award,
  ShieldCheck,
  Users,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  Loader2,
  Sparkles,
  Plus,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  X,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  FileCode,
  CheckCircle2,
  ChevronRight,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

// Custom gauge helper
function ComplianceRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = size === 64 ? 28 : 45;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={size === 64 ? "4" : "6"} stroke="#1e293b" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={size === 64 ? "4" : "6"}
          stroke={color}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className={`font-bold ${size === 64 ? "text-xs" : "text-lg"}`} style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

function RatingBadge({ rating }: { rating?: string }) {
  const normalized = (rating || "Good").toLowerCase();
  if (normalized === "outstanding") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Outstanding
      </span>
    );
  }
  if (normalized === "good") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
        Good
      </span>
    );
  }
  if (normalized === "requires improvement") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
        Requires Improvement
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-500/20">
      Inadequate
    </span>
  );
}

const AVATAR_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-blue-500 to-cyan-600",
  "from-violet-500 to-fuchsia-600",
];

export default function OrganizationWorkspaceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const now = new Date();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "managers" | "staff" | "reports" | "audit">("overview");
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isStaffProfileOpen, setIsStaffProfileOpen] = useState(false);

  // Modals
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editType, setEditType] = useState<"manager" | "staff">("staff");
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    emergencyContact: "",
  });

  // Query Workspace details
  const { data: workspaceRes, isLoading, error } = useQuery({
    queryKey: ["organizationWorkspace", id],
    queryFn: () => api.get(`/organizations/${id}/workspace`).then(res => res.data),
    enabled: !!id && !!currentUser && currentUser.role === "ADMIN",
  });

  // Toggle user status (ACTIVE/INACTIVE)
  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      api.patch(`/users/${userId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizationWorkspace", id] });
      toast.success("Account status updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update account status");
    },
  });

  // Reset user password
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.patch(`/users/${userId}`, { password }),
    onSuccess: () => {
      toast.success("User password has been successfully reset!");
      setIsResetPasswordModalOpen(false);
      setNewPassword("");
      setResetUserId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to reset password");
    },
  });

  // Edit Manager/Staff profile details
  const editProfileMutation = useMutation({
    mutationFn: ({ staffId, payload }: { staffId: string; payload: any }) =>
      api.patch(`/staff/${staffId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizationWorkspace", id] });
      toast.success("Profile updated successfully!");
      setIsEditUserModalOpen(false);
      setEditTargetId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    },
  });

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="p-8 text-center bg-zinc-950 min-h-screen text-slate-100">
        <h1 className="text-xl font-bold text-red-500">Access Denied</h1>
        <p className="text-slate-400 mt-2">Only administrators can access this workspace details portal.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4 min-h-[70vh]">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-sm font-semibold">Loading organization workspace details...</p>
      </div>
    );
  }

  if (error || !workspaceRes?.success) {
    return (
      <div className="p-8 text-center text-rose-500 min-h-[50vh] flex flex-col items-center justify-center gap-2">
        <AlertCircle className="h-12 w-12" />
        <h2 className="text-lg font-bold">Failed to load organization workspace</h2>
        <p className="text-slate-500 text-sm">{(error as any)?.message || "Organization details mismatch."}</p>
        <Link href="/dashboard/organizations" className="mt-4 px-4 py-2 bg-zinc-800 rounded-xl text-xs text-white hover:bg-zinc-700">
          Back to list
        </Link>
      </div>
    );
  }

  const { overview, managers, staff, reports, notifications, auditLogs } = workspaceRes.data;

  const handleOpenResetPassword = (userId: string) => {
    setResetUserId(userId);
    setIsResetPasswordModalOpen(true);
  };

  const handleOpenEditUser = (type: "manager" | "staff", item: any) => {
    setEditType(type);
    setEditTargetId(item.id);
    setEditForm({
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      phone: item.phone || "",
      address: item.address || "",
      emergencyContact: item.emergencyContact || "",
    });
    setIsEditUserModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetId) return;

    if (editType === "manager") {
      api.patch(`/users/${editTargetId}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["organizationWorkspace", id] });
        toast.success("Manager details updated successfully!");
        setIsEditUserModalOpen(false);
      }).catch(err => {
        toast.error(err?.response?.data?.message || "Failed to update manager");
      });
    } else {
      editProfileMutation.mutate({
        staffId: editTargetId,
        payload: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone,
          address: editForm.address,
          emergencyContact: editForm.emergencyContact,
        }
      });
    }
  };

  const triggerResetPassword = () => {
    if (!resetUserId || !newPassword.trim()) return;
    resetPasswordMutation.mutate({ userId: resetUserId, password: newPassword });
  };

  const handleOpenStaffProfile = (item: any) => {
    setSelectedStaff(item);
    setIsStaffProfileOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ["Employee ID", "Full Name", "Email", "Status", "Compliance Score", "Trainings Logged", "Practical Audits Passed"];
    const rows = staff.map((s: any) => [
      s.employeeNo,
      `${s.firstName} ${s.lastName}`,
      s.email || "N/A",
      s.status,
      `${s.complianceScore}%`,
      s.trainings?.length || 0,
      s.competencies?.filter((c: any) => c.level === "PASS").length || 0,
    ]);
    
    const csvRows = [headers.join(",")];
    for (const row of rows) {
      const escapedRow = row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(escapedRow.join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${overview.name.replace(/\s+/g, "_")}_Compliance_Report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report exported successfully!");
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-hidden print:p-0 print:max-w-none">
      {/* Back Button */}
      <div className="flex items-center gap-3 print:hidden">
        <Link
          href="/dashboard/organizations"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-purple-500 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Workspace Directory</span>
      </div>

      {/* Overview Card */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border border-slate-150 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 z-10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg text-white font-bold flex-shrink-0">
            <Building className="h-8 w-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-zinc-50">{overview.name}</h1>
              <RatingBadge rating={overview.rating} />
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-1 font-semibold">CQC REGISTRATION NO: {overview.registrationNumber}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {overview.address}, {overview.postcode}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-slate-400" /> {overview.phone}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-slate-400" /> {overview.email}</span>
            </div>
            <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 mt-2.5 items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
                Bed Capacity: <span className="font-extrabold text-slate-900 dark:text-zinc-100">{overview.bedCapacity ?? 0}</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                Plan: <span className="font-extrabold">{overview.subscriptionPlan ?? "Standard"}</span>
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                overview.subscriptionStatus === "ACTIVE" 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              }`}>
                Sub: {overview.subscriptionStatus ?? "ACTIVE"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 self-start lg:self-center border-t lg:border-t-0 lg:border-l border-slate-150 dark:border-zinc-800 pt-5 lg:pt-0 lg:pl-8 z-10 w-full lg:w-auto justify-between lg:justify-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">CQC Audit Score</span>
            <span className="text-xs text-slate-550 dark:text-zinc-400 block">Predicted regulatory readiness</span>
          </div>
          <ComplianceRing score={overview.complianceScore} size={80} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 overflow-x-auto gap-5 print:hidden">
        {[
          { id: "overview", label: "Overview Workspace", icon: Sparkles },
          { id: "managers", label: "Managers", icon: KeyRound },
          { id: "staff", label: "Staff Directory", icon: Users },
          { id: "reports", label: "Audit Reports", icon: FileText },
          { id: "audit", label: "Platform Logs", icon: Clock },
        ].map((tab) => {
          const ActiveIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-600 dark:text-purple-400 font-extrabold"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-zinc-205"
              }`}
            >
              <ActiveIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in print:block">
          {/* Stat Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Managers", value: overview.totalManagers, sub: "Regulatory users", bg: "from-blue-550/10 to-indigo-550/5", border: "border-blue-500/20" },
              { label: "Total Staff", value: overview.totalStaff, sub: "Caregivers logged", bg: "from-purple-550/10 to-indigo-550/5", border: "border-purple-500/20" },
              { label: "Active User Sessions", value: `${overview.activeUsers} / ${overview.activeUsers + overview.inactiveUsers}`, sub: "Activated accounts", bg: "from-emerald-550/10 to-teal-550/5", border: "border-emerald-500/20" },
              { label: "Certificates Store", value: overview.certificatesCount, sub: "Uploaded document logs", bg: "from-amber-550/10 to-orange-550/5", border: "border-amber-500/20" },
            ].map((stat, i) => (
              <div key={i} className={`rounded-2xl border bg-gradient-to-br ${stat.bg} ${stat.border} p-5 shadow-sm`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{stat.label}</span>
                <span className="text-3xl font-extrabold text-slate-800 dark:text-zinc-100 block mt-2">{stat.value}</span>
                <span className="text-[10px] text-slate-450 mt-1 block font-semibold">{stat.sub}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                  Compliance Metrics
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-normal">Overall distribution of valid documents, CPD completed models, and bedside competency checks.</p>
              </div>

              <div className="grid grid-cols-3 gap-3 my-6 text-center">
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/30 rounded-xl border border-slate-100 dark:border-zinc-850">
                  <span className="text-lg font-bold text-slate-850 dark:text-zinc-100">{overview.trainingsCount}</span>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold mt-1">E-learning</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/30 rounded-xl border border-slate-100 dark:border-zinc-850">
                  <span className="text-lg font-bold text-slate-850 dark:text-zinc-100">{overview.competenciesCount}</span>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold mt-1">Bedside Audits</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/30 rounded-xl border border-slate-100 dark:border-zinc-850">
                  <span className="text-lg font-bold text-slate-850 dark:text-zinc-100">{overview.certificatesCount}</span>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold mt-1">Certs Store</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button onClick={() => setActiveTab("reports")} className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer">
                  View Detailed Audit Reports <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm lg:col-span-2">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-purple-500" />
                CQC Regulation 18 Audit Trends
              </h3>
              <p className="text-xs text-slate-500 mt-1">Calculated audit results for required training competencies</p>

              <div className="mt-6 space-y-4">
                {reports.complianceTrends.map((trend: any, index: number) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-750 dark:text-zinc-305">{trend.name}</span>
                      <span className="text-purple-650 dark:text-purple-400">{trend.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-zinc-850 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000"
                        style={{ width: `${trend.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2 mb-4">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
                Active Compliance Alerts ({notifications.filter((n: any) => n.status === "UNREAD").length})
              </h3>
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">All caught up! No active warnings.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-850 max-h-80 overflow-y-auto">
                  {notifications.map((n: any) => (
                    <div key={n.id} className="py-3 flex items-start gap-3">
                      <span className={`h-2 w-2 rounded-full mt-1.5 ${
                        n.type === "ERROR" ? "bg-rose-500" : n.type === "WARNING" ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-slate-400 font-medium block mt-1">{new Date(n.createdAt).toLocaleString("en-GB")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2 mb-4">
                <Clock className="h-4.5 w-4.5 text-blue-500" />
                Recent Operations History
              </h3>
              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No audits logs recorded.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-850 max-h-80 overflow-y-auto">
                  {auditLogs.map((l: any) => (
                    <div key={l.id} className="py-3 text-xs leading-normal">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-zinc-250 truncate">{l.description}</span>
                        <span className="text-[9px] font-bold uppercase bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded flex-shrink-0">{l.action}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 block">{new Date(l.createdAt).toLocaleString("en-GB")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Managers */}
      {activeTab === "managers" && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-150 dark:border-zinc-800 shadow-sm overflow-hidden animate-fade-in">
          {managers.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <KeyRound className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm">No managers registered in this care home workspace.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-650 dark:text-zinc-300">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Manager Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Staff Count</th>
                    <th className="px-6 py-4 text-center">Compliance Score</th>
                    <th className="px-6 py-4 text-center">Pending Tasks</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
                  {managers.map((mgr: any) => {
                    const managerName = `${mgr.firstName} ${mgr.lastName}`.trim() || mgr.email.split("@")[0];
                    const isActive = mgr.status === "ACTIVE";

                    return (
                      <tr key={mgr.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/10 transition-colors">
                        <td className="px-6 py-4.5 font-bold text-slate-900 dark:text-zinc-150">{managerName}</td>
                        <td className="px-6 py-4.5 font-medium">{mgr.email}</td>
                        <td className="px-6 py-4.5 font-mono text-xs">{mgr.phone || "N/A"}</td>
                        <td className="px-6 py-4.5 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}>
                            {mgr.status}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-center font-bold">{mgr.assignedStaffCount}</td>
                        <td className="px-6 py-4.5 text-center font-bold text-emerald-600 dark:text-emerald-400">{mgr.complianceScore}%</td>
                        <td className="px-6 py-4.5 text-center">
                          {mgr.pendingTasks > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                              {mgr.pendingTasks} tasks
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditUser("manager", mgr)}
                              className="px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:text-purple-500 dark:hover:text-purple-400 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenResetPassword(mgr.id)}
                              className="p-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:text-blue-500 transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => toggleUserStatusMutation.mutate({ userId: mgr.id, status: isActive ? "INACTIVE" : "ACTIVE" })}
                              disabled={toggleUserStatusMutation.isPending}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                isActive
                                  ? "border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10"
                                  : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10"
                              }`}
                            >
                              {isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Staff Directory */}
      {activeTab === "staff" && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-150 dark:border-zinc-800 shadow-sm overflow-hidden animate-fade-in">
          {staff.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Users className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm">No caregiver staff members logged.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-650 dark:text-zinc-300">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Caregiver</th>
                    <th className="px-6 py-4">Employee ID</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Compliance</th>
                    <th className="px-6 py-4 text-center">Training Progress</th>
                    <th className="px-6 py-4 text-center">Competency Audits</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
                  {staff.map((stf: any, idx: number) => {
                    const fullName = `${stf.firstName} ${stf.lastName}`;
                    const isActive = stf.status === "ACTIVE";
                    const avatarGradient = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                    return (
                      <tr key={stf.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/10 transition-colors">
                        <td className="px-6 py-4.5 flex items-center gap-3">
                          {stf.avatarUrl ? (
                            <img
                              src={stf.avatarUrl.startsWith("http") ? stf.avatarUrl : `http://localhost:3001${stf.avatarUrl}`}
                              alt="Avatar"
                              className="h-9 w-9 rounded-xl object-cover border border-slate-200 dark:border-zinc-800"
                            />
                          ) : (
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient} text-white text-xs font-extrabold`}>
                              {stf.firstName[0]}{stf.lastName[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-zinc-150">{fullName}</p>
                            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Manager: {stf.managerName.split(",")[0]}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 font-mono text-xs font-semibold">{stf.employeeNo}</td>
                        <td className="px-6 py-4.5">
                          <div className="text-xs">
                            <p className="font-medium">{stf.email || "N/A"}</p>
                            <p className="text-slate-400 mt-0.5">{stf.phone || "N/A"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}>
                            {stf.status}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <div className="flex items-center justify-center">
                            <ComplianceRing score={stf.complianceScore} size={40} />
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-center font-semibold text-slate-700 dark:text-zinc-300">{stf.trainingProgress} Modules</td>
                        <td className="px-6 py-4.5 text-center font-semibold text-slate-700 dark:text-zinc-300">{stf.competencyStatus}</td>
                        <td className="px-6 py-4.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenStaffProfile(stf)}
                              className="px-2.5 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-500/20 transition-all cursor-pointer"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => handleOpenEditUser("staff", stf)}
                              className="px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:text-purple-500 dark:hover:text-purple-400 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenResetPassword(stf.userId)}
                              className="p-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:text-blue-500 transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => toggleUserStatusMutation.mutate({ userId: stf.userId, status: isActive ? "INACTIVE" : "ACTIVE" })}
                              disabled={toggleUserStatusMutation.isPending}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                isActive
                                  ? "border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10"
                                  : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10"
                              }`}
                            >
                              {isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Reports & Audits */}
      {activeTab === "reports" && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-150 dark:border-zinc-800 shadow-sm print:hidden">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">Export Regulation 18 Audit Data</h2>
              <p className="text-xs text-slate-550 dark:text-zinc-400 mt-0.5">Generate compliant printouts or spreadsheets directly from database records.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 border border-slate-250 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" /> Export Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-purple-500/10 cursor-pointer"
              >
                <FileText className="h-4 w-4" /> Print PDF Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2 mb-4">
                <Clock className="h-4.5 w-4.5 text-amber-500" />
                Expiring Certificates (30 Days) ({reports.expiringCertificates.length})
              </h3>
              {reports.expiringCertificates.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No certificates expiring soon.</div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {reports.expiringCertificates.map((c: any) => (
                    <div key={c.id} className="p-3 bg-amber-500/[0.02] border border-amber-500/10 rounded-xl text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 dark:text-zinc-100">{c.title}</span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-GB") : "N/A"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">Caregiver: {c.staffName} ({c.employeeNo})</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                Overdue Trainings ({reports.overdueTraining.length})
              </h3>
              {reports.overdueTraining.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">All trainings are up to date!</div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {reports.overdueTraining.map((t: any) => (
                    <div key={t.id} className="p-3 bg-rose-500/[0.02] border border-rose-500/10 rounded-xl text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 dark:text-zinc-100">{t.title}</span>
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          EXPIRED
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">Caregiver: {t.staffName} ({t.employeeNo})</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2 mb-4">
                <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
                Failed Practical Audits ({reports.failedCompetencies.length})
              </h3>
              {reports.failedCompetencies.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No failed bedside audits.</div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {reports.failedCompetencies.map((t: any) => (
                    <div key={t.id} className="p-3 bg-red-500/[0.02] border border-red-500/10 rounded-xl text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-850 dark:text-zinc-100">{t.name}</span>
                        <span className="text-[9px] font-bold uppercase bg-red-500/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">FAIL</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">Caregiver: {t.staffName} ({t.employeeNo})</p>
                      <p className="text-[10px] text-slate-405 dark:text-zinc-500 italic mt-1 bg-zinc-950/20 p-2 rounded">{t.assessorNotes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Platform Logs */}
      {activeTab === "audit" && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-150 dark:border-zinc-800 shadow-sm overflow-hidden animate-fade-in">
          {auditLogs.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm">No operation logs recorded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-655">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Entity type</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
                  {auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/10 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-855 dark:text-zinc-150">{log.description}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block rounded bg-slate-100 dark:bg-zinc-800 text-slate-550 dark:text-zinc-400 px-2.5 py-0.5 text-xs font-bold">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-500">{log.entity}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{new Date(log.createdAt).toLocaleString("en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Staff Profile slide-out drawer (Admin View) */}
      {isStaffProfileOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex print:hidden">
          <div className="flex-1 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsStaffProfileOpen(false)} />
          <div className="flex w-full max-w-2xl flex-col overflow-hidden border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 animate-slide-left">
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-br from-purple-600/10 to-indigo-600/5 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedStaff.avatarUrl ? (
                  <img
                    src={selectedStaff.avatarUrl.startsWith("http") ? selectedStaff.avatarUrl : `http://localhost:3001${selectedStaff.avatarUrl}`}
                    alt="Avatar"
                    className="h-14 w-14 rounded-2xl object-cover border border-slate-200 dark:border-zinc-800"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-xl font-bold text-white shadow-md">
                    {selectedStaff.firstName[0]}{selectedStaff.lastName[0]}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">{selectedStaff.firstName} {selectedStaff.lastName}</h2>
                  <span className="text-xs font-bold text-slate-400 uppercase">Employee ID: {selectedStaff.employeeNo}</span>
                </div>
              </div>

              <button onClick={() => setIsStaffProfileOpen(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile body scroll */}
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 text-slate-700 dark:text-zinc-300">
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850">
                <ComplianceRing score={selectedStaff.complianceScore} size={64} />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Regulation 18 scorecard</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedStaff.complianceScore >= 90
                      ? "Full compliance: audit ready"
                      : "Action items or renewals pending"}
                  </p>
                </div>
              </div>

              {/* Personal Info Grid */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block pb-1.5 border-b border-slate-100 dark:border-zinc-850">Personal Information</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs leading-normal">
                  <div>
                    <span className="block text-slate-400 mb-0.5">Email Address</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedStaff.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-0.5">Phone Number</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedStaff.phone || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-0.5">Date of Birth</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                      {selectedStaff.dateOfBirth ? new Date(selectedStaff.dateOfBirth).toLocaleDateString("en-GB") : "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-0.5">Hire Date</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                      {selectedStaff.hireDate ? new Date(selectedStaff.hireDate).toLocaleDateString("en-GB") : "N/A"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-slate-400 mb-0.5">Home Address</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedStaff.address || "Not provided"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-slate-400 mb-0.5">Emergency Contact Details</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedStaff.emergencyContact || "Not provided"}</span>
                  </div>
                </div>
              </div>

              {/* Certificates */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block pb-1.5 border-b border-slate-100 dark:border-zinc-855">Uploaded Certificates</h4>
                {selectedStaff.certificates?.length === 0 ? (
                  <p className="text-xs italic text-slate-450">No documents uploaded to store.</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedStaff.certificates.map((cert: any) => (
                      <div key={cert.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-805 dark:text-zinc-200 truncate">{cert.title}</p>
                          <p className="text-[10px] text-slate-450 mt-0.5">Issuer: {cert.issuer} · Expiry: {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString("en-GB") : "N/A"}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {cert.fileUrl && (
                            <a
                              href={`http://localhost:3001${cert.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold hover:text-purple-500 cursor-pointer"
                              title="Download File"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-extrabold uppercase border ${
                            cert.status === "VALID"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : cert.status === "EXPIRING"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          }`}>
                            {cert.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Practical bedside audits */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block pb-1.5 border-b border-slate-100 dark:border-zinc-855">Practical Bedside Competencies</h4>
                {selectedStaff.competencies?.length === 0 ? (
                  <p className="text-xs italic text-slate-450">No practical audits performed.</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedStaff.competencies.map((comp: any) => (
                      <div key={comp.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900/50 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-805 dark:text-zinc-200">{comp.name ? comp.name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Practical Bedside Audit"}</span>
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-extrabold uppercase border ${
                            comp.level === "PASS"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          }`}>
                            {comp.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-450 mt-1">
                          <span>
                            {comp.signature && (comp.signature.startsWith("data:") || comp.signature.length > 50)
                              ? "Assessor: Verified"
                              : `Assessor: ${comp.signature || "Verified"}`}
                          </span>
                          {comp.signature && comp.signature.startsWith("data:") && (
                            <img
                              src={comp.signature}
                              alt="Signature"
                              className="h-4 max-w-[50px] object-contain rounded bg-white px-1 border border-slate-200"
                            />
                          )}
                          <span>· Date: {new Date(comp.achievedOn).toLocaleDateString("en-GB")}</span>
                        </div>
                        {comp.assessorNotes && <p className="text-[10px] text-slate-400 mt-1.5 bg-zinc-950/20 p-2 rounded italic">{comp.assessorNotes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Training Matrix Assigned courses */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block pb-1.5 border-b border-slate-100 dark:border-zinc-855">CPD E-Learning Matrix</h4>
                {selectedStaff.trainings?.length === 0 ? (
                  <p className="text-xs italic text-slate-450">No assigned courses logged.</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedStaff.trainings.map((t: any) => {
                      const isExpired = t.expiresOn && new Date(t.expiresOn) < now;
                      return (
                        <div key={t.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-855 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-850 dark:text-zinc-200">{t.title}</span>
                            <p className="text-[10px] text-slate-450 mt-0.5">Provider: {t.provider} · Compl: {new Date(t.completedOn).toLocaleDateString("en-GB")}</p>
                          </div>
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-extrabold uppercase border ${
                            isExpired
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          }`}>
                            {isExpired ? "EXPIRED" : "VALID"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Audit history logs for individual staff */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block pb-1.5 border-b border-slate-100 dark:border-zinc-855">Employee Operation Logs</h4>
                {auditLogs.filter((l: any) => l.userId === selectedStaff.userId).length === 0 ? (
                  <p className="text-xs italic text-slate-450">No operations history logged for this caregiver.</p>
                ) : (
                  <div className="space-y-2">
                    {auditLogs
                      .filter((l: any) => l.userId === selectedStaff.userId)
                      .map((log: any) => (
                        <div key={log.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-zinc-850/50 text-[11px] leading-normal flex justify-between items-start gap-4 bg-slate-50/50 dark:bg-zinc-900/30">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">{log.description}</span>
                            <span className="text-[9px] text-slate-455 block mt-0.5">{new Date(log.createdAt).toLocaleString("en-GB")}</span>
                          </div>
                          <span className="text-[8px] font-extrabold uppercase bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-slate-455 flex-shrink-0">{log.action}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password */}
      {isResetPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsResetPasswordModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-150 dark:border-zinc-800">
              <h2 className="font-bold text-slate-900 dark:text-zinc-50 text-sm flex items-center gap-2">
                <KeyRound className="h-4.5 w-4.5 text-purple-500" />
                Reset User Password
              </h2>
              <button onClick={() => setIsResetPasswordModalOpen(false)} className="text-slate-450 hover:text-slate-200 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. SecretPassword123!"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={triggerResetPassword}
                  disabled={resetPasswordMutation.isPending || !newPassword.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                >
                  {resetPasswordMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save New Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Profile */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsEditUserModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-150 dark:border-zinc-800 flex-shrink-0">
              <h2 className="font-bold text-slate-900 dark:text-zinc-50 text-sm">
                Edit {editType === "manager" ? "Manager" : "Staff"} Profile details
              </h2>
              <button onClick={() => setIsEditUserModalOpen(false)} className="text-slate-455 hover:text-slate-205 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {editType === "staff" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Home Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm(p => ({ ...p, address: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Emergency Contact Details</label>
                    <input
                      type="text"
                      value={editForm.emergencyContact}
                      onChange={(e) => setEditForm(p => ({ ...p, emergencyContact: e.target.value }))}
                      placeholder="e.g. John Doe (Husband) - 07700900121"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 text-sm text-slate-805 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-850 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editProfileMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                >
                  {editProfileMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
