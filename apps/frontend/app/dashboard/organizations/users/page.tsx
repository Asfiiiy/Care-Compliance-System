"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  ShieldCheck,
  Building,
  UserCheck,
  Mail,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { userService } from "@/services/user.service";
import { useAuth } from "@/context/auth-context";

function RoleBadge({ role }: { role: string }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
        Admin
      </span>
    );
  }
  if (role === "MANAGER") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
        Manager
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-500/20">
      Staff
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const norm = (status || "ACTIVE").toUpperCase();
  if (norm === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Active
      </span>
    );
  }
  if (norm === "INACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-500/20">
        Inactive
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
      Suspended
    </span>
  );
}

export default function UserAccountsPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "STAFF",
    status: "ACTIVE",
    organizationId: "",
  });

  const { data: usersRes, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => userService.findAll().then((res) => res.data),
    enabled: !!currentUser,
  });

  const { data: orgsRes } = useQuery({
    queryKey: ["organizations-list"],
    queryFn: () => api.get("/users/organizations").then((res) => res.data),
    enabled: !!currentUser,
  });

  const users = usersRes?.data || [];
  const organizations = orgsRes?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => userService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["adminSummary"] });
      toast.success("User account and profile created!");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create user account");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      userService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User account updated successfully!");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update user account");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["adminSummary"] });
      toast.success("User account deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete user account");
    },
  });

  function openCreateModal() {
    setEditingUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "STAFF",
      status: "ACTIVE",
      organizationId: "",
    });
    setIsModalOpen(true);
  }

  function openEditModal(usr: any) {
    setEditingUser(usr);
    setFormData({
      firstName: usr.staff?.firstName || "",
      lastName: usr.staff?.lastName || "",
      email: usr.email || "",
      password: "",
      role: usr.role || "STAFF",
      status: usr.status || "ACTIVE",
      organizationId: usr.organizationId || "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingUser(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!editingUser && !formData.password) {
      toast.error("Password is required for new accounts");
      return;
    }

    // Sanitize payload: ADMIN roles have no organization
    const payload: any = { ...formData };
    if (formData.role === "ADMIN") {
      payload.organizationId = "";
    } else if (!payload.organizationId) {
      toast.error("Please associate this user with a care home facility.");
      return;
    }

    if (editingUser) {
      if (!payload.password) {
        delete payload.password;
      }
      updateMutation.mutate({ id: editingUser.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(id: string, email: string) {
    if (id === currentUser?.id) {
      toast.error("You cannot delete your own active administrator account.");
      return;
    }
    if (confirm(`Are you sure you want to delete user "${email}"? This will delete their staff record and login access.`)) {
      deleteMutation.mutate(id);
    }
  }

  const filteredUsers = users.filter((u: any) => {
    const term = search.toLowerCase();
    const fullName = `${u.staff?.firstName || ""} ${u.staff?.lastName || ""}`.toLowerCase();
    const matchSearch =
      search === "" ||
      u.email.toLowerCase().includes(term) ||
      fullName.includes(term) ||
      u.role.toLowerCase().includes(term) ||
      (u.organization?.name || "").toLowerCase().includes(term);
    return matchSearch;
  });

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-red-500">Access Denied</h1>
        <p className="text-slate-600 dark:text-zinc-400 mt-2">Only administrators can access this section.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
              <KeyRound className="h-5 w-5 text-purple-500" />
            </div>
            User Accounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage user login credentials, security roles, and facility assignments.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 transition-all duration-200 cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add User Account
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, role, or care home facility..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all shadow-sm"
        />
      </div>

      {/* Main List Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        {isUsersLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <p className="text-sm">Fetching user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <KeyRound className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm">No user accounts found matching query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-600 dark:text-zinc-300">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">CQC Facility</th>
                  <th className="px-6 py-4 text-center">Role</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
                {filteredUsers.map((usr: any) => (
                  <tr key={usr.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/10 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {(usr.staff?.firstName?.[0] || usr.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-zinc-100">
                            {usr.staff ? `${usr.staff.firstName} ${usr.staff.lastName}` : "No Profile"}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {usr.staff?.employeeNo || "SYSTEM"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 font-medium text-slate-700 dark:text-zinc-300">
                      {usr.email}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-slate-600 dark:text-zinc-400">
                          {usr.organization?.name || (usr.role === "ADMIN" ? "Global System" : "Unassigned")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <RoleBadge role={usr.role} />
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <StatusBadge status={usr.status} />
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => openEditModal(usr)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(usr.id, usr.email)}
                          disabled={usr.id === currentUser?.id}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                          title={usr.id === currentUser?.id ? "Cannot delete yourself" : "Delete"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-150 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <UserCheck className="h-4 w-4 text-purple-500" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-zinc-50 text-sm">
                  {editingUser ? "Edit User Settings" : "Create New User Account"}
                </h2>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="e.g. John"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="e.g. Doe"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Email Address (Username) *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="e.g. worker@carehome.com"
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {editingUser ? "Change Password (Leave blank to keep)" : "Password *"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    placeholder={editingUser ? "••••••••" : "Minimum 6 characters"}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Access Level Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  >
                    <option value="STAFF">Staff (Caregiver)</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Organization association - hide if ADMIN is selected */}
              {formData.role !== "ADMIN" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Associated Care Facility *
                  </label>
                  <select
                    required
                    value={formData.organizationId}
                    onChange={(e) => setFormData((p) => ({ ...p, organizationId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  >
                    <option value="" disabled>Select Care Home...</option>
                    {organizations.map((org: any) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                    {organizations.length === 0 && (
                      <option value="" disabled>No care facilities registered.</option>
                    )}
                  </select>
                  {organizations.length === 0 && (
                    <p className="text-[11px] text-rose-500 mt-1.5 leading-normal">
                      Please register a care home in the Organizations section first before creating manager/staff accounts.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || (formData.role !== "ADMIN" && organizations.length === 0)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg shadow-md shadow-purple-500/10 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {editingUser ? "Save Settings" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
