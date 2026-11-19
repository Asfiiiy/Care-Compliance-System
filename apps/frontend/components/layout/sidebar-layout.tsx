"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Grid3X3,
  ShieldCheck,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  FolderOpen,
  ChevronRight,
  Settings,
  Loader2,
  Camera,
  Building,
  KeyRound,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { staffService } from "@/services/staff";
import { certificateService } from "@/services/certificate";
import { competencyService } from "@/services/competency";
import { dashboardService } from "@/services/dashboard";
import { messageService } from "@/services/message";
import { api } from "@/lib/axios";
import { toast } from "sonner";

type SidebarLayoutProps = { children: ReactNode };

const managerMenuItems = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Messages & Notices",
    href: "/dashboard/messages",
    icon: MessageSquare,
    exact: false,
  },
  {
    name: "Training Matrix",
    href: "/dashboard/training-matrix",
    icon: Grid3X3,
    exact: false,
  },
  {
    name: "Bedside Auditor",
    href: "/dashboard/competencies",
    icon: ShieldCheck,
    exact: false,
  },
  {
    name: "Staff Directory",
    href: "/dashboard/staff",
    icon: Users,
    exact: false,
  },
  {
    name: "Certificate Store",
    href: "/dashboard/certificates",
    icon: FolderOpen,
    exact: false,
  },
  {
    name: "Compliance Reports",
    href: "/dashboard/reports",
    icon: FileText,
    exact: false,
  },
];

const adminMenuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Organizations & Homes",
    href: "/dashboard/organizations",
    icon: Building,
    exact: false,
  },
  {
    name: "User Accounts",
    href: "/dashboard/organizations/users",
    icon: KeyRound,
    exact: false,
  },
  {
    name: "Compliance Inspector",
    href: "/dashboard/training-matrix",
    icon: Grid3X3,
    exact: false,
  },
  {
    name: "Platform Reports",
    href: "/dashboard/reports",
    icon: FileText,
    exact: false,
  },
];

const staffMenuItems = [
  {
    name: "My Passport & Radar",
    href: "/dashboard",
    icon: Users,
    exact: true,
  },
  {
    name: "Messages & Notices",
    href: "/dashboard/messages",
    icon: MessageSquare,
    exact: false,
  },
  {
    name: "My Certificates",
    href: "/dashboard/certificates",
    icon: FolderOpen,
    exact: false,
  },
  {
    name: "My Competencies",
    href: "/dashboard/competencies",
    icon: ShieldCheck,
    exact: false,
  },
];

interface SidebarNavProps {
  user: any;
  pathname: string;
  isCollapsed: boolean;
  mobile?: boolean;
  unreadMessagesCount: number;
  userInitials: string;
  userName: string;
  onLogout: () => void;
}

function SidebarNav({
  user,
  pathname,
  isCollapsed,
  mobile = false,
  unreadMessagesCount,
  userInitials,
  userName,
  onLogout,
}: SidebarNavProps) {
  const collapsed = !mobile && isCollapsed;

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return (
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href))
    );
  }

  const menuItems =
    user?.role === "ADMIN"
      ? adminMenuItems
      : user?.role === "STAFF"
      ? staffMenuItems
      : managerMenuItems;

  return (
    <div className="flex flex-col h-full select-none">
      {/* Brand */}
      <div
        className={`flex items-center gap-3 px-5 border-b h-16 border-white/10 ${collapsed ? "justify-center" : ""}`}
      >
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
          style={{
            background:
              user?.role === "ADMIN"
                ? "linear-gradient(135deg, oklch(0.55 0.18 290), oklch(0.58 0.15 320))"
                : "linear-gradient(135deg, oklch(0.52 0.18 163), oklch(0.55 0.15 190))",
            boxShadow:
              user?.role === "ADMIN"
                ? "0 0 16px oklch(0.55 0.18 290 / 40%)"
                : "0 0 16px oklch(0.52 0.18 163 / 40%)",
          }}
        >
          <ShieldCheck className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm tracking-tight leading-none">
              CareCompliance
            </p>
            <p
              className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{
                color:
                  user?.role === "ADMIN"
                    ? "oklch(0.75 0.15 290)"
                    : "oklch(0.72 0.15 163)",
              }}
            >
              {user?.role === "ADMIN"
                ? "Platform Super Admin"
                : "CQC Regulation 18"}
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        {!collapsed && (
          <p
            className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-3"
            style={{ color: "oklch(0.42 0.02 240)" }}
          >
            {user?.role === "ADMIN"
              ? "Platform Administration"
              : user?.role === "STAFF"
              ? "Carer Passport"
              : "Care Home Operations"}
          </p>
        )}
        {menuItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                collapsed
                  ? "justify-center h-10 w-10 mx-auto px-0"
                  : "px-3.5 py-2.5"
              } ${
                active
                  ? user?.role === "ADMIN"
                    ? "bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold shadow-[0_0_12px_oklch(0.55_0.15_295_/_15%)]"
                    : "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-semibold shadow-[0_0_12px_oklch(0.52_0.18_163_/_10%)]"
                  : "text-slate-300 border border-transparent hover:bg-white/5 hover:text-slate-100"
              }`}
              title={collapsed ? item.name : undefined}
            >
              {/* Active indicator */}
              {active && (
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full ${
                    user?.role === "ADMIN" ? "bg-purple-500" : ""
                  }`}
                  style={
                    user?.role !== "ADMIN"
                      ? { background: "oklch(0.52 0.18 163)" }
                      : {}
                  }
                />
              )}
              <item.icon
                className="h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110"
                style={{
                  color: active
                    ? user?.role === "ADMIN"
                      ? "oklch(0.75 0.18 295)"
                      : "oklch(0.68 0.16 162)"
                    : "currentColor",
                }}
              />
              {!collapsed && (
                <span className="flex-1 truncate">{item.name}</span>
              )}
              {item.href === "/dashboard/messages" && unreadMessagesCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-indigo-600 text-white shadow-sm">
                  {unreadMessagesCount}
                </span>
              )}
              {!collapsed && active && (
                <ChevronRight
                  className="h-3 w-3 opacity-60"
                  style={{
                    color:
                      user?.role === "ADMIN"
                        ? "oklch(0.7 0.16 295)"
                        : "oklch(0.65 0.18 163)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={`flex items-center gap-3 p-3 rounded-xl mb-2 bg-sidebar-accent border border-sidebar-border ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {user?.staff?.avatarUrl ? (
            <img
              src={
                user.staff.avatarUrl.startsWith("http")
                  ? user.staff.avatarUrl
                  : `http://localhost:3001${user.staff.avatarUrl}`
              }
              alt="Avatar"
              className="h-8 w-8 rounded-full object-cover flex-shrink-0 border border-white/10"
            />
          ) : (
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-gradient-to-br from-emerald-500 to-indigo-500">
              {userInitials}
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold truncate"
                style={{ color: "oklch(0.88 0.01 240)" }}
              >
                {userName}
              </p>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  background: "oklch(0.52 0.18 163 / 20%)",
                  color: "oklch(0.7 0.15 163)",
                }}
              >
                {user?.role ?? "ADMIN"}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-rose-500 hover:bg-rose-500/10 cursor-pointer ${
            collapsed ? "w-full justify-center" : "w-full"
          }`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, logout, isLoading, refetchUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch live notifications for bell panel (all roles)
  const { data: sidebarNotifsRes } = useQuery({
    queryKey: ["sidebarNotifications"],
    queryFn: () => dashboardService.getRecentNotifications(),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const sidebarNotifications: any[] = sidebarNotifsRes?.data?.data ?? [];

  // Fetch unread messages count
  const { data: unreadRes } = useQuery({
    queryKey: ["messagesUnread"],
    queryFn: () => messageService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 10000,
  });
  const unreadMessagesCount = unreadRes?.data?.data?.unreadCount ?? unreadRes?.data?.unreadCount ?? 0;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.staff) {
      setEditForm({
        firstName: user.staff.firstName || "",
        lastName: user.staff.lastName || "",
        phone: user.staff.phone || "",
        address: user.staff.address || "",
      });
      setAvatarPreview(user.staff.avatarUrl ? (user.staff.avatarUrl.startsWith("http") ? user.staff.avatarUrl : `http://localhost:3001${user.staff.avatarUrl}`) : "");
    }
  }, [user, isEditModalOpen]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.staff?.id) return;
    setIsUpdating(true);
    try {
      const fd = new FormData();
      fd.append("firstName", editForm.firstName);
      fd.append("lastName", editForm.lastName);
      fd.append("phone", editForm.phone || "");
      fd.append("address", editForm.address || "");
      if (avatarFile) {
        fd.append("avatar", avatarFile);
      }
      
      await api.patch(`/staff/${user.staff.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await refetchUser();
      toast.success("Profile details updated successfully!");
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error("Failed to update profile details.");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center flex-col gap-5"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.1 0.02 240) 0%, oklch(0.09 0.03 195) 100%)",
        }}
      >
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.52 0.18 163), oklch(0.55 0.15 190))",
            boxShadow: "0 0 30px oklch(0.52 0.18 163 / 50%)",
          }}
        >
          <ShieldCheck className="h-7 w-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">
            Loading portal…
          </p>
        </div>
      </div>
    );
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    staff: any[];
    certificates: any[];
    competencies: any[];
  }>({ staff: [], certificates: [], competencies: [] });
  const [isSearching, setIsSearching] = useState(false);

  const settingsShortcuts = [
    { name: "Personal Profile Settings", href: "/dashboard", desc: "View and edit your personal profile and contact details" },
    { name: "CQC Regulation 18 Audit Matrix", href: "/dashboard/training-matrix", desc: "View training compliance and audit completions" },
    { name: "Certificate Management Store", href: "/dashboard/certificates", desc: "Access uploaded certificates and documentation" },
    { name: "Bedside Competency Audits", href: "/dashboard/competencies", desc: "Perform new audits or view assessment logs" },
    { name: "Compliance Reports Export", href: "/dashboard/reports", desc: "Download compliance CSV, Excel, or PDF reports" },
  ].filter(shortcut => 
    searchQuery.trim().length >= 2 && (
      shortcut.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      shortcut.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery("");
      setSearchResults({ staff: [], certificates: [], competencies: [] });
      return;
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults({ staff: [], certificates: [], competencies: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [staffRes, certsRes, compsRes] = await Promise.all([
          staffService.findAll({ search: searchQuery, limit: 5 }),
          certificateService.findAll({ search: searchQuery, limit: 5 }),
          competencyService.findAll({ search: searchQuery, limit: 5 }),
        ]);

        setSearchResults({
          staff: staffRes?.data?.data?.data || [],
          certificates: certsRes?.data?.data?.data || [],
          competencies: compsRes?.data?.data?.data || [],
        });
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isSearchOpen]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    }
    if (isSearchOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isSearchOpen]);

  if (!user) return null;

  const userInitials = user.staff 
    ? `${user.staff.firstName?.charAt(0) || ""}${user.staff.lastName?.charAt(0) || ""}`.toUpperCase() || "US"
    : (user.email ? user.email.substring(0, 2).toUpperCase() : "AD");

  const userName = user.staff 
    ? `${user.staff.firstName || ""} ${user.staff.lastName || ""}`.trim() || "User"
    : (user.email ? user.email.split("@")[0] : "Admin");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-zinc-950 p-3 md:p-4 gap-3 md:gap-4">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"} bg-sidebar border border-sidebar-border rounded-2xl shadow-xl overflow-hidden`}
      >
        <SidebarNav
          user={user}
          pathname={pathname}
          isCollapsed={isCollapsed}
          unreadMessagesCount={unreadMessagesCount}
          userInitials={userInitials}
          userName={userName}
          onLogout={logout}
        />
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-5 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-850 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop toggle collapse sidebar */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search bar */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 text-xs w-60 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-all"
            >
              <Search className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="flex-1 text-left">Search staff, training…</span>
              <kbd className="text-[10px] bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 px-1.5 py-0.5 rounded font-mono text-slate-400 dark:text-zinc-400">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                id="notifications-btn"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2.5 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {/* Only show red dot for non-STAFF roles */}
                {user?.role !== "STAFF" && (
                  <span
                    className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white dark:border-zinc-900"
                    style={{ background: "oklch(0.65 0.22 25)" }}
                  />
                )}
              </button>

              {isNotificationsOpen && (
                // Fixed positioning to escape overflow-hidden header and prevent background overlap
                <div className="fixed right-4 mt-2 w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl shadow-slate-300/30 dark:shadow-black/50 py-2 z-[999] animate-scale-in" style={{ top: "64px" }}>
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Alerts
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {user?.role === "STAFF" ? "Your personal notifications" : "Live compliance notifications"}
                      </p>
                    </div>
                    {user?.role !== "STAFF" && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{
                          background: "oklch(0.65 0.22 25 / 10%)",
                          color: "oklch(0.55 0.22 25)",
                        }}
                      >
                        Live
                      </span>
                    )}
                  </div>

                  {/* STAFF: empty state */}
                  {user?.role === "STAFF" ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div
                        className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3"
                        style={{ background: "oklch(0.52 0.18 163 / 10%)" }}
                      >
                        <Bell className="h-6 w-6" style={{ color: "oklch(0.62 0.16 163)" }} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No notifications</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 leading-relaxed">
                        You're all caught up! Your manager will notify you of any compliance actions.
                      </p>
                    </div>
                  ) : (
                    // ADMIN/MANAGER: show compliance alerts from real API
                    <>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-zinc-800/50">
                        {sidebarNotifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                            <Bell className="h-6 w-6 text-slate-300 dark:text-zinc-600 mb-2" />
                            <p className="text-xs text-slate-500 dark:text-zinc-400">No recent compliance alerts.</p>
                          </div>
                        ) : (
                          sidebarNotifications.slice(0, 8).map((n: any) => {
                            const isError = n.type === "ERROR";
                            const isWarning = n.type === "WARNING";
                            const dotColor = isError
                              ? "oklch(0.65 0.22 25)"
                              : isWarning
                              ? "oklch(0.75 0.18 70)"
                              : "oklch(0.52 0.18 163)";
                            const titleColor = isError
                              ? "oklch(0.55 0.22 25)"
                              : isWarning
                              ? "oklch(0.55 0.18 55)"
                              : "oklch(0.4 0.15 163)";
                            // Relative time
                            const relTime = (() => {
                              if (!n.createdAt) return "";
                              const diff = Date.now() - new Date(n.createdAt).getTime();
                              const mins = Math.floor(diff / 60000);
                              if (mins < 1) return "Just now";
                              if (mins < 60) return `${mins} min ago`;
                              const hrs = Math.floor(mins / 60);
                              if (hrs < 24) return `${hrs} hr ago`;
                              return new Date(n.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                            })();
                            return (
                              <div
                                key={n.id}
                                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                              >
                                <div className="flex items-start gap-2.5">
                                  <div
                                    className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0"
                                    style={{ background: dotColor }}
                                  />
                                  <div>
                                    <p
                                      className="text-xs font-semibold"
                                      style={{ color: titleColor }}
                                    >
                                      {n.title}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-normal">
                                      {n.message}
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-1">
                                      {relTime}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-zinc-800">
                        <button
                          onClick={() => { router.push("/dashboard/reports"); setIsNotificationsOpen(false); }}
                          className="text-xs font-semibold w-full text-center transition-colors hover:opacity-80 cursor-pointer"
                          style={{ color: "oklch(0.52 0.18 163)" }}
                        >
                          View all alerts
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Avatar */}
            {user.staff?.avatarUrl ? (
              <img 
                src={user.staff.avatarUrl.startsWith("http") ? user.staff.avatarUrl : `http://localhost:3001${user.staff.avatarUrl}`} 
                alt="Avatar" 
                className="h-9 w-9 rounded-full object-cover shadow-md cursor-pointer border border-slate-200 dark:border-zinc-800 hover:scale-105 active:scale-95 transition-transform"
                title={user.email}
                onClick={() => setIsEditModalOpen(true)}
              />
            ) : (
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.52 0.18 163), oklch(0.55 0.15 190))",
                  boxShadow: "0 0 12px oklch(0.52 0.18 163 / 30%)",
                }}
                title={user.email}
                onClick={() => setIsEditModalOpen(true)}
              >
                {userInitials}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-zinc-900/30 p-0">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div
            className="relative flex w-72 max-w-[85vw] flex-col shadow-2xl animate-slide-left"
            style={{ background: "oklch(0.1 0.018 240)" }}
          >
            <div
              className="flex h-16 items-center justify-between px-5 border-b"
              style={{ borderColor: "oklch(0.2 0.02 240)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.52 0.18 163), oklch(0.55 0.15 190))",
                  }}
                >
                  <ShieldCheck
                    className="h-4.5 w-4.5 text-white"
                    strokeWidth={2.5}
                  />
                </div>
                <span className="text-white font-bold text-sm">
                  CareCompliance
                </span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "oklch(0.55 0.02 240)" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav
              user={user}
              pathname={pathname}
              isCollapsed={false}
              mobile={true}
              unreadMessagesCount={unreadMessagesCount}
              userInitials={userInitials}
              userName={userName}
              onLogout={() => {
                setIsMobileOpen(false);
                logout();
              }}
            />
          </div>
        </div>
      )}

      {/* Global Search Overlay Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-all duration-200"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[65vh] animate-scale-in">
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
              <Search className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search staff members, certificates, competencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 w-full"
                autoFocus
              />
              {isSearching && <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 px-2 py-1 rounded text-slate-500 cursor-pointer transition-colors"
              >
                ESC
              </button>
            </div>

            {/* Results Output */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {searchQuery.trim().length < 2 ? (
                <div className="text-center py-10 text-slate-400 dark:text-zinc-500 text-xs">
                  <Search className="h-8 w-8 mx-auto mb-3 opacity-30 animate-bounce" />
                  Type at least 2 characters to run instant search queries...
                </div>
              ) : searchResults.staff.length === 0 &&
                searchResults.certificates.length === 0 &&
                searchResults.competencies.length === 0 &&
                settingsShortcuts.length === 0 &&
                !isSearching ? (
                <div className="text-center py-10 text-slate-400 dark:text-zinc-500 text-xs">
                  No matches found for <span className="font-semibold text-slate-600 dark:text-zinc-300">"{searchQuery}"</span>
                </div>
              ) : (
                <>
                  {/* Settings Shortcuts */}
                  {settingsShortcuts.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-2 px-1">
                        Settings & Navigation Shortcuts
                      </h4>
                      <div className="space-y-1 mb-4">
                        {settingsShortcuts.map((s) => (
                          <Link
                            key={s.name}
                            href={s.href}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 border border-transparent hover:border-slate-100 dark:hover:border-zinc-800/50 transition-all text-xs"
                          >
                            <div className="h-6 w-6 rounded bg-rose-500/10 flex items-center justify-center text-rose-455 flex-shrink-0">
                              <Settings className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                                {s.name}
                              </p>
                              <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">
                                {s.desc}
                              </p>
                            </div>
                            <ChevronRight className="h-3 w-3 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff results */}
                  {searchResults.staff.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-2 px-1">
                        Staff & Managers Directory
                      </h4>
                      <div className="space-y-1 mb-4">
                        {searchResults.staff.map((s) => (
                          <Link
                            key={s.id}
                            href={`/dashboard/staff?search=${s.firstName}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 border border-transparent hover:border-slate-100 dark:hover:border-zinc-800/50 transition-all text-xs"
                          >
                            {s.avatarUrl ? (
                              <img 
                                src={s.avatarUrl.startsWith("http") ? s.avatarUrl : `http://localhost:3001${s.avatarUrl}`} 
                                alt="avatar" 
                                className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-[9px] font-bold flex-shrink-0">
                                {s.firstName[0]}{s.lastName[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                                {s.firstName} {s.lastName}
                              </p>
                              <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">
                                Role: {s.user?.role || "STAFF"} · Employee ID: {s.employeeNo}
                              </p>
                            </div>
                            <ChevronRight className="h-3 w-3 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certificates results */}
                  {searchResults.certificates.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-2 px-1">
                        Uploaded Certificates
                      </h4>
                      <div className="space-y-1 mb-4">
                        {searchResults.certificates.map((c) => (
                          <Link
                            key={c.id}
                            href={`/dashboard/certificates?search=${c.title}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 border border-transparent hover:border-slate-100 dark:hover:border-zinc-800/50 transition-all text-xs"
                          >
                            <div className="h-6 w-6 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                              <FileText className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                                {c.title}
                              </p>
                              <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">
                                Issued by {c.issuer} · Staff: {c.staff?.firstName} {c.staff?.lastName}
                              </p>
                            </div>
                            <ChevronRight className="h-3 w-3 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Competency audits */}
                  {searchResults.competencies.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-500 mb-2 px-1">
                        Bedside Competencies
                      </h4>
                      <div className="space-y-1">
                        {searchResults.competencies.map((comp) => (
                          <Link
                            key={comp.id}
                            href={`/dashboard/competencies?search=${comp.name}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 border border-transparent hover:border-slate-100 dark:hover:border-zinc-800/50 transition-all text-xs"
                          >
                            <div className="h-6 w-6 rounded bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                                {comp.name.replace("_", " ").toUpperCase()}
                              </p>
                              <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">
                                Status: {comp.level} · Staff: {comp.staff?.firstName} {comp.staff?.lastName}
                              </p>
                            </div>
                            <ChevronRight className="h-3 w-3 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal (Admin/Manager/Caregiver settings overlay) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Edit Profile Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer p-1 rounded bg-slate-100 dark:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Profile Picture Selector */}
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
                      {userInitials}
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
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">Click to update avatar</span>
              </div>

              {/* Employee ID (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-550 dark:text-zinc-400">Employee ID</label>
                <input
                  type="text"
                  value={user.staff?.employeeNo || "N/A"}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-lg border text-xs bg-slate-100 dark:bg-zinc-800/80 text-slate-450 dark:text-zinc-500 border-slate-200 dark:border-zinc-700 cursor-not-allowed outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none border-slate-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none border-slate-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
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
                  className="w-full px-3.5 py-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none border-slate-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Home Address</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none border-slate-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer flex justify-center items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, oklch(0.68 0.16 162), oklch(0.55 0.18 280))"
                }}
              >
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
