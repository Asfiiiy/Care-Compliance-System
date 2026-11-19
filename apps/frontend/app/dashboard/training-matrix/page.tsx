"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Download, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Info,
  Calendar,
  Sparkles,
  ChevronRight,
  Filter,
  Printer,
  X,
  Building,
  Award,
  ShieldCheck,
  ShieldAlert,
  Send,
} from "lucide-react";
import { CqcInspectionPackModal } from "@/components/cqc/cqc-inspection-pack-modal";
import { SendWarningModal } from "@/components/compliance/send-warning-modal";
import { reportService } from "@/services/report";
import { trainingService } from "@/services/training";
import { staffService } from "@/services/staff";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Define the courses to monitor in our compliance matrix
const MANDATORY_COURSES = [
  { key: "safeguarding", label: "Safeguarding Adults", type: "elearning" },
  { key: "firesafety", label: "Fire Safety", type: "elearning" },
  { key: "infection", label: "Infection Control", type: "elearning" },
  { key: "moving", label: "Moving & Handling", type: "elearning" },
  { key: "medication_theory", label: "Medication (Theory)", type: "elearning" },
  { key: "bls", label: "Basic Life Support", type: "elearning" },
  { key: "hoist_audit", label: "Hoist Safety (Practical)", type: "competency" },
  { key: "med_audit", label: "Medication Round (Practical)", type: "competency" },
];

function ComplianceRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const color = score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex h-16 w-16 items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} strokeWidth="4" stroke="transparent" className="stroke-slate-200 dark:stroke-zinc-800" fill="none" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          strokeWidth="4"
          stroke={color}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="text-xs font-bold" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

function getComplianceScore(staff: any): number {
  const trainings = staff.trainings || [];
  const competencies = staff.competencies || [];
  const certs = staff.certificates || [];
  const now = new Date();

  const allItems = [...trainings, ...certs];
  if (allItems.length === 0 && competencies.length === 0) return 100;

  const validTrainings = allItems.filter(
    (t: any) => !(t.expiresOn || t.expiryDate) || new Date(t.expiresOn || t.expiryDate) > now
  ).length;

  const passedComps = competencies.filter(
    (c: any) => c.level === "PASS"
  ).length;

  const total = allItems.length + competencies.length;
  if (total === 0) return 100;

  return Math.round(((validTrainings + passedComps) / total) * 100);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TrainingMatrixPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrg, setFilterOrg] = useState("all");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCqcPackOpen, setIsCqcPackOpen] = useState(false);
  const [warningModalData, setWarningModalData] = useState<{
    isOpen: boolean;
    staff: any;
    courseTitle: string;
    expiryDate: string;
    statusType: "EXPIRED" | "EXPIRING";
  }>({
    isOpen: false,
    staff: null,
    courseTitle: "",
    expiryDate: "",
    statusType: "EXPIRING",
  });
  const [newTraining, setNewTraining] = useState({
    staffId: "",
    title: "",
    provider: "",
    completedOn: "",
    expiresOn: "",
  });

  const isAdmin = user?.role === "ADMIN";

  // Fetch Organizations (admin only)
  const { data: orgsRes } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get("/users/organizations").then((res) => res.data),
    enabled: !!user && isAdmin,
  });

  const organizations = orgsRes?.data || [];

  // Fetch Staff Report containing all staff, training, and competencies
  const { data: staffReportRes, isLoading } = useQuery({
    queryKey: ["staffComplianceReport", filterOrg, includeInactive],
    queryFn: () =>
      reportService.getStaffReport({
        limit: 100,
        organizationId: filterOrg === "all" ? undefined : filterOrg,
        includeInactive: includeInactive ? "true" : "false",
      }),
    enabled: !!user,
  });

  // Add Training Mutation
  const addTrainingMutation = useMutation({
    mutationFn: (payload: any) => trainingService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffComplianceReport"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      toast.success("Training record logged successfully");
      setIsModalOpen(false);
      setNewTraining({ staffId: "", title: "", provider: "", completedOn: "", expiresOn: "" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log training");
    },
  });

  const staffList = staffReportRes?.data?.data?.data || [];

  // Filtering staff
  const filteredStaffList = staffList.filter((staff: any) => {
    const fullName = `${staff.firstName} ${staff.lastName}`.toLowerCase();
    const empNo = staff.employeeNo.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || empNo.includes(searchTerm.toLowerCase());
  });

  // Helper to determine training cell status
  const getCellStatus = (staff: any, course: typeof MANDATORY_COURSES[0]) => {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    if (course.type === "elearning") {
      // Find matching completed training module
      const trainings = staff?.trainings || [];
      const matched = trainings.find((t: any) => 
        t.title?.toLowerCase().includes(course.label.toLowerCase().split(" ")[0]) || 
        t.title?.toLowerCase().includes(course.key.split("_")[0])
      );

      if (!matched) {
        return { status: "missing", label: "Not Done", date: null };
      }

      const expiry = matched.expiresOn ? new Date(matched.expiresOn) : null;
      if (expiry) {
        if (expiry < today) {
          return { status: "expired", label: "Expired", date: matched.completedOn, expiry: matched.expiresOn };
        }
        if (expiry <= next30Days) {
          return { status: "expiring", label: "Expiring", date: matched.completedOn, expiry: matched.expiresOn };
        }
      }

      return { status: "valid", label: "Valid", date: matched.completedOn, expiry: matched.expiresOn };
    } else {
      // Find matching practical competency audit
      const competencies = staff?.competencies || [];
      const matched = competencies.find((c: any) => 
        c.name?.toLowerCase().includes(course.label.toLowerCase().split(" ")[0]) ||
        c.name?.toLowerCase().includes(course.key.split("_")[0])
      );

      if (!matched) {
        return { status: "missing", label: "No Audit", date: null };
      }

      if (matched.level === "FAIL") {
        return { status: "expired", label: "FAILED", date: matched.achievedOn };
      }

      const expiry = matched.expiresOn ? new Date(matched.expiresOn) : null;
      if (expiry) {
        if (expiry < today) {
          return { status: "expired", label: "Expired", date: matched.achievedOn, expiry: matched.expiresOn };
        }
        if (expiry <= next30Days) {
          return { status: "expiring", label: "Review", date: matched.achievedOn, expiry: matched.expiresOn };
        }
      }

      return { status: "valid", label: "PASSED", date: matched.achievedOn, expiry: matched.expiresOn };
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "expiring":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20";
      case "expired":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 border-transparent";
    }
  };

  // Export Matrix to CSV file
  const handleExportCSV = () => {
    if (staffList.length === 0) return;

    let csvContent = "Employee No,Staff Name,Email,Role,";
    csvContent += MANDATORY_COURSES.map(c => c.label).join(",") + "\n";

    staffList.forEach((staff: any) => {
      const name = `${staff.firstName} ${staff.lastName}`;
      const email = staff.user?.email || "";
      const role = staff.user?.role || "STAFF";
      
      let row = `"${staff.employeeNo}","${name}","${email}","${role}",`;
      
      const courseStatuses = MANDATORY_COURSES.map(c => {
        const cell = getCellStatus(staff, c);
        return cell.label;
      });

      row += courseStatuses.join(",") + "\n";
      csvContent += row;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `care_compliance_matrix_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraining.staffId || !newTraining.title || !newTraining.completedOn) {
      toast.error("Please fill in all required fields");
      return;
    }

    addTrainingMutation.mutate({
      ...newTraining,
      completedOn: new Date(newTraining.completedOn).toISOString(),
      expiresOn: newTraining.expiresOn ? new Date(newTraining.expiresOn).toISOString() : null,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Staff Training Matrix</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Cross-check e-learning completions against practical competency checklists</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCqcPackOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-md shadow-emerald-900/20 transition-all cursor-pointer border border-emerald-400/30"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Generate CQC Audit Pack</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-xs px-3.5 py-2.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-xs px-3.5 py-2.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-secondary text-foreground font-semibold text-xs px-3.5 py-2.5 rounded-lg shadow-sm hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Log Training
            </button>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 no-print">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center w-full md:max-w-2xl">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by staff name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border-slate-200 dark:border-zinc-800"
              />
            </div>
            {isAdmin && (
              <>
                <select
                  value={filterOrg}
                  onChange={(e) => setFilterOrg(e.target.value)}
                  className="w-full md:w-56 h-10 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Care Homes</option>
                  {organizations.map((org: any) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2 flex-shrink-0">
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
          </div>
          <div className="flex gap-2 text-xs text-slate-500 items-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Valid
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              Expiring
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 text-rose-600 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              Expired / Overdue
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid Card */}
      <Card id="print-area" className="shadow-md border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto"></div>
              <p className="text-xs text-slate-500 mt-3 font-medium">Assembling Training Matrix...</p>
            </div>
          ) : filteredStaffList.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              No staff members found matching search query.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
                  <th className="py-4 px-6 font-semibold text-xs tracking-wider uppercase sticky left-0 bg-slate-900 z-10 w-64 shadow-md">
                    Care Staff Name
                  </th>
                  {MANDATORY_COURSES.map((course) => (
                    <th key={course.key} className="py-4 px-4 font-semibold text-[10px] tracking-wider uppercase text-center max-w-[120px] leading-tight">
                      {course.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredStaffList.map((staff: any) => (
                  <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    {/* Sticky Name Col */}
                    <td className="py-4 px-6 font-semibold text-sm text-slate-800 dark:text-zinc-200 sticky left-0 bg-white dark:bg-zinc-900 border-r border-slate-100 dark:border-zinc-800 flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-zinc-300">
                        {staff.firstName[0]}{staff.lastName[0]}
                      </div>
                      <div className="truncate">
                        <button
                          onClick={() => setSelectedStaff(staff)}
                          className="font-semibold text-sm text-slate-800 dark:text-zinc-200 hover:text-emerald-600 hover:underline text-left cursor-pointer focus:outline-none"
                        >
                          {staff.firstName} {staff.lastName}
                        </button>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{staff.employeeNo}</p>
                      </div>
                    </td>
                    {/* Matrix Status Cells */}
                    {MANDATORY_COURSES.map((course) => {
                      const cell = getCellStatus(staff, course);
                      return (
                        <td key={course.key} className="py-4 px-2 text-center align-middle">
                          <div className={`mx-auto inline-flex flex-col items-center justify-center px-2 py-1.5 rounded-lg border text-[10px] font-bold tracking-wide w-28 text-center ${getStatusBadgeStyles(cell.status)}`}>
                            {cell.label}
                            {cell.expiry && (
                              <span className="text-[8px] opacity-75 font-normal mt-0.5 block">
                                Ex: {new Date(cell.expiry).toLocaleDateString("en-GB", { month: "2-digit", year: "2-digit" })}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Log Training Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center no-print">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <Card className="w-full max-w-md relative z-10 shadow-2xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Record Training Completion</CardTitle>
              <CardDescription>Manually register an e-learning module or external certificate.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">Select Care Staff *</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 p-2.5 text-sm bg-transparent dark:text-white"
                    value={newTraining.staffId}
                    onChange={(e) => setNewTraining({ ...newTraining, staffId: e.target.value })}
                    required
                  >
                    <option value="" disabled className="dark:bg-zinc-900">-- Choose staff member --</option>
                    {staffList.map((s: any) => (
                      <option key={s.id} value={s.id} className="dark:bg-zinc-900">
                        {s.firstName} {s.lastName} ({s.employeeNo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">Training Title / Course *</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 p-2.5 text-sm bg-transparent dark:text-white"
                    value={newTraining.title}
                    onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
                    required
                  >
                    <option value="" disabled className="dark:bg-zinc-900">-- Select Course --</option>
                    <option value="Safeguarding Adults (Level 2)" className="dark:bg-zinc-900">Safeguarding Adults (Level 2)</option>
                    <option value="Fire Safety Awareness" className="dark:bg-zinc-900">Fire Safety Awareness</option>
                    <option value="Infection Prevention & Control" className="dark:bg-zinc-900">Infection Prevention & Control</option>
                    <option value="Moving & Handling Theory" className="dark:bg-zinc-900">Moving & Handling Theory</option>
                    <option value="Medication Administration (E-Learning)" className="dark:bg-zinc-900">Medication Administration (E-Learning)</option>
                    <option value="Basic Life Support (BLS)" className="dark:bg-zinc-900">Basic Life Support (BLS)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">Training Provider *</label>
                  <Input
                    placeholder="e.g. Blue Stream Academy"
                    value={newTraining.provider}
                    onChange={(e) => setNewTraining({ ...newTraining, provider: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">Completed Date *</label>
                    <Input
                      type="date"
                      value={newTraining.completedOn}
                      onChange={(e) => setNewTraining({ ...newTraining, completedOn: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">Expiry Date</label>
                    <Input
                      type="date"
                      value={newTraining.expiresOn}
                      onChange={(e) => setNewTraining({ ...newTraining, expiresOn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addTrainingMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    {addTrainingMutation.isPending ? "Logging..." : "Save Record"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sidebar Details Drawer */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex no-print">
          <div className="flex-1 bg-slate-950/70 backdrop-blur-sm" onClick={() => setSelectedStaff(null)} />
          <div className="flex w-full max-w-md flex-col overflow-hidden border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 animate-slide-left">
            <div className="border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-br from-emerald-600/10 to-teal-600/5 px-6 py-5">
              <div className="mb-4 flex items-start justify-between">
                {selectedStaff.avatarUrl ? (
                  <img
                    src={selectedStaff.avatarUrl.startsWith("http") ? selectedStaff.avatarUrl : `http://localhost:3001${selectedStaff.avatarUrl}`}
                    alt="Avatar"
                    className="h-16 w-16 rounded-2xl object-cover border border-slate-200 dark:border-zinc-800"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-650 to-teal-600 text-xl font-bold text-white shadow-md">
                    {getInitials(`${selectedStaff.firstName} ${selectedStaff.lastName}`)}
                  </div>
                )}

                <button onClick={() => setSelectedStaff(null)} className="text-slate-400 hover:text-slate-650 cursor-pointer p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h2 className="text-lg font-extrabold text-slate-900 dark:text-zinc-50">
                {selectedStaff.firstName} {selectedStaff.lastName}
              </h2>
              <div className="flex gap-2 mt-1">
                <span className="text-xs font-semibold text-slate-500">{selectedStaff.user?.email}</span>
                <span className="text-xs font-bold text-slate-400">·</span>
                <span className="text-xs font-bold text-slate-550 uppercase text-emerald-600">{selectedStaff.user?.role || "STAFF"}</span>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {/* Compliance Ring */}
              <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850">
                <div className="flex items-center gap-4">
                  <ComplianceRing score={getComplianceScore(selectedStaff)} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Regulation 18 Scorecard</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getComplianceScore(selectedStaff) >= 90 ? "Excellent CQC readiness" : "Outstanding requirements pending"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const score = getComplianceScore(selectedStaff);
                    setWarningModalData({
                      isOpen: true,
                      staff: selectedStaff,
                      courseTitle: "Mandatory CQC Training Matrix Compliance",
                      expiryDate: new Date().toISOString().split("T")[0],
                      statusType: score < 80 ? "EXPIRED" : "EXPIRING",
                    });
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer flex-shrink-0"
                  title="Dispatch 3-channel compliance notice"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Notice
                </button>
              </div>

              {/* Personal Info */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Personal Info</h4>
                <div className="grid grid-cols-2 gap-3 text-xs leading-normal">
                  <div>
                    <span className="block text-slate-400">Phone</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedStaff.phone || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Hire Date</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                      {selectedStaff.hireDate ? new Date(selectedStaff.hireDate).toLocaleDateString("en-GB") : "Not set"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-slate-400">Home Address</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedStaff.address || "Not provided"}</span>
                  </div>
                </div>
              </div>

              {/* Compliance checklist details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Matrix Status Checklist</h4>
                <div className="space-y-2">
                  {MANDATORY_COURSES.map((course) => {
                    const cell = getCellStatus(selectedStaff, course);
                    const isExp = cell.status === "expired";
                    const isExpiring = cell.status === "expiring";
                    return (
                      <div key={course.key} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/60 bg-slate-50 dark:bg-zinc-900 text-xs">
                        <span className="font-bold text-slate-800 dark:text-zinc-300">{course.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              cell.status === "valid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                              cell.status === "expiring" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                              "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            }`}>
                              {cell.label}
                            </span>
                            {cell.expiry && (
                              <span className="text-[8px] text-slate-400 mt-0.5">
                                Expires: {new Date(cell.expiry).toLocaleDateString("en-GB")}
                              </span>
                            )}
                          </div>
                          {(isExp || isExpiring) && (
                            <button
                              onClick={() => {
                                setWarningModalData({
                                  isOpen: true,
                                  staff: selectedStaff,
                                  courseTitle: course.label,
                                  expiryDate: cell.expiry ? new Date(cell.expiry).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                                  statusType: isExp ? "EXPIRED" : "EXPIRING",
                                });
                              }}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-500 text-slate-600 dark:text-zinc-400 transition-colors cursor-pointer"
                              title="Send Warning Notice to Staff"
                            >
                              <Send className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Certificates list from store */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Certificate Store ({selectedStaff.certificates?.length || 0})</h4>
                {selectedStaff.certificates?.length === 0 ? (
                  <p className="text-xs italic text-slate-500">No certificates uploaded to store.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedStaff.certificates?.map((c: any) => {
                      const isExp = c.status === "EXPIRED" || (c.expiryDate && new Date(c.expiryDate) < new Date());
                      const isExpiring = c.status === "EXPIRING";
                      return (
                        <div key={c.id} className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800/60 bg-slate-50 dark:bg-zinc-900 space-y-1.5 text-xs">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-800 dark:text-zinc-200">{c.title}</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                c.status === "VALID" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                c.status === "EXPIRING" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              }`}>
                                {c.status}
                              </span>
                              {(isExp || isExpiring) && (
                                <button
                                  onClick={() => {
                                    setWarningModalData({
                                      isOpen: true,
                                      staff: selectedStaff,
                                      courseTitle: c.title,
                                      expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                                      statusType: isExp ? "EXPIRED" : "EXPIRING",
                                    });
                                  }}
                                  className="p-1 rounded bg-slate-200 dark:bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-500 text-slate-600 dark:text-zinc-400 transition-colors cursor-pointer"
                                  title="Send Warning Notice to Staff"
                                >
                                  <Send className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                            <div>Issuer: <span className="font-semibold text-slate-600 dark:text-zinc-300">{c.issuer}</span></div>
                            <div>No: <span className="font-semibold text-slate-600 dark:text-zinc-300">{c.certificateNo}</span></div>
                          </div>
                          {c.fileUrl && (
                            <div className="pt-1.5 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                              <a
                                href={c.fileUrl.startsWith("http") ? c.fileUrl : `http://localhost:3001${c.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-600 font-extrabold hover:underline flex items-center gap-1"
                              >
                                View Document &rarr;
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Print Media */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          /* Hide sidebar, layout header, page borders, and zoom the main card to fit full page */
          nav, aside, header, footer, .sidebar-layout-header {
            display: none !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            font-size: 9px !important;
          }
          th {
            background-color: #f2f2f2 !important;
            color: black !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* CQC Regulation 18 Inspection Pack Modal */}
      <CqcInspectionPackModal
        isOpen={isCqcPackOpen}
        onClose={() => setIsCqcPackOpen(false)}
        organizationId={filterOrg === "all" ? undefined : filterOrg}
      />

      {/* 3-Channel CQC Compliance Warning Modal */}
      {warningModalData.isOpen && (
        <SendWarningModal
          isOpen={warningModalData.isOpen}
          onClose={() => setWarningModalData(prev => ({ ...prev, isOpen: false }))}
          staff={warningModalData.staff}
          courseTitle={warningModalData.courseTitle}
          expiryDate={warningModalData.expiryDate}
          statusType={warningModalData.statusType}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["staffComplianceReport"] });
          }}
        />
      )}
    </div>
  );
}
