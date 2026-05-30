"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertOctagon,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Clock,
  ShieldCheck,
  XCircle,
  Gavel
} from "lucide-react";

interface Report {
  _id: string;
  reason: string;
  description: string;
  status: string;
  superAdminDecision?: string;
  createdAt: string;
  businessId: { _id: string; name: string; status?: string; isActive?: boolean };
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "Awaiting Triage", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Clock className="w-3.5 h-3.5" /> },
  recommended_under_review: { label: "Under Review", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  recommended_warning: { label: "Warning Recommended", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  recommended_suspension: { label: "Suspension Recommended", color: "text-red-600", bg: "bg-red-50 border-red-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  recommended_dismissal: { label: "Dismissal Recommended", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  warned: { label: "Official Warning", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  suspended: { label: "Business Suspended", color: "text-red-600", bg: "bg-red-50 border-red-100", icon: <XCircle className="w-3.5 h-3.5" /> },
  dismissed: { label: "Closed / Dismissed", color: "text-foreground/40", bg: "bg-foreground/[0.02] border-foreground/[0.05]", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function BusinessReportsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Role guard
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    } else if (sessionStatus === "authenticated" && session?.user?.role !== "business_owner") {
      router.push("/unauthorized");
    }
  }, [session, sessionStatus, router]);

  useEffect(() => {
    if (session?.user?.role === "business_owner") {
      fetchReports();
    }
  }, [session]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === "loading" || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground font-sans min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-500/[0.02] rounded-full blur-[120px] pointer-events-none -mr-40 -mt-40" />
      
      <main className="relative z-10 max-w-7xl mx-auto px-3 md:px-4 lg:px-5 py-10 lg:py-20">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-foreground/40 hover:text-primary transition-all bg-white/50 backdrop-blur-xl px-5 py-2.5 rounded-full border border-foreground/5 shadow-sm font-bold text-xs mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Command Hub
        </Link>

        {/* Title block */}
        <div className="animate-fade-in mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black tracking-[0.3em] uppercase text-red-500">
              Compliance Tracking
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-tight">
            Grievance & <br /> <span className="italic font-light opacity-50">Resolution Record</span>
          </h1>
          <p className="text-foreground/40 text-lg font-medium italic max-w-3xl">
            Monitor formal complaints filed against your business entities and view binding resolutions issued by the central authority.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <span className="text-xs font-black tracking-widest uppercase text-foreground/20">Syncing Registry...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-48 bg-white/50 rounded-[60px] border-4 border-dashed border-foreground/5">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground/40 mb-2">Clean Record</h3>
            <p className="text-foreground/20 font-medium italic">No active or historic grievances have been filed against your businesses.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {reports.map((report, i) => {
              const sc = statusConfig[report.status] || statusConfig.pending;
              return (
                <div
                  key={report._id}
                  className={`bg-white rounded-[60px] p-10 md:p-14 shadow-2xl shadow-foreground/5 border animate-slide-up group ${
                    report.status === "resolved" ? "border-red-500/20" : "border-foreground/[0.03]"
                  }`}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex flex-col lg:flex-row items-start gap-12">
                    <div className="flex-1 w-full">
                      {/* Status Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
                        <div className="flex items-center gap-8">
                          <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform flex-shrink-0 ${
                            report.status === "resolved" ? "bg-red-50 text-red-500" : "bg-foreground/5 text-foreground/40"
                          }`}>
                            <AlertOctagon className="w-10 h-10" />
                          </div>
                          <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tighter mb-1 capitalize leading-none">
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
                        <div className={`px-3 md:px-4 lg:px-5 py-2.5 rounded-full border ${sc.bg} ${sc.color} flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] shadow-sm shrink-0`}>
                          {sc.icon} {sc.label}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-foreground/[0.01] border border-foreground/[0.02] p-8 rounded-[40px] mb-10">
                        <div className="text-xs font-black text-foreground/20 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                          <MessageSquare className="w-4 h-4" /> Tourist Grievance Log
                        </div>
                        <p className="text-lg text-foreground/60 font-medium leading-relaxed italic">
                          &ldquo;{report.description}&rdquo;
                        </p>
                      </div>

                      {/* Official Decision */}
                      {["resolved", "dismissed", "suspended", "warned"].includes(report.status) && (() => {
                        const isSuspended = report.businessId?.status === "suspended" || report.status === "suspended";
                        const isWarned = report.status === "warned";
                        
                        let theme = "emerald";
                        if (isSuspended) theme = "red";
                        else if (isWarned) theme = "amber";
                        
                        return (
                          <div className={`p-10 rounded-[40px] border relative overflow-hidden border-${theme}-500/20 bg-${theme}-50/50`}>
                            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none bg-${theme}-500/5`} />
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                              <Gavel className={`w-6 h-6 text-${theme}-600`} />
                              <span className={`text-sm font-black uppercase tracking-[0.3em] bg-white px-4 py-1.5 rounded-full shadow-sm border text-${theme}-600 border-${theme}-100`}>
                                Official Institutional Resolution
                              </span>
                            </div>
                            <p className={`text-lg font-medium leading-relaxed bg-white p-8 rounded-[28px] border mb-6 shadow-sm relative z-10 text-foreground border-${theme}-200/50`}>
                              {report.superAdminDecision || "The central authority has reviewed this grievance and closed the investigation without providing a specific administrative note."}
                            </p>

                            {isSuspended && (
                              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl relative z-10 flex items-start gap-4">
                                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                                <div>
                                  <span className="block text-red-700 font-bold mb-1">Appeal Instructions (CRITICAL)</span>
                                  <span className="block text-sm text-red-600/80 font-medium leading-relaxed">
                                    Your business operations have been <strong>SUSPENDED</strong> as part of this resolution. You must physically report to the Ministry of Tourism with your credentials to file an appeal.
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {isWarned && (
                              <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl relative z-10 flex items-start gap-4">
                                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                                <div>
                                  <span className="block text-amber-700 font-bold mb-1">Official Compliance Warning</span>
                                  <span className="block text-sm text-amber-600/80 font-medium leading-relaxed">
                                    This is a formal institutional warning. Failure to address the stated violations will result in immediate suspension of your business account and removal from the platform registry.
                                  </span>
                                </div>
                              </div>
                            )}

                            {!isSuspended && !isWarned && (
                               <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl relative z-10 flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                                <div>
                                  <span className="block text-emerald-700 font-bold mb-1">
                                    {report.status === "dismissed" ? "Cleared of Fault" : "Compliance Restored"}
                                  </span>
                                  <span className="block text-sm text-emerald-600/80 font-medium leading-relaxed">
                                    {report.status === "dismissed" 
                                      ? "This grievance was officially dismissed. Your operations are currently in good standing."
                                      : "The previously issued suspension has been lifted. Your business is now in good standing with the central registry."}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
