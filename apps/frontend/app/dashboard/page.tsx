"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { 
  Users, 
  Award, 
  CheckCircle, 
  CheckCircle2,
  AlertOctagon, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Send,
  Bot,
  X,
  Activity,
  ShieldAlert,
  BookOpen,
  Loader2,
  FolderOpen,
  Camera,
  Building,
  HardDrive,
  HeartHandshake,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UploadCloud,
  FileCheck2,
  Clock,
  Plus,
  FileText,
  Download,
  Eye,
  Flame,
  Pill,
  Heart,
  Stethoscope,
  Syringe,
  FileBadge,
  CheckCheck,
  AlertCircle,
  XCircle,
  ExternalLink,
  Shield,
  File,
  Image as ImageIcon,
  Check,
  Info,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard";
import { copilotService } from "@/services/copilot";
import { reportService } from "@/services/report";
import { certificateService } from "@/services/certificate";
import { competencyService } from "@/services/competency";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { SendWarningModal } from "@/components/compliance/send-warning-modal";

// 8 CQC Regulation 18 Mandatory CPD Core Standards
const CQC_MANDATORY_COURSES = [
  {
    id: "safeguarding",
    title: "Safeguarding Adults (Level 2/3)",
    kloe: "SAFE",
    kloeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    frequency: "Annual Renewal",
    keywords: ["safeguard", "protection", "vulnerable", "safeguarding"],
    description: "Protection of vulnerable adults, modern slavery awareness, whistleblowing protocols, and reporting abuse.",
    icon: ShieldCheck,
  },
  {
    id: "moving_handling",
    title: "Moving & Handling & Hoist Safety",
    kloe: "SAFE",
    kloeColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    frequency: "Annual Renewal",
    keywords: ["moving", "handling", "hoist", "ergonomics", "sling", "transfer"],
    description: "Ergonomics, safe slide sheet transfers, and passive/active mechanical hoist operation.",
    icon: Activity,
  },
  {
    id: "medication",
    title: "Safe Administration of Medicines (Level 3)",
    kloe: "SAFE",
    kloeColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    frequency: "Annual Renewal",
    keywords: ["medication", "medicine", "mar", "prescri", "drug"],
    description: "5 Rights of administration, MAR charts, controlled drugs protocol, and adverse reaction management.",
    icon: Pill,
  },
  {
    id: "infection_control",
    title: "Infection Prevention & Control (IPC & PPE)",
    kloe: "SAFE",
    kloeColor: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    frequency: "Annual Renewal",
    keywords: ["infection", "ipc", "ppe", "hygiene", "aseptic", "clean"],
    description: "7-step hand hygiene, PPE donning/doffing sequence, barrier nursing, and clinical waste disposal.",
    icon: Stethoscope,
  },
  {
    id: "basic_life_support",
    title: "Basic Life Support & First Aid (BLS/CPR)",
    kloe: "SAFE",
    kloeColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    frequency: "Annual Renewal",
    keywords: ["first aid", "life support", "bls", "cpr", "resuscitation", "emergency"],
    description: "Cardiopulmonary resuscitation, automated external defibrillator (AED), and choking protocol.",
    icon: Heart,
  },
  {
    id: "fire_safety",
    title: "Fire Safety & Emergency Evacuation",
    kloe: "SAFE",
    kloeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    frequency: "Annual Renewal",
    keywords: ["fire", "evacuation", "extinguisher", "peep", "alarm"],
    description: "Fire prevention, alarm operations, PEEP awareness, and compartmental progressive evacuation.",
    icon: Flame,
  },
  {
    id: "food_hygiene",
    title: "Food Hygiene, Nutrition & Hydration",
    kloe: "EFFECTIVE",
    kloeColor: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    frequency: "3-Year Renewal",
    keywords: ["food", "nutrition", "hydration", "diet", "allergen", "iddsi"],
    description: "HACCP principles, textured diets (IDDSI levels), fluid balance recording, and choking risk mitigation.",
    icon: Award,
  },
  {
    id: "mental_capacity",
    title: "Mental Capacity Act & DoLS (MCA)",
    kloe: "EFFECTIVE",
    kloeColor: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    frequency: "2-Year Renewal",
    keywords: ["mental capacity", "mca", "dols", "deprivation", "liberty", "consent"],
    description: "5 statutory principles, best interest decisions, DoLS authorizations, and resident consent.",
    icon: BookOpen,
  },
];

const PRESET_ISSUERS = [
  "Blue Stream Academy",
  "Florence Academy",
  "Skills for Care",
  "e-Learning for Healthcare (HEE)",
  "Care Home In-House Practical Audit",
  "St John Ambulance",
  "British Red Cross",
];

function ComplianceRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} strokeWidth="4" stroke="#1e293b" fill="none" />
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

export default function DashboardPage() {
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"trainings" | "certificates">("trainings");
  const [staffActiveTab, setStaffActiveTab] = useState<"passport" | "competencies" | "certificates" | "trainings">("passport");
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "### 🩺 Virtual CQC Inspector Activated\n\nHello! I am your AI CQC compliance assistant. I monitor your training matrix and bedside competency records. Ask me anything, or choose a prompt below to begin:",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Deactivated/Inactive Users Filter state (defaults to active only)
  const [includeInactive, setIncludeInactive] = useState(false);

  // Caregiver Staff Edit profile modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });

  // Staff Certificate Upload Modal States
  const [isUploadCertModalOpen, setIsUploadCertModalOpen] = useState(false);
  const [certUploadData, setCertUploadData] = useState({
    title: "Safeguarding Adults (Level 2/3)",
    customTitle: "",
    issuer: "Blue Stream Academy",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    certificateNo: "",
  });
  const [certFile, setCertFile] = useState<File | null>(null);

  // Bedside Audit Request Modal States
  const [isAuditRequestModalOpen, setIsAuditRequestModalOpen] = useState(false);
  const [auditRequestData, setAuditRequestData] = useState({
    competency: "hoist_safety",
    shift: "Day Shift (08:00 - 16:00)",
    notes: "",
  });

  // Certificate Preview Modal
  const [previewCert, setPreviewCert] = useState<any | null>(null);

  // Warning Notice Modal States (3-channel: Email, Notification, Direct Chat)
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

  // Fetch Dashboard Summary with Inactive Toggle support
  const { data: summaryRes, isLoading: isManagerSummaryLoading } = useQuery({
    queryKey: ["dashboardSummary", includeInactive],
    queryFn: () => dashboardService.getSummary(includeInactive),
    enabled: !!user && user?.role !== "STAFF",
  });

  // Fetch Admin-only global summary
  const { data: adminSummaryRes, isLoading: isAdminSummaryLoading } = useQuery({
    queryKey: ["adminSummary"],
    queryFn: () => dashboardService.getAdminSummary(),
    enabled: !!user && user?.role === "ADMIN",
  });

  // Fetch Top Organizations (admin only)
  const { data: topOrgsRes } = useQuery({
    queryKey: ["topOrganizations"],
    queryFn: () => dashboardService.getTopOrganizations(),
    enabled: !!user && user?.role === "ADMIN",
  });

  // Fetch Recent Activities (admin only)
  const { data: recentActivityRes } = useQuery({
    queryKey: ["recentActivity"],
    queryFn: () => dashboardService.getRecentActivity(),
    enabled: !!user && user?.role === "ADMIN",
  });

  // Fetch Recent Notifications
  const { data: notificationsRes, isLoading: isNotificationsLoading } = useQuery({
    queryKey: ["recentNotifications"],
    queryFn: () => dashboardService.getRecentNotifications(),
    enabled: !!user && user?.role !== "STAFF",
  });

  // Fetch Expiring Certificates
  const { data: expiringCertsRes, isLoading: isCertsLoading } = useQuery({
    queryKey: ["expiringCertificates"],
    queryFn: () => dashboardService.getExpiringCertificates(),
    enabled: !!user && user?.role !== "STAFF",
  });

  // Fetch Expiring Trainings
  const { data: expiringTrainingsRes, isLoading: isTrainingsLoading } = useQuery({
    queryKey: ["expiringTrainings"],
    queryFn: () => dashboardService.getExpiringTrainings(),
    enabled: !!user && user?.role !== "STAFF",
  });

  // Fetch AI Risk Forecast
  const { data: forecastRes, isLoading: isForecastLoading } = useQuery({
    queryKey: ["riskForecast"],
    queryFn: () => copilotService.getForecast(),
    enabled: !!user && user?.role !== "STAFF",
  });

  // Fetch staff report for live compliance score (same source as Compliance Reports page)
  const { data: dashboardStaffReportRes } = useQuery({
    queryKey: ["dashboardStaffReport", includeInactive],
    queryFn: () =>
      reportService.getStaffReport({
        limit: 200,
        includeInactive: includeInactive ? "true" : "false",
      }),
    enabled: !!user && user?.role !== "STAFF",
  });

  // STAFF queries: Fetch single caregiver profile
  const { data: staffRes } = useQuery({
    queryKey: ["staffProfile", user?.staff?.id],
    queryFn: () => api.get(`/staff/${user?.staff?.id}`).then((res) => res.data),
    enabled: !!user && !!user?.staff?.id && user?.role === "STAFF",
  });

  const staffData = (staffRes as any)?.data ?? staffRes; // Unwrap API response envelope

  // Staff Certificate Upload Mutation
  const uploadCertMutation = useMutation({
    mutationFn: async (data: typeof certUploadData) => {
      const finalTitle = data.title === "OTHER" ? (data.customTitle || "Specialized CPD Training") : data.title;
      return certificateService.create({
        title: finalTitle,
        issuer: data.issuer,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        certificateNo: data.certificateNo || undefined,
        staffId: user?.staff?.id,
      }, certFile || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffProfile", user?.staff?.id] });
      queryClient.invalidateQueries({ queryKey: ["staffProfile"] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStaffReport"] });
      toast.success("Training certificate uploaded successfully & CQC Passport updated!");
      setIsUploadCertModalOpen(false);
      setCertFile(null);
      setCertUploadData({
        title: "Safeguarding Adults (Level 2/3)",
        customTitle: "",
        issuer: "Blue Stream Academy",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        certificateNo: "",
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to upload certificate. Please try again.");
    },
  });

  // Staff Bedside Audit Request Mutation
  const requestAuditMutation = useMutation({
    mutationFn: async (data: typeof auditRequestData) => {
      return competencyService.requestAudit({
        competency: data.competency,
        shift: data.shift,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffProfile", user?.staff?.id] });
      queryClient.invalidateQueries({ queryKey: ["competencies"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      toast.success("Bedside Audit Request sent to Shift Lead & Registered Manager!");
      setIsAuditRequestModalOpen(false);
      setAuditRequestData({
        competency: "hoist_safety",
        shift: "Day Shift (08:00 - 16:00)",
        notes: "",
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to submit audit request. Please try again.");
    },
  });

  // Fetch staff list for MANAGER/ADMIN performance overview table
  const { data: orgStaffListRes } = useQuery({
    queryKey: ["orgStaffList", includeInactive],
    queryFn: () => api.get("/staff", { params: { limit: 100, status: includeInactive ? undefined : "ACTIVE" } }).then((res) => res.data),
    enabled: !!user && user?.role !== "STAFF",
  });

  const orgStaffList: any[] = Array.isArray(orgStaffListRes?.data?.data)
    ? orgStaffListRes.data.data
    : Array.isArray(orgStaffListRes?.data)
    ? orgStaffListRes.data
    : [];

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Initialize edit form when staff data loads
  useEffect(() => {
    if (staffData) {
      setEditForm({
        firstName: staffData.firstName || "",
        lastName: staffData.lastName || "",
        phone: staffData.phone || "",
        address: staffData.address || "",
      });
      setAvatarPreview(staffData.avatarUrl ? (staffData.avatarUrl.startsWith("http") ? staffData.avatarUrl : `http://localhost:3001${staffData.avatarUrl}`) : "");
    }
  }, [staffData]);

  // Edit Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (formData: FormData) => api.patch(`/staff/${user?.staff?.id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
    onSuccess: async () => {
      await refetchUser();
      toast.success("Profile details updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["staffProfile", user?.staff?.id] });
      setIsEditModalOpen(false);
    },
    onError: () => {
      toast.error("Failed to update profile. Please try again.");
    },
  });

  const clearMockMutation = useMutation({
    mutationFn: () => api.post("/users/clear-mock"),
    onSuccess: () => {
      toast.success("Database mock data cleared successfully!");
      queryClient.invalidateQueries();
      window.location.reload();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to clear mock data");
    },
  });

  const handleClearMockData = () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete all care homes, managers, caregivers, certs, audits, and e-learning logs, leaving only your active administrator account. This cannot be undone.")) {
      clearMockMutation.mutate();
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("firstName", editForm.firstName);
    fd.append("lastName", editForm.lastName);
    fd.append("phone", editForm.phone || "");
    fd.append("address", editForm.address || "");
    if (avatarFile) {
      fd.append("avatar", avatarFile);
    }
    updateProfileMutation.mutate(fd);
  };

  const summary = summaryRes?.data?.data ?? summaryRes?.data ?? {
    totalStaff: 0,
    activeStaffCount: 0,
    inactiveStaffCount: 0,
    totalStaffCount: 0,
    totalTrainings: 0,
    totalCertificates: 0,
    totalCompetencies: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
    expiredCertificates: 0,
    expiringCertificates: 0,
  };

  const adminSummary = adminSummaryRes?.data?.data ?? adminSummaryRes?.data ?? {
    totalOrganizations: 0,
    totalManagers: 0,
    activeManagers: 0,
    inactiveManagers: 0,
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalCertificates: 0,
    totalCompetencies: 0,
    totalTrainings: 0,
    expiredCertificates: 0,
    expiringCertificates: 0,
    failedCompetencies: 0,
    unreadNotifications: 0,
  };

  const topOrgs: any[] = Array.isArray(topOrgsRes?.data?.data)
    ? topOrgsRes.data.data
    : Array.isArray(topOrgsRes?.data)
    ? topOrgsRes.data
    : [];

  const recentActivities = recentActivityRes?.data?.data ?? recentActivityRes?.data ?? { recentCerts: [], recentTrainings: [] };

  const rawNotifications = notificationsRes?.data?.data ?? notificationsRes?.data ?? [];
  const notifications: any[] = Array.isArray(rawNotifications) ? rawNotifications : [];
  // Deduplicate notifications by id to prevent duplicate entries in the Alert Timeline
  const uniqueNotifications = notifications.filter(
    (n: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.id === n.id) === idx
  );

  const rawExpiringCerts = expiringCertsRes?.data?.data ?? expiringCertsRes?.data ?? [];
  const expiringCerts: any[] = Array.isArray(rawExpiringCerts) ? rawExpiringCerts : [];

  const rawExpiringTrainings = expiringTrainingsRes?.data?.data ?? expiringTrainingsRes?.data ?? [];
  const expiringTrainings: any[] = Array.isArray(rawExpiringTrainings) ? rawExpiringTrainings : [];

  const forecastData = forecastRes?.data?.data ?? forecastRes?.data ?? {
    currentScore: 100,
    forecast: [
      { label: "Today", score: 100 },
      { label: "+30 Days", score: 95 },
      { label: "+60 Days", score: 85 },
      { label: "+90 Days", score: 70 }
    ],
    risks: []
  };

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Auto-switch to certificates tab if 0 expiring trainings but certificates exist
  useEffect(() => {
    if (expiringTrainings.length === 0 && expiringCerts.length > 0) {
      setActiveTab("certificates");
    }
  }, [expiringTrainings.length, expiringCerts.length]);

  // Compute live compliance score from real data (same formula as Compliance Reports page)
  const dashboardStaff: any[] = Array.isArray(dashboardStaffReportRes?.data?.data?.data)
    ? dashboardStaffReportRes.data.data.data
    : Array.isArray(dashboardStaffReportRes?.data?.data)
    ? dashboardStaffReportRes.data.data
    : Array.isArray(dashboardStaffReportRes?.data)
    ? dashboardStaffReportRes.data
    : [];

  const calculatedCompliance = (() => {
    const allTrainings = dashboardStaff.flatMap((s) => s.trainings || []);
    const allCompetencies = dashboardStaff.flatMap((s) => s.competencies || []);
    const expiredTrainings = allTrainings.filter(
      (t) => t.expiresOn && new Date(t.expiresOn) < new Date()
    ).length;
    const passedCompetencies = allCompetencies.filter((c) => c.level === "PASS").length;
    const total = allTrainings.length + allCompetencies.length;
    if (total === 0) return forecastData.currentScore; // fall back to forecast score if no data yet
    return Math.round(
      (((allTrainings.length - expiredTrainings) + passedCompetencies) / total) * 100
    );
  })();

  const getCqcRating = (score: number) => {
    if (score >= 90) return { label: "Outstanding", color: "text-emerald-500 dark:text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" };
    if (score >= 75) return { label: "Good", color: "text-blue-500 dark:text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" };
    if (score >= 55) return { label: "Requires Improvement", color: "text-amber-500 dark:text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" };
    return { label: "Inadequate", color: "text-rose-500 dark:text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10" };
  };

  const cqcRating = getCqcRating(calculatedCompliance);

  const formatShortDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isChatLoading) return;
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setInputPrompt("");
    setIsChatLoading(true);

    try {
      const res = await copilotService.chat(text);
      const assistantText = res.data?.data?.response || "I could not generate an analysis. Please try again.";
      setChatMessages((prev) => [...prev, { role: "assistant", text: assistantText }]);
    } catch (err: any) {
      toast.error("Failed to connect to AI Compliance Auditor");
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error contacting CQC AI Copilot. Check that the backend is active." }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  function getComplianceScore(staff: any): number {
    const trainings = staff?.trainings || [];
    const certs = staff?.certificates || [];
    const competencies = staff?.competencies || [];

    const now = new Date();
    const combined = [...certs, ...trainings];
    const uniqueItems = combined.reduce((acc: any[], curr: any) => {
      const norm = (curr.title || "").trim().toLowerCase();
      if (!acc.some((x: any) => (x.title || "").trim().toLowerCase() === norm)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    if (uniqueItems.length === 0 && competencies.length === 0) return 0;

    const validTrainings = uniqueItems.filter(
      (t: any) => (!t.expiresOn && !t.expiryDate) || new Date(t.expiresOn || t.expiryDate) > now
    ).length;

    const passedComps = competencies.filter(
      (c: any) => c.level === "PASS"
    ).length;

    const total = uniqueItems.length + competencies.length;
    if (total === 0) return 0;

    return Math.round(((validTrainings + passedComps) / total) * 100);
  }

  // Evaluate Course Status against CQC 8 Standards
  function getCourseComplianceStatus(course: typeof CQC_MANDATORY_COURSES[0], staff: any) {
    const allItems = [
      ...(staff?.certificates || []).map((c: any) => ({
        title: c.title,
        issuer: c.issuer,
        completedOn: c.issueDate,
        expiresOn: c.expiryDate,
        fileUrl: c.fileUrl,
        id: c.id,
        isCert: true,
        certificateNo: c.certificateNo,
      })),
      ...(staff?.trainings || []).map((t: any) => ({
        title: t.title,
        issuer: t.provider,
        completedOn: t.completedOn,
        expiresOn: t.expiresOn,
        fileUrl: null,
        id: t.id,
        isCert: false,
        certificateNo: null,
      })),
    ];

    const matched = allItems.filter(item => {
      const itemTitle = (item.title || "").toLowerCase();
      const courseTitle = course.title.toLowerCase();
      if (itemTitle.includes(courseTitle) || courseTitle.includes(itemTitle)) return true;
      return course.keywords.some(k => itemTitle.includes(k.toLowerCase()));
    });

    if (matched.length === 0) {
      return {
        status: "MISSING" as const,
        label: "Not Completed",
        record: null,
        daysLeft: null,
      };
    }

    matched.sort((a, b) => {
      const timeA = a.expiresOn ? new Date(a.expiresOn).getTime() : (a.completedOn ? new Date(a.completedOn).getTime() : 0);
      const timeB = b.expiresOn ? new Date(b.expiresOn).getTime() : (b.completedOn ? new Date(b.completedOn).getTime() : 0);
      return timeB - timeA;
    });

    const latest = matched[0];
    if (!latest.expiresOn) {
      return {
        status: "VALID" as const,
        label: "Valid (No Expiry)",
        record: latest,
        daysLeft: null,
      };
    }

    const now = new Date();
    const expDate = new Date(latest.expiresOn);
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: "EXPIRED" as const,
        label: `Expired ${Math.abs(diffDays)}d ago`,
        record: latest,
        daysLeft: diffDays,
      };
    } else if (diffDays <= 30) {
      return {
        status: "EXPIRING" as const,
        label: `Expires in ${diffDays}d`,
        record: latest,
        daysLeft: diffDays,
      };
    }

    return {
      status: "VALID" as const,
      label: `Valid (${diffDays}d left)`,
      record: latest,
      daysLeft: diffDays,
    };
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Wait for initial load only. If we have data, we just show stale data while refetching.
  if ((isManagerSummaryLoading && !summaryRes) || (isAdminSummaryLoading && !adminSummaryRes)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ==========================================
  // STAFF PERSONAL DASHBOARD & CQC RADAR
  // ==========================================
  if (user?.role === "STAFF") {
    const personalScore = staffData ? getComplianceScore(staffData) : 0;
    const personalRating = getCqcRating(personalScore);

    // Compute all staff items for Expiry Radar & Scorecards
    const rawStaffItems = [
      ...(staffData?.certificates || []).map((c: any) => ({
        type: "Certificate",
        title: c.title,
        issuer: c.issuer,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        fileUrl: c.fileUrl,
        certificateNo: c.certificateNo,
        id: c.id,
      })),
      ...(staffData?.trainings || []).map((t: any) => ({
        type: "e-Learning",
        title: t.title,
        issuer: t.provider,
        issueDate: t.completedOn,
        expiryDate: t.expiresOn,
        fileUrl: null,
        certificateNo: null,
        id: t.id,
      })),
    ];

    // Deduplicate by normalized course title so a training with an attached certificate isn't double-counted
    const allStaffItems = rawStaffItems.reduce((acc: any[], current: any) => {
      const normTitle = (current.title || "").trim().toLowerCase();
      const existingIdx = acc.findIndex((x) => (x.title || "").trim().toLowerCase() === normTitle);
      if (existingIdx === -1) {
        acc.push(current);
      } else {
        // If the current entry has a file proof, prefer it
        if (current.fileUrl && !acc[existingIdx].fileUrl) {
          acc[existingIdx] = current;
        }
      }
      return acc;
    }, []);

    const now = new Date();
    const expiredItems = allStaffItems.filter(item => item.expiryDate && new Date(item.expiryDate) < now);
    const expiringSoonItems = allStaffItems.filter(item => {
      if (!item.expiryDate) return false;
      const d = new Date(item.expiryDate);
      const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    });

    const passedCompetenciesCount = (staffData?.competencies || []).filter((c: any) => c.level === "PASS").length;
    const validTrainingsCount = allStaffItems.filter((item: any) => !item.expiryDate || new Date(item.expiryDate) >= now).length;

    // Open upload modal with prefilled course
    const openUploadModalWithCourse = (courseTitle: string) => {
      setCertUploadData({
        title: courseTitle,
        customTitle: "",
        issuer: "Blue Stream Academy",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        certificateNo: "",
      });
      setCertFile(null);
      setIsUploadCertModalOpen(true);
    };

    return (
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl border border-indigo-500/20 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            {staffData?.avatarUrl ? (
              <img 
                src={staffData.avatarUrl.startsWith("http") ? staffData.avatarUrl : `http://localhost:3001${staffData.avatarUrl}`} 
                alt="Avatar" 
                className="h-16 w-16 rounded-2xl object-cover border-2 border-indigo-400/40 shadow-xl flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white text-xl font-extrabold shadow-xl flex-shrink-0 border-2 border-white/20">
                {staffData ? `${staffData.firstName?.charAt(0) || ""}${staffData.lastName?.charAt(0) || ""}`.toUpperCase() || "US" : "C"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CQC Reg 18 Staff Portal
                </span>
                <span className="text-xs text-indigo-200">
                  {staffData?.employeeNo ? `ID: ${staffData.employeeNo}` : ""}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-white">
                {staffData ? `${staffData.firstName} ${staffData.lastName}` : user?.email}
              </h1>
              <p className="text-indigo-200/80 text-xs md:text-sm mt-0.5 flex items-center gap-2">
                <span>{staffData?.jobTitle || "Care Staff Member"}</span>
                <span>•</span>
                <span>{staffData?.department || "Care & Nursing"}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Active On-Duty</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
            <button
              onClick={() => openUploadModalWithCourse("Safeguarding Adults (Level 2/3)")}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs px-4.5 py-3 rounded-xl shadow-lg transition-all cursor-pointer hover:scale-102 active:scale-98"
            >
              <UploadCloud className="h-4 w-4" />
              Upload Certificate / CPD
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-3 rounded-xl border border-white/10 shadow transition-all cursor-pointer hover:scale-102"
              title="Edit Contact & Profile"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden md:inline">Edit Profile</span>
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* URGENT EXPIRY RADAR WARNING BANNER */}
        {/* ========================================== */}
        {expiredItems.length > 0 ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 backdrop-blur-sm shadow-xl shadow-rose-500/5 animate-pulse-subtle">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                  <AlertOctagon className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      CRITICAL COMPLIANCE BREACH
                    </span>
                    <span className="text-xs text-rose-500 font-bold">
                      CQC Regulation 18 (Staffing) Alert
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-extrabold text-rose-700 dark:text-rose-400 mt-1">
                    {expiredItems.length} Mandatory Certification{expiredItems.length > 1 ? "s" : ""} Expired!
                  </h3>
                  <p className="text-xs text-rose-700/90 dark:text-rose-300/80 mt-0.5">
                    Your mandatory training certificate has lapsed. Please upload updated refresher evidence immediately.
                  </p>
                </div>
              </div>
              <button
                onClick={() => openUploadModalWithCourse(expiredItems[0]?.title || "Safeguarding Adults (Level 2/3)")}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap hover:scale-102"
              >
                <UploadCloud className="h-4 w-4" />
                Upload Renewed Certificate
              </button>
            </div>
            <div className="mt-4 pt-3.5 border-t border-rose-500/20 flex flex-wrap gap-2">
              {expiredItems.map((item, idx) => (
                <div key={idx} className="inline-flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                    <strong>{item.title}</strong>
                    <span className="text-[11px] opacity-80">(Expired: {formatShortDate(item.expiryDate)})</span>
                  </span>
                  <button
                    onClick={() => openUploadModalWithCourse(item.title)}
                    className="text-[10px] font-bold underline hover:text-rose-900 dark:hover:text-white cursor-pointer ml-1"
                  >
                    Renew Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : expiringSoonItems.length > 0 ? (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 backdrop-blur-sm shadow-xl shadow-amber-500/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      UPCOMING RENEWAL RADAR
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                      Expires in &le; 30 Days
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-extrabold text-amber-800 dark:text-amber-300 mt-1">
                    {expiringSoonItems.length} Certification{expiringSoonItems.length > 1 ? "s" : ""} Expiring Soon
                  </h3>
                  <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                    Upload your renewed e-learning certificate or schedule a bedside refresher before expiry.
                  </p>
                </div>
              </div>
              <button
                onClick={() => openUploadModalWithCourse(expiringSoonItems[0]?.title || "Moving & Handling & Hoist Safety")}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap hover:scale-102"
              >
                <UploadCloud className="h-4 w-4" />
                Upload Renewal Certificate
              </button>
            </div>
            <div className="mt-4 pt-3.5 border-t border-amber-500/20 flex flex-wrap gap-2">
              {expiringSoonItems.map((item, idx) => (
                <div key={idx} className="inline-flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <strong>{item.title}</strong>
                    <span className="text-[11px] opacity-80">(Expires: {formatShortDate(item.expiryDate)})</span>
                  </span>
                  <button
                    onClick={() => openUploadModalWithCourse(item.title)}
                    className="text-[10px] font-bold underline hover:text-amber-950 dark:hover:text-white cursor-pointer ml-1"
                  >
                    Upload Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4.5 backdrop-blur-sm shadow-md flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  🛡️ CQC Radar All-Clear: Fully Compliant
                </h3>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  All CQC Regulation 18 mandatory modules and practical bedside competencies are active and up-to-date.
                </p>
              </div>
            </div>
            <button
              onClick={() => openUploadModalWithCourse("Safeguarding Adults (Level 2/3)")}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Extra CPD
            </button>
          </div>
        )}

        {/* ========================================== */}
        {/* PERSONAL METRIC SCORECARDS */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* CQC Compliance Score Ring */}
          <Card className="shadow-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Overall Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-1">
              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {personalScore}%
                </div>
                <div className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${personalRating.border} ${personalRating.bg} ${personalRating.color}`}>
                  <Sparkles className="h-3 w-3" />
                  {personalRating.label}
                </div>
              </div>
              <div className="relative flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="26" className="stroke-slate-100 dark:stroke-zinc-800" strokeWidth="5" fill="transparent" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    className="transition-all duration-1000 ease-out"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={163}
                    strokeDashoffset={163 - (163 * personalScore) / 100}
                    strokeLinecap="round"
                    stroke={personalScore >= 80 ? "#10b981" : personalScore >= 60 ? "#f59e0b" : "#ef4444"}
                  />
                </svg>
                <div className="absolute text-center">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* e-Learning Courses */}
          <Card className="shadow-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Completed e-Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {validTrainingsCount}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Logged CPD modules & certificates
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Practical Bedside Audits */}
          <Card className="shadow-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Bedside Competencies
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {passedCompetenciesCount}
                  </div>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
                    Verified clinical observations
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Renewal Status */}
          <Card className="shadow-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${expiredItems.length > 0 ? "bg-rose-500" : expiringSoonItems.length > 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-3xl font-black ${expiredItems.length > 0 ? "text-rose-500" : expiringSoonItems.length > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                    {expiredItems.length + expiringSoonItems.length}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    {expiredItems.length > 0 ? "Expired certifications" : expiringSoonItems.length > 0 ? "Expiring in <= 30 days" : "All certificates current"}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${expiredItems.length > 0 ? "bg-rose-500/10 text-rose-500" : expiringSoonItems.length > 0 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========================================== */}
        {/* INTERACTIVE NAVIGATION TABS */}
        {/* ========================================== */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStaffActiveTab("passport")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffActiveTab === "passport"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                <Award className="h-4 w-4" />
                CQC Mandatory CPD Passport (8 Core)
              </button>
              <button
                onClick={() => setStaffActiveTab("competencies")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffActiveTab === "competencies"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Bedside Practical Competencies ({staffData?.competencies?.length || 0})
              </button>
              <button
                onClick={() => setStaffActiveTab("certificates")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffActiveTab === "certificates"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                Certificate Evidence Vault ({staffData?.certificates?.length || 0})
              </button>
              <button
                onClick={() => setStaffActiveTab("trainings")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffActiveTab === "trainings"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                e-Learning Matrix Logs ({staffData?.trainings?.length || 0})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openUploadModalWithCourse("Safeguarding Adults (Level 2/3)")}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Certificate
              </button>
            </div>
          </div>

          {/* TAB 1: CQC 8 MANDATORY CPD PASSPORT GRID */}
          {staffActiveTab === "passport" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 dark:bg-zinc-900/60 p-4.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    CQC Regulation 18 Mandatory Training Passport
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    UK Care Quality Commission statutory training standards required for every active caregiver.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Valid</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" /> Expiring Soon</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" /> Expired</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-400 inline-block" /> Missing</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {CQC_MANDATORY_COURSES.map((course) => {
                  const check = getCourseComplianceStatus(course, staffData);
                  const Icon = course.icon;

                  return (
                    <div
                      key={course.id}
                      className={`relative flex flex-col justify-between rounded-2xl bg-white dark:bg-zinc-900 border p-5 shadow-md hover:shadow-xl transition-all duration-300 ${
                        check.status === "VALID"
                          ? "border-emerald-500/30 hover:border-emerald-500/60"
                          : check.status === "EXPIRING"
                          ? "border-amber-500/40 hover:border-amber-500/70"
                          : check.status === "EXPIRED"
                          ? "border-rose-500/40 hover:border-rose-500/70"
                          : "border-slate-200 dark:border-zinc-800 hover:border-slate-400"
                      }`}
                    >
                      <div>
                        {/* Top KLOE Badge & Status */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${course.kloeColor}`}>
                            CQC {course.kloe}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              check.status === "VALID"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : check.status === "EXPIRING"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
                                : check.status === "EXPIRED"
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700"
                            }`}
                          >
                            {check.status === "VALID" && <CheckCircle2 className="h-3 w-3" />}
                            {check.status === "EXPIRING" && <Clock className="h-3 w-3" />}
                            {check.status === "EXPIRED" && <AlertCircle className="h-3 w-3" />}
                            {check.status === "MISSING" && <XCircle className="h-3 w-3" />}
                            {check.label}
                          </span>
                        </div>

                        {/* Title & Icon */}
                        <div className="flex items-start gap-3 mt-1">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            check.status === "VALID" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white leading-tight">
                              {course.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              {course.frequency}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-3 line-clamp-2">
                          {course.description}
                        </p>

                        {/* Record Details if exists */}
                        {check.record && (
                          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-zinc-800 text-[10px] space-y-1 text-slate-600 dark:text-zinc-300">
                            <p className="flex justify-between">
                              <span className="text-slate-400">Issuer:</span>
                              <span className="font-bold truncate max-w-[140px]">{check.record.issuer || "Online CPD"}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">Completed:</span>
                              <span className="font-medium">{formatShortDate(check.record.completedOn)}</span>
                            </p>
                            {check.record.expiresOn && (
                              <p className="flex justify-between">
                                <span className="text-slate-400">Expires:</span>
                                <span className={`font-bold ${check.status === 'EXPIRED' ? 'text-rose-500' : check.status === 'EXPIRING' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  {formatShortDate(check.record.expiresOn)}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-2">
                        {check.status === "VALID" ? (
                          <button
                            onClick={() => openUploadModalWithCourse(course.title)}
                            className="w-full py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <UploadCloud className="h-3.5 w-3.5" />
                            Update Evidence
                          </button>
                        ) : check.status === "EXPIRING" ? (
                          <button
                            onClick={() => openUploadModalWithCourse(course.title)}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <UploadCloud className="h-3.5 w-3.5" />
                            Upload Renewal
                          </button>
                        ) : check.status === "EXPIRED" ? (
                          <button
                            onClick={() => openUploadModalWithCourse(course.title)}
                            className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <UploadCloud className="h-3.5 w-3.5" />
                            Re-Certify Now
                          </button>
                        ) : (
                          <button
                            onClick={() => openUploadModalWithCourse(course.title)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Upload Certificate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: BEDSIDE PRACTICAL COMPETENCIES */}
          {staffActiveTab === "competencies" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 p-5 rounded-2xl border border-purple-500/20">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-purple-500" />
                    Bedside Competencies & Practical Observation Checklist
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Physical on-ward competency verifications signed off by Registered Nurses & Managers.
                  </p>
                </div>
                <button
                  onClick={() => setIsAuditRequestModalOpen(true)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer hover:scale-102"
                >
                  <Plus className="h-4 w-4" />
                  Request Bedside Audit Check
                </button>
              </div>

              {(!staffData?.competencies || staffData?.competencies?.length === 0) ? (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-10 text-center space-y-4 shadow-sm">
                  <div className="h-16 w-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-500">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    No Bedside Competency Audits Logged Yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                    CQC audits require practical bedside observation (e.g. Hoist Safety sling fitting, Medication 5-Rights observation) alongside online e-learning.
                  </p>
                  <button
                    onClick={() => setIsAuditRequestModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl shadow transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Request Audit Observation Shift
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {staffData.competencies.map((c: any) => (
                    <div
                      key={c.id}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-md flex flex-col justify-between hover:border-purple-500/40 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                            Practical Audit
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.level === "PASS"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : c.level === "PENDING"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
                              : "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                          }`}>
                            {c.level === "PENDING" ? "PENDING REVIEW" : c.level}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {c.name ? c.name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Practical Bedside Audit"}
                        </h4>

                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          {c.level === "PENDING" ? "Requested: " : "Audited: "}
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">{formatShortDate(c.achievedOn)}</span>
                        </p>

                        {c.assessorNotes && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 italic">
                            &quot;{c.assessorNotes}&quot;
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs text-slate-400 overflow-hidden">
                        {c.level === "PENDING" ? (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
                            <Clock className="h-4 w-4 text-amber-500 animate-pulse flex-shrink-0" />
                            <span>Awaiting Manager Observation</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            {c.signature && (c.signature.startsWith("data:") || c.signature.startsWith("http") || c.signature.length > 50) ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                  Assessor Verified
                                </span>
                                {c.signature.startsWith("data:") && (
                                  <img
                                    src={c.signature}
                                    alt="Assessor Signature"
                                    className="h-6 max-w-[80px] object-contain rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-1 py-0.5"
                                    title="Digital Hand Signature Verified"
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                                {c.signature ? `Assessor: ${c.signature}` : "Assessor Verified"}
                              </span>
                            )}
                          </div>
                        )}
                        {c.expiresOn && (
                          <span className="text-[10px] flex-shrink-0">
                            Exp: {formatShortDate(c.expiresOn)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CERTIFICATES EVIDENCE VAULT */}
          {staffActiveTab === "certificates" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-zinc-900/60 p-4.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                    Uploaded Certificate Evidence Gallery
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Official CPD credentials, DBS documentation, and accredited training proof.
                  </p>
                </div>
                <button
                  onClick={() => openUploadModalWithCourse("Safeguarding Adults (Level 2/3)")}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all cursor-pointer hover:scale-102"
                >
                  <Plus className="h-4 w-4" />
                  Upload New Certificate
                </button>
              </div>

              {(!staffData?.certificates || staffData?.certificates?.length === 0) ? (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-10 text-center space-y-4 shadow-sm">
                  <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
                    <FileBadge className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    No Certificates Uploaded Yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                    Upload your e-learning certificates or diplomas (PDF, PNG, JPG) so your manager can verify them on the CQC Inspection Pack.
                  </p>
                  <button
                    onClick={() => openUploadModalWithCourse("Safeguarding Adults (Level 2/3)")}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl shadow transition-all cursor-pointer"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Upload First Certificate
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {staffData.certificates.map((cert: any) => {
                    const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
                    const isExpiring = cert.expiryDate && !isExpired && (new Date(cert.expiryDate).getTime() - Date.now()) <= 30 * 24 * 60 * 60 * 1000;

                    return (
                      <div
                        key={cert.id}
                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-md flex flex-col justify-between hover:shadow-lg transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 truncate max-w-[150px]">
                              {cert.issuer || "Accredited CPD"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isExpired
                                ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                                : isExpiring
                                ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                            }`}>
                              {isExpired ? "EXPIRED" : isExpiring ? "EXPIRING" : "VALID"}
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {cert.title}
                          </h4>

                          {cert.certificateNo && (
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              Ref: #{cert.certificateNo}
                            </p>
                          )}

                          <div className="mt-4 space-y-1 text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-xl">
                            <p className="flex justify-between">
                              <span>Issued On:</span>
                              <strong className="text-slate-700 dark:text-zinc-300">{formatShortDate(cert.issueDate)}</strong>
                            </p>
                            <p className="flex justify-between">
                              <span>Expires On:</span>
                              <strong className={isExpired ? "text-rose-500 font-bold" : isExpiring ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                                {formatShortDate(cert.expiryDate)}
                              </strong>
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                          {cert.fileUrl ? (
                            <a
                              href={cert.fileUrl.startsWith("http") ? cert.fileUrl : `http://localhost:3001${cert.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                              View Document
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No document file attached</span>
                          )}

                          <button
                            onClick={() => openUploadModalWithCourse(cert.title)}
                            className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 hover:text-blue-500 cursor-pointer"
                          >
                            Replace / Renew
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ALL E-LEARNING LOGS */}
          {staffActiveTab === "trainings" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  Historical e-Learning Training Matrix Records
                </h3>

                {(!staffData?.trainings || staffData?.trainings?.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4">No e-learning items recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {staffData.trainings.map((t: any) => (
                      <div
                        key={t.id}
                        className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs hover:border-indigo-500/30 transition-all"
                      >
                        <div>
                          <p className="font-bold text-sm text-slate-850 dark:text-zinc-100">{t.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Provider: <span className="font-semibold text-slate-600 dark:text-zinc-300">{t.provider}</span> • Completed: {formatShortDate(t.completedOn)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {t.expiresOn && (
                            <span className={`text-[10px] px-3 py-1 rounded-full font-bold ${
                              new Date(t.expiresOn) > new Date()
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            }`}>
                              Expires: {formatShortDate(t.expiresOn)}
                            </span>
                          )}
                          <button
                            onClick={() => openUploadModalWithCourse(t.title)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Upload Certificate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* CERTIFICATE UPLOAD MODAL */}
        {/* ========================================== */}
        {isUploadCertModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsUploadCertModalOpen(false)} />
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg p-6 md:p-8 relative z-10 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-extrabold text-lg md:text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    <UploadCloud className="h-6 w-6 text-emerald-500" />
                    Upload Training Certificate
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Attach PDF or Image to update your CQC Regulation 18 Passport.
                  </p>
                </div>
                <button onClick={() => setIsUploadCertModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  uploadCertMutation.mutate(certUploadData);
                }}
                className="space-y-4 text-xs"
              >
                {/* Course Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Mandatory CQC Course / Topic
                  </label>
                  <select
                    value={certUploadData.title}
                    onChange={(e) => setCertUploadData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  >
                    {CQC_MANDATORY_COURSES.map(c => (
                      <option key={c.id} value={c.title}>{c.title} ({c.kloe})</option>
                    ))}
                    <option value="OTHER">Other / Specialized Training</option>
                  </select>
                </div>

                {certUploadData.title === "OTHER" && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-zinc-300">Custom Course Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Dementia Awareness Tier 2"
                      value={certUploadData.customTitle}
                      onChange={(e) => setCertUploadData(prev => ({ ...prev, customTitle: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                )}

                {/* Issuer / Provider */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Training Provider / Issuing Body
                  </label>
                  <input
                    type="text"
                    value={certUploadData.issuer}
                    onChange={(e) => setCertUploadData(prev => ({ ...prev, issuer: e.target.value }))}
                    placeholder="e.g. Blue Stream Academy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    required
                  />
                  {/* Preset Issuer Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_ISSUERS.map(issuer => (
                      <button
                        key={issuer}
                        type="button"
                        onClick={() => setCertUploadData(prev => ({ ...prev, issuer }))}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] text-slate-600 dark:text-zinc-400 hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                      >
                        {issuer}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-zinc-300">Completion / Issue Date</label>
                    <input
                      type="date"
                      value={certUploadData.issueDate}
                      onChange={(e) => setCertUploadData(prev => ({ ...prev, issueDate: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-zinc-300">Expiry Date</label>
                    <input
                      type="date"
                      value={certUploadData.expiryDate}
                      onChange={(e) => setCertUploadData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Quick Expiry Duration Helpers */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">Quick Valid Period:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const base = new Date(certUploadData.issueDate || Date.now());
                      base.setFullYear(base.getFullYear() + 1);
                      setCertUploadData(prev => ({ ...prev, expiryDate: base.toISOString().split("T")[0] }));
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/20 cursor-pointer"
                  >
                    +1 Year (Annual)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const base = new Date(certUploadData.issueDate || Date.now());
                      base.setFullYear(base.getFullYear() + 2);
                      setCertUploadData(prev => ({ ...prev, expiryDate: base.toISOString().split("T")[0] }));
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-indigo-600 hover:bg-indigo-500/20 cursor-pointer"
                  >
                    +2 Years
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const base = new Date(certUploadData.issueDate || Date.now());
                      base.setFullYear(base.getFullYear() + 3);
                      setCertUploadData(prev => ({ ...prev, expiryDate: base.toISOString().split("T")[0] }));
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-blue-600 hover:bg-blue-500/20 cursor-pointer"
                  >
                    +3 Years
                  </button>
                </div>

                {/* Certificate Number */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Certificate / Verification Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BSA-2026-98124"
                    value={certUploadData.certificateNo}
                    onChange={(e) => setCertUploadData(prev => ({ ...prev, certificateNo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                {/* File Attachment Dropzone */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Attach Document Proof (PDF or Image)</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-zinc-800/30">
                    <input
                      type="file"
                      id="cert-file-input"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCertFile(file);
                      }}
                    />
                    <label htmlFor="cert-file-input" className="cursor-pointer block">
                      {certFile ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                          <FileBadge className="h-5 w-5" />
                          <span>{certFile.name} ({(certFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <UploadCloud className="h-7 w-7 text-slate-400 mx-auto" />
                          <p className="font-semibold text-slate-700 dark:text-zinc-300">Click to browse or drag certificate</p>
                          <p className="text-[10px] text-slate-400">PDF, PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadCertMutation.isPending}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex justify-center items-center gap-2 mt-4"
                >
                  {uploadCertMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading & Syncing Passport...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Upload & Update CQC Passport
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* REQUEST BEDSIDE AUDIT MODAL */}
        {/* ========================================== */}
        {isAuditRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAuditRequestModalOpen(false)} />
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-purple-500" />
                    Request Bedside Audit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Notify your Registered Manager / Nurse to observe a practical check.
                  </p>
                </div>
                <button onClick={() => setIsAuditRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  requestAuditMutation.mutate(auditRequestData);
                }}
                className="space-y-4 text-xs"
              >
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Competency Topic to Assess</label>
                  <select
                    value={auditRequestData.competency}
                    onChange={(e) => setAuditRequestData(prev => ({ ...prev, competency: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                  >
                    <option value="hoist_safety">Hoist Safety & Mechanical Sling Transfer</option>
                    <option value="medication_admin">Medication Administration & MAR Verification</option>
                    <option value="infection_control">Infection Prevention & PPE Donning/Doffing</option>
                    <option value="first_aid">First Aid & Basic Life Support (BLS)</option>
                    <option value="fire_evacuation">Fire Safety & Emergency Evacuation</option>
                    <option value="wound_care">Wound Care & Aseptic Clinical Technique</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Preferred Shift / Time</label>
                  <select
                    value={auditRequestData.shift}
                    onChange={(e) => setAuditRequestData(prev => ({ ...prev, shift: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                  >
                    <option value="Day Shift (08:00 - 16:00)">Day Shift (08:00 - 16:00)</option>
                    <option value="Late Shift (14:00 - 22:00)">Late Shift (14:00 - 22:00)</option>
                    <option value="Night Shift (20:00 - 08:00)">Night Shift (20:00 - 08:00)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Notes for Assessor</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Completed online hoist module, ready for practical sling fitting assessment."
                    value={auditRequestData.notes}
                    onChange={(e) => setAuditRequestData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={requestAuditMutation.isPending}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex justify-center items-center gap-2 mt-4 disabled:opacity-60"
                >
                  {requestAuditMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Submit Audit Request
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* EDIT PROFILE MODAL */}
        {/* ========================================== */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Edit Profile Details</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="relative group cursor-pointer">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar Preview" 
                        className="h-20 w-20 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 text-lg font-bold border border-dashed border-slate-300 dark:border-zinc-700 shadow-inner">
                        {user?.staff?.firstName?.[0] || "U"}{user?.staff?.lastName?.[0] || ""}
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-5 w-5 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Update profile image</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">First Name</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 animate-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 animate-none"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Home Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer flex justify-center items-center gap-2"
                >
                  {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================
  if (user?.role === "ADMIN") {
    return (
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">Admin Console</h1>
            </div>
            <p className="text-slate-500 dark:text-zinc-400 text-sm ml-12">Global Enterprise Multi-Tenant CQC Audit Matrix</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs">
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Include Inactive</span>
              <button 
                type="button"
                onClick={() => setIncludeInactive(!includeInactive)} 
                className="text-blue-500 focus:outline-none cursor-pointer transition-colors"
                title="Toggle showing inactive users in summary statistics"
              >
                {includeInactive ? <ToggleRight className="h-7 w-7 text-blue-500" /> : <ToggleLeft className="h-7 w-7 text-slate-400" />}
              </button>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Live Sync</span>
            </div>
          </div>
        </div>

        {/* Premium Global Statistics Cards — all clickable */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Organizations */}
          <Link href="/dashboard/organizations" className="group block">
            <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-indigo-600 rounded-l-2xl" />
              <div className="pl-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Organizations</p>
                  <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <Building className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">{adminSummary.totalOrganizations}</h2>
                <span className="text-[9px] text-slate-400 mt-1 block">Care homes registered</span>
              </div>
            </div>
          </Link>

          {/* Total Managers */}
          <Link href="/dashboard/staff?role=MANAGER" className="group block">
            <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-2xl" />
              <div className="pl-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Managers</p>
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                    <UserCheck className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">{adminSummary.totalManagers}</h2>
                <span className="text-[9px] text-slate-400 mt-1 block">
                  {adminSummary.activeManagers} active
                </span>
              </div>
            </div>
          </Link>

          {/* Total Staff */}
          <Link href="/dashboard/staff?role=STAFF" className="group block">
            <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl" />
              <div className="pl-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Staff</p>
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">{includeInactive ? adminSummary.totalStaff : adminSummary.activeStaff}</h2>
                <span className="text-[9px] text-slate-400 mt-1 block">
                  {includeInactive ? `${adminSummary.activeStaff} active` : `${adminSummary.activeStaff} active`}
                </span>
              </div>
            </div>
          </Link>

          {/* Total Users */}
          <Link href="/dashboard/organizations/users" className="group block">
            <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/40 overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-500 to-emerald-500 rounded-l-2xl" />
              <div className="pl-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Users</p>
                  <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">{includeInactive ? adminSummary.totalUsers : adminSummary.activeUsers}</h2>
                <span className="text-[9px] text-slate-400 mt-1 block">
                  {adminSummary.activeUsers} active accounts
                </span>
              </div>
            </div>
          </Link>

          {/* Practical Checks */}
          <Link href="/dashboard/competencies" className="group block">
            <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/40 overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-500 to-pink-500 rounded-l-2xl" />
              <div className="pl-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Practical Checks</p>
                  <div className="h-7 w-7 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                    <CheckCircle className="h-3.5 w-3.5 text-rose-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">{adminSummary.totalCompetencies}</h2>
                <span className="text-[9px] text-rose-500 font-semibold mt-1 block">{adminSummary.failedCompetencies} failed</span>
              </div>
            </div>
          </Link>

          {/* e-Learning */}
          <Link href="/dashboard/training-matrix" className="group block">
            <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-green-500 rounded-l-2xl" />
              <div className="pl-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">e-Learning</p>
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">{adminSummary.totalTrainings}</h2>
                <span className="text-[9px] text-slate-400 mt-1 block">Completed courses</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Analytics Charts + System Health Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Staff Headcount Trend */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div>
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Staff Headcount Growth</span>
              <h4 className="text-base font-bold mt-0.5 text-slate-800 dark:text-zinc-200">Active Care Staff Trend</h4>
            </div>
            <div className="relative h-24">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="staffGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 72 Q 60 56 120 40 T 240 24 T 300 8" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 0 72 Q 60 56 120 40 T 240 24 T 300 8 L 300 80 L 0 80 Z" fill="url(#staffGrad)" />
                <circle cx="300" cy="8" r="4" fill="#3b82f6" />
                <circle cx="0" cy="72" r="3" fill="#3b82f6" fillOpacity="0.5" />
              </svg>
              <div className="absolute top-0 right-0 flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3 text-blue-500" />
                <span className="text-[9px] font-bold text-blue-500">+12.5%</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Steady onboarding growth projected this month.</p>
          </div>

          {/* Org Registrations Trend */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Registered Facilities</span>
              <h4 className="text-base font-bold mt-0.5 text-slate-800 dark:text-zinc-200">Care Homes Growth</h4>
            </div>
            <div className="relative h-24">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 76 Q 75 64 150 52 T 300 16" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 0 76 Q 75 64 150 52 T 300 16 L 300 80 L 0 80 Z" fill="url(#orgGrad)" />
                <circle cx="300" cy="16" r="4" fill="#10b981" />
                <circle cx="0" cy="76" r="3" fill="#10b981" fillOpacity="0.5" />
              </svg>
              <div className="absolute top-0 right-0 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-500">100%</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Monthly organization registration retention at 100%.</p>
          </div>

          {/* Infrastructure Health */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Infrastructure Health</h4>
              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">All Systems Go</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl">
                <span className="text-slate-600 dark:text-zinc-400 font-medium flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Activity className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  NestJS Web API
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-500 uppercase">Live</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl">
                <span className="text-slate-600 dark:text-zinc-400 font-medium flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  PostgreSQL DB
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-500 uppercase">Connected</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl">
                <span className="text-slate-600 dark:text-zinc-400 font-medium flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <HeartHandshake className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  System Uptime
                </span>
                <span className="font-bold text-slate-800 dark:text-zinc-200 font-mono text-[11px]">99.98%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Org Ranking + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organization Compliance Ranking */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Organization Compliance Ranking</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Regulation 18 scorecards per tenant facility</p>
              </div>
              <Link href="/dashboard/organizations" className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-zinc-800/40 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="px-6 py-3 font-semibold">Facility Name</th>
                    <th className="px-3 py-3 font-semibold text-center">CQC Rating</th>
                    <th className="px-3 py-3 font-semibold text-center">Staff</th>
                    <th className="px-6 py-3 font-semibold text-right">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                  {topOrgs.map((org: any, idx: number) => {
                    const orgRating = getCqcRating(org.complianceScore);
                    return (
                      <tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                        <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-zinc-200">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                              <Building className="h-3.5 w-3.5" />
                            </div>
                            {org.name}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${orgRating.bg} ${orgRating.color} ${orgRating.border}`}>
                            {orgRating.label}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center font-semibold text-slate-600 dark:text-zinc-300">{org.staffCount}</td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${org.complianceScore}%`,
                                  backgroundColor: org.complianceScore >= 80 ? "#10b981" : org.complianceScore >= 60 ? "#f59e0b" : "#ef4444"
                                }}
                              />
                            </div>
                            <span className="font-extrabold text-slate-900 dark:text-zinc-100 text-xs w-10 text-right">{org.complianceScore}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {topOrgs.length === 0 && (
                <div className="py-10 text-center text-slate-400 text-xs">No organizations registered yet.</div>
              )}
            </div>
          </div>

          {/* Recent Platform Activities */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Recent Platform Activity</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Newest records registered across the system</p>
            </div>
            <div className="p-5 space-y-4 max-h-[320px] overflow-y-auto">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Award className="h-3 w-3 text-amber-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Certificates Uploaded</span>
                </div>
                {recentActivities.recentCerts?.length === 0 ? (
                  <p className="text-xs italic text-slate-400 pl-7">No uploads recently.</p>
                ) : (
                  recentActivities.recentCerts.map((c: any) => (
                    <div key={c.id} className="pl-7 text-xs flex justify-between items-start py-1.5 border-b border-slate-50 dark:border-zinc-800/60">
                      <div>
                        <p className="font-semibold text-slate-700 dark:text-zinc-300">{c.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{c.staff?.firstName} {c.staff?.lastName}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 flex-shrink-0 ml-2">{formatShortDate(c.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-3 w-3 text-blue-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trainings Registered</span>
                </div>
                {recentActivities.recentTrainings?.length === 0 ? (
                  <p className="text-xs italic text-slate-400 pl-7">No registrations recently.</p>
                ) : (
                  recentActivities.recentTrainings.map((t: any) => (
                    <div key={t.id} className="pl-7 text-xs flex justify-between items-start py-1.5 border-b border-slate-50 dark:border-zinc-800/60">
                      <div>
                        <p className="font-semibold text-slate-700 dark:text-zinc-300">{t.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t.staff?.firstName} {t.staff?.lastName}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 flex-shrink-0 ml-2">{formatShortDate(t.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MANAGER DASHBOARD
  // ==========================================
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">Facility Dashboard</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1 text-sm">CQC Training compliance monitor & auditor matrix for my Care Home</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Include Inactive Users Toggle */}
          <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs">
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-455">Include Inactive Users</span>
            <button 
              type="button"
              onClick={() => setIncludeInactive(!includeInactive)} 
              className="text-blue-500 focus:outline-none cursor-pointer transition-colors"
              title="Toggle showing inactive users in summary statistics"
            >
              {includeInactive ? <ToggleRight className="h-7 w-7 text-blue-500" /> : <ToggleLeft className="h-7 w-7 text-slate-400" />}
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" style={{ backgroundColor: "oklch(0.68 0.16 162)" }}></div>
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Live Audit-Ready Status</span>
          </div>
        </div>
      </div>

      {/* Critical Alert Center */}
      {summary.expiredCertificates > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-rose-500/15">
          <div className="flex gap-4 items-start md:items-center">
            <div className="p-3 bg-rose-500/20 rounded-xl text-rose-500">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-rose-800 dark:text-rose-400 text-base leading-snug">Compliance Issues Require Immediate Action</h3>
              <p className="text-sm text-rose-700/80 dark:text-rose-300/80 leading-normal">
                There are <strong>{summary.expiredCertificates} expired certificate{summary.expiredCertificates > 1 ? 's' : ''}</strong> logged in your facility. Remedial training or verification is required.
              </p>
            </div>
          </div>
          <Link href="/dashboard/certificates">
            <button className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow shadow-rose-900/20 transition-all self-start md:self-auto cursor-pointer">
              Renew Certificates
            </button>
          </Link>
        </div>
      )}

      {/* Circular Compliance Ring & Executive Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compliance Rating Circle */}
        <Link href="/dashboard/reports" className="block group">
          <Card className="shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200 dark:border-zinc-800 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:border-emerald-500/40">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-zinc-200">CQC Readiness Score</CardTitle>
              <CardDescription className="text-xs">Based on active training matrix audits</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 relative z-10">
              <div className="relative flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="70" className="stroke-slate-200 dark:stroke-zinc-800" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="stroke-emerald-500 transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * calculatedCompliance) / 100}
                    strokeLinecap="round"
                    style={{ stroke: "oklch(0.68 0.16 162)" }}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-zinc-50">{calculatedCompliance}%</span>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Readiness</p>
                </div>
              </div>
              <div className={`mt-6 px-4 py-1.5 rounded-full border ${cqcRating.border} ${cqcRating.bg} text-center flex items-center gap-2`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${cqcRating.color}`}>{cqcRating.label}</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Executive Stats Card List */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/dashboard/staff" className="block group">
            <Card className="shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200 dark:border-zinc-800 h-full transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:border-emerald-500/40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
              <CardContent className="flex items-center gap-5 p-6 h-full">
                <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl transition-all group-hover:scale-110 group-hover:bg-emerald-500/20" style={{ color: "oklch(0.68 0.16 162)" }}>
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">My Staff</p>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1">{summary.totalStaff}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
                    <span>
                      {includeInactive 
                        ? `${summary.activeStaffCount} Active · ${summary.inactiveStaffCount} Inactive` 
                        : `${summary.activeStaffCount} Active Users`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/competencies" className="block group">
            <Card className="shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200 dark:border-zinc-800 h-full transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:border-blue-500/40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
              <CardContent className="flex items-center gap-5 p-6 h-full">
                <div className="p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl transition-all group-hover:scale-110 group-hover:bg-blue-500/20" style={{ color: "oklch(0.6 0.18 240)" }}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">My Competencies</p>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1">{summary.totalCompetencies}</h2>
                  <span className="text-[11px] text-slate-500 mt-1 block">Practical checks verified</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/training-matrix" className="block group">
            <Card className="shadow-lg shadow-slate-200/50 dark:shadow-none border-slate-200 dark:border-zinc-800 h-full transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:border-amber-500/40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
              <CardContent className="flex items-center gap-5 p-6 h-full">
                <div className="p-4 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-2xl transition-all group-hover:scale-110 group-hover:bg-amber-500/20">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Training Progress</p>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1">{summary.totalTrainings}</h2>
                  <span className="text-[11px] text-slate-500 mt-1 block">CPD online modules synced</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/certificates" className="block group">
            <Card className="shadow-md border-slate-200 dark:border-zinc-800 h-full transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg group-hover:border-rose-500/30">
              <CardContent className="flex items-center gap-5 p-6 h-full">
                <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl transition-all group-hover:scale-110 group-hover:bg-rose-500/20">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Expiring Documents</p>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1">
                    {summary.expiringCertificates + summary.expiredCertificates}
                  </h2>
                  <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                    {summary.expiredCertificates} Expired | {summary.expiringCertificates} Expiring
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* AI CQC Risk Forecast Timeline Dashboard Panel */}
      <Card className="border-slate-200 dark:border-zinc-800 shadow-lg overflow-hidden bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 text-white rounded-2xl relative">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 10% 20%, oklch(0.68 0.16 162) 0%, transparent 40%),
                            radial-gradient(circle at 90% 80%, oklch(0.55 0.18 280) 0%, transparent 40%)`
        }} />
        <CardContent className="p-6 md:p-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl" style={{ color: "oklch(0.68 0.16 162)" }}>
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">AI Compliance Risk Forecast</h3>
                <p className="text-xs text-slate-400">Regulation 18 score projection timeline based on active decay algorithms</p>
              </div>
            </div>

            {/* Horizontal Timeline Graph */}
            {isForecastLoading ? (
              <div className="flex justify-center items-center py-6"><Loader2 className="h-6 w-6 text-emerald-400 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-800">
                {forecastData.forecast.map((f: any, idx: number) => {
                  const rating = getCqcRating(f.score);
                  return (
                    <div key={idx} className="space-y-2 text-center relative">
                      <p className="text-xs font-semibold text-slate-400">{f.label}</p>
                      <div className="h-10 w-10 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center font-bold text-sm">
                        {f.score}%
                      </div>
                      <p className={`text-[9px] font-bold tracking-wider uppercase ${rating.color}`}>{rating.label}</p>
                      {idx < 3 && (
                        <div className="absolute top-8 left-[70%] right-[-30%] h-[1px] bg-slate-800 hidden sm:block"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
            <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-400" />
              AI Projected Risk Events
            </h4>
            <div className="space-y-3 max-h-[140px] overflow-y-auto pr-1">
              {forecastData.risks?.length === 0 ? (
                <p className="text-xs text-slate-400">All staff training lines fully compliant. No upcoming decay risk predicted.</p>
              ) : (
                forecastData.risks.map((risk: any, i: number) => (
                  <div key={i} className="text-xs flex gap-2.5 items-start">
                    <span className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      risk.severity === "CRITICAL" ? "bg-rose-500" : "bg-amber-400"
                    }`} />
                    <div>
                      <p className="font-semibold text-slate-200">{risk.staffName}</p>
                      <p className="text-[10px] text-slate-400 leading-snug">{risk.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Performance & Tab List of Expiring Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Staff Performance and Score ranking */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800 dark:text-zinc-200">Staff Performance Matrix</CardTitle>
              <CardDescription className="text-xs">Individual caregivers and Regulation 18 compliance ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-semibold">Staff Member</th>
                      <th className="pb-3 font-semibold text-center">Job Title</th>
                      <th className="pb-3 font-semibold text-center">Status</th>
                      <th className="pb-3 font-semibold text-right">Score</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                    {orgStaffList.slice(0, 5).map((staff: any) => {
                      const name = `${staff.firstName} ${staff.lastName}`;
                      const score = getComplianceScore(staff);
                      const rating = getCqcRating(score);
                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="py-3 font-bold text-slate-850 dark:text-zinc-200">{name}</td>
                          <td className="py-3 text-center text-slate-600 dark:text-zinc-400">{staff.jobTitle}</td>
                          <td className="py-3 text-center">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${
                              staff.user?.status === "ACTIVE" 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            }`}>
                              {staff.user?.status || "ACTIVE"}
                            </span>
                          </td>
                          <td className="py-3 text-right font-extrabold" style={{ color: score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444" }}>
                            {score}%
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setWarningModalData({
                                  isOpen: true,
                                  staff: staff,
                                  courseTitle: "Mandatory CQC Training Matrix Compliance",
                                  expiryDate: new Date().toISOString().split("T")[0],
                                  statusType: score < 80 ? "EXPIRED" : "EXPIRING",
                                });
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                              title="Send Compliance Warning (Email, Notification, Chat)"
                            >
                              <Send className="h-3 w-3" />
                              Send Notice
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Docs / Trainings */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-zinc-800 p-4 justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("trainings")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === "trainings"
                      ? "bg-slate-900 text-white dark:bg-zinc-850"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  Expiring Trainings ({expiringTrainings.length})
                </button>
                <button
                  onClick={() => setActiveTab("certificates")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === "certificates"
                      ? "bg-slate-900 text-white dark:bg-zinc-850"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  Expiring / Expired Certificates ({expiringCerts.length})
                </button>
              </div>
            </div>

            <div className="p-4">
              {activeTab === "trainings" ? (
                isTrainingsLoading ? (
                  <div className="text-center py-8 text-sm text-slate-500">Loading expiring e-Learning records...</div>
                ) : expiringTrainings.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-emerald-500/60" />
                    <span>No e-learning items expiring within the next 30 days.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-zinc-850">
                    {expiringTrainings.map((t: any) => {
                      const isExp = t.expiresOn && new Date(t.expiresOn) < new Date();
                      return (
                        <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0 px-2 rounded-lg">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{t.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Staff: <span className="font-medium text-slate-700 dark:text-zinc-300">{t.staff.firstName} {t.staff.lastName}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              Expires: {formatShortDate(t.expiresOn)}
                            </span>
                            <button
                              onClick={() => {
                                setWarningModalData({
                                  isOpen: true,
                                  staff: t.staff,
                                  courseTitle: t.title,
                                  expiryDate: t.expiresOn ? new Date(t.expiresOn).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                                  statusType: isExp ? "EXPIRED" : "EXPIRING",
                                });
                              }}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Send warning notice (Email + Notification + Chat)"
                            >
                              <Send className="h-3 w-3" />
                              Send Notice
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                isCertsLoading ? (
                  <div className="text-center py-8 text-sm text-slate-500">Loading expiring certificates...</div>
                ) : expiringCerts.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-emerald-500/60" />
                    <span>No certificates expiring within the next 30 days.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-zinc-850">
                    {expiringCerts.map((c: any) => {
                      const isExp = c.expiryDate && new Date(c.expiryDate) < new Date();
                      return (
                        <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0 px-2 rounded-lg">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{c.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Staff: <span className="font-medium text-slate-700 dark:text-zinc-300">{c.staff.firstName} {c.staff.lastName}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className={`text-[11px] font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                              isExp
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            }`}>
                              <Calendar className="h-3.5 w-3.5" />
                              {isExp ? `Expired (${formatShortDate(c.expiryDate)})` : `Expires: ${formatShortDate(c.expiryDate)}`}
                            </span>
                            <button
                              onClick={() => {
                                setWarningModalData({
                                  isOpen: true,
                                  staff: c.staff,
                                  courseTitle: c.title,
                                  expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                                  statusType: isExp ? "EXPIRED" : "EXPIRING",
                                });
                              }}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Send warning notice (Email + Notification + Chat)"
                            >
                              <Send className="h-3 w-3" />
                              Send Notice
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right: Notifications alert timeline feed */}
        <Card className="shadow-md border-slate-200 dark:border-zinc-800 flex flex-col h-full bg-white dark:bg-zinc-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-zinc-200">Alert Timeline</CardTitle>
            <CardDescription className="text-xs">Proof of ongoing audit compliance</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[360px] pb-6">
            {isNotificationsLoading ? (
              <div className="text-center py-6 text-sm text-slate-500">Loading timeline...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No active alerts logged.</div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-zinc-800">
                {uniqueNotifications.map((n: any) => {
                  const isUrgent = n.type === "ERROR";
                  const isWarning = n.type === "WARNING";
                  return (
                    <div key={n.id} className="relative pl-7 group">
                      <span className={`absolute left-[7px] top-1.5 h-[10px] w-[10px] rounded-full border-2 border-white dark:border-zinc-900 ${
                        isUrgent ? "bg-rose-500 animate-pulse" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                      }`} style={{ backgroundColor: isUrgent ? "" : isWarning ? "" : "oklch(0.68 0.16 162)" }}></span>
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className={`text-xs font-bold ${
                            isUrgent ? "text-rose-600 dark:text-rose-400" : isWarning ? "text-amber-600 dark:text-amber-500" : "text-slate-855 dark:text-zinc-300"
                          }`}>{n.title}</span>
                          <span className="text-[9px] text-slate-400 flex-shrink-0">{formatShortDate(n.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">{n.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button for AI Copilot Chatbot */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border border-emerald-500/30 z-40 group"
        style={{
          boxShadow: "0 0 20px oklch(0.68 0.16 162 / 50%)",
          background: "linear-gradient(135deg, oklch(0.68 0.16 162), oklch(0.55 0.18 280))"
        }}
      >
        <Sparkles className="h-6 w-6 text-white animate-pulse" />
      </button>

      {/* Slide-out AI Copilot Panel */}
      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[460px] bg-slate-55 dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          isCopilotOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-900 text-white dark:bg-zinc-950 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">CQC AI Auditor</h3>
              <p className="text-[10px] text-slate-400">Regulation 18 Staffing Copilot</p>
            </div>
          </div>
          <button onClick={() => setIsCopilotOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4.5 w-4.5" />
                </div>
              )}
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-slate-900 text-white dark:bg-zinc-800 rounded-tr-none"
                  : "bg-white dark:bg-zinc-850 border border-slate-200/60 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-200 rounded-tl-none shadow-sm"
              }`}>
                {msg.text.split("\n\n").map((para, pIdx) => {
                  if (para.startsWith("###")) {
                    return <h4 key={pIdx} className="font-bold text-sm mb-2 text-slate-900 dark:text-white">{para.replace(/###/g, "").trim()}</h4>;
                  }
                  if (para.startsWith("-") || para.startsWith("*")) {
                    return (
                      <ul key={pIdx} className="list-disc pl-4 space-y-1 mb-2">
                        {para.split("\n").map((li, lIdx) => (
                          <li key={lIdx}>{li.replace(/^[-\*\s]+/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={pIdx} className="mb-2 last:mb-0">{para}</p>;
                })}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-center">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="bg-white dark:bg-zinc-855 p-3.5 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2 border border-slate-200/60 dark:border-zinc-800/80">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                Inspector is auditing matrix logs…
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900/60 flex flex-wrap gap-2">
          {[
            "Are we compliant with CQC Regulation 18?",
            "Audit training matrix",
            "Generate compliance action plan",
          ].map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[10px] font-semibold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-zinc-700 hover:border-emerald-500/60 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex gap-2">
          <input
            type="text"
            placeholder="Ask the Virtual CQC Inspector..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputPrompt)}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-slate-900 dark:text-white"
          />
          <button
            onClick={() => handleSendMessage(inputPrompt)}
            disabled={!inputPrompt.trim() || isChatLoading}
            className="h-9 w-9 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-200 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

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
            queryClient.invalidateQueries({ queryKey: ["recentNotifications"] });
            queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
          }}
        />
      )}
    </div>
  );
}