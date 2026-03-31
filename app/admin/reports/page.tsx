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
  ShieldCheck,
  LayoutDashboard,
  Gavel,
  History,
  AlertOctagon
} from "lucide-react";

interface Report {
  _id: string;
  reason: string;
  description: string;
  status: string;
  adminNotes: string;
  superAdminDecision: string;
  reporterId: { name: string; email: string };
  businessId: { name: string };
  reviewedBy: { name: string } | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Unresolved", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Clock className="w-3.5 h-3.5" /> },
  under_review: { label: "Under Review", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  action_taken: { label: "Resolution Complete", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  dismissed: { label: "Closed / Dismissed", color: "text-foreground/40", bg: "bg-foreground/[0.02] border-foreground/[0.05]", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
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

  const handleAction = async (id: string, action: string) => {
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
      console.error("Action failed:", error);
    }
  };

  return (
    <div className="bg-background text-foreground font-sans">
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 lg:py-20">
        {/* Title & Filters */}
        <div className="animate-fade-in mb-16 px-4">
          <div className="max-w-4xl mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">
                Grievance Master Terminal
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-tight">
              Final Registry <br /> Determinations
            </h1>
            <p className="text-foreground/40 text-lg font-medium italic">
              Super Admin terminal for executing final resolutions on reported platform entities.
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {["all", "pending", "under_review", "action_taken", "dismissed"].map((f) => (
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
            <span className="text-[10px] font-black tracking-widest uppercase text-foreground/20">Syncing Master Log...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-48 bg-white/50 rounded-[60px] border-4 border-dashed border-foreground/5">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary/20">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground/40 mb-2">Registry Quiescent</h3>
            <p className="text-foreground/20 font-medium italic">No grievances require master resolution at this time.</p>
          </div>
        ) : (
          <div className="space-y-10 px-4">
            {reports.map((report, i) => {
              const sc = statusConfig[report.status] || statusConfig.pending;
              return (
                <div
                  key={report._id}
                  className="bg-white rounded-[60px] p-10 md:p-14 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] animate-slide-up group"
                  style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
                    <div className="flex-1 w-full">
                       {/* Identity Row */}
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
                          <div className="flex items-center gap-8">
                             <div className="w-20 h-20 rounded-[32px] bg-red-50 text-red-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                                <AlertOctagon className="w-10 h-10" />
                             </div>
                             <div>
                                <h3 className="text-3xl font-bold text-foreground tracking-tighter mb-1 capitalize group-hover:text-primary transition-colors leading-none">
                                   {report.reason.replace("_", " ")}
                                </h3>
                                <div className="flex flex-wrap items-center gap-4">
                                   <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/50 flex items-center gap-2">
                                      <Building2 className="w-3.5 h-3.5" />
                                      Against: {report.businessId?.name}
                                   </span>
                                   <div className="w-1 h-1 rounded-full bg-foreground/10" />
                                   <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {new Date(report.createdAt).toLocaleDateString()}
                                   </span>
                                </div>
                             </div>
                          </div>
                          <div className={`px-8 py-3 rounded-full border ${sc.bg} ${sc.color} flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm`}>
                            {sc.icon}
                            {sc.label}
                          </div>
                       </div>

                       <div className="bg-foreground/[0.01] border border-foreground/[0.02] p-10 rounded-[40px] mb-12 relative overflow-hidden group/text">
                          <div className="absolute top-0 right-0 p-8 opacity-[0.02] scale-150 group-hover/text:rotate-12 transition-transform duration-700">
                             <MessageSquare className="w-24 h-24" />
                          </div>
                          <p className="text-xl text-foreground/60 font-medium leading-relaxed italic">
                             "{report.description}"
                          </p>
                       </div>

                       {/* Admin Notes Block */}
                       {report.adminNotes && (
                        <div className="mb-12 p-12 rounded-[50px] border border-blue-100 bg-blue-50/30 relative">
                          <div className="flex items-center gap-4 mb-8">
                            <History className="w-5 h-5 text-blue-600" />
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">
                              Tourism Admin Triage Report
                            </span>
                          </div>
                          <p className="text-lg text-foreground/60 italic font-medium leading-relaxed bg-white/40 p-8 rounded-[32px] border border-blue-200/50 mb-8">
                            "{report.adminNotes}"
                          </p>
                          {report.reviewedBy && (
                            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-foreground/30">
                              <div className="w-6 h-6 rounded-lg bg-blue-200 flex items-center justify-center text-blue-700 text-[10px]">
                                 {report.reviewedBy.name[0]}
                              </div>
                              Reviewed by {report.reviewedBy.name}
                            </div>
                          )}
                        </div>
                      )}

                       {/* Institutional Controller */}
                       <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-12 border-t border-foreground/[0.03]">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/30">
                                <User className="w-6 h-6" />
                             </div>
                             <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20 block mb-1">Reporter Entity</span>
                                <span className="text-[15px] font-bold text-foreground/60">{report.reporterId?.name} • <span className="text-[13px] font-medium underline underline-offset-4 decoration-foreground/5">{report.reporterId?.email}</span></span>
                             </div>
                          </div>

                          {actingOn === report._id ? (
                            <div className="w-full lg:max-w-2xl space-y-8 animate-fade-in py-4">
                              <textarea
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                placeholder="Enter final institutional determination..."
                                className="w-full px-8 py-6 bg-foreground/[0.02] border border-foreground/[0.05] rounded-[32px] text-foreground text-sm font-bold placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner resize-none"
                                rows={2}
                              />
                              <div className="flex gap-4 flex-wrap">
                                <button
                                  onClick={() => handleAction(report._id, "action_taken")}
                                  className="flex-1 px-10 py-5 bg-primary text-white text-[11px] font-black rounded-2xl hover:bg-primary-hover transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-4 uppercase tracking-[0.2em]"
                                >
                                  <Gavel className="w-5 h-5" />
                                  Execute Action
                                </button>
                                <button
                                  onClick={() => handleAction(report._id, "dismissed")}
                                  className="flex-1 px-10 py-5 bg-white border border-foreground/10 text-foreground/40 text-[11px] font-black rounded-2xl hover:bg-foreground hover:text-white transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.2em]"
                                >
                                  Final Dismissal
                                </button>
                                <button
                                  onClick={() => { setActingOn(null); setActionNote(""); }}
                                  className="px-8 py-5 text-[11px] font-black text-foreground/20 hover:text-foreground uppercase tracking-widest"
                                >
                                  Suspend Decision
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActingOn(report._id)}
                              className="px-12 py-5 bg-foreground text-background text-[11px] font-black rounded-2xl hover:bg-primary transition-all active:scale-95 uppercase tracking-[0.2em] flex items-center gap-5 shadow-2xl shadow-foreground/10"
                            >
                              Final Determination Terminal
                              <ChevronRight className="w-5 h-5" />
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
