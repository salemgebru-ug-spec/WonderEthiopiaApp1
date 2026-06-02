"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Clock,
  FileText,
  AlertCircle,
  MoreVertical,
  Briefcase,
  Phone,
  LayoutDashboard,
  ShieldCheck,
  MessageSquare,
  User,
  Mail,
  History,
  Search
} from "lucide-react";
import BusinessChat from "@/components/admin/BusinessChat";
import ChatDrawer from "@/components/admin/ChatDrawer";
import ExpansionChatDrawer from "@/components/admin/ExpansionChatDrawer";
import { pusherClient } from "@/lib/pusher-client";

import { showToast, getToastContent } from "@/lib/toast";

interface Business {
  _id: string;
  name: string;
  description: string;
  category: string | string[];
  status: string;
  permitNumber: string;
  documents: string[];
  applicantName: string;
  location: { region: string; city: string; address: string };
  ownerId: { name: string; email: string } | null;
  contactPhone: string;
  contactEmail: string;
  industryDetails?: Record<string, any>;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pending Review", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Clock className="w-3.5 h-3.5" /> },
  recommended_approve: { label: "Approved (Recommended)", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  recommended_reject: { label: "Rejected (Recommended)", color: "text-rose-600", bg: "bg-rose-50 border-rose-100", icon: <XCircle className="w-3.5 h-3.5" /> },
  approved: { label: "Live / Approved", color: "text-primary", bg: "bg-primary/5 border-primary/10", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Denied", color: "text-red-600", bg: "bg-red-50 border-red-100", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function TourismAdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionNote, setActionNote] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [showChat, setShowChat] = useState<string | null>(null);
  const showChatRef = useRef<string | null>(null);
  useEffect(() => { showChatRef.current = showChat; }, [showChat]);
  const [unreadBizCounts, setUnreadBizCounts] = useState<Record<string, number>>({});
  const [expansionRequests, setExpansionRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBusinesses = businesses.filter(biz => {
    const term = searchTerm.toLowerCase();
    return (
      biz.name.toLowerCase().includes(term) ||
      (biz.permitNumber || "").toLowerCase().includes(term) ||
      (biz.applicantName || "").toLowerCase().includes(term) ||
      (biz.contactEmail || "").toLowerCase().includes(term) ||
      (biz.contactPhone || "").toLowerCase().includes(term) ||
      (Array.isArray(biz.category)
        ? biz.category.join(" ")
        : biz.category || ""
      ).toLowerCase().includes(term) ||
      (biz.location?.city || "").toLowerCase().includes(term) ||
      (biz.location?.region || "").toLowerCase().includes(term) ||
      (biz.location?.address || "").toLowerCase().includes(term)
    );
  });

  const filteredExpansionRequests = expansionRequests.filter(req => {
    const term = searchTerm.toLowerCase();
    return (
      (req.message || "").toLowerCase().includes(term) ||
      (req.relatedId?.name || "Business").toLowerCase().includes(term) ||
      (req.relatedId?.permitNumber || "").toLowerCase().includes(term)
    );
  });

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      if (filter === "expansion_requests") {
        const res = await fetch("/api/business/category-request");
        const data = await res.json();
        setExpansionRequests(data.requests || []);
        setBusinesses([]);
      } else {
        const url = filter === "all" ? "/api/businesses" : `/api/businesses?status=${filter}`;
        const res = await fetch(url);
        const data = await res.json();
        setBusinesses(data.businesses || []);
        setExpansionRequests([]);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      const counts: Record<string, number> = {};
      (data.notifications || [])
        .filter((n: any) => !n.isRead && n.relatedId && n.type === "internal_chat")
        .forEach((n: any) => {
          const id = n.relatedId?.toString();
          if (id) {
            if (showChatRef.current === id) {
              fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ relatedId: id }),
              }).catch(() => { });
            } else {
              counts[id] = (counts[id] || 0) + 1;
            }
          }
        });
      setUnreadBizCounts(counts);
    } catch (e) { }
  };

  useEffect(() => {
    fetchBusinesses();
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 10000);

    // Instant notification listener for badges
    let channel: any;
    try {
      if (process.env.NEXT_PUBLIC_PUSHER_KEY) {
        channel = pusherClient.subscribe(`admin-notifications-tourism_admin`);
        channel.bind("new-internal-message", (data: any) => {
          if (data.businessId) {
            if (showChatRef.current === data.businessId) {
              fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ relatedId: data.businessId }),
              }).catch(() => { });
            } else {
              setUnreadBizCounts(prev => ({
                ...prev,
                [data.businessId]: (prev[data.businessId] || 0) + 1
              }));
            }
          }
        });
      }
    } catch (e) { }

    return () => {
      clearInterval(interval);
      if (channel) {
        pusherClient.unsubscribe(`admin-notifications-tourism_admin`);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleRecommend = async (id: string, action: string) => {
    try {
      const loadingToast = toast.loading(`Submitting recommendation...`);
      const res = await fetch(`/api/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: actionNote }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.update(loadingToast, { render: getToastContent("Success", data.message || "Recommendation submitted!", "success"), type: "success", isLoading: false, autoClose: 8000 });
        setActingOn(null);
        setActionNote("");
        fetchBusinesses();
      } else {
        toast.update(loadingToast, { render: getToastContent("System Error", data.error || "Failed", "error"), type: "error", isLoading: false, autoClose: 8000 });
      }
    } catch (error: any) {
      console.error("Recommendation failed:", error);
      showToast("System Error", error.message || "An unexpected error occurred", "error");
    }
  };

  const handleExpansionAction = async (id: string, action: string) => {
    try {
      const loadingToast = toast.loading(`Processing expansion...`);
      const res = await fetch(`/api/business/category-request`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, action, note: actionNote }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.update(loadingToast, { render: getToastContent("Success", data.message || "Processed successfully!", "success"), type: "success", isLoading: false, autoClose: 8000 });
        setActingOn(null);
        setActionNote("");
        fetchBusinesses();
      } else {
        toast.update(loadingToast, { render: getToastContent("System Error", data.error || "Failed", "error"), type: "error", isLoading: false, autoClose: 8000 });
      }
    } catch (error: any) {
      showToast("System Error", error.message || "An error occurred", "error");
    }
  };

  const filters = ["all", "pending", "recommended_approve", "recommended_reject", "approved", "rejected", "expansion_requests"];

  return (
    <div className="bg-background text-foreground font-sans">
      <main className="relative z-10 max-w-7xl mx-auto px-3 md:px-4 lg:px-5 py-10 lg:py-20">
        {/* Title & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-black tracking-[0.3em] uppercase text-primary">
                Operational Moderate
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground mb-6 leading-none">
              Institutional <br /> Quality Control
            </h1>
            <p className="text-foreground/40 text-lg font-medium italic">
              Verification of business permits and cultural integrity compliance.
            </p>
          </div>
          <div className="relative w-full md:w-80 shrink-0">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search registry..."
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-foreground/5 rounded-2xl text-xs font-bold placeholder-foreground/20 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all shadow-sm"
            />
            <Search className="w-4 h-4 text-foreground/20 absolute left-4 top-1/2 -translate-y-1/2" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-primary transition-colors text-[9px] font-black uppercase tracking-widest"
              >
                X
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide border-t border-foreground/[0.03] pt-8">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-8 py-3.5 text-sm font-black uppercase tracking-widest rounded-2xl border transition-all duration-300 ${filter === f
                ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105"
                : "bg-white text-foreground/30 border-foreground/5 hover:border-primary/20 hover:text-primary"
                }`}
            >
              {f.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <span className="text-xs font-black tracking-widest uppercase text-foreground/20">Syncing Registry...</span>
          </div>
        ) : filter === "expansion_requests" ? (
          filteredExpansionRequests.length === 0 ? (
            <div className="text-center py-48 bg-white/50 rounded-[60px] border-4 border-dashed border-foreground/5">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary/20">
                <Briefcase className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-foreground/40 mb-2">
                {searchTerm ? "No Match Found" : "No Expansion Requests"}
              </h3>
              <p className="text-foreground/20 font-medium italic">
                {searchTerm ? "Try searching for a different term." : "All business domains are verified."}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredExpansionRequests.map((req, i) => (
                <div key={req._id} className="bg-white rounded-[50px] p-10 md:p-12 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] animate-slide-up group">
                  <div className="flex items-start gap-8 mb-8">
                    <div className="w-16 h-16 rounded-[28px] bg-primary/5 flex items-center justify-center text-primary shadow-inner shrink-0 mt-2">
                      <Briefcase className="w-8 h-8" />
                    </div>
                    <div className="w-full">
                      <h3 className="text-2xl font-bold text-foreground tracking-tighter leading-none mb-6">Expansion Protocol Request</h3>

                      {/* Parse Message Content */}
                      {(() => {
                        const sections = req.message.split("\n\n");
                        const [introRaw, justificationRaw] = sections[0].split("**Justification:**");
                        const intro = introRaw.trim().replace(/\*\*/g, "");
                        const justification = justificationRaw ? justificationRaw.trim() : null;

                        return (
                          <div className="space-y-6 w-full">
                            <p className="text-[14px] font-bold text-foreground/70 leading-relaxed border-b border-foreground/[0.03] pb-6">
                              {intro}
                            </p>

                            {justification && (
                              <div className="p-6 rounded-[32px] bg-primary/[0.02] border border-primary/10">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary block mb-2">Strategic Justification</span>
                                <p className="text-base font-medium text-foreground/60 italic leading-relaxed text-balance">
                                  "{justification}"
                                </p>
                              </div>
                            )}

                            {sections.slice(1).map((section: string, idx: number) => {
                              if (section.includes("Supplemental Industry Data")) {
                                const lines = section.split("\n").filter((l: string) => l.startsWith("- **"));
                                return (
                                  <div key={idx} className="bg-foreground/[0.01] p-6 lg:p-8 rounded-[32px] border border-foreground/[0.03]">
                                    <span className="text-xs font-black uppercase tracking-widest text-foreground/40 block mb-6">Supplemental Intelligence</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {lines.map((line: string, i: number) => {
                                        const match = line.match(/- \*\*([^*]+)\*\*: (.*)/);
                                        if (match) {
                                          return (
                                            <div key={i} className="bg-white p-4 rounded-2xl border border-foreground/[0.03] shadow-sm">
                                              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/50 block mb-1">{match[1].replace(/([A-Z])/g, ' $1').trim()}</span>
                                              <span className="text-base font-bold text-foreground/80">{match[2]}</span>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  </div>
                                );
                              }

                              if (section.includes("Supporting Documents")) {
                                const lines = section.split("\n").filter((l: string) => l.startsWith("- ["));
                                return (
                                  <div key={idx} className="bg-primary/[0.01] p-6 lg:p-8 rounded-[32px] border border-primary/10">
                                    <span className="text-xs font-black uppercase tracking-widest text-primary/40 block mb-6">Verification Artifacts</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {lines.map((line: string, i: number) => {
                                        const match = line.match(/- \[([^\]]+)\]\(([^)]+)\) \(([^)]+)\)/);
                                        if (match) {
                                          return (
                                           <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-[28px] bg-white border border-foreground/[0.05] hover:border-primary/20 hover:shadow-xl transition-all group/doc">
                                              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover/doc:bg-primary group-hover/doc:text-white transition-all shrink-0">
                                                <FileText className="w-6 h-6" />
                                              </div>
                                              <div className="flex flex-col min-w-0">
                                                <span className="text-[8px] font-black uppercase text-foreground/20 tracking-widest truncate mb-1">{match[3].replace(/([A-Z])/g, ' $1').trim()}</span>
                                                <span className="text-sm font-extrabold text-foreground/60 truncate uppercase">{match[1]}</span>
                                              </div>
                                            </a>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {/* Institutional Discussion (Chat) Toggle */}
                  <div className="mb-10">
                    <button
                      onClick={() => setShowChat(req._id)}
                      className="flex items-center gap-4 px-6 py-4 bg-primary/5 text-primary rounded-xl border border-primary/10 hover:bg-primary hover:text-white transition-all group/chat relative w-fit"
                    >
                      <MessageSquare className="w-5 h-5 group-hover/chat:scale-110 transition-transform" />
                      <span className="text-sm font-black uppercase tracking-[0.3em]">Deliberation</span>
                      {unreadBizCounts[req._id] > 0 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                          {unreadBizCounts[req._id]}
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="border-t border-foreground/[0.03] pt-8 mt-4">
                    {req.recommendationAction ? (
                      /* Already forwarded — show status, await Super Admin */
                      <div className={`flex items-center gap-6 p-6 rounded-[28px] ${req.recommendationAction === "recommend_approve"
                        ? "bg-emerald-50/50 border border-emerald-100"
                        : "bg-rose-50/50 border border-rose-100"
                        }`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${req.recommendationAction === "recommend_approve"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-100 text-rose-600"
                          }`}>
                          {req.recommendationAction === "recommend_approve"
                            ? <CheckCircle2 className="w-6 h-6" />
                            : <XCircle className="w-6 h-6" />}
                        </div>
                        <div>
                          <span className={`text-[9px] font-black uppercase tracking-[0.25em] block mb-1 ${req.recommendationAction === "recommend_approve" ? "text-emerald-600" : "text-rose-600"
                            }`}>
                            Recommendation Forwarded — Awaiting Super Admin
                          </span>
                          <p className="text-base font-bold text-foreground/60">
                            You recommended{" "}
                            <strong>{req.recommendationAction === "recommend_approve" ? "Approval" : "Rejection"}</strong>{" "}
                            on{" "}
                            {new Date(req.recommendedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}.
                            The Super Admin will make the final call.
                          </p>
                        </div>
                      </div>
                    ) : actingOn === req._id ? (
                      <div className="w-full lg:max-w-2xl space-y-6 animate-fade-in">
                        <textarea
                          value={actionNote}
                          onChange={(e) => setActionNote(e.target.value)}
                          placeholder="State the institutional grounds for this recommendation..."
                          className="w-full px-8 py-6 bg-foreground/[0.02] border border-foreground/[0.05] rounded-[32px] text-foreground text-sm font-bold placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                          rows={3}
                        />
                        <div className="flex gap-4 flex-wrap">
                          <button
                            onClick={() => handleExpansionAction(req._id, "recommend_approve")}
                            className="flex-1 px-8 py-4 bg-primary text-white text-sm font-black rounded-2xl hover:bg-primary-hover transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase tracking-widest"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Recommend Approval
                          </button>
                          <button
                            onClick={() => handleExpansionAction(req._id, "recommend_reject")}
                            className="flex-1 px-8 py-4 bg-white border border-red-100 text-red-600 text-sm font-black rounded-2xl hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                          >
                            <XCircle className="w-4 h-4" />
                            Recommend Rejection
                          </button>
                          <button
                            onClick={() => { setActingOn(null); setActionNote(""); }}
                            className="px-8 py-4 text-sm font-black text-foreground/30 hover:text-foreground uppercase tracking-widest"
                          >
                            Abandon Action
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActingOn(req._id)}
                        className="px-10 py-5 bg-primary text-white text-sm font-black rounded-2xl hover:bg-primary-hover shadow-2xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-[0.2em] flex items-center gap-3"
                      >
                        Begin Resolution Path
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <ExpansionChatDrawer
                    isOpen={showChat === req._id}
                    onClose={() => setShowChat(null)}
                    notificationId={req._id}
                    businessName={req.relatedId?.name || "Business"}
                    currentRole="tourism_admin"
                    initialDiscussion={req.discussion}
                  />
                </div>
              ))}
            </div>
          )
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-48 bg-white/50 rounded-[60px] border-4 border-dashed border-foreground/5">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary/20">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground/40 mb-2">
              {searchTerm ? "No Match Found" : "No Applications Found"}
            </h3>
            <p className="text-foreground/20 font-medium italic">
              {searchTerm ? "Try searching for a different term." : "This segment of the registry is currently clear."}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredBusinesses.map((biz, i) => {
              const sc = statusConfig[biz.status] || statusConfig.pending;
              return (
                <div
                  key={biz._id}
                  className="bg-white rounded-[50px] p-10 md:p-12 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] animate-slide-up group"
                  style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
                    <div className="flex-1 w-full">
                      {/* Identity Row */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-8">
                        <div className="flex items-center gap-6">
                          <Link href={`/tourism-admin/businesses/${biz._id}`} className="w-16 h-16 rounded-[28px] bg-primary/5 flex items-center justify-center text-primary shadow-inner hover:bg-primary hover:text-white transition-all">
                            <Building2 className="w-8 h-8" />
                          </Link>
                          <div>
                            <Link href={`/tourism-admin/businesses/${biz._id}`} className="hover:text-primary transition-colors">
                              <h3 className="text-4xl font-bold text-foreground tracking-tighter mb-1 leading-none group-hover:text-primary transition-colors">{biz.name}</h3>
                            </Link>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground/30">
                                {Array.isArray(biz.category)
                                  ? biz.category.map(c => c.replace(/_/g, " ")).join(", ")
                                  : biz.category.replace(/_/g, " ")}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-foreground/10" />
                              <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-primary/40" />
                                {biz.location.address}, {biz.location.city}, {biz.location.region}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-5 py-2.5 rounded-full border ${sc.bg} ${sc.color} flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-sm`}>
                          {sc.icon}
                          {sc.label}
                        </div>
                      </div>

                      <p className="text-[15px] text-foreground/40 font-medium leading-relaxed mb-10 italic">
                        "{biz.description}"
                      </p>

                      {/* Info & Metadata Matrix */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12 p-10 rounded-[40px] bg-foreground/[0.01] border border-foreground/[0.03]">
                        <div className="space-y-4">
                          <div>
                            <span className="text-[9px] font-black tracking-widest uppercase text-primary/40 block mb-1">Permit Number</span>
                            <p className="text-base font-bold text-foreground">{biz.permitNumber}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-black tracking-widest uppercase text-primary/40 block mb-1">Applicant Name</span>
                            <p className="text-base font-bold text-foreground">{biz.applicantName || "Institutional"}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <span className="text-[9px] font-black tracking-widest uppercase text-primary/40 block mb-1">Official Email</span>
                            <p className="text-base font-bold text-foreground truncate">{biz.contactEmail}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-black tracking-widest uppercase text-primary/40 block mb-1">Primary Phone</span>
                              <p className="text-base font-bold text-foreground">{biz.contactPhone || "None"}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-black tracking-widest uppercase text-primary/40 block mb-1">Entry</span>
                              <p className="text-base font-bold text-foreground">{new Date(biz.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Administrative Control Bar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-foreground/[0.03]">
                        <div className="flex items-center gap-6">
                          <button
                            onClick={() => setShowChat(biz._id)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all relative ${showChat === biz._id ? 'bg-primary text-white shadow-lg' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
                            <MessageSquare className="w-4 h-4" /> Discussion
                            {unreadBizCounts[biz._id] > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-bounce shadow-lg">{unreadBizCounts[biz._id]}</span>}
                          </button>
                        </div>

                        {biz.status === "pending" ? (
                          <button
                            onClick={() => setActingOn(biz._id)}
                            className="px-10 py-5 bg-primary text-white text-sm font-black rounded-2xl hover:bg-primary-hover shadow-2xl transition-all active:scale-95 uppercase tracking-[0.2em] flex items-center gap-3">
                            Begin Resolution Path
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-foreground/[0.03] text-foreground/20 italic text-sm font-black uppercase tracking-widest">
                            Recommendation Filed
                          </div>
                        )}
                      </div>

                      {actingOn === biz._id && (
                        <div className="mt-10 p-10 bg-white border-2 border-primary/20 rounded-[40px] shadow-2xl animate-fade-in">
                          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-6">Institutional Grounds Terminal</h4>
                          <textarea
                            value={actionNote}
                            onChange={e => setActionNote(e.target.value)}
                            placeholder="State the institutional grounds for this recommendation..."
                            className="w-full px-8 py-6 bg-foreground/[0.02] border border-foreground/[0.05] rounded-[28px] text-sm font-bold placeholder-foreground/20 outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-6"
                            rows={3} />
                          <div className="flex gap-3">
                            <button onClick={() => handleRecommend(biz._id, "recommended_approve")} className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover">Recommend Approval</button>
                            <button onClick={() => handleRecommend(biz._id, "recommended_reject")} className="flex-1 px-8 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-700">Recommend Rejection</button>
                            <button onClick={() => setActingOn(null)} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-foreground/30">Cancel</button>
                          </div>
                        </div>
                      )}

                      {/* Chat Drawer */}
                      <ChatDrawer
                        isOpen={showChat === biz._id}
                        onClose={() => setShowChat(null)}
                        businessId={biz._id}
                        businessName={biz.name}
                        currentRole="tourism_admin"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
