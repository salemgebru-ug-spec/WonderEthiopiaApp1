"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  User, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ArrowLeft, 
  MessageSquare, 
  Clock,
  Filter,
  LayoutDashboard
} from "lucide-react";

interface Report {
  _id: string;
  reason: string;
  description: string;
  status: string;
  reporterId: { name: string; email: string };
  businessId: { name: string };
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Unresolved", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Clock className="w-3.5 h-3.5" /> },
  under_review: { label: "Under Review", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  action_taken: { label: "Resolved", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  dismissed: { label: "Dismissed", color: "text-foreground/40", bg: "bg-foreground/[0.02] border-foreground/[0.05]", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function TourismAdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionNote, setActionNote] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);

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
    fetchReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleReview = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: actionNote }),
      });
      if (res.ok) {
        setActingOn(null);
        setActionNote("");
        fetchReports();
      }
    } catch (error) {
      console.error("Review failed:", error);
    }
  };

  return (
    <div className="bg-background text-foreground font-sans">
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 lg:py-20">
        {/* Title & Filters */}
        <div className="animate-fade-in mb-16 px-4">
          <div className="max-w-3xl mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">
                Institutional Oversight
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-none">
              Platform Integrity <br /> Monitoring
            </h1>
            <p className="text-foreground/40 text-lg font-medium italic">
              Verification and initial triage of tourist-submitted grievances.
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {["all", "pending", "under_review", "dismissed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-8 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-2xl border transition-all duration-300 ${
                  filter === f
                    ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105"
                    : "bg-white text-foreground/30 border-foreground/5 hover:border-primary/20 hover:text-primary"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <span className="text-[10px] font-black tracking-widest uppercase text-foreground/20">Syncing Grief Registry...</span>
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
          <div className="space-y-8 px-4">
            {reports.map((report, i) => {
              const sc = statusConfig[report.status] || statusConfig.pending;
              return (
                <div
                  key={report._id}
                  className="bg-white rounded-[50px] p-10 md:p-12 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] animate-slide-up group"
                  style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
                    <div className="flex-1 w-full">
                       {/* Header Row */}
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 rounded-[28px] bg-red-50 text-red-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                                <AlertTriangle className="w-8 h-8" />
                             </div>
                             <div>
                                <h3 className="text-2xl font-bold text-foreground tracking-tight mb-1 capitalize group-hover:text-primary transition-colors">
                                   {report.reason.replace("_", " ")}
                                </h3>
                                <div className="flex items-center gap-3">
                                   <span className="text-[11px] font-black uppercase tracking-widest text-primary/40 flex items-center gap-2">
                                      <Building2 className="w-3 h-3" />
                                      {report.businessId?.name}
                                   </span>
                                   <div className="w-1 h-1 rounded-full bg-foreground/10" />
                                   <span className="text-[11px] font-black uppercase tracking-widest text-foreground/30 flex items-center gap-2">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(report.createdAt).toLocaleDateString()}
                                   </span>
                                </div>
                             </div>
                          </div>
                          <div className={`px-6 py-2 rounded-full border ${sc.bg} ${sc.color} flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm`}>
                            {sc.icon}
                            {sc.label}
                          </div>
                       </div>

                       <div className="bg-foreground/[0.01] border border-foreground/[0.02] p-8 rounded-[32px] mb-10">
                          <p className="text-lg text-foreground/60 font-medium leading-relaxed italic">
                             "{report.description}"
                          </p>
                       </div>

                       {/* Meta Row */}
                       <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-foreground/[0.03]">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/30">
                                <User className="w-5 h-5" />
                             </div>
                             <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20 block mb-0.5">Reporter Entity</span>
                                <span className="text-[13px] font-bold text-foreground/60">{report.reporterId?.name} • <span className="text-[11px] font-medium italic underline decoration-foreground/5">{report.reporterId?.email}</span></span>
                             </div>
                          </div>

                          {actingOn === report._id ? (
                            <div className="w-full lg:max-w-xl space-y-6 animate-fade-in py-4">
                              <textarea
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                placeholder="Enter institutional review notes..."
                                className="w-full px-8 py-6 bg-foreground/[0.02] border border-foreground/[0.05] rounded-[32px] text-foreground text-sm font-bold placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner"
                                rows={2}
                              />
                              <div className="flex gap-4">
                                <button
                                  onClick={() => handleReview(report._id, "under_review")}
                                  className="flex-1 px-8 py-4 bg-primary text-white text-[10px] font-black rounded-2xl hover:bg-primary-hover transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase tracking-widest"
                                >
                                  Triage Progress
                                </button>
                                <button
                                  onClick={() => handleReview(report._id, "dismissed")}
                                  className="flex-1 px-8 py-4 bg-white border border-foreground/5 text-foreground/40 text-[10px] font-black rounded-2xl hover:bg-foreground hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                                >
                                  Dismiss Record
                                </button>
                                <button
                                  onClick={() => { setActingOn(null); setActionNote(""); }}
                                  className="px-6 py-4 text-[10px] font-black text-foreground/20 hover:text-foreground uppercase tracking-widest"
                                >
                                  Abandon
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActingOn(report._id)}
                              className="px-10 py-5 bg-foreground text-background text-[11px] font-black rounded-2xl hover:bg-primary transition-all active:scale-95 uppercase tracking-[0.2em] flex items-center gap-4 shadow-xl shadow-foreground/5"
                            >
                              Initialize Resolution
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                       </div>
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
