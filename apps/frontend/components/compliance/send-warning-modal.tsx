"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertOctagon,
  Clock,
  Mail,
  Bell,
  MessageSquare,
  X,
  Send,
  Loader2,
  CheckCircle2,
  User,
  ShieldAlert,
} from "lucide-react";
import { messageService, SendWarningDto } from "@/services/message";
import { toast } from "sonner";

interface SendWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string | null;
    employeeNo?: string;
    user?: any;
  };
  courseTitle: string;
  expiryDate: string;
  statusType: "EXPIRED" | "EXPIRING";
  onSuccess?: () => void;
}

const NOTE_PRESETS = [
  "Please complete refresher training and upload certificate ASAP to remain CQC compliant.",
  "Your certificate has lapsed. Shift lead observation/e-learning link is available in your staff portal.",
  "Urgent: Annual CQC Regulation 18 audit is this week. Please upload evidence before tomorrow.",
  "Refresher course is required before next roster allocation.",
];

export function SendWarningModal({
  isOpen,
  onClose,
  staff,
  courseTitle,
  expiryDate,
  statusType,
  onSuccess,
}: SendWarningModalProps) {
  const queryClient = useQueryClient();
  const isExpired = statusType === "EXPIRED";

  const [customNote, setCustomNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [sendChat, setSendChat] = useState(true);

  const staffDisplayName = staff?.name || `${staff?.firstName || ''} ${staff?.lastName || ''}`.trim() || "Staff Member";

  const warningMutation = useMutation({
    mutationFn: (dto: SendWarningDto) => messageService.sendWarning(dto),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      queryClient.invalidateQueries({ queryKey: ["sidebarNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["recentNotifications"] });
      onSuccess?.();
      toast.success(`CQC Warning successfully dispatched to ${staffDisplayName} via Email, Notification, and Chat!`);
      onClose();
      setCustomNote("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to dispatch compliance warning");
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendEmail && !sendNotification && !sendChat) {
      toast.error("Please select at least one dispatch channel (Email, Notification, or Chat)");
      return;
    }

    warningMutation.mutate({
      staffId: staff.id,
      courseTitle,
      expiryDate,
      statusType,
      customNote: customNote.trim() || undefined,
      sendEmail,
      sendNotification,
      sendChat,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg p-6 md:p-7 relative z-10 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isExpired ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30" : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
            }`}>
              {isExpired ? <AlertOctagon className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isExpired ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                }`}>
                  {isExpired ? "EXPIRED CERTIFICATION" : "UPCOMING EXPIRY"}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
                  CQC Reg 18 Notice
                </span>
              </div>
              <h3 className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white mt-0.5">
                Issue Compliance Warning
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Staff & Course Target Card */}
        <div className="bg-slate-50 dark:bg-zinc-850 border border-slate-200/80 dark:border-zinc-800 p-4 rounded-2xl space-y-3 mb-5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow">
                {staffDisplayName.split(" ").map(n => n[0]).join("").toUpperCase() || "ST"}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{staffDisplayName}</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">{staff?.email || staff?.user?.email || "Care Staff Member"}</p>
              </div>
            </div>
            {staff.employeeNo && (
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-mono text-slate-600 dark:text-zinc-400">
                {staff.employeeNo}
              </span>
            )}
          </div>

          <div className="pt-2.5 border-t border-slate-200/60 dark:border-zinc-800 flex justify-between items-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Course / Module:</span>
              <p className="font-bold text-slate-800 dark:text-zinc-200">{courseTitle}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Expiry Date:</span>
              <p className={`font-bold ${isExpired ? "text-rose-600" : "text-amber-600"}`}>{expiryDate}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Custom Manager Note */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-zinc-300 flex justify-between">
              <span>Manager Directive / Note <span className="text-slate-400 font-normal">(Optional)</span></span>
            </label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Please complete your online module by Friday so we can sign off the training matrix before CQC audit."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 resize-none text-xs"
            />
            {/* Note Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {NOTE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCustomNote(preset)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors cursor-pointer text-left truncate max-w-full"
                >
                  &quot;{preset.slice(0, 48)}...&quot;
                </button>
              ))}
            </div>
          </div>

          {/* 3-Channel Dispatch Toggles */}
          <div className="space-y-2 pt-2">
            <label className="font-bold text-slate-700 dark:text-zinc-300 block">
              Multi-Channel Dispatch Selection:
            </label>

            <div className="space-y-2">
              {/* Email */}
              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                sendEmail ? "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-300" : "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 text-slate-500"
              }`}>
                <div className="flex items-center gap-3">
                  <Mail className={`h-4 w-4 ${sendEmail ? "text-blue-500" : "text-slate-400"}`} />
                  <div>
                    <p className="font-bold text-xs">Send Official Email Notice</p>
                    <p className="text-[10px] opacity-80">Sends branded CQC compliance action email to staff inbox</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              {/* In-App Notification */}
              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                sendNotification ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300" : "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 text-slate-500"
              }`}>
                <div className="flex items-center gap-3">
                  <Bell className={`h-4 w-4 ${sendNotification ? "text-amber-500" : "text-slate-400"}`} />
                  <div>
                    <p className="font-bold text-xs">Send In-App Dashboard Alert</p>
                    <p className="text-[10px] opacity-80">Triggers notification bell & banner on caregiver login</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="rounded h-4 w-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </label>

              {/* Direct Chat Message */}
              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                sendChat ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300" : "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 text-slate-500"
              }`}>
                <div className="flex items-center gap-3">
                  <MessageSquare className={`h-4 w-4 ${sendChat ? "text-emerald-500" : "text-slate-400"}`} />
                  <div>
                    <p className="font-bold text-xs">Post Direct Chat Warning Card</p>
                    <p className="text-[10px] opacity-80">Posts interactive warning card into Manager-Staff chat thread</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={sendChat}
                  onChange={(e) => setSendChat(e.target.checked)}
                  className="rounded h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 font-semibold text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={warningMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer hover:scale-102 disabled:opacity-50"
            >
              {warningMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Dispatching Multi-Channel Warning...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Dispatch 3-Channel CQC Warning
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
