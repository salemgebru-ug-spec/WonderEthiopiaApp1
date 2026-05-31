"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronRight,
  MessageSquare,
  Clock,
  ShieldCheck,
  History,
  AlertOctagon,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";
import ReportChatDrawer from "@/components/admin/ReportChatDrawer";

interface Report {
  _id: string;
  reason: string;
  description: string;
  status: string;
  adminNotes: string;
  reporterId: { _id: string; name: string; email: string };
  businessId: { _id: string; name: string };
  reviewedBy: { name: string } | null;
  discussion: Array<{
    senderId: string;
    senderName: string;
    senderRole: string;
    message: string;
    timestamp: string;
  }>;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "Awaiting Triage", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Clock className="w-3.5 h-3.5" /> },
  recommended_under_review: { label: "Rec: Under Review", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  recommended_warning: { label: "Rec: Warning", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  recommended_suspension: { label: "Rec: Suspension", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  recommended_dismissal: { label: "Rec: Dismissal", color: "text-rose-600", bg: "bg-rose-50 border-rose-100", icon: <XCircle className="w-3.5 h-3.5" /> },
  warned: { label: "Warned by Super Admin", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  suspended: { label: "Suspended by Super Admin", color: "text-red-600", bg: "bg-red-50 border-red-100", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  dismissed: { label: "Dismissed by Super Admin", color: "text-foreground/40", bg: "bg-foreground/[0.02] border-foreground/[0.05]", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function TourismAdminReportsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionNote, setActionNote] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showChat, setShowChat] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [readReports, setReadReports] = useState<Record<string, number>>({});

  useEffect(() => {
    const stored = localStorage.getItem('read_reports');
    if (stored) {
      try {
        setReadReports(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const openChat = (reportId: string, currentLength: number) => {
    setShowChat(reportId);
    const newRead = { ...readReports, [reportId]: currentLength };
    setReadReports(newRead);
    localStorage.setItem('read_reports', JSON.stringify(newRead));
  };

  // Role guard
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    } else if (sessionStatus === "authenticated" && session?.user?.role !== "tourism_admin") {
      router.push("/unauthorized");
    }
  }, [session, sessionStatus, router]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const url = filter === "all" ? "/api/reports" : `/api/reports?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.role === "tourism_admin") {
      fetchReports();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, session, sessionStatus]);

  const handleAction = async (id: string, newStatus: string, message?: string) => {
    try {
      setSubmitting(true);
      const payload: any = {};
      if (newStatus) payload.status = newStatus;
      if (message) payload.message = message;
      if (actionNote) payload.adminNotes = actionNote;

      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setActingOn(null);
        setActionNote("");
        fetchReports();
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionStatus !== "authenticated" || session?.user?.role !== "tourism_admin") {
    return null;
  }

  return (
    <div className="bg-background text-foreground font-sans min-h-screen">
      <main className="relative z-10 max-w-7xl mx-auto px-3 md:px-4 lg:px-5 py-10 lg:py-20">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-foreground/40 hover:text-primary transition-all bg-white/50 backdrop-blur-xl px-5 py-2.5 rounded-full border border-foreground/5 shadow-sm font-bold text-xs mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Command Hub
        </Link>

        {/* Title & Filters */}
        <div className="animate-fade-in mb-16 px-4">
          <div className="max-w-3xl mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-black tracking-[0.3em] uppercase text-primary">
                Institutional Oversight — Stage 1
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-tight">
              Platform Integrity <br /> Monitoring
            </h1>
            <p className="text-foreground/40 text-lg font-medium italic">
              Review and triage tourist-submitted reports. Forward serious violations to Super Admin for final action.
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {["all", "pending", "recommended_under_review", "recommended_warning", "recommended_suspension", "recommended_dismissal"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-8 py-3.5 text-sm font-black uppercase tracking-widest rounded-2xl border transition-all duration-300 whitespace-nowrap ${
                  filter === f
                    ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105"
                    : "bg-white text-foreground/30 border-foreground/5 hover:border-primary/20 hover:text-primary"
                }`}
              >
                {f.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <span className="text-xs font-black tracking-widest uppercase text-foreground/20">Syncing Grievance Registry...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-48 bg-white/50 rounded-[60px] border-4 border-dashed border-foreground/5">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary/20">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground/40 mb-2">Registry is Clear</h3>
            <p className="text-foreground/20 font-medium italic">No active tourist grievances found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-20 px-4 max-w-5xl mx-auto">
            {Object.entries(
              reports.reduce((acc: Record<string, { business: any, items: Report[] }>, report) => {
                const bizId = report.businessId?._id || "unknown";
                if (!acc[bizId]) acc[bizId] = { business: report.businessId, items: [] };
                acc[bizId].items.push(report);
                return acc;
              }, {})
            ).map(([bizId, { business, items }], bizIndex) => {
              const uniqueReportersCount = new Set(items.map(r => r.reporterId?._id || r.reporterId)).size;
              return (
              <div key={bizId} className="space-y-8 animate-slide-up" style={{ animationDelay: `${bizIndex * 0.08}s` }}>
                {/* Business Group Header */}
                <div className="flex items-center gap-4 pl-6 border-l-4 border-primary">
                  <h2 className="text-3xl font-black tracking-tighter text-foreground capitalize">
                    {business?.name || "Unknown Entity"}
                  </h2>
                  <div className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs font-black uppercase tracking-widest border border-rose-100 shadow-sm flex items-center gap-2">
                    <AlertOctagon className="w-3 h-3" />
                    {items.length} Active Grievance{items.length !== 1 ? 's' : ''}
                  </div>
                  {uniqueReportersCount > 1 && (
                    <div className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-xs font-black uppercase tracking-widest border border-amber-100 shadow-sm flex items-center gap-2">
                      <User className="w-3 h-3" />
                      {uniqueReportersCount} Unique Reporters (Auto-Escalation Active)
                    </div>
                  )}
                </div>

                {/* Grouped Reports */}
                <div className="space-y-12 pl-4 md:pl-10">
                  {items.map((report, i) => {
                    const sc = statusConfig[report.status] || statusConfig.pending;
                    return (
                <div
                  key={report._id}
                  className="bg-white rounded-[60px] p-10 md:p-14 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] animate-slide-up group"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {/* Header Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 rounded-[32px] bg-red-50 text-red-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
                        <AlertOctagon className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-foreground tracking-tighter mb-1 capitalize group-hover:text-primary transition-colors leading-none">
                          {report.reason.replace(/_/g, " ")}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <span className="text-sm font-black uppercase tracking-[0.2em] text-primary/50 flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5" /> {report.businessId?.name}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-foreground/10" />
                          <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-5 py-2.5 rounded-full border ${sc.bg} ${sc.color} flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] shadow-sm shrink-0`}>
                      {sc.icon} {sc.label}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-foreground/[0.01] border border-foreground/[0.02] p-8 rounded-[40px] mb-12">
                    <p className="text-xl text-foreground/60 font-medium leading-relaxed italic">
                      &ldquo;{report.description}&rdquo;
                    </p>
                  </div>

                  {/* Institutional Discussion (Chat) Toggle */}
                  <div className="mb-12">
                    <button
                      onClick={() => openChat(report._id, report.discussion?.length || 0)}
                      className="flex items-center gap-4 px-6 py-4 bg-primary/5 text-primary rounded-xl border border-primary/10 hover:bg-primary hover:text-white transition-all group/chat relative w-fit"
                    >
                      <MessageSquare className="w-5 h-5 group-hover/chat:scale-110 transition-transform" />
                      <span className="text-sm font-black uppercase tracking-[0.3em]">Discussion</span>
                      {(() => {
                        const unreadCount = report.discussion 
                          ? report.discussion.slice(readReports[report._id] || 0).filter(m => m.senderRole !== "tourism_admin").length 
                          : 0;
                        if (unreadCount > 0) {
                          return (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                              {unreadCount}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </button>
                    
                    <ReportChatDrawer
                      isOpen={showChat === report._id}
                      onClose={() => setShowChat(null)}
                      reportId={report._id}
                      businessName={report.businessId?.name}
                      currentRole="tourism_admin"
                      initialDiscussion={report.discussion}
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-foreground/[0.03]">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/30">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20 block">Reporter</span>
                        <span className="text-[14px] font-bold text-foreground/60">{report.reporterId?.name}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                      {report.status === "pending" ? (
                        <div className="grid grid-cols-2 gap-4 w-full">
                          {uniqueReportersCount <= 1 ? (
                            <>
                              <button
                                onClick={() => handleAction(report._id, "recommended_under_review")}
                                className="px-6 py-4 bg-white border border-foreground/10 text-foreground/60 text-xs font-black rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all uppercase tracking-widest text-center shadow-sm"
                              >
                                Rec. Review
                              </button>
                              <button
                                onClick={() => handleAction(report._id, "recommended_warning")}
                                className="px-6 py-4 bg-white border border-foreground/10 text-foreground/60 text-xs font-black rounded-2xl hover:bg-amber-50 hover:text-amber-600 transition-all uppercase tracking-widest text-center shadow-sm"
                              >
                                Rec. Warning
                              </button>
                              <button
                                onClick={() => handleAction(report._id, "recommended_suspension")}
                                className="px-6 py-4 bg-primary text-white text-xs font-black rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-center"
                              >
                                Rec. Suspension
                              </button>
                              <button
                                onClick={() => handleAction(report._id, "recommended_dismissal")}
                                className="px-6 py-4 bg-white border border-foreground/10 text-foreground/40 text-xs font-black rounded-2xl hover:bg-foreground hover:text-white transition-all uppercase tracking-widest text-center shadow-sm"
                              >
                                Rec. Dismissal
                              </button>
                            </>
                          ) : uniqueReportersCount === 2 ? (
                            <button
                              onClick={() => handleAction(report._id, "recommended_under_review")}
                              className="col-span-2 px-6 py-4 bg-blue-500 text-white text-xs font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 uppercase tracking-widest text-center flex flex-col items-center justify-center gap-1"
                            >
                              <span>Auto-Enforced: Review</span>
                              <span className="text-[8px] opacity-80">(2 Unique Complaints)</span>
                            </button>
                          ) : uniqueReportersCount === 3 ? (
                            <button
                              onClick={() => handleAction(report._id, "recommended_warning")}
                              className="col-span-2 px-6 py-4 bg-amber-500 text-white text-xs font-black rounded-2xl hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 uppercase tracking-widest text-center flex flex-col items-center justify-center gap-1"
                            >
                              <span>Auto-Enforced: Warning</span>
                              <span className="text-[8px] opacity-80">(3 Unique Complaints)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(report._id, "recommended_suspension")}
                              className="col-span-2 px-6 py-4 bg-red-600 text-white text-xs font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 uppercase tracking-widest text-center flex flex-col items-center justify-center gap-1"
                            >
                              <span>Auto-Enforced: Suspension</span>
                              <span className="text-[8px] opacity-80">(4+ Unique Complaints)</span>
                            </button>
                          )}
                        </div>
                      ) : ["dismissed", "suspended", "warned"].includes(report.status) ? (
                        <div className="px-6 py-4 bg-primary/5 text-primary text-xs font-black rounded-2xl border border-primary/10 uppercase tracking-widest text-center shadow-sm w-full">
                          Finalized by Super Admin: {report.status.toUpperCase()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 w-full">
                          <div className="flex-1 px-6 py-4 bg-amber-50 text-amber-600 text-xs font-black rounded-2xl border border-amber-100 uppercase tracking-widest text-center shadow-sm">
                            Recommendation Sent: {report.status.replace("recommended_", "").toUpperCase()}
                          </div>
                          <button
                            onClick={() => handleAction(report._id, "pending")}
                            className="px-4 py-4 bg-white border border-foreground/10 text-foreground/40 hover:text-red-500 rounded-xl transition-all"
                            title="Revoke Recommendation"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
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
