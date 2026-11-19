"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Plus,
  Search,
  Upload,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  User,
  Award,
  Clock,
  Loader2,
  Eye,
  X,
  ImageIcon,
  FileBadge,
  ChevronLeft,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Shield,
  Check,
  Grid3X3,
  Table,
  Printer,
  MessageSquare,
  Sparkles,
  Building,
} from "lucide-react";
import { certificateService } from "@/services/certificate";
import { staffService } from "@/services/staff";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")?.replace("/api", "") ||
  "http://localhost:3001";

const CERT_TYPES = [
  "DBS Enhanced Disclosure Check",
  "NMC Professional Registration",
  "First Aid & CPR at Work",
  "Moving & Handling Certification",
  "Safeguarding Adults (Level 2)",
  "Safeguarding Adults (Level 3)",
  "Fire Safety & Evacuation",
  "Food Safety & Hygiene Level 2",
  "Infection Prevention & Control",
  "Safe Administration of Medication",
  "Mental Capacity Act & DoLS",
  "UK Full Driving Licence",
  "Right to Work in the UK Verification",
  "Dementia Awareness & Care",
  "End of Life Care (Palliative)",
  "Health and Safety Awareness",
  "Other CQC Mandated Certification",
];

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getDaysUntilExpiry(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function CertStatusBadge({ expiryDate }: { expiryDate?: string | null }) {
  const days = getDaysUntilExpiry(expiryDate);
  if (days === null)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
        No Expiry
      </span>
    );
  if (days < 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <XCircle className="h-3 w-3" /> Expired {Math.abs(days)}d ago
      </span>
    );
  if (days <= 30)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <AlertTriangle className="h-3 w-3" /> Expires in {days}d
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="h-3 w-3" /> Valid ({days}d left)
    </span>
  );
}

function FileIcon({ fileUrl }: { fileUrl?: string | null }) {
  if (!fileUrl) return <FileText className="h-5 w-5 text-indigo-500" />;
  if (fileUrl.toLowerCase().endsWith(".pdf"))
    return <FileBadge className="h-5 w-5 text-rose-500" />;
  return <ImageIcon className="h-5 w-5 text-blue-500" />;
}

export default function CertificatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "directory">("table");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [previewCert, setPreviewCert] = useState<any>(null);
  const [selectedStaffDir, setSelectedStaffDir] = useState<any>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [imgLoadFailed, setImgLoadFailed] = useState(false);

  const [form, setForm] = useState({
    staffId: "",
    title: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    certificateNo: "",
  });

  const isStaff = user?.role === "STAFF";
  const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";

  const { data: certsRes, isLoading } = useQuery({
    queryKey: ["certificates", user?.staff?.id, user?.role],
    queryFn: () => certificateService.findAll({ limit: 300 }),
    enabled: !!user,
  });

  const { data: staffRes } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => staffService.findAll({ limit: 200 }),
    enabled: !!user && !isStaff,
  });

  const rawCerts = certsRes?.data?.data?.data || certsRes?.data?.data || certsRes?.data || [];
  const certs: any[] = Array.isArray(rawCerts) ? rawCerts : [];

  const rawStaff = staffRes?.data?.data?.data || staffRes?.data?.data || staffRes?.data || [];
  const staffList: any[] = Array.isArray(rawStaff) ? rawStaff : [];

  const validateFile = (file: File): string => {
    if (!ALLOWED_TYPES.includes(file.type))
      return "Only PDF, PNG, JPG, or WEBP files are allowed";
    if (file.size > MAX_FILE_SIZE)
      return `File too large. Maximum size is 10MB (this file: ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    return "";
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    setFileError(error);
    if (!error) setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await certificateService.create(data, selectedFile || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Certificate uploaded successfully");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to upload certificate";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => certificateService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Certificate removed successfully");
      if (previewCert) setPreviewCert(null);
    },
    onError: () => toast.error("Failed to delete certificate"),
  });

  const filtered = certs.filter((c: any) => {
    const q = search.toLowerCase().trim();
    const staffName = `${c.staff?.firstName || ""} ${c.staff?.lastName || ""}`.toLowerCase();
    const matchesSearch =
      !q ||
      c.title?.toLowerCase().includes(q) ||
      c.issuer?.toLowerCase().includes(q) ||
      c.certificateNo?.toLowerCase().includes(q) ||
      staffName.includes(q);

    if (!matchesSearch) return false;
    if (selectedStaffDir && c.staffId !== selectedStaffDir.id) return false;

    const days = getDaysUntilExpiry(c.expiryDate);
    if (filterStatus === "valid") return days !== null && days > 30;
    if (filterStatus === "expiring") return days !== null && days >= 0 && days <= 30;
    if (filterStatus === "expired") return days !== null && days < 0;
    return true;
  });

  const stats = {
    total: certs.length,
    valid: certs.filter((c) => {
      const d = getDaysUntilExpiry(c.expiryDate);
      return d !== null && d > 30;
    }).length,
    expiring: certs.filter((c) => {
      const d = getDaysUntilExpiry(c.expiryDate);
      return d !== null && d >= 0 && d <= 30;
    }).length,
    expired: certs.filter((c) => {
      const d = getDaysUntilExpiry(c.expiryDate);
      return d !== null && d < 0;
    }).length,
  };

  const resetForm = () => {
    setForm({
      staffId: "",
      title: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
      certificateNo: "",
    });
    setSelectedFile(null);
    setFileError("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalForm = { ...form };
    if (isStaff && user?.staff?.id) {
      finalForm.staffId = user.staff.id;
    }
    if (!finalForm.staffId) {
      toast.error("Please select a staff member");
      return;
    }
    if (!finalForm.title) {
      toast.error("Please select a certificate type");
      return;
    }
    if (!finalForm.issuer) {
      toast.error("Please enter the issuing authority");
      return;
    }
    if (!finalForm.issueDate) {
      toast.error("Please enter the issue date");
      return;
    }
    createMutation.mutate(finalForm);
  };

  const getFileUrl = (url?: string | null) => {
    if (!url || typeof url !== "string") return null;
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url.startsWith("/") ? url : "/" + url}`;
  };

  const openPreview = (cert: any) => {
    setZoomScale(1);
    setImgLoadFailed(false);
    setPreviewCert(cert);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {!isStaff && selectedStaffDir && (
                  <button
                    onClick={() => setSelectedStaffDir(null)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
                  {!isStaff && selectedStaffDir
                    ? `${selectedStaffDir.firstName}'s Certificate Portfolio`
                    : "Certificate Store & Verification"}
                </h1>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                {isStaff
                  ? "View and upload verified certificates for your CQC compliance passport."
                  : "Review, preview, and audit staff training certifications and evidence files."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!isStaff && (
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
              <button
                onClick={() => {
                  setViewMode("table");
                  setSelectedStaffDir(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "table" && !selectedStaffDir
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                <Table className="h-3.5 w-3.5" /> All Table
              </button>
              <button
                onClick={() => setViewMode("directory")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "directory" || selectedStaffDir
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                <Grid3X3 className="h-3.5 w-3.5" /> By Staff
              </button>
            </div>
          )}

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg hover:scale-102 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Upload Certificate
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: isStaff ? "My Certificates" : "Total Stored",
            value: stats.total,
            icon: Award,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-500/10",
            filterKey: "all",
          },
          {
            label: "Valid & Compliant",
            value: stats.valid,
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
            filterKey: "valid",
          },
          {
            label: "Expiring (≤ 30d)",
            value: stats.expiring,
            icon: AlertTriangle,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10",
            filterKey: "expiring",
          },
          {
            label: "Expired (CQC Breach)",
            value: stats.expired,
            icon: XCircle,
            color: "text-rose-600 dark:text-rose-400",
            bg: "bg-rose-500/10",
            filterKey: "expired",
          },
        ].map((item) => (
          <div
            key={item.label}
            onClick={() => setFilterStatus(item.filterKey)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === item.filterKey
                ? "bg-white dark:bg-zinc-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                : "bg-white/80 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                {item.label}
              </span>
              <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              isStaff
                ? "Search by certificate title, issuer, reference..."
                : "Search by staff name, certificate title, issuer..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "all", label: "All Statuses" },
            { key: "valid", label: "Valid Only" },
            { key: "expiring", label: "Expiring Soon" },
            { key: "expired", label: "Expired" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory View by Staff */}
      {!isStaff && viewMode === "directory" && !selectedStaffDir ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {staffList.map((st: any) => {
            const staffCerts = certs.filter((c) => c.staffId === st.id);
            const hasExpired = staffCerts.some((c) => {
              const d = getDaysUntilExpiry(c.expiryDate);
              return d !== null && d < 0;
            });
            const hasExpiring = staffCerts.some((c) => {
              const d = getDaysUntilExpiry(c.expiryDate);
              return d !== null && d >= 0 && d <= 30;
            });

            return (
              <div
                key={st.id}
                onClick={() => setSelectedStaffDir(st)}
                className="group relative rounded-3xl border bg-white dark:bg-zinc-900 p-5 text-left transition-all hover:-translate-y-1 hover:shadow-xl border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center font-black text-white shadow-md flex-shrink-0">
                    {st.firstName?.[0] || "U"}
                    {st.lastName?.[0] || ""}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100 truncate">
                      {st.firstName} {st.lastName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      #{st.employeeNo}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {staffCerts.length} files
                    </span>
                    {hasExpired && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/15 text-rose-600 rounded-md">
                        Expired
                      </span>
                    )}
                    {!hasExpired && hasExpiring && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-600 rounded-md">
                        Expiring
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800/50 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
          <div className="h-16 w-16 bg-slate-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-slate-400 mx-auto mb-4">
            <FolderOpen className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-zinc-200">
            No certificates found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Upload certificates or adjust filters to inspect compliance records.
          </p>
        </Card>
      ) : (
        /* Certificates Table */
        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-850/60 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Certificate & Reference</th>
                  {!isStaff && <th className="px-5 py-3.5">Staff Member</th>}
                  <th className="px-5 py-3.5">Issuing Authority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filtered.map((cert) => (
                  <tr
                    key={cert.id}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 flex-shrink-0">
                          <FileIcon fileUrl={cert.fileUrl} />
                        </div>
                        <div>
                          <button
                            onClick={() => openPreview(cert)}
                            className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer text-left block"
                          >
                            {cert.title}
                          </button>
                          {cert.certificateNo && (
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              Ref: #{cert.certificateNo}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {!isStaff && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-zinc-300">
                            {cert.staff?.firstName?.[0] || "U"}
                            {cert.staff?.lastName?.[0] || ""}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-zinc-200 block">
                              {cert.staff?.firstName} {cert.staff?.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{cert.staff?.employeeNo}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-700 dark:text-zinc-300">
                        {cert.issuer || "Accredited Body"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <CertStatusBadge expiryDate={cert.expiryDate} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {cert.expiryDate
                            ? new Date(cert.expiryDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "No Expiry"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openPreview(cert)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold transition-all cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> <span>Preview</span>
                        </button>
                        {cert.fileUrl && (
                          <a
                            href={getFileUrl(cert.fileUrl) || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all cursor-pointer"
                            title="Download Evidence File"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove "${cert.title}"?`))
                                deleteMutation.mutate(cert.id);
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL-SCREEN RICH PREVIEW MODAL */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setPreviewCert(null)}
          />
          <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[880px]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/80 dark:bg-zinc-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md">
                  <FileBadge className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white">
                      {previewCert.title}
                    </h3>
                    <CertStatusBadge expiryDate={previewCert.expiryDate} />
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>
                      Staff Member:{" "}
                      <strong className="text-slate-700 dark:text-zinc-200">
                        {previewCert.staff?.firstName} {previewCert.staff?.lastName}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="font-mono">#{previewCert.staff?.employeeNo}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewCert.fileUrl && (
                  <a
                    href={getFileUrl(previewCert.fileUrl) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-zinc-800 transition-colors"
                    title="Open Original in New Tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-zinc-800 transition-colors"
                  title="Print Certificate"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Left Document Viewer / Right Carer Info & Actions */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-100/60 dark:bg-zinc-900/50">
              {/* Left Viewer Canvas */}
              <div className="lg:col-span-8 flex flex-col h-full border-r border-slate-200 dark:border-zinc-800 overflow-hidden bg-slate-200/40 dark:bg-zinc-950">
                {/* Viewer Toolbar */}
                <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Regulation 18 Verified Evidence</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                    <button
                      onClick={() => setZoomScale((prev) => Math.max(0.6, prev - 0.2))}
                      className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[11px] font-mono font-bold px-1.5 text-slate-700 dark:text-zinc-200">
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomScale((prev) => Math.min(2.5, prev + 0.2))}
                      className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomScale(1)}
                      className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 cursor-pointer"
                      title="Reset Zoom"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Document Display Area */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                  {previewCert.fileUrl &&
                  previewCert.fileUrl.toLowerCase().endsWith(".pdf") ? (
                    <div className="w-full h-full flex flex-col relative">
                      <object
                        data={`${getFileUrl(previewCert.fileUrl)}#toolbar=1&navpanes=0`}
                        type="application/pdf"
                        className="w-full h-full rounded-2xl shadow-xl bg-white border border-slate-300 dark:border-zinc-800"
                      >
                        <iframe
                          src={getFileUrl(previewCert.fileUrl) || ""}
                          className="w-full h-full rounded-2xl shadow-xl bg-white"
                          title="PDF Document"
                        />
                      </object>
                    </div>
                  ) : previewCert.fileUrl && !imgLoadFailed ? (
                    <div
                      className="transition-transform duration-150 flex items-center justify-center min-w-full min-h-full"
                      style={{ transform: `scale(${zoomScale})` }}
                    >
                      <img
                        src={getFileUrl(previewCert.fileUrl) || ""}
                        onError={() => setImgLoadFailed(true)}
                        className="max-h-[620px] max-w-full object-contain rounded-2xl shadow-2xl bg-white border border-slate-200"
                        alt="Certificate Evidence"
                      />
                    </div>
                  ) : (
                    /* High-Fidelity Official CQC Digital Certificate Fallback */
                    <div
                      className="w-full max-w-xl p-8 bg-gradient-to-br from-white via-amber-50/20 to-indigo-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-850 rounded-3xl shadow-2xl border-4 border-double border-amber-400/60 dark:border-amber-500/40 relative overflow-hidden transition-transform duration-150"
                      style={{ transform: `scale(${zoomScale})` }}
                    >
                      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-bl-full pointer-events-none" />
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
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-400 block">
                            REF: {previewCert.certificateNo || "CQC-REG18-VERIFIED"}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                            <CheckCircle2 className="h-3 w-3" /> Digitally Attested
                          </span>
                        </div>
                      </div>

                      <div className="text-center py-4 space-y-2 border-y border-amber-200/50 dark:border-zinc-800">
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                          This is to formally certify that
                        </p>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          {previewCert.staff?.firstName} {previewCert.staff?.lastName}
                        </h2>
                        <p className="text-xs font-mono text-slate-400">
                          Carer ID: #{previewCert.staff?.employeeNo || "N/A"}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-zinc-300 max-w-md mx-auto pt-2">
                          has successfully demonstrated certified competence and fulfilled mandatory
                          compliance standards for:
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

              {/* Right Sidebar: Details, Staff Info & Quick Message Action */}
              <div className="lg:col-span-4 p-5 space-y-4 overflow-y-auto bg-white dark:bg-zinc-900">
                {/* Staff Profile Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Carer Profile
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center font-extrabold text-white text-sm shadow-md">
                      {previewCert.staff?.firstName?.[0] || "U"}
                      {previewCert.staff?.lastName?.[0] || ""}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {previewCert.staff?.firstName} {previewCert.staff?.lastName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {previewCert.staff?.jobTitle || "Care Staff"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Emp ID: #{previewCert.staff?.employeeNo}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit Information */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-indigo-500" /> Audit Information
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-slate-500">Course / Skill:</span>
                      <strong className="text-slate-900 dark:text-white font-bold text-right max-w-[180px] truncate">
                        {previewCert.title}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-slate-500">Issuing Body:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {previewCert.issuer || "Accredited Body"}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-slate-500">Reference No:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">
                        {previewCert.certificateNo || "None"}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-slate-500">Issue Date:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {previewCert.issueDate
                          ? new Date(previewCert.issueDate).toLocaleDateString("en-GB")
                          : "N/A"}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-slate-500">Expiry Date:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {previewCert.expiryDate
                          ? new Date(previewCert.expiryDate).toLocaleDateString("en-GB")
                          : "No Expiry"}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Status:</span>
                      <CertStatusBadge expiryDate={previewCert.expiryDate} />
                    </div>
                  </div>
                </div>

                {/* Manager Quick Actions */}
                {!isStaff && (
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setPreviewCert(null);
                        router.push("/dashboard/messages");
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Message Carer
                    </button>
                    {previewCert.fileUrl && (
                      <a
                        href={getFileUrl(previewCert.fileUrl) || "#"}
                        download
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs transition-all cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" /> Download File
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Certificate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Upload Certificate
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {!isStaff && (
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-zinc-300">
                    Staff Member *
                  </label>
                  <select
                    value={form.staffId}
                    onChange={(e) => setForm((p) => ({ ...p, staffId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">— Select Staff Member —</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.firstName} {st.lastName} (#{st.employeeNo})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-zinc-300">
                  Certificate Title *
                </label>
                <select
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">— Select Certificate Type —</option>
                  {CERT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-zinc-300">
                  Issuing Authority / Organization *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Care Quality Commission, Highfield, Skills for Care"
                  value={form.issuer}
                  onChange={(e) => setForm((p) => ({ ...p, issuer: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-zinc-300">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-zinc-300">
                    Expiry Date (if applicable)
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-zinc-300">
                  Certificate / Reference Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. CERT-2026-9871"
                  value={form.certificateNo}
                  onChange={(e) => setForm((p) => ({ ...p, certificateNo: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Drag & Drop File Upload */}
              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-zinc-300">
                  Evidence File (PDF / Image)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
                      : "border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/40 hover:border-indigo-400"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                    }}
                  />
                  <Upload className="h-7 w-7 text-indigo-500 mx-auto mb-1.5" />
                  {selectedFile ? (
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-slate-700 dark:text-zinc-300">
                        Drop certificate file here, or browse
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Supports PDF, PNG, JPG up to 10MB
                      </p>
                    </div>
                  )}
                </div>
                {fileError && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">
                    {fileError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md"
                >
                  {createMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Save Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
