"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Plus,
  Search,
  Filter,
  User,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Stethoscope,
  Pill,
  Activity,
  Flame,
  Heart,
  Syringe,
  X,
  PenTool,
  Paperclip,
  Check,
  Eye,
  FileText,
} from "lucide-react";
import { competencyService } from "@/services/competency";
import { staffService } from "@/services/staff";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const COMPETENCY_TYPES = [
  { key: "hoist_safety", label: "Hoist Safety", icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { key: "medication_admin", label: "Medication Administration", icon: Pill, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { key: "fire_evacuation", label: "Fire Evacuation", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { key: "first_aid", label: "First Aid / BLS", icon: Heart, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { key: "infection_control", label: "Infection Control", icon: Stethoscope, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
  { key: "wound_care", label: "Wound Care", icon: Syringe, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
];

const CHECKLIST_TEMPLATES: Record<string, string[]> = {
  hoist_safety: [
    "Pre-use equipment check completed",
    "Correct sling selected for service user weight/build",
    "Sling positioned correctly without folds",
    "Spread bars attached correctly",
    "Loop attachments in appropriate position",
    "Hoist raised to transfer height before moving",
    "Service user verbal consent obtained",
    "Transfer completed smoothly without incident",
    "Post-use equipment left clean and stored correctly",
  ],
  medication_admin: [
    "5 Rights checked: Right Patient, Drug, Dose, Route, Time",
    "MAR chart signed before administration",
    "Medication dispensed from original packaging",
    "Expiry date checked on medication",
    "Service user positively identified (wristband/verbal)",
    "Service user consent obtained",
    "Medication administered correctly",
    "Any refusal or error documented immediately",
    "Controlled drugs locked away after use",
  ],
  fire_evacuation: [
    "Demonstrates knowledge of fire exit routes",
    "Can locate nearest fire extinguisher",
    "Knows how to raise the alarm",
    "Understands PEEP for service users",
    "Can operate fire doors correctly",
    "Assembly point identified correctly",
    "Knows not to use lifts during evacuation",
  ],
  first_aid: [
    "Scene safety assessment performed",
    "Correctly performs primary survey (ABCDE)",
    "Calls 999 at appropriate point",
    "Demonstrates correct CPR technique (30:2)",
    "AED pads placed correctly (if available)",
    "Recovery position demonstrated correctly",
    "Incident documented on body map / RIDDOR where required",
  ],
  infection_control: [
    "Performs correct 7-step hand wash technique",
    "Correct PPE donned in right sequence",
    "Correct PPE doffed without self-contamination",
    "Clinical waste disposed of in correct bin",
    "Sharps disposed of in correct sharps container",
    "Demonstrates awareness of IPC guidance",
    "Equipment cleaned with correct product",
  ],
  wound_care: [
    "Correct aseptic technique maintained throughout",
    "Wound assessed and documented using appropriate tool",
    "Dressing selected appropriate for wound stage",
    "Wound irrigated correctly if required",
    "Dressing applied correctly without contamination",
    "Completed wound care documentation",
    "Escalation pathway understood if wound deteriorates",
  ],
};

function StatusBadge({ status }: { status: string }) {
  if (status === "PASS") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        PASS
      </span>
    );
  }
  if (status === "FAIL") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400 border border-red-500/20">
        <XCircle className="h-3 w-3" />
        FAIL
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
      <AlertCircle className="h-3 w-3" />
      PENDING
    </span>
  );
}

export default function CompetenciesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<"select" | "checklist" | "signature">("select");
  const [selectedType, setSelectedType] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<number, boolean>>({});
  const [formData, setFormData] = useState({
    staffId: "",
    assessorNotes: "",
    evidenceUrl: "",
    assessedOn: new Date().toISOString().split("T")[0],
  });
  
  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");
  const [selectedAudit, setSelectedAudit] = useState<any>(null);

  const { data: competenciesRes, isLoading } = useQuery({
    queryKey: ["competencies"],
    queryFn: () => competencyService.findAll({ limit: 100 }),
    enabled: !!user,
  });

  const { data: staffRes } = useQuery({
    queryKey: ["staff-competencies-caregivers"],
    queryFn: () => staffService.findAll({ role: "STAFF", limit: 100 }),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => competencyService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competencies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      toast.success("Competency audit recorded successfully");
      closeModal();
    },
    onError: () => toast.error("Failed to record competency audit"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => competencyService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competencies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      toast.success("Audit deleted successfully");
    },
    onError: () => toast.error("Failed to delete competency audit"),
  });

  const competencies: any[] = competenciesRes?.data?.data?.data || [];
  const rawStaff = staffRes?.data?.data?.data ?? staffRes?.data?.data ?? [];
  const staff: any[] = Array.isArray(rawStaff) ? rawStaff : [];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
        openModal();
      }
    }
  }, []);

  // Initialize Canvas stroke styles
  useEffect(() => {
    if (activeStep === "signature" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#6366f1"; // Indigo-500
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [activeStep]);

  const filtered = competencies.filter((c) => {
    const matchSearch =
      search === "" ||
      c.staff?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      c.staff?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      c.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.level === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: competencies.length,
    passed: competencies.filter((c) => c.level === "PASS").length,
    failed: competencies.filter((c) => c.level === "FAIL").length,
    pending: competencies.filter((c) => !c.level || c.level === "PENDING").length,
  };

  const pendingAudits = competencies.filter((c) => !c.level || c.level === "PENDING");

  function conductPendingAudit(comp: any) {
    if (user?.role === "STAFF") return;
    setIsModalOpen(true);
    setFormData({
      staffId: comp.staffId || comp.staff?.id || "",
      assessorNotes: comp.assessorNotes || (comp.notes ? `[Caregiver Shift/Notes: ${comp.notes}]` : ""),
      evidenceUrl: comp.evidenceUrl || "",
      assessedOn: new Date().toISOString().split("T")[0],
    });
    setSignatureData("");
    if (comp.name && CHECKLIST_TEMPLATES[comp.name]) {
      handleSelectType(comp.name);
    } else {
      setActiveStep("select");
      setSelectedType("");
      setChecklist({});
    }
  }

  function openModal() {
    if (user?.role === "STAFF") return; // Security fix: Staff cannot create competencies
    setIsModalOpen(true);
    setActiveStep("select");
    setSelectedType("");
    setChecklist({});
    setSignatureData("");
    setFormData({
      staffId: "",
      assessorNotes: "",
      evidenceUrl: "",
      assessedOn: new Date().toISOString().split("T")[0]
    });
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleSelectType(key: string) {
    setSelectedType(key);
    const items = CHECKLIST_TEMPLATES[key] || [];
    const initial: Record<number, boolean> = {};
    items.forEach((_, i) => (initial[i] = false));
    setChecklist(initial);
    setActiveStep("checklist");
  }

  // Draw Signature event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Touch screen drawing handlers
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    setIsDrawing(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData("");
  };

  const captureSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Get image as base64 string
    const dataUrl = canvas.toDataURL("image/png");
    setSignatureData(dataUrl);
    toast.success("Signature captured successfully");
  };

  function handleSubmit() {
    if (!formData.staffId || !selectedType) {
      toast.error("Please select a staff member");
      return;
    }
    const items = CHECKLIST_TEMPLATES[selectedType] || [];
    const checkedCount = Object.values(checklist).filter(Boolean).length;
    
    // Pass if 100% checks met, fail otherwise
    const result = checkedCount === items.length ? "PASS" : "FAIL";
    
    const checklistData = items.map((item, i) => ({
      item,
      passed: !!checklist[i]
    }));

    createMutation.mutate({
      staffId: formData.staffId,
      name: selectedType,
      level: result,
      achievedOn: new Date(formData.assessedOn).toISOString(),
      expiresOn: new Date(new Date(formData.assessedOn).setFullYear(new Date(formData.assessedOn).getFullYear() + 1)).toISOString(), // 1 year expiry
      assessorNotes: formData.assessorNotes || "",
      evidenceUrl: formData.evidenceUrl || "",
      signature: signatureData || null,
      checklist: checklistData,
    });
  }

  const selectedTypeInfo = COMPETENCY_TYPES.find((t) => t.key === selectedType);
  const checklistItems = CHECKLIST_TEMPLATES[selectedType] || [];
  const passedCount = Object.values(checklist).filter(Boolean).length;
  const passRate = checklistItems.length > 0 ? Math.round((passedCount / checklistItems.length) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
            </div>
            Bedside Competency Auditor
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
            Digital bedside assessments — CQC Regulation 18 compliant
          </p>
        </div>
        {user?.role !== "STAFF" && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-505 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all duration-200 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Audit
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Audits", value: stats.total, icon: ShieldCheck, color: "text-indigo-400", bg: "bg-white dark:bg-zinc-900/50", filterKey: "all" },
          { label: "Passed (100%)", value: stats.passed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", filterKey: "PASS" },
          { label: "Failed (<100%)", value: stats.failed, icon: ShieldX, color: "text-red-400", bg: "bg-red-500/10", filterKey: "FAIL" },
          { label: "Pending Review", value: stats.pending, icon: ShieldAlert, color: "text-amber-400", bg: "bg-amber-500/10", filterKey: "PENDING" },
        ].map((stat) => (
          <Card
            key={stat.label}
            onClick={() => setFilterStatus(stat.filterKey)}
            className={`${stat.bg} border border-slate-200 dark:border-zinc-800 cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-indigo-500/30 active:scale-98 transition-all duration-200`}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-850/50">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{stat.value}</p>
                <p className="text-xs text-slate-600 dark:text-zinc-400">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Audit Requests Spotlight Banner */}
      {pendingAudits.length > 0 && user?.role !== "STAFF" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-500 flex-shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                  Pending Bedside Audit Requests
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-500 border border-amber-500/30">
                    {pendingAudits.length} Pending
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                  Caregivers have requested bedside observation sign-offs. Review checklist and provide digital hand signature.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilterStatus("PENDING")}
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              Filter Pending Requests <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingAudits.slice(0, 3).map((comp) => {
              const typeInfo = COMPETENCY_TYPES.find((t) => t.key === comp.name);
              const Icon = typeInfo?.icon || ShieldAlert;
              return (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900/80 border border-amber-500/20 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${typeInfo?.bg || "bg-amber-500/10 border-amber-500/20"}`}>
                      <Icon className={`h-4 w-4 ${typeInfo?.color || "text-amber-400"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                        {typeInfo?.label || comp.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                        {comp.staff ? `${comp.staff.firstName} ${comp.staff.lastName}` : "Staff Member"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => conductPendingAudit(comp)}
                    className="ml-3 flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-sm shadow-amber-500/20"
                  >
                    Conduct Audit
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 dark:text-zinc-400" />
          <Input
            placeholder="Search by staff name or competency type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-50 placeholder:text-slate-600 dark:text-zinc-400 focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "PASS", "FAIL", "PENDING"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                filterStatus === status
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
              }`}
            >
              {status === "all" ? "All Statuses" : status === "PENDING" ? "Pending Requests" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Competency Cards Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-slate-100/50 dark:bg-zinc-900/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-100/50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ShieldCheck className="h-12 w-12 text-slate-600" />
            <p className="text-slate-600 dark:text-zinc-400 font-medium">No competency audits found</p>
            <p className="text-slate-600 dark:text-zinc-400 text-sm">Start by clicking "New Audit" to record a bedside assessment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((comp) => {
            const typeInfo = COMPETENCY_TYPES.find((t) => t.key === comp.name);
            const Icon = typeInfo?.icon || ShieldCheck;
            return (
              <Card
                key={comp.id}
                onClick={() => setSelectedAudit(comp)}
                className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/40 cursor-pointer transition-all duration-200 group relative"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${typeInfo?.bg || "bg-slate-100/50 dark:bg-zinc-800/40 border-slate-600/50"}`}>
                      <Icon className={`h-5 w-5 ${typeInfo?.color || "text-slate-600 dark:text-zinc-400"}`} />
                    </div>
                    <StatusBadge status={comp.level || "PENDING"} />
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-zinc-50 text-sm mb-1">
                    {typeInfo?.label || comp.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/25 flex items-center justify-center">
                      <User className="h-3 w-3 text-indigo-400" />
                    </div>
                    <span className="text-sm text-slate-700 dark:text-zinc-300 font-medium">
                      {comp.staff ? `${comp.staff.firstName} ${comp.staff.lastName}` : "Unknown Caregiver"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {comp.achievedOn
                          ? new Date(comp.achievedOn).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                          : "Requested"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {comp.level === "PENDING" && user?.role !== "STAFF" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            conductPendingAudit(comp);
                          }}
                          className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors"
                        >
                          Conduct
                        </button>
                      )}
                      <div className="flex items-center gap-1 text-indigo-400 group-hover:underline">
                        <Eye className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedAudit(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/25">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-zinc-50 text-sm">Bedside Audit Log</h2>
                  <p className="text-xs text-slate-500">Record ID: {selectedAudit.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAudit(null)} className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Care Staff Member</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-zinc-200 mt-0.5">
                    {selectedAudit.staff ? `${selectedAudit.staff.firstName} ${selectedAudit.staff.lastName}` : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Audit Result</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedAudit.level} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Assessment Date</p>
                  <p className="text-sm text-slate-800 dark:text-zinc-300 font-medium mt-0.5">
                    {new Date(selectedAudit.achievedOn).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
                {selectedAudit.expiresOn && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Expiry Date</p>
                    <p className="text-sm text-slate-800 dark:text-zinc-300 font-medium mt-0.5">
                      {new Date(selectedAudit.expiresOn).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>

              {/* Checklist details */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessment Checklist Details</h3>
                {Array.isArray(selectedAudit.checklist) && selectedAudit.checklist.length > 0 ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {selectedAudit.checklist.map((cItem: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex items-start justify-between p-2.5 rounded-lg border text-xs ${
                          cItem.passed
                            ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                            : "bg-red-500/5 border-red-500/10 text-red-400"
                        }`}
                      >
                        <span className="font-medium text-slate-700 dark:text-zinc-300">{cItem.item}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-4 font-semibold text-[10px] uppercase">
                          {cItem.passed ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Passed
                            </>
                          ) : (
                            <>
                              <X className="h-3.5 w-3.5" />
                              Failed
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-zinc-400 italic">No checklist log was generated for this legacy record.</p>
                )}
              </div>

              {/* Assessor Notes */}
              {selectedAudit.assessorNotes && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessor Notes</h3>
                  <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-700 dark:text-zinc-350">
                    {selectedAudit.assessorNotes}
                  </div>
                </div>
              )}

              {/* Evidence Link */}
              {selectedAudit.evidenceUrl && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">External Evidence / Documents</h3>
                  <a
                    href={selectedAudit.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-all bg-indigo-500/5 px-3 py-2 rounded-lg border border-indigo-500/20"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Open Evidence Attachment
                  </a>
                </div>
              )}

              {/* Digital Signature */}
              {selectedAudit.signature && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Digital Signature Sign-off</h3>
                  <div className="p-2 border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 rounded-xl inline-block max-w-[280px]">
                    <img
                      src={selectedAudit.signature}
                      alt="Manager Hand Signature"
                      className="max-h-20 max-w-full object-contain dark:invert"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/30">
              {user?.role !== "STAFF" ? (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this audit log? This is non-reversible.")) {
                      deleteMutation.mutate(selectedAudit.id);
                      setSelectedAudit(null);
                    }
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-400 hover:underline transition-all cursor-pointer"
                >
                  Delete Log
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                {selectedAudit.level === "PENDING" && user?.role !== "STAFF" && (
                  <button
                    onClick={() => {
                      const comp = selectedAudit;
                      setSelectedAudit(null);
                      conductPendingAudit(comp);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-lg text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    Conduct Bedside Audit
                  </button>
                )}
                <button
                  onClick={() => setSelectedAudit(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Audit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/25 border border-indigo-500/30">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-zinc-50 text-sm">New Bedside Competency Audit</h2>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    {activeStep === "select"
                      ? "Step 1: Select Caregiver & Competency"
                      : activeStep === "checklist"
                      ? `Step 2: ${selectedTypeInfo?.label} Checklist`
                      : "Step 3: digital signature Sign-Off"}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6">
              {activeStep === "select" ? (
                <div className="space-y-4">
                  {/* Staff selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                      Staff Member Being Assessed *
                    </label>
                    {user?.role === "STAFF" && user?.staff ? (
                      // STAFF users: show their own name as a readonly field (auto-selected)
                      <div className="w-full rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-50 text-sm px-3 py-2.5 flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                        <span className="font-semibold">
                          {user.staff.firstName} {user.staff.lastName}
                        </span>
                        {staff.find((s) => s.id === formData.staffId)?.employeeNo && (
                          <span className="text-slate-400 text-xs">({staff.find((s) => s.id === formData.staffId)?.employeeNo})</span>
                        )}
                        <span className="ml-auto text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Auto-selected</span>
                      </div>
                    ) : (
                      // MANAGER/ADMIN: show full dropdown
                      <select
                        value={formData.staffId}
                        onChange={(e) => setFormData((p) => ({ ...p, staffId: e.target.value }))}
                        className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-50 text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">— Select staff member —</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.firstName} {s.lastName} ({s.employeeNo})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                      Date of Assessment *
                    </label>
                    <input
                      type="date"
                      value={formData.assessedOn}
                      onChange={(e) => setFormData((p) => ({ ...p, assessedOn: e.target.value }))}
                      className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-50 text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-3 block">
                      Select Competency Type *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {COMPETENCY_TYPES.map((type) => (
                        <button
                          key={type.key}
                          onClick={() => {
                            if (!formData.staffId) {
                              toast.error("Please select a staff member first");
                              return;
                            }
                            handleSelectType(type.key);
                          }}
                          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${type.bg}`}
                        >
                          <type.icon className={`h-5 w-5 ${type.color} flex-shrink-0`} />
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50 leading-tight">{type.label}</p>
                            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                              {CHECKLIST_TEMPLATES[type.key]?.length || 0} checks
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-600 dark:text-zinc-400 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeStep === "checklist" ? (
                <div className="space-y-5">
                  <button
                    onClick={() => setActiveStep("select")}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    ← Back to selection
                  </button>

                  <div className={`rounded-xl p-4 border ${selectedTypeInfo?.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {selectedTypeInfo && <selectedTypeInfo.icon className={`h-4 w-4 ${selectedTypeInfo.color}`} />}
                        <span className="text-sm font-semibold text-slate-900 dark:text-zinc-200">{selectedTypeInfo?.label}</span>
                      </div>
                      <span className={`text-lg font-bold ${passRate === 100 ? "text-emerald-400" : "text-red-400"}`}>
                        {passRate}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100/50 dark:bg-zinc-800/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passRate === 100 ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${passRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{passedCount} of {checklistItems.length} checks passed (Requires 100% for PASS)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                      Bedside Assessment Tasks
                    </label>
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                      {checklistItems.map((item, i) => (
                        <label
                          key={i}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            checklist[i]
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : "bg-slate-100/50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!checklist[i]}
                            onChange={(e) => setChecklist((p) => ({ ...p, [i]: e.target.checked }))}
                            className="mt-0.5 h-4 w-4 accent-emerald-500 flex-shrink-0"
                          />
                          <span className={`text-sm leading-snug ${checklist[i] ? "text-emerald-300" : "text-slate-700 dark:text-zinc-300"}`}>
                            {item}
                          </span>
                          {checklist[i] && <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 ml-auto mt-0.5" />}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                      Assessor Observation Notes
                    </label>
                    <textarea
                      value={formData.assessorNotes}
                      onChange={(e) => setFormData((p) => ({ ...p, assessorNotes: e.target.value }))}
                      placeholder="Input clinical notes, observations, areas of caution, or remarks..."
                      rows={3}
                      className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-50 text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 dark:text-zinc-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                      Evidence URL (Link to docs/photos, optional)
                    </label>
                    <Input
                      value={formData.evidenceUrl}
                      onChange={(e) => setFormData((p) => ({ ...p, evidenceUrl: e.target.value }))}
                      placeholder="e.g. Cloud Storage/Sharepoint URL containing physical sheets or photo evidence"
                      className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-50 placeholder:text-slate-600 focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveStep("checklist")}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    ← Back to checklist
                  </button>

                  <div className="text-center space-y-1">
                    <PenTool className="h-8 w-8 text-indigo-400 mx-auto" />
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100">Digital Assessor Sign-Off</h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">Please sign in the box below to authorize this clinical audit.</p>
                  </div>

                  {/* Draw Canvas Signature Pad */}
                  <div className="border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 rounded-xl overflow-hidden shadow-inner max-w-md mx-auto relative">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={180}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawingTouch}
                      onTouchMove={drawTouch}
                      onTouchEnd={stopDrawing}
                      className="w-full h-44 cursor-crosshair"
                    />
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <button
                        onClick={clearSignature}
                        className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={captureSignature}
                        className="px-2.5 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition-colors"
                      >
                        Save Ink
                      </button>
                    </div>
                  </div>
                  {signatureData && (
                    <div className="text-center">
                      <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Signature Captured Successfully!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-zinc-800 flex-shrink-0 bg-slate-50 dark:bg-zinc-950/20">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {activeStep === "checklist" && (
                <button
                  onClick={() => setActiveStep("signature")}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Proceed to Sign-off
                </button>
              )}
              {activeStep === "signature" && (
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || !signatureData}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  {createMutation.isPending ? "Submitting..." : "Submit Completed Audit"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
