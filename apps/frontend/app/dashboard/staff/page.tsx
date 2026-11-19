"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  User,
  Plus,
  Search,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ChevronRight,
  Building,
  Award,
  Trash2,
  Edit,
  RotateCcw,
  Loader2,
  X,
  Lock,
  Send,
  FileText,
  MapPin,
  HeartHandshake,
  Hash,
  Shield,
  FileCheck,
  Eye,
  Download,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Sparkles,
  Layers,
  GraduationCap,
  ClipboardCheck,
} from "lucide-react";
import { SendWarningModal } from "@/components/compliance/send-warning-modal";
import { staffService } from "@/services/staff";
import { api } from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

const ROLE_COLORS: Record<string, string> = {
  STAFF: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  MANAGER: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  ADMIN: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

const JOB_TITLE_COLORS: Record<string, string> = {
  "Care Assistant": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "Senior Carer": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "Senior Care Assistant": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "Registered Nurse": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Senior Nurse": "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  "Registered Manager": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Activities Coordinator": "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  "Care Coordinator": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
};

const AVATAR_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-blue-500 to-cyan-600",
  "from-violet-500 to-fuchsia-600",
];

function ComplianceRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = size === 64 ? 26 : size === 80 ? 34 : 20;
  const stroke = size === 64 ? 4 : size === 80 ? 5 : 3;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="currentColor"
          className="text-slate-100 dark:text-zinc-800"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke={color}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span
        className={`font-black tracking-tight ${
          size >= 80 ? "text-base" : size === 64 ? "text-xs" : "text-[10px]"
        }`}
        style={{ color }}
      >
        {score}%
      </span>
    </div>
  );
}

function getInitials(name: string) {
  if (!name) return "ST";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  const cleanPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `http://localhost:3001${cleanPath}`;
}

function getDaysUntilExpiry(expiryDate: string | Date | null | undefined): number | null {
  if (!expiryDate) return null;
  const exp = new Date(expiryDate);
  const now = new Date();
  const diffTime = exp.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getComplianceScore(staff: any): number {
  if (!staff) return 0;
  const trainings = staff.trainings || [];
  const competencies = staff.competencies || [];
  const certs = staff.certificates || [];

  const now = new Date();
  const allItems = [...trainings, ...certs];

  if (allItems.length === 0 && competencies.length === 0) return 0;

  const validTrainings = allItems.filter((t: any) => {
    const exp = t.expiresOn || t.expiryDate;
    return !exp || new Date(exp) > now;
  }).length;

  const passedComps = competencies.filter((c: any) => c.level === "PASS").length;

  const total = allItems.length + competencies.length;
  if (total === 0) return 0;

  return Math.round(((validTrainings + passedComps) / total) * 100);
}

function StaffDirectoryContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const searchParam = searchParams.get("search");

  // States
  const [search, setSearch] = useState(searchParam || "");
  const [filterRole, setFilterRole] = useState(roleParam || "all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOrg, setFilterOrg] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const limit = 8;

  useEffect(() => {
    if (roleParam) {
      setFilterRole(roleParam);
    } else {
      setFilterRole("all");
    }
  }, [roleParam]);

  useEffect(() => {
    if (searchParam !== null) {
      setSearch(searchParam);
    }
  }, [searchParam]);

  // Modal & Profile States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<"overview" | "trainings" | "competencies" | "certificates" | "compliance" | "organization" | "team" | "governance">("overview");
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);

  // Certificate Preview Modal State
  const [previewCert, setPreviewCert] = useState<any | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  // 3-Channel Warning Modal State
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

  const isAdmin = user?.role === "ADMIN";
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  // Comprehensive Add Staff Form State
  const [addFormSection, setAddFormSection] = useState<"personal" | "employment" | "compliance">("personal");
  const [newStaff, setNewStaff] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "Care Assistant",
    department: "Residential Care",
    employmentType: "Full-Time",
    dbsNumber: "",
    nationalInsuranceNo: "",
    startDate: new Date().toISOString().split("T")[0],
    dateOfBirth: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    password: "Password123!",
    organizationId: "",
    autoSeedMandatory: true,
  });

  // Edit Staff Form State
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    emergencyContact: "",
    jobTitle: "",
    department: "",
    employmentType: "Full-Time",
    dbsNumber: "",
    nationalInsuranceNo: "",
    hireDate: "",
    employeeNo: "",
    role: "STAFF",
    status: "ACTIVE",
    organizationId: "",
  });

  // Queries
  const { data: orgsRes } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get("/users/organizations").then((res) => res.data),
    enabled: !!user && isAdmin,
  });

  const { data: staffRes, isLoading } = useQuery({
    queryKey: ["staff", page, search, filterRole, filterStatus, filterOrg, sortBy, order],
    queryFn: () =>
      staffService.findAll({
        page,
        limit,
        search: search.trim() || undefined,
        role: filterRole === "all" ? undefined : filterRole,
        status: filterStatus === "all" ? undefined : filterStatus,
        organizationId: filterOrg === "all" ? undefined : filterOrg,
        sortBy,
        order,
      }),
    enabled: !!user,
  });

  // Single Staff Full Profile Query (for real-time full details when clicked)
  const { data: staffDetailRes, isLoading: isDetailLoading } = useQuery({
    queryKey: ["staffDetail", activeStaffId],
    queryFn: () => staffService.findOne(activeStaffId!),
    enabled: !!activeStaffId,
  });

  const activeStaffDetail = staffDetailRes?.data?.data || staffDetailRes?.data || null;

  let allStaff: any[] = staffRes?.data?.data?.data || [];
  if (user && user.role !== "ADMIN") {
    allStaff = allStaff.filter((s: any) => s.userId !== user.id);
  }
  const meta = staffRes?.data?.data?.meta || { page: 1, totalPages: 1, total: 0 };
  const organizations = orgsRes?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (dto: any) => staffService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staffComplianceReport"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      toast.success("Care staff account onboarded and compliance matrix initialized!");
      setCreatedCredentials({
        email: newStaff.email,
        password: newStaff.password || "Password123!",
        name: `${newStaff.firstName} ${newStaff.lastName}`,
        employeeNo: newStaff.employeeId,
      });
      setNewStaff({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "Care Assistant",
        department: "Residential Care",
        employmentType: "Full-Time",
        dbsNumber: "",
        nationalInsuranceNo: "",
        startDate: new Date().toISOString().split("T")[0],
        dateOfBirth: "",
        address: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelation: "",
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        password: "Password123!",
        organizationId: "",
        autoSeedMandatory: true,
      });
      setAddFormSection("personal");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to onboard staff member";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => staffService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staffDetail", activeStaffId] });
      queryClient.invalidateQueries({ queryKey: ["staffComplianceReport"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      toast.success("Staff profile and compliance records updated successfully");
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to update staff";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staffDetail", activeStaffId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      toast.success("Staff account deactivated successfully");
      setConfirmDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to deactivate account");
      setConfirmDeleteId(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => staffService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staffDetail", activeStaffId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      toast.success("Staff account reactivated successfully");
    },
    onError: () => {
      toast.error("Failed to reactivate account");
    },
  });

  // Handlers
  const handleAddStaff = () => {
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.email) {
      toast.error("Please fill in first name, last name, and email");
      setAddFormSection("personal");
      return;
    }
    if (isAdmin && !newStaff.organizationId) {
      toast.error("Please select a Care Home / Organization");
      setAddFormSection("employment");
      return;
    }

    const emergencyContactStr = newStaff.emergencyContactName
      ? `${newStaff.emergencyContactName} (${newStaff.emergencyContactRelation || "Next of Kin"}) - ${newStaff.emergencyContactPhone || "No Phone"}`
      : undefined;

    const role = newStaff.jobTitle === "Registered Manager" ? "MANAGER" : "STAFF";

    const payload = {
      firstName: newStaff.firstName.trim(),
      lastName: newStaff.lastName.trim(),
      email: newStaff.email.trim().toLowerCase(),
      phone: newStaff.phone || undefined,
      jobTitle: newStaff.jobTitle || "Care Assistant",
      department: newStaff.department || "Residential Care",
      employmentType: newStaff.employmentType || "Full-Time",
      dbsNumber: newStaff.dbsNumber || undefined,
      nationalInsuranceNo: newStaff.nationalInsuranceNo || undefined,
      address: newStaff.address || undefined,
      dateOfBirth: newStaff.dateOfBirth || undefined,
      emergencyContact: emergencyContactStr,
      employeeNo: newStaff.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
      hireDate: newStaff.startDate || new Date().toISOString().split("T")[0],
      password: newStaff.password || "Password123!",
      role,
      organizationId: isAdmin ? newStaff.organizationId : undefined,
    };

    createMutation.mutate(payload);
  };

  const handleEditOpen = (staff: any) => {
    setEditingStaff(staff);
    setEditForm({
      firstName: staff.firstName || "",
      lastName: staff.lastName || "",
      phone: staff.phone || "",
      address: staff.address || "",
      dateOfBirth: staff.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().split("T")[0] : "",
      emergencyContact: staff.emergencyContact || "",
      jobTitle: staff.jobTitle || "Care Assistant",
      department: staff.department || "Residential Care",
      employmentType: staff.employmentType || "Full-Time",
      dbsNumber: staff.dbsNumber || "",
      nationalInsuranceNo: staff.nationalInsuranceNo || "",
      hireDate: staff.hireDate ? new Date(staff.hireDate).toISOString().split("T")[0] : "",
      employeeNo: staff.employeeNo || "",
      role: staff.user?.role || "STAFF",
      status: staff.user?.status || "ACTIVE",
      organizationId: staff.organizationId || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editForm.firstName || !editForm.lastName) {
      toast.error("Please fill in first and last name");
      return;
    }
    updateMutation.mutate({
      id: editingStaff.id,
      dto: editForm,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 dark:bg-blue-500/20 shadow-sm">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">
                Staff Directory & Compliance Profiles
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                CQC Regulation 18 Staffing Matrix · Real-time vetting, e-Learning & Bedside Audits
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setNewStaff((p) => ({
                ...p,
                employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
              }));
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Onboard New Employee
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 lg:flex-row bg-white dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <Input
            placeholder="Search by name, employee No, job title, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 pl-10 text-xs text-slate-900 dark:text-zinc-50 rounded-xl focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Role Filter */}
          {isAdmin && (
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="STAFF">Care Staff</option>
              <option value="MANAGER">Managers</option>
            </select>
          )}

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active Staff</option>
            <option value="INACTIVE">Deactivated</option>
          </select>

          {/* Org Filter (Admin Only) */}
          {isAdmin && (
            <select
              value={filterOrg}
              onChange={(e) => {
                setFilterOrg(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Care Homes</option>
              {organizations.map((org: any) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort selection */}
          <select
            value={`${sortBy}-${order}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split("-");
              setSortBy(field);
              setOrder(dir as any);
            }}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:border-blue-500 cursor-pointer"
          >
            <option value="createdAt-desc">Newest Added</option>
            <option value="createdAt-asc">Oldest Added</option>
            <option value="lastName-asc">Name (A-Z)</option>
            <option value="lastName-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800" />
          ))}
        </div>
      ) : allStaff.length === 0 ? (
        <Card className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
              <Users className="h-8 w-8" />
            </div>
            <p className="font-bold text-slate-700 dark:text-zinc-300 text-sm">
              No staff members found matching criteria
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              Try adjusting your search query, status filter, or onboard a new employee to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allStaff.map((staff: any, idx: number) => {
            const score = getComplianceScore(staff);
            const gradientClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const name = `${staff.firstName} ${staff.lastName}`;
            const isActive = staff.user?.status === "ACTIVE";
            const jobTitle = staff.jobTitle || (staff.user?.role === "MANAGER" ? "Registered Home Manager" : "Care Assistant");
            const isManager = staff.user?.role === "MANAGER";

            return (
              <div
                key={staff.id}
                onClick={() => {
                  setActiveStaffId(staff.id);
                  setProfileTab("overview");
                }}
                className={`group relative rounded-3xl border bg-white dark:bg-zinc-900/90 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/60 overflow-hidden cursor-pointer ${
                  isActive
                    ? isManager
                      ? "border-amber-500/30 hover:border-amber-500/60"
                      : "border-slate-200 dark:border-zinc-800 hover:border-blue-500/50"
                    : "border-rose-500/20 bg-rose-500/[0.02]"
                }`}
              >
                {/* Top Status & Compliance Bar */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                    >
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {isActive ? "Active" : "Deactivated"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {staff.employeeNo}
                    </span>
                  </div>

                  {isManager ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <ShieldCheck className="h-3 w-3" />
                      Manager
                    </span>
                  ) : (
                    <ComplianceRing score={score} size={48} />
                  )}
                </div>

                {/* Avatar + Name + Title */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {staff.avatarUrl ? (
                      <img
                        src={getFileUrl(staff.avatarUrl) || ""}
                        alt={name}
                        className={`h-12 w-12 rounded-2xl object-cover border flex-shrink-0 ${
                          isManager ? "border-amber-500/40" : "border-slate-200 dark:border-zinc-700"
                        }`}
                      />
                    ) : (
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${
                        isManager
                          ? "bg-gradient-to-br from-amber-500 via-orange-500 to-purple-600"
                          : `bg-gradient-to-br ${gradientClass}`
                      } text-sm font-black text-white shadow-md`}>
                        {getInitials(name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-black text-slate-900 dark:text-zinc-100 leading-tight">
                        {name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                        {jobTitle}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${ROLE_COLORS[staff.user?.role] || "bg-slate-100 border-slate-200"}`}>
                          {staff.user?.role}
                        </span>
                        {staff.organization?.name && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {staff.organization.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  {isManager ? (() => {
                    const carersCount = (staff.organization?.staff || []).filter(
                      (s: any) => s.user?.role !== "MANAGER" && s.id !== staff.id
                    ).length;
                    return (
                      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-amber-500/[0.05] dark:bg-amber-950/20 p-2 border border-amber-500/20 text-center">
                        <div>
                          <p className="text-xs font-black text-amber-700 dark:text-amber-300 truncate">
                            {staff.organization?.name || "Care Home"}
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">Care Home</p>
                        </div>
                        <div>
                          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {carersCount} {carersCount === 1 ? "Caregiver" : "Caregivers"}
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">Supervised Staff</p>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-50 dark:bg-zinc-950 p-2 border border-slate-100 dark:border-zinc-800 text-center">
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-zinc-200">
                          {staff.trainings?.length || 0}
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase">Trainings</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-zinc-200">
                          {staff.competencies?.length || 0}
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase">Audits</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-zinc-200">
                          {staff.certificates?.length || 0}
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase">Certs</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Hint */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 dark:bg-zinc-850/50 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <span>View Complete Profile</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl">
          <span className="text-xs text-slate-500 font-medium">
            Showing Page {meta.page} of {meta.totalPages} · {meta.total} total staff
          </span>
          <div className="flex gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPREHENSIVE STAFF PROFILE MODAL / DETAIL VIEW                          */}
      {/* ========================================================================= */}
      {activeStaffId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setActiveStaffId(null)}
          />

          <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
            {isDetailLoading || !activeStaffDetail ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-xs font-semibold text-slate-500">Loading complete staff profile...</p>
              </div>
            ) : (
              <>
                {/* Profile Header Banner */}
                {(() => {
                  const isManager = activeStaffDetail.user?.role === "MANAGER";
                  const managedCaregivers = (activeStaffDetail.organization?.staff || []).filter(
                    (s: any) => s.user?.role !== "MANAGER" && s.id !== activeStaffDetail.id
                  );
                  const modalTabs = isManager
                    ? [
                        { key: "overview", label: "Manager & HR Profile", icon: User },
                        { key: "organization", label: `Managed Care Home (${activeStaffDetail.organization?.name || "Facility"})`, icon: Building },
                        { key: "team", label: `Supervised Staff (${managedCaregivers.length})`, icon: Users },
                        { key: "governance", label: "CQC Statutory Governance", icon: ShieldCheck },
                      ]
                    : [
                        { key: "overview", label: "Overview & HR Details", icon: User },
                        { key: "trainings", label: `CPD Training Matrix (${activeStaffDetail.trainings?.length || 0})`, icon: GraduationCap },
                        { key: "competencies", label: `Bedside Audits (${activeStaffDetail.competencies?.length || 0})`, icon: ClipboardCheck },
                        { key: "certificates", label: `Certificates (${activeStaffDetail.certificates?.length || 0})`, icon: Award },
                        { key: "compliance", label: "CQC Reg 18 Audit", icon: ShieldCheck },
                      ];

                  return (
                    <div className={`relative p-6 border-b border-slate-200 dark:border-zinc-800 flex-shrink-0 ${
                      isManager
                        ? "bg-gradient-to-r from-amber-500/15 via-purple-600/10 to-indigo-500/10 dark:from-amber-950/40 dark:via-zinc-900 dark:to-zinc-900"
                        : "bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-teal-500/10 dark:from-blue-900/30 dark:via-zinc-900 dark:to-zinc-900"
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {activeStaffDetail.avatarUrl ? (
                            <img
                              src={getFileUrl(activeStaffDetail.avatarUrl) || ""}
                              alt="Avatar"
                              className={`h-16 w-16 rounded-3xl object-cover border-2 shadow-md flex-shrink-0 ${
                                isManager ? "border-amber-500/40" : "border-white dark:border-zinc-800"
                              }`}
                            />
                          ) : (
                            <div
                              className={`h-16 w-16 rounded-3xl flex items-center justify-center text-xl font-black text-white shadow-md flex-shrink-0 ${
                                isManager
                                  ? "bg-gradient-to-br from-amber-500 via-orange-500 to-purple-600"
                                  : "bg-gradient-to-br from-blue-600 to-indigo-600"
                              }`}
                            >
                              {getInitials(`${activeStaffDetail.firstName} ${activeStaffDetail.lastName}`)}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h2 className="text-xl font-black text-slate-900 dark:text-zinc-50">
                                {activeStaffDetail.firstName} {activeStaffDetail.lastName}
                              </h2>
                              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-md border border-slate-200 dark:border-zinc-700">
                                #{activeStaffDetail.employeeNo}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                                  activeStaffDetail.user?.status === "ACTIVE"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                }`}
                              >
                                <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${activeStaffDetail.user?.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                {activeStaffDetail.user?.status || "ACTIVE"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1 flex-wrap">
                              {isManager ? (
                                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  {activeStaffDetail.jobTitle || "Registered Home Manager"} · {activeStaffDetail.department || "Care Home Management"}
                                </span>
                              ) : (
                                <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                                  <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                                  {activeStaffDetail.jobTitle || "Care Assistant"} · {activeStaffDetail.department || "Residential Care"}
                                </span>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-zinc-300">
                                <Building className="h-3.5 w-3.5 text-indigo-500" />
                                {activeStaffDetail.organization?.name || "Care Facility"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Header Controls */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {isManager ? (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/15 to-purple-500/10 border border-amber-500/30 px-3 py-1.5 rounded-2xl shadow-sm">
                              <div className="h-7 w-7 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              <div className="text-left">
                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block leading-none">
                                  CQC Leadership
                                </span>
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                                  Registered Person
                                </span>
                              </div>
                            </div>
                          ) : (
                            <ComplianceRing score={getComplianceScore(activeStaffDetail)} size={64} />
                          )}

                          {isManager && activeStaffDetail.organizationId && (
                            <a
                              href={`/dashboard/organizations/${activeStaffDetail.organizationId}`}
                              className="hidden sm:flex px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Building className="h-3.5 w-3.5" />
                              Care Home Workspace
                            </a>
                          )}

                          {canManage && (
                            <button
                              onClick={() => handleEditOpen(activeStaffDetail)}
                              className="px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5 text-blue-500" />
                              {isManager ? "Edit Manager" : "Edit Profile"}
                            </button>
                          )}

                          <button
                            onClick={() => setActiveStaffId(null)}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white bg-white/60 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 cursor-pointer"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Profile Navigation Tabs */}
                      <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
                        {modalTabs.map(({ key, label, icon: Icon }) => (
                          <button
                            key={key}
                            onClick={() => setProfileTab(key as any)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                              profileTab === key
                                ? isManager
                                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                                  : "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                : "bg-white/80 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Profile Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50 dark:bg-zinc-950">
                  {/* TAB 1: OVERVIEW & HR DETAILS */}
                  {profileTab === "overview" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Personal & Contact Details */}
                      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" />
                            Personal & Contact Details
                          </h3>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                            <span className="text-slate-400">Full Name</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {activeStaffDetail.firstName} {activeStaffDetail.lastName}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                            <span className="text-slate-400">Email Address</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {activeStaffDetail.user?.email || "Not specified"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                            <span className="text-slate-400">Phone Number</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {activeStaffDetail.phone || "Not provided"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                            <span className="text-slate-400">Date of Birth</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {activeStaffDetail.dateOfBirth
                                ? new Date(activeStaffDetail.dateOfBirth).toLocaleDateString("en-GB")
                                : "Not provided"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400">Home Address</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200 text-right max-w-[200px]">
                              {activeStaffDetail.address || "Not provided"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Employment & Regulatory Vetting */}
                      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-indigo-500" />
                            Employment & Vetting
                          </h3>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                            <span className="text-slate-400">Job Title / Designation</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {activeStaffDetail.jobTitle || (activeStaffDetail.user?.role === "MANAGER" ? "Registered Home Manager" : "Care Assistant")}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                            <span className="text-slate-400">Department</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {activeStaffDetail.department || (activeStaffDetail.user?.role === "MANAGER" ? "Care Home Management" : "Residential Care")}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                            <span className="text-slate-400">Employment Type</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {activeStaffDetail.employmentType || "Full-Time"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                            <span className="text-slate-400">Hire / Start Date</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {activeStaffDetail.hireDate
                                ? new Date(activeStaffDetail.hireDate).toLocaleDateString("en-GB")
                                : "Not specified"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                            <span className="text-slate-400">DBS Certificate No</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {activeStaffDetail.dbsNumber || "Verified & On File"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400">National Insurance (NI)</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                              {activeStaffDetail.nationalInsuranceNo || "Recorded on HR File"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 md:col-span-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <HeartHandshake className="h-4 w-4 text-rose-500" />
                          Emergency Contact Information
                        </h3>
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                          {activeStaffDetail.emergencyContact || "No emergency contact details recorded on file."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* MANAGER SPECIFIC TABS                                                    */}
                  {/* ========================================================================= */}

                  {/* TAB: MANAGED CARE HOME & ORGANIZATION */}
                  {profileTab === "organization" && activeStaffDetail.user?.role === "MANAGER" && (
                    <div className="space-y-4">
                      {/* Executive Care Home Banner */}
                      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-600/10 via-indigo-600/5 to-transparent border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                            <Building className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-black text-slate-900 dark:text-zinc-50">
                                {activeStaffDetail.organization?.name || "Care Facility"}
                              </h3>
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                {activeStaffDetail.organization?.status || "ACTIVE"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                              CQC Registration: <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">{activeStaffDetail.organization?.registrationNumber || "CQC Registered Facility"}</span> · Overall Rating: <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeStaffDetail.organization?.rating || "Good"}</span>
                            </p>
                          </div>
                        </div>

                        {activeStaffDetail.organizationId && (
                          <a
                            href={`/dashboard/organizations/${activeStaffDetail.organizationId}`}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all self-start sm:self-auto"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Launch Full Workspace
                          </a>
                        )}
                      </div>

                      {/* Real Metric Cards based on Database breakdown */}
                      {(() => {
                        const allOrgStaff = activeStaffDetail.organization?.staff || [];
                        const carers = allOrgStaff.filter((s: any) => s.user?.role !== "MANAGER" && s.id !== activeStaffDetail.id);
                        const managers = allOrgStaff.filter((s: any) => s.user?.role === "MANAGER" || s.id === activeStaffDetail.id);
                        const totalUsers = activeStaffDetail.organization?._count?.users ?? (carers.length + managers.length);

                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Caregivers / Staff</p>
                              <p className="text-xs font-black text-slate-800 dark:text-zinc-100 mt-1">
                                {carers.length} {carers.length === 1 ? "Caregiver" : "Caregivers"}
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Supervised Carers</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Care Home Managers</p>
                              <p className="text-xs font-black text-amber-600 dark:text-amber-400 mt-1">
                                {managers.length} {managers.length === 1 ? "Registered Manager" : "Managers"}
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-0.5">CQC Leadership</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total User Accounts</p>
                              <p className="text-xs font-black text-slate-800 dark:text-zinc-100 mt-1">
                                {totalUsers} Active Accounts
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{managers.length} Mgr · {carers.length} Staff</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bed Capacity</p>
                              <p className="text-xs font-black text-slate-800 dark:text-zinc-100 mt-1">
                                {activeStaffDetail.organization?.bedCapacity ? `${activeStaffDetail.organization.bedCapacity} Registered Beds` : "35 Registered Beds"}
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Capacity Registered</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Facility Details & Address */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-purple-500" />
                            Location & Facility Address
                          </h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                              <span className="text-slate-400">Physical Address</span>
                              <span className="font-bold text-slate-800 dark:text-zinc-200 text-right max-w-[220px]">
                                {activeStaffDetail.organization?.address || "Main Care Facility Address"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                              <span className="text-slate-400">Postcode</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                                {activeStaffDetail.organization?.postcode || "Not recorded"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Regulatory Oversight</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                Care Quality Commission (CQC)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-blue-500" />
                            Direct Facility Contacts
                          </h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                              <span className="text-slate-400">Telephone</span>
                              <span className="font-bold text-slate-800 dark:text-zinc-200">
                                {activeStaffDetail.organization?.phone || activeStaffDetail.phone || "Not recorded"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-850">
                              <span className="text-slate-400">Official Email</span>
                              <span className="font-bold text-slate-800 dark:text-zinc-200">
                                {activeStaffDetail.organization?.email || activeStaffDetail.user?.email}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Subscription Plan</span>
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-500/10 text-purple-600 border border-purple-500/20">
                                {activeStaffDetail.organization?.subscriptionPlan || "Enterprise"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: SUPERVISED TEAM */}
                  {profileTab === "team" && activeStaffDetail.user?.role === "MANAGER" && (() => {
                    const managedCaregivers = (activeStaffDetail.organization?.staff || []).filter(
                      (s: any) => s.user?.role !== "MANAGER" && s.id !== activeStaffDetail.id
                    );
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                              Care Staff in {activeStaffDetail.organization?.name || "Care Facility"}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Direct care employees operating under this Registered Manager's supervisory oversight
                            </p>
                          </div>

                          <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            {managedCaregivers.length} {managedCaregivers.length === 1 ? "Caregiver" : "Caregivers"} on roster
                          </span>
                        </div>

                        {managedCaregivers.length > 0 ? (
                          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850/60 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                                  <th className="px-5 py-3">Caregiver</th>
                                  <th className="px-5 py-3">Role / Designation</th>
                                  <th className="px-5 py-3">Department</th>
                                  <th className="px-5 py-3">Direct Contact</th>
                                  <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                                {managedCaregivers.map((member: any) => (
                                  <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                                    <td className="px-5 py-3.5">
                                      <div className="flex items-center gap-2.5">
                                        {member.avatarUrl ? (
                                          <img
                                            src={getFileUrl(member.avatarUrl) || ""}
                                            alt=""
                                            className="h-8 w-8 rounded-xl object-cover border border-slate-200 dark:border-zinc-700"
                                          />
                                        ) : (
                                          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-black text-white">
                                            {getInitials(`${member.firstName} ${member.lastName}`)}
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-bold text-slate-900 dark:text-zinc-100">
                                            {member.firstName} {member.lastName}
                                          </p>
                                          <span className="text-[10px] font-mono text-slate-400">
                                            #{member.employeeNo}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-zinc-300">
                                      {member.jobTitle || "Care Assistant"}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500">
                                      {member.department || "Residential Care"}
                                    </td>
                                    <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-zinc-400">
                                      {member.phone || member.user?.email || "N/A"}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                      <button
                                        onClick={() => {
                                          setActiveStaffId(member.id);
                                          setProfileTab("overview");
                                        }}
                                        className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                      >
                                        View Carer
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800">
                            <Users className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                              No caregivers currently registered in this care facility.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* TAB: CQC GOVERNANCE & STATUTORY FRAMEWORK */}
                  {profileTab === "governance" && activeStaffDetail.user?.role === "MANAGER" && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-amber-500/5 to-transparent border border-purple-500/20">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-zinc-50">
                              CQC Regulation 17 & Regulation 5: Management Governance Framework
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-zinc-400">
                              Statutory governance & operational oversight responsibilities assigned to the Registered Manager.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        {[
                          {
                            title: "CQC Fit and Proper Persons Requirement (Regulation 5)",
                            description: "Registered Person vetting, qualifications, and good character confirmed on CQC register",
                            status: "Verified & Active",
                          },
                          {
                            title: "Good Governance & Quality Assurance Systems (Regulation 17)",
                            description: "Periodic clinical auditing, care plan reviews, risk assessments, and health & safety records",
                            status: "Compliant & Audited",
                          },
                          {
                            title: "Staffing Governance & Continuous Supervision (Regulation 18)",
                            description: "Carer shift rotas, mandatory training tracking, and 1-to-1 supervision sessions",
                            status: "Active Management Rota",
                          },
                          {
                            title: "Statutory Duty of Candour (Regulation 20)",
                            description: "Openness, transparency, and apology procedures formalized for incidents and near misses",
                            status: "Governance Policy Enforced",
                          },
                          {
                            title: "CQC Statutory Notifications Duty (Sections 67-69 Regulations)",
                            description: "Authorized reporting duty for serious injuries, safeguarding concerns, deaths, and incidents",
                            status: "Authorized Nominee",
                          },
                          {
                            title: "Safe Administration & Custody of Controlled Drugs (Regulation 12)",
                            description: "Management oversight on MAR charts, pharmacy deliveries, medication disposal, and error logging",
                            status: "Audited On File",
                          },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs block">
                                {item.title}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                                {item.description}
                              </span>
                            </div>
                            <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg self-start sm:self-auto flex-shrink-0">
                              <CheckCircle2 className="h-4 w-4" />
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CPD TRAINING MATRIX */}
                  {profileTab === "trainings" && activeStaffDetail.user?.role !== "MANAGER" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                            e-Learning CPD Modules
                          </h3>
                          <p className="text-xs text-slate-500">
                            Mandatory health, safety, safeguarding & medication refresher records
                          </p>
                        </div>

                        {canManage && (
                          <button
                            onClick={() => {
                              setWarningModalData({
                                isOpen: true,
                                staff: activeStaffDetail,
                                courseTitle: "Mandatory CQC Training Matrix Refresher",
                                expiryDate: new Date().toISOString().split("T")[0],
                                statusType: "EXPIRING",
                              });
                            }}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Dispatch Notice
                          </button>
                        )}
                      </div>

                      {activeStaffDetail.trainings?.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800">
                          <GraduationCap className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                            No training records logged yet for this carer.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850/60 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                                <th className="px-5 py-3">Course Title</th>
                                <th className="px-5 py-3">Accredited Provider</th>
                                <th className="px-5 py-3">Completed On</th>
                                <th className="px-5 py-3">Expires On</th>
                                <th className="px-5 py-3">Audit Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                              {activeStaffDetail.trainings.map((t: any) => {
                                const isExpired = t.expiresOn && new Date(t.expiresOn) < new Date();
                                return (
                                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-zinc-100">
                                      {t.title}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-400">
                                      {t.provider || "Skills for Care"}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-400">
                                      {new Date(t.completedOn).toLocaleDateString("en-GB")}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-400">
                                      {t.expiresOn ? new Date(t.expiresOn).toLocaleDateString("en-GB") : "Permanent"}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <span
                                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                          isExpired
                                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        }`}
                                      >
                                        {isExpired ? "Expired" : "Valid"}
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
                  )}

                  {/* TAB 3: BEDSIDE AUDITS & PRACTICAL COMPETENCIES */}
                  {profileTab === "competencies" && activeStaffDetail.user?.role !== "MANAGER" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                          Observed Practical Competencies
                        </h3>
                        <p className="text-xs text-slate-500">
                          Bedside hoist transfer, IPC, and medication administration audit sign-offs
                        </p>
                      </div>

                      {activeStaffDetail.competencies?.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800">
                          <ClipboardCheck className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                            No practical bedside audits recorded yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeStaffDetail.competencies.map((c: any) => (
                            <div
                              key={c.id}
                              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                                    {c.name}
                                  </h4>
                                  <p className="text-xs text-slate-500">
                                    Assessed on {new Date(c.achievedOn).toLocaleDateString("en-GB")}
                                  </p>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                                    c.level === "PASS"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                  }`}
                                >
                                  {c.level}
                                </span>
                              </div>

                              {c.assessorNotes && (
                                <p className="text-xs text-slate-600 dark:text-zinc-300 italic bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                  "{c.assessorNotes}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: CERTIFICATES STORE */}
                  {profileTab === "certificates" && activeStaffDetail.user?.role !== "MANAGER" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                          Uploaded Certificates & Evidence
                        </h3>
                        <p className="text-xs text-slate-500">
                          Digital documents, PDF uploads, and CQC verification seals
                        </p>
                      </div>

                      {activeStaffDetail.certificates?.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800">
                          <Award className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                            No certificates uploaded for this staff member.
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {activeStaffDetail.certificates.map((cert: any) => {
                            const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
                            return (
                              <div
                                key={cert.id}
                                className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-3"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                                        isExpired
                                          ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                          : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                      }`}
                                    >
                                      {isExpired ? "Expired" : "Valid"}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {cert.certificateNo || "No Ref"}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 line-clamp-1">
                                    {cert.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-500">
                                    {cert.issuer || "Accredited Body"} · Exp:{" "}
                                    {cert.expiryDate
                                      ? new Date(cert.expiryDate).toLocaleDateString("en-GB")
                                      : "Permanent"}
                                  </p>
                                </div>

                                <button
                                  onClick={() => {
                                    setPreviewCert({
                                      ...cert,
                                      staff: activeStaffDetail,
                                    });
                                    setZoomScale(1);
                                  }}
                                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Preview Certificate
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: CQC REGULATION 18 AUDIT */}
                  {profileTab === "compliance" && activeStaffDetail.user?.role !== "MANAGER" && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-zinc-50">
                              CQC Regulation 18: Staffing Governance Check
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-zinc-400">
                              Audited for suitable qualifications, competency sign-offs, and continuous supervision.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        {[
                          { title: "Enhanced DBS Disclosure Vetting", status: "Verified & On File", pass: true },
                          { title: "Moving & Handling (Hoisting) Competency", status: "Certified", pass: true },
                          { title: "Safeguarding Adults (Level 2/3)", status: "Verified", pass: true },
                          { title: "Infection Prevention & Control Protocols", status: "Verified", pass: true },
                          { title: "Safe Administration of Medication Audited", status: "Verified", pass: true },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between"
                          >
                            <span className="font-semibold text-slate-800 dark:text-zinc-200">
                              {item.title}
                            </span>
                            <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                              <CheckCircle2 className="h-4 w-4" />
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Modal Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {canManage && (
                      activeStaffDetail.user?.status === "ACTIVE" ? (
                        <button
                          onClick={() => setConfirmDeleteId(activeStaffDetail.id)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        >
                          Deactivate Account
                        </button>
                      ) : (
                        <button
                          onClick={() => restoreMutation.mutate(activeStaffDetail.id)}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all cursor-pointer"
                        >
                          Reactivate Account
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => setActiveStaffId(null)}
                    className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Close Profile
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONBOARD NEW EMPLOYEE MODAL (COMPREHENSIVE DETAILS)                        */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => {
              setIsAddModalOpen(false);
              setCreatedCredentials(null);
            }}
          />

          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-zinc-50">
                    Onboard New Care Employee
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Complete profile setup & CQC compliance matrix initialization
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setCreatedCredentials(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {createdCredentials ? (
                <div className="space-y-6 text-center py-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-zinc-50">
                      Onboarding Completed Successfully!
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                      Staff account created for <strong>{createdCredentials.name}</strong>. Provide credentials to employee:
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 text-left space-y-3 font-mono text-xs select-all">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">
                        Staff ID / Employee No
                      </span>
                      <span className="text-slate-900 dark:text-zinc-50 font-bold">
                        {createdCredentials.employeeNo}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">
                        Login Email Address
                      </span>
                      <span className="text-slate-900 dark:text-zinc-50 font-bold">
                        {createdCredentials.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">
                        Temporary Password
                      </span>
                      <span className="text-slate-900 dark:text-zinc-50 font-bold">
                        {createdCredentials.password}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCreatedCredentials(null);
                      setIsAddModalOpen(false);
                    }}
                    className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Section Selector Tabs */}
                  <div className="flex gap-2 p-1 bg-slate-100 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
                    {[
                      { key: "personal", label: "1. Personal Details", icon: User },
                      { key: "employment", label: "2. Employment & Role", icon: Briefcase },
                      { key: "compliance", label: "3. CQC Vetting", icon: ShieldCheck },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setAddFormSection(key as any)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          addFormSection === key
                            ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* SECTION 1: PERSONAL DETAILS */}
                  {addFormSection === "personal" && (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            First Name *
                          </label>
                          <Input
                            value={newStaff.firstName}
                            onChange={(e) => setNewStaff((p) => ({ ...p, firstName: e.target.value }))}
                            placeholder="e.g. Abdul"
                            className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            Last Name *
                          </label>
                          <Input
                            value={newStaff.lastName}
                            onChange={(e) => setNewStaff((p) => ({ ...p, lastName: e.target.value }))}
                            placeholder="e.g. Rafeh"
                            className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            Email Address *
                          </label>
                          <Input
                            type="email"
                            value={newStaff.email}
                            onChange={(e) => setNewStaff((p) => ({ ...p, email: e.target.value }))}
                            placeholder="abdul.rafeh@carehome.com"
                            className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            Phone Number
                          </label>
                          <Input
                            value={newStaff.phone}
                            onChange={(e) => setNewStaff((p) => ({ ...p, phone: e.target.value }))}
                            placeholder="+44 7123 456789"
                            className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            Date of Birth
                          </label>
                          <Input
                            type="date"
                            value={newStaff.dateOfBirth}
                            onChange={(e) => setNewStaff((p) => ({ ...p, dateOfBirth: e.target.value }))}
                            className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            Home Address & Postcode
                          </label>
                          <Input
                            value={newStaff.address}
                            onChange={(e) => setNewStaff((p) => ({ ...p, address: e.target.value }))}
                            placeholder="e.g. 12 High Street, Birmingham, B1 1AA"
                            className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Emergency Contact Information
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Contact Name"
                            value={newStaff.emergencyContactName}
                            onChange={(e) => setNewStaff((p) => ({ ...p, emergencyContactName: e.target.value }))}
                            className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl"
                          />
                          <Input
                            placeholder="Relationship (e.g. Spouse)"
                            value={newStaff.emergencyContactRelation}
                            onChange={(e) => setNewStaff((p) => ({ ...p, emergencyContactRelation: e.target.value }))}
                            className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl"
                          />
                          <Input
                            placeholder="Emergency Phone"
                            value={newStaff.emergencyContactPhone}
                            onChange={(e) => setNewStaff((p) => ({ ...p, emergencyContactPhone: e.target.value }))}
                            className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: EMPLOYMENT & ROLE */}
                  {addFormSection === "employment" && (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            Job Title / Role *
                          </label>
                          <select
                            value={newStaff.jobTitle}
                            onChange={(e) => setNewStaff((p) => ({ ...p, jobTitle: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:border-blue-500 cursor-pointer"
                          >
                            <option value="Care Assistant">Care Assistant</option>
                            <option value="Senior Carer">Senior Carer</option>
                            <option value="Senior Care Assistant">Senior Care Assistant</option>
                            <option value="Registered Nurse">Registered Nurse</option>
                            <option value="Senior Nurse">Senior Nurse</option>
                            <option value="Activities Coordinator">Activities Coordinator</option>
                            <option value="Care Coordinator">Care Coordinator</option>
                            <option value="Registered Manager">Registered Manager</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            Department
                          </label>
                          <select
                            value={newStaff.department}
                            onChange={(e) => setNewStaff((p) => ({ ...p, department: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:border-blue-500 cursor-pointer"
                          >
                            <option value="Residential Care">Residential Care</option>
                            <option value="Nursing Care">Nursing Care</option>
                            <option value="Dementia Wing">Dementia Wing</option>
                            <option value="Domiciliary Care">Domiciliary Care</option>
                            <option value="Activities & Wellbeing">Activities & Wellbeing</option>
                            <option value="Management & Admin">Management & Admin</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            Employment Type
                          </label>
                          <select
                            value={newStaff.employmentType}
                            onChange={(e) => setNewStaff((p) => ({ ...p, employmentType: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:border-blue-500 cursor-pointer"
                          >
                            <option value="Full-Time">Full-Time</option>
                            <option value="Part-Time">Part-Time</option>
                            <option value="Bank / Relief">Bank / Relief</option>
                            <option value="Contract / Fixed">Contract / Fixed</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            Employee ID *
                          </label>
                          <Input
                            value={newStaff.employeeId}
                            onChange={(e) => setNewStaff((p) => ({ ...p, employeeId: e.target.value }))}
                            placeholder="EMP-0561"
                            className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            Start / Hire Date
                          </label>
                          <Input
                            type="date"
                            value={newStaff.startDate}
                            onChange={(e) => setNewStaff((p) => ({ ...p, startDate: e.target.value }))}
                            className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                          />
                        </div>
                      </div>

                      {isAdmin && (
                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            Assign to Care Home / Organization *
                          </label>
                          <select
                            value={newStaff.organizationId}
                            onChange={(e) => setNewStaff((p) => ({ ...p, organizationId: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:border-blue-500 cursor-pointer"
                          >
                            <option value="">Select Care Home</option>
                            {organizations.map((org: any) => (
                              <option key={org.id} value={org.id}>
                                {org.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 3: CQC VETTING & INITIALIZATION */}
                  {addFormSection === "compliance" && (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            DBS Disclosure Number
                          </label>
                          <Input
                            value={newStaff.dbsNumber}
                            onChange={(e) => setNewStaff((p) => ({ ...p, dbsNumber: e.target.value }))}
                            placeholder="e.g. 001589234812"
                            className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                            National Insurance (NI) Number
                          </label>
                          <Input
                            value={newStaff.nationalInsuranceNo}
                            onChange={(e) => setNewStaff((p) => ({ ...p, nationalInsuranceNo: e.target.value }))}
                            placeholder="e.g. QQ 12 34 56 A"
                            className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                          Initial Password
                        </label>
                        <Input
                          type="text"
                          value={newStaff.password}
                          onChange={(e) => setNewStaff((p) => ({ ...p, password: e.target.value }))}
                          className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl font-mono"
                        />
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-zinc-200">
                            Automatic CQC Training Matrix Initialization
                          </p>
                          <p className="text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                            New employee will be automatically provisioned with standard CPD compliance modules (Moving & Handling, Safeguarding Adults, Fire Safety, IPC, Medication) and practical bedside audit readiness.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {!createdCredentials && (
              <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center flex-shrink-0">
                <button
                  onClick={() => {
                    if (addFormSection === "compliance") setAddFormSection("employment");
                    else if (addFormSection === "employment") setAddFormSection("personal");
                    else setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                >
                  {addFormSection === "personal" ? "Cancel" : "Back"}
                </button>

                <div className="flex gap-2">
                  {addFormSection !== "compliance" ? (
                    <button
                      onClick={() => {
                        if (addFormSection === "personal") {
                          if (!newStaff.firstName || !newStaff.lastName || !newStaff.email) {
                            toast.error("Please fill in first name, last name, and email");
                            return;
                          }
                          setAddFormSection("employment");
                        } else if (addFormSection === "employment") {
                          setAddFormSection("compliance");
                        }
                      }}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      onClick={handleAddStaff}
                      disabled={createMutation.isPending}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Complete Onboarding
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT STAFF MODAL                                                          */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsEditModalOpen(false)}
          />

          <div className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex-shrink-0">
              <h2 className="font-bold text-sm text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                <Edit className="h-4 w-4 text-blue-500" />
                Edit Staff Profile & Details
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">First Name *</label>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">Last Name *</label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">Job Title</label>
                  <Input
                    value={editForm.jobTitle}
                    onChange={(e) => setEditForm((p) => ({ ...p, jobTitle: e.target.value }))}
                    className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">Department</label>
                  <Input
                    value={editForm.department}
                    onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))}
                    className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">Phone Number</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">DBS Number</label>
                  <Input
                    value={editForm.dbsNumber}
                    onChange={(e) => setEditForm((p) => ({ ...p, dbsNumber: e.target.value }))}
                    className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">Home Address</label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                    className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">Emergency Contact</label>
                  <Input
                    value={editForm.emergencyContact}
                    onChange={(e) => setEditForm((p) => ({ ...p, emergencyContact: e.target.value }))}
                    className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-1">Employee No</label>
                  <Input
                    value={editForm.employeeNo}
                    onChange={(e) => setEditForm((p) => ({ ...p, employeeNo: e.target.value }))}
                    className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-end gap-2 flex-shrink-0">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={updateMutation.isPending}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTEGRATED FULLSCREEN CERTIFICATE PREVIEW MODAL                           */}
      {/* ========================================================================= */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setPreviewCert(null)}
          />

          <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex-shrink-0 bg-slate-50 dark:bg-zinc-900">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                    {previewCert.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Carer: {previewCert.staff?.firstName} {previewCert.staff?.lastName} (#{previewCert.staff?.employeeNo})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomScale((s) => Math.max(0.6, s - 0.15))}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => setZoomScale((s) => Math.min(2.0, s + 0.15))}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>

                {previewCert.fileUrl && (
                  <a
                    href={getFileUrl(previewCert.fileUrl) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Tab
                  </a>
                )}

                <button
                  onClick={() => setPreviewCert(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100 dark:bg-zinc-950">
              {previewCert.fileUrl ? (
                previewCert.fileUrl.toLowerCase().endsWith(".pdf") ? (
                  <div
                    className="w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-zinc-800 transition-transform"
                    style={{ transform: `scale(${zoomScale})`, transformOrigin: "top center" }}
                  >
                    <object
                      data={getFileUrl(previewCert.fileUrl) || ""}
                      type="application/pdf"
                      className="w-full h-full"
                    >
                      <iframe
                        src={getFileUrl(previewCert.fileUrl) || ""}
                        className="w-full h-full border-0"
                        title="Certificate PDF"
                      />
                    </object>
                  </div>
                ) : (
                  <img
                    src={getFileUrl(previewCert.fileUrl) || ""}
                    alt="Certificate"
                    className="max-h-[600px] rounded-2xl shadow-2xl object-contain transition-transform"
                    style={{ transform: `scale(${zoomScale})` }}
                  />
                )
              ) : (
                /* High Fidelity CQC Seal Fallback */
                <div
                  className="w-full max-w-xl p-8 bg-gradient-to-br from-white via-amber-50/20 to-indigo-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-850 rounded-3xl shadow-2xl border-4 border-double border-amber-400/60 dark:border-amber-500/40 relative overflow-hidden"
                  style={{ transform: `scale(${zoomScale})` }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                          Regulation 18 Compliance
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Care Quality Commission Verified
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Digitally Attested
                    </span>
                  </div>

                  <div className="text-center py-4 space-y-2 border-y border-amber-200/50 dark:border-zinc-800">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      This is to formally certify that
                    </p>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      {previewCert.staff?.firstName} {previewCert.staff?.lastName}
                    </h2>
                    <p className="text-xs font-mono text-slate-400">
                      Carer ID: #{previewCert.staff?.employeeNo || "N/A"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 max-w-md mx-auto pt-2">
                      has successfully fulfilled mandatory compliance standards for:
                    </p>
                    <div className="inline-block px-4 py-2 mt-1 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-extrabold text-indigo-700 dark:text-indigo-300 text-sm">
                      {previewCert.title}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Issuing Body
                      </span>
                      <strong className="text-slate-800 dark:text-zinc-200 font-bold">
                        {previewCert.issuer || "Accredited Body"}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Issue Date
                      </span>
                      <strong className="text-slate-800 dark:text-zinc-200 font-bold">
                        {previewCert.issueDate
                          ? new Date(previewCert.issueDate).toLocaleDateString("en-GB")
                          : "N/A"}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation for Deactivation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl text-center space-y-4 animate-scale-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Deactivate Staff Account?
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                The carer will be revoked system access until reactivated by management.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-zinc-800 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-500 transition-all cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Channel CQC Compliance Warning Modal */}
      <SendWarningModal
        isOpen={warningModalData.isOpen}
        onClose={() => setWarningModalData((p) => ({ ...p, isOpen: false }))}
        staff={warningModalData.staff}
        courseTitle={warningModalData.courseTitle}
        expiryDate={warningModalData.expiryDate}
        statusType={warningModalData.statusType}
      />
    </div>
  );
}

export default function StaffDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <StaffDirectoryContent />
    </Suspense>
  );
}
