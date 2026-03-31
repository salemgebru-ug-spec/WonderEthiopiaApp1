"use client";

import { useEffect, useState } from "react";
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
  ShieldCheck,
  Briefcase,
  Phone,
  Mail,
  User,
  LayoutDashboard,
  Trash2,
  Lock
} from "lucide-react";

interface Business {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  permitNumber: string;
  recommendationNote: string;
  decisionNote: string;
  applicantName: string;
  location: { region: string; city: string; address: string };
  ownerId: { name: string; email: string } | null;
  contactEmail: string;
  contactPhone: string;
  recommendedBy: { name: string } | null;
  industryDetails?: Record<string, any>;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pending Review", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Clock className="w-3.5 h-3.5" /> },
  recommended_approve: { label: "Approval Recommended", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  recommended_reject: { label: "Rejection Recommended", color: "text-rose-600", bg: "bg-rose-50 border-rose-100", icon: <XCircle className="w-3.5 h-3.5" /> },
  approved: { label: "Live / Approved", color: "text-primary", bg: "bg-primary/5 border-primary/10", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  rejected: { label: "Denied", color: "text-red-600", bg: "bg-red-50 border-red-100", icon: <Lock className="w-3.5 h-3.5" /> },
};

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionNote, setActionNote] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const url = filter === "all" ? "/api/businesses" : `/api/businesses?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setBusinesses(data.businesses || []);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleAction = async (id: string, action: string) => {
    try {
      const loadingToast = toast.loading(`Processing ${action}...`);
      const res = await fetch(`/api/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: actionNote }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.update(loadingToast, { render: data.message || "Success!", type: "success", isLoading: false, autoClose: 5000 });
        setActingOn(null);
        setActionNote("");
        fetchBusinesses();
      } else {
        toast.update(loadingToast, { render: data.error || "Action failed", type: "error", isLoading: false, autoClose: 5000 });
      }
    } catch (error: any) {
      console.error("Action failed:", error);
      toast.error(error.message || "An unexpected error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this business?")) return;
    try {
      const res = await fetch(`/api/businesses/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Business removed from registry");
        fetchBusinesses();
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const filters = ["all", "recommended_approve", "recommended_reject", "approved", "rejected"];

  return (
    <div className="bg-background text-foreground font-sans">
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 lg:py-20">
        {/* Title & Filters */}
        <div className="animate-fade-in mb-16">
          <div className="max-w-4xl mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">
                Registry Master Access
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-[0.9]">
              Institutional <br /> Final Determinations
            </h1>
            <p className="text-foreground/40 text-lg font-medium italic">
              Super Admin terminal for finalizing Tourist Office recommendations.
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-8 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-2xl border transition-all duration-300 ${
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
            <span className="text-[10px] font-black tracking-widest uppercase text-foreground/20">Syncing Master Registry...</span>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-48 bg-white/50 rounded-[60px] border-4 border-dashed border-foreground/5">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary/20">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground/40 mb-2">No Determinations Needed</h3>
            <p className="text-foreground/20 font-medium italic">All institutional recommendations have been resolved.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {businesses.map((biz, i) => {
              const sc = statusConfig[biz.status] || statusConfig.pending;
              return (
                <div
                  key={biz._id}
                  className="bg-white rounded-[60px] p-10 md:p-14 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] animate-slide-up group"
                  style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
                    <div className="flex-1 w-full">
                      {/* Identity Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                        <div className="flex items-center gap-6">
                           <div className="w-20 h-20 rounded-[32px] bg-primary/5 flex items-center justify-center text-primary shadow-inner group-hover:scale-105 transition-transform">
                              <Building2 className="w-10 h-10" />
                           </div>
                           <div>
                              <h3 className="text-4xl font-bold text-foreground tracking-tighter mb-1 leading-none">{biz.name}</h3>
                              <div className="flex flex-wrap items-center gap-4">
                                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/30">{biz.category.replace(/_/g, " ")}</span>
                                 <div className="w-1 h-1 rounded-full bg-foreground/10" />
                                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-primary/40" />
                                    {biz.location.city}, {biz.location.region}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <div className={`px-8 py-3 rounded-full border ${sc.bg} ${sc.color} flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm`}>
                          {sc.icon}
                          {sc.label}
                        </div>
                      </div>

                      {/* Info Cards Matrix */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {[
                          { label: "Permit ID", value: biz.permitNumber, icon: <FileText className="w-5 h-5" /> },
                          { label: "Lead Partner", value: biz.applicantName || "Institutional", icon: <User className="w-5 h-5" /> },
                          { label: "Channel", value: biz.contactEmail, icon: <Mail className="w-5 h-5" /> },
                          { label: "Hotline", value: biz.contactPhone || "Pending", icon: <Phone className="w-5 h-5" /> },
                        ].map((item, idx) => (
                          <div key={idx} className="p-6 rounded-[32px] bg-foreground/[0.01] border border-foreground/[0.02] flex flex-col gap-3">
                             <div className="flex items-center gap-2 text-primary/40">
                                {item.icon}
                                <span className="text-[9px] font-black tracking-widest uppercase">{item.label}</span>
                             </div>
                             <p className="text-[14px] font-bold text-foreground truncate">{item.value}</p>
                          </div>
                        ))}
                      </div>

                       {/* Recommendation Block */}
                       {(biz.status === "recommended_approve" || biz.status === "recommended_reject") && (
                        <div className="mb-12 p-12 rounded-[50px] border border-amber-100 bg-amber-50/30 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-12 opacity-[0.05]">
                             <ShieldCheck className="w-24 h-24" />
                          </div>
                          <div className="flex items-center gap-4 mb-8">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <span className="text-[11px] font-black text-amber-600 uppercase tracking-[0.3em]">
                              Tourist Office Recommendation
                            </span>
                          </div>
                          <div className="space-y-6 max-w-3xl">
                             <div className="flex items-center gap-3">
                                {biz.status === "recommended_approve" ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-rose-500" />}
                                <h4 className="text-2xl font-bold tracking-tight text-foreground">
                                   Recommend for {biz.status === "recommended_approve" ? "Registry Admission" : "Registry Denial"}
                                </h4>
                             </div>
                            
                            {biz.recommendationNote && (
                              <p className="text-lg text-foreground/60 italic font-medium leading-relaxed bg-white/40 p-8 rounded-[32px] border border-amber-200/50">
                                "{biz.recommendationNote}"
                              </p>
                            )}
                            
                            {biz.recommendedBy && (
                              <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-foreground/30">
                                <div className="w-6 h-6 rounded-lg bg-amber-200 flex items-center justify-center text-amber-700 text-[10px]">
                                   {biz.recommendedBy.name[0]}
                                </div>
                                Initiated by {biz.recommendedBy.name}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Final Determinative Panel */}
                      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-12 border-t border-foreground/[0.03]">
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                               <span className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.2em] mb-1">Created Path</span>
                               <span className="text-[12px] font-bold text-foreground/40">{new Date(biz.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button
                              onClick={() => handleDelete(biz._id)}
                              className="flex items-center gap-3 px-6 py-3 border border-red-100 text-red-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all opacity-40 hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                              Purge Record
                            </button>
                          </div>

                          {actingOn === biz._id ? (
                            <div className="w-full lg:max-w-2xl space-y-6 animate-fade-in">
                              <textarea
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                placeholder="Enter the final institutional decision note..."
                                className="w-full px-8 py-6 bg-foreground/[0.02] border border-foreground/[0.05] rounded-[32px] text-foreground text-sm font-bold placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner"
                                rows={3}
                              />
                              <div className="flex gap-4 flex-wrap">
                                {biz.status === "recommended_approve" && (
                                  <button
                                    onClick={() => handleAction(biz._id, "approved")}
                                    className="flex-1 px-10 py-5 bg-primary text-white text-[11px] font-black rounded-2xl hover:bg-primary-hover transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
                                  >
                                    <ShieldCheck className="w-5 h-5" />
                                    Final Admission
                                  </button>
                                )}
                                {biz.status === "recommended_reject" && (
                                  <button
                                    onClick={() => handleAction(biz._id, "rejected")}
                                    className="flex-1 px-10 py-5 bg-white border border-red-100 text-red-600 text-[11px] font-black rounded-2xl hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
                                  >
                                    <Lock className="w-5 h-5" />
                                    Final Denial
                                  </button>
                                )}
                                <button
                                  onClick={() => { setActingOn(null); setActionNote(""); }}
                                  className="px-8 py-5 text-[11px] font-black text-foreground/30 hover:text-foreground uppercase tracking-widest"
                                >
                                  Suspend Decision
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              {(biz.status === "recommended_approve" || biz.status === "recommended_reject") && (
                                <button
                                  onClick={() => setActingOn(biz._id)}
                                  className="px-12 py-5 bg-primary text-white text-[11px] font-black rounded-2xl hover:bg-primary-hover shadow-2xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-[0.2em] flex items-center gap-4"
                                >
                                  Execute Master Decision
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              )}
                            </div>
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
