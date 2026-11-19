"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { organizationService } from "@/services/organization.service";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

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

export default function OrganizationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    postcode: "",
    registrationNumber: "",
    phone: "",
    email: "",
    bedCapacity: "0",
    subscriptionPlan: "Standard",
    subscriptionStatus: "ACTIVE",
    status: "ACTIVE",
  });

  const { data: orgsRes, isLoading } = useQuery({
    queryKey: ["organizations", search],
    queryFn: () => organizationService.findAll({ search }).then((res) => res.data),
    enabled: !!user,
  });

  const organizations = orgsRes?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => organizationService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["adminSummary"] });
      toast.success("Organization registered successfully!");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to register organization");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      organizationService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organization updated successfully!");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update organization");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => organizationService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["adminSummary"] });
      toast.success("Organization deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete organization");
    },
  });

  function openCreateModal() {
    setEditingOrg(null);
    setFormData({
      name: "",
      address: "",
      postcode: "",
      registrationNumber: "",
      phone: "",
      email: "",
      bedCapacity: "0",
      subscriptionPlan: "Standard",
      subscriptionStatus: "ACTIVE",
      status: "ACTIVE",
    });
    setIsModalOpen(true);
  }

  function openEditModal(org: any) {
    setEditingOrg(org);
    setFormData({
      name: org.name || "",
      address: org.address || "",
      postcode: org.postcode || "",
      registrationNumber: org.registrationNumber || "",
      phone: org.phone || "",
      email: org.email || "",
      bedCapacity: String(org.bedCapacity ?? 0),
      subscriptionPlan: org.subscriptionPlan || "Standard",
      subscriptionStatus: org.subscriptionStatus || "ACTIVE",
      status: org.status || "ACTIVE",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingOrg(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Organization Name is required");
      return;
    }

    const payload = {
      ...formData,
      bedCapacity: parseInt(formData.bedCapacity, 10) || 0,
    };

    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(id: string, name: string) {
    if (confirm(`Are you sure you want to delete organization "${name}"? This will unlink all associated users/staff.`)) {
      deleteMutation.mutate(id);
    }
  }

  if (user?.role !== "ADMIN") {
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
              <Building className="h-5 w-5 text-purple-500" />
            </div>
            Organizations
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Register and manage CQC-compliant care homes and facilities.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 transition-all duration-200 cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Organization
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, address, or postcode..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all shadow-sm"
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <p className="text-sm">Fetching organizations...</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <Building className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm">No organizations found matching details.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-600 dark:text-zinc-300">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">CQC Rating (Predicted)</th>
                  <th className="px-6 py-4 text-center">Staff Count</th>
                  <th className="px-6 py-4 text-center">User Accounts</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
                {organizations.map((org: any) => (
                  <tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/10 transition-colors">
                    <td className="px-6 py-4.5 font-semibold text-slate-900 dark:text-zinc-100">
                      <Link href={`/dashboard/organizations/${org.id}`} className="hover:underline text-purple-600 dark:text-purple-400 font-bold">
                        {org.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-zinc-400">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {org.address || "N/A"}
                          {org.postcode ? `, ${org.postcode}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <RatingBadge rating={org.rating} />
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold px-2.5 py-1 text-xs min-w-[32px]">
                        {org._count?.staff ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold px-2.5 py-1 text-xs min-w-[32px]">
                        {org._count?.users ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => openEditModal(org)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(org.id, org.name)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Delete"
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
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-150 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Building className="h-4 w-4 text-purple-500" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-zinc-50 text-sm">
                  {editingOrg ? "Edit Organization Details" : "Register New Organization"}
                </h2>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. St. Jude Care Home"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  placeholder="e.g. 100 Careway Lane, London"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Postcode
                </label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => setFormData((p) => ({ ...p, postcode: e.target.value }))}
                  placeholder="e.g. EC1A 1BB"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Registration No
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, registrationNumber: e.target.value }))}
                    placeholder="e.g. CQC-109283-A"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Bed Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.bedCapacity}
                    onChange={(e) => setFormData((p) => ({ ...p, bedCapacity: e.target.value }))}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. 020 7946 0192"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="e.g. info@facility.co.uk"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  >
                    <option value="ACTIVE">Active (Logins Enabled)</option>
                    <option value="INACTIVE">Inactive (Logins Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Subscription Plan
                  </label>
                  <select
                    value={formData.subscriptionPlan}
                    onChange={(e) => setFormData((p) => ({ ...p, subscriptionPlan: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Subscription Status
                  </label>
                  <select
                    value={formData.subscriptionStatus}
                    onChange={(e) => setFormData((p) => ({ ...p, subscriptionStatus: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg shadow-md shadow-purple-500/10 transition-colors cursor-pointer"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {editingOrg ? "Save Changes" : "Register Home"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
