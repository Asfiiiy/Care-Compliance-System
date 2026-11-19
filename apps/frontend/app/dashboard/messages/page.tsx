"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Send,
  Search,
  CheckCheck,
  AlertOctagon,
  UploadCloud,
  Loader2,
  Award,
  RefreshCw,
  Users,
  ShieldCheck,
  FileCheck,
  ArrowLeft,
} from "lucide-react";
import { messageService, SendMessageDto } from "@/services/message";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { toast } from "sonner";

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If URL has ?userId=xxx, sync selectedUserId
  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId);
    }
  }, [initialUserId]);

  // Safe helper for initials
  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== "string") return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  // Safe helper for avatar URL
  const getAvatarUrl = (url?: string | null) => {
    if (!url || typeof url !== "string") return null;
    if (url.startsWith("http")) return url;
    return `http://localhost:3001${url.startsWith("/") ? url : "/" + url}`;
  };

  // Fetch conversations
  const { data: convsRes, isLoading: isConvsLoading, refetch: refetchConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messageService.getConversations(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const rawConvs = convsRes?.data?.data ?? convsRes?.data;
  const conversations: any[] = Array.isArray(rawConvs) ? rawConvs : [];

  // Fetch messages with selected user
  const { data: messagesRes, isLoading: isMessagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ["chatMessages", selectedUserId],
    queryFn: () => messageService.getMessages(selectedUserId!),
    enabled: !!user && !!selectedUserId,
    refetchInterval: 5000,
  });

  const rawMsgs = messagesRes?.data?.data ?? messagesRes?.data;
  const messages: any[] = Array.isArray(rawMsgs) ? rawMsgs : [];

  // Scroll to bottom on message load
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: (dto: SendMessageDto) => messageService.sendMessage(dto),
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["chatMessages", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messagesUnread"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to send message");
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedUserId || sendMutation.isPending) return;

    sendMutation.mutate({
      receiverId: selectedUserId,
      message: messageText.trim(),
      messageType: "TEXT",
    });
  };

  const handleQuickReply = (text: string) => {
    setMessageText(text);
  };

  const filteredConversations = conversations.filter((c: any) => {
    const name = c?.user?.name || "";
    const email = c?.user?.email || "";
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  const activeConversation = conversations.find((c: any) => c?.user?.id === selectedUserId);

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatConversationDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    } catch {
      return "";
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Team Chat & Compliance Notices
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
              Direct manager-staff messaging, CQC Regulation 18 warnings, and audit updates.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            refetchConvs();
            if (selectedUserId) refetchMessages();
            toast.success("Messages synced");
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Inbox
        </button>
      </div>

      {/* Main Messaging Container: 2-Pane Flex Layout */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[680px]">
        {/* Left Sidebar: Conversation List */}
        <div
          className={`w-full md:w-[340px] lg:w-[380px] flex-shrink-0 border-r border-slate-200 dark:border-zinc-800 flex flex-col h-full bg-slate-50/90 dark:bg-zinc-900/80 ${
            selectedUserId ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                {user?.role === "STAFF" ? "Your Registered Manager" : "Active Staff Chats"}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                {filteredConversations.length}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={user?.role === "STAFF" ? "Search manager..." : "Search staff members..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Conversation List Scroll Area */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60">
            {isConvsLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-xs gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2.5">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mx-auto">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <p className="font-bold text-slate-700 dark:text-zinc-300">
                  {user?.role === "STAFF" ? "No Messages from Manager" : "No Active Staff Chats"}
                </p>
                <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                  {user?.role === "STAFF"
                    ? "You will receive direct notices here when your Registered Manager contacts you."
                    : "When you dispatch a CQC Warning Notice or message a carer, their active chat will appear here."}
                </p>
              </div>
            ) : (
              filteredConversations.map((c: any) => {
                const isSelected = c.user?.id === selectedUserId;
                const hasUnread = (c.unreadCount || 0) > 0;
                const isOtherManager = c.user?.role === "MANAGER" || c.user?.role === "ADMIN";
                const avatarSrc = getAvatarUrl(c.user?.avatarUrl);

                return (
                  <button
                    key={c.user?.id || Math.random()}
                    onClick={() => setSelectedUserId(c.user?.id)}
                    className={`w-full p-4 flex items-start gap-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-indigo-600 shadow-sm"
                        : "hover:bg-slate-100/80 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    {/* Avatar with Status */}
                    <div className="relative flex-shrink-0">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={c.user?.name || "User"}
                          className="h-11 w-11 rounded-2xl object-cover border border-slate-200 dark:border-zinc-700 shadow-sm"
                        />
                      ) : (
                        <div
                          className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-sm ${
                            isOtherManager
                              ? "bg-gradient-to-br from-purple-600 to-indigo-600"
                              : "bg-gradient-to-br from-blue-600 to-teal-600"
                          }`}
                        >
                          {getInitials(c.user?.name)}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                          {c.user?.name || "Care Staff"}
                        </h4>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                          {formatConversationDate(c.lastMessage?.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isOtherManager
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {isOtherManager
                            ? c.user?.designation || "Registered Manager"
                            : c.user?.jobTitle || "Care Staff"}
                        </span>

                        {c.user?.complianceScore !== undefined && !isOtherManager && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              c.user.complianceScore >= 80
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            }`}
                          >
                            {c.user.complianceScore}% CQC
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs truncate ${
                          hasUnread
                            ? "font-bold text-slate-900 dark:text-white"
                            : "text-slate-500 dark:text-zinc-400"
                        }`}
                      >
                        {c.lastMessage ? (
                          c.lastMessage.messageType === "WARNING" ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                              <AlertOctagon className="h-3.5 w-3.5 inline flex-shrink-0 text-rose-500" />
                              CQC Notice: {c.lastMessage.courseTitle}
                            </span>
                          ) : (
                            c.lastMessage.message
                          )
                        ) : (
                          <span className="italic text-[11px] text-slate-400">
                            Click to open conversation
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {hasUnread && (
                      <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Message Window */}
        <div
          className={`flex-1 min-w-0 flex flex-col h-full bg-white dark:bg-zinc-900 ${
            !selectedUserId ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedUserId && activeConversation ? (
            <>
              {/* Active Conversation Top Header */}
              <div className="p-4 md:p-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 sticky top-0 z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedUserId(null)}
                    className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0 ${
                      activeConversation.user?.role === "MANAGER" ||
                      activeConversation.user?.role === "ADMIN"
                        ? "bg-gradient-to-br from-purple-600 to-indigo-600"
                        : "bg-gradient-to-br from-blue-600 to-teal-600"
                    }`}
                  >
                    {getInitials(activeConversation.user?.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white">
                        {activeConversation.user?.name}
                      </h3>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          activeConversation.user?.role === "MANAGER" ||
                          activeConversation.user?.role === "ADMIN"
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                            : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {activeConversation.user?.role === "MANAGER" ||
                        activeConversation.user?.role === "ADMIN"
                          ? activeConversation.user?.designation || "Registered Manager"
                          : activeConversation.user?.jobTitle || "Care Staff Member"}
                      </span>

                      {activeConversation.user?.complianceScore !== undefined &&
                        activeConversation.user?.role === "STAFF" && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              activeConversation.user.complianceScore >= 80
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            }`}
                          >
                            {activeConversation.user.complianceScore}% CQC Audit Readiness
                          </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{activeConversation.user?.email}</span>
                      {activeConversation.user?.employeeNo && (
                        <>
                          <span>•</span>
                          <span className="font-mono font-semibold text-slate-500">
                            ID: #{activeConversation.user.employeeNo}
                          </span>
                        </>
                      )}
                      {activeConversation.user?.department && (
                        <>
                          <span>•</span>
                          <span>{activeConversation.user.department}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user?.role !== "STAFF" && (
                    <Link
                      href="/dashboard/training-matrix"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors"
                    >
                      <Award className="h-3.5 w-3.5 text-emerald-500" />
                      View Matrix
                    </Link>
                  )}
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/30 dark:bg-zinc-950/20">
                {isMessagesLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-xs text-slate-400 space-y-2">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-zinc-300">
                      Start of message thread with {activeConversation.user?.name}
                    </p>
                    <p className="text-[11px] max-w-sm">
                      Direct messaging is logged and time-stamped for CQC Regulation 18 compliance audits.
                    </p>
                  </div>
                ) : (
                  messages.map((msg: any) => {
                    const isMine = msg.senderId === user?.id || msg.sender?.id === user?.id;
                    const isWarning = msg.messageType === "WARNING";

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      >
                        {isWarning ? (
                          /* CQC Compliance Warning Card */
                          <div
                            className={`max-w-[90%] sm:max-w-md rounded-2xl border p-4 shadow-lg ${
                              msg.statusType === "EXPIRED"
                                ? "bg-rose-500/10 border-rose-500/40 dark:bg-rose-950/30"
                                : "bg-amber-500/10 border-amber-500/40 dark:bg-amber-950/30"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-rose-500/20">
                              <AlertOctagon
                                className={`h-4 w-4 ${
                                  msg.statusType === "EXPIRED"
                                    ? "text-rose-500 animate-bounce"
                                    : "text-amber-500"
                                }`}
                              />
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider ${
                                  msg.statusType === "EXPIRED"
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                Formal CQC Regulation 18 Notice
                              </span>
                              <span className="text-[10px] text-slate-400 ml-auto font-medium">
                                {formatMessageTime(msg.createdAt)}
                              </span>
                            </div>

                            <div className="text-xs text-slate-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                              {msg.message}
                            </div>

                            {user?.role === "STAFF" && (
                              <div className="mt-3 pt-3 border-t border-rose-500/20 flex justify-end">
                                <Link
                                  href="/dashboard"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] shadow transition-all hover:scale-102"
                                >
                                  <UploadCloud className="h-3.5 w-3.5" />
                                  Upload Certificate Evidence
                                </Link>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Standard Chat Bubble */
                          <div
                            className={`max-w-[85%] sm:max-w-md rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed ${
                              isMine
                                ? "bg-slate-900 text-white dark:bg-indigo-600 rounded-tr-none"
                                : "bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 text-slate-900 dark:text-zinc-100 rounded-tl-none"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                            <div
                              className={`mt-1 text-[9px] flex items-center justify-end gap-1 ${
                                isMine ? "text-slate-300 dark:text-indigo-200" : "text-slate-400"
                              }`}
                            >
                              <span>{formatMessageTime(msg.createdAt)}</span>
                              {isMine && <CheckCheck className="h-3 w-3 text-emerald-400" />}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Preset Chips */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-850/60 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap gap-1.5 flex-shrink-0">
                {[
                  user?.role === "STAFF"
                    ? "I have completed the refresher module and will upload certificate today."
                    : "Please complete refresher training and upload certificate ASAP.",
                  user?.role === "STAFF"
                    ? "Ready for practical hoist bedside observation check."
                    : "Your practical bedside competency check is scheduled for tomorrow.",
                  "Thank you, certificate has been verified on matrix.",
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickReply(chip)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-indigo-500 transition-colors cursor-pointer truncate max-w-full"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSend}
                className="p-3 md:p-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2 flex-shrink-0"
              >
                <input
                  type="text"
                  placeholder={`Write a message to ${activeConversation.user?.name}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-zinc-800/80 text-xs rounded-2xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sendMutation.isPending}
                  className="h-11 w-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:scale-105"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Empty selection state - Shown when no chat is opened */
            <div className="flex flex-col items-center justify-center h-full p-12 text-center text-xs space-y-4">
              <div className="h-20 w-20 bg-gradient-to-br from-indigo-500/10 to-teal-500/10 rounded-3xl flex items-center justify-center text-indigo-600 shadow-inner">
                <MessageSquare className="h-10 w-10 stroke-[1.5]" />
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="font-extrabold text-lg text-slate-800 dark:text-zinc-100">
                  Select a Conversation
                </h4>
                <p className="text-slate-500 dark:text-zinc-400 text-xs leading-relaxed">
                  {user?.role === "STAFF"
                    ? "Click on your Registered Care Manager from the left list to review CQC notices or send a reply."
                    : "Click on any staff member from the left list to open their direct chat history, inspect compliance metrics, or send an audit notice."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm w-full pt-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    CQC Audit Trail
                  </div>
                  <p className="text-[10px] text-slate-400">All warnings and messages are stamped for Regulation 18.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    <FileCheck className="h-3.5 w-3.5" />
                    Live Matrix Sync
                  </div>
                  <p className="text-[10px] text-slate-400">Notices automatically sync with training expiry dates.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}

