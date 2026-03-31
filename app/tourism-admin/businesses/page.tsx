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
  MoreVertical,
  Briefcase,
  Phone,
  Mail,
  User,
  LayoutDashboard
} from "lucide-react";

interface Business {
  _id: string;
  name: string;
  description: string;
  category: string;
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
        toast.update(loadingToast, { render: data.message || "Recommendation submitted!", type: "success", isLoading: false, autoClose: 5000 });
        setActingOn(null);
        setActionNote("");
        fetchBusinesses();
      } else {
        toast.update(loadingToast, { render: data.error || "Failed", type: "error", isLoading: false, autoClose: 5000 });
      }
    } catch (error: any) {
      console.error("Recommendation failed:", error);
      toast.error(error.message || "An unexpected error occurred");
    }
  };

  const filters = ["all", "pending", "recommended_approve", "recommended_reject", "approved", "rejected"];

  return (
    <div className="bg-background text-foreground font-sans">
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 lg:py-20">
        {/* Title & Filters */}
        <div className="animate-fade-in mb-16">
          <div className="max-w-3xl mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">
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
            <span className="text-[10px] font-black tracking-widest uppercase text-foreground/20">Syncing Registry...</span>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-48 bg-white/50 rounded-[60px] border-4 border-dashed border-foreground/5">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary/20">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground/40 mb-2">No Applications Found</h3>
            <p className="text-foreground/20 font-medium italic">This segment of the registry is currently clear.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {businesses.map((biz, i) => {
              const sc = statusConfig[biz.status] || statusConfig.pending;
              return (
                <div
                  key={biz._id}
                  className="bg-white rounded-[50px] p-10 md:p-12 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] animate-slide-up group"
                  style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
                    <div className="flex-1 w-full">
                      {/* Business Identity */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-[28px] bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                              <Building2 className="w-8 h-8" />
                           </div>
                           <div>
                              <h3 className="text-3xl font-bold text-foreground tracking-tighter mb-1 leading-none group-hover:text-primary transition-colors">{biz.name}</h3>
                              <div className="flex items-center gap-3">
                                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/30">{biz.category.replace(/_/g, " ")}</span>
                                 <div className="w-1 h-1 rounded-full bg-foreground/10" />
                                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-primary/40" />
                                    {biz.location.city}, {biz.location.region}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <div className={`px-6 py-2 rounded-full border ${sc.bg} ${sc.color} flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]`}>
                          {sc.icon}
                          {sc.label}
                        </div>
                      </div>

                      <p className="text-lg text-foreground/40 font-medium leading-relaxed mb-12 italic">
                        "{biz.description}"
                      </p>

                      {/* Info Matrix */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 p-8 rounded-[40px] bg-foreground/[0.01] border border-foreground/[0.02]">
                        {[
                          { label: "Permit Number", value: biz.permitNumber, icon: <FileText className="w-4 h-4" /> },
                          { label: "Applicant Name", value: biz.applicantName || "Institutional", icon: <User className="w-4 h-4" /> },
                          { label: "Official Email", value: biz.contactEmail, icon: <Mail className="w-4 h-4" /> },
                          { label: "Primary Phone", value: biz.contactPhone || "None", icon: <Phone className="w-4 h-4" /> },
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-1">
                             <div className="flex items-center gap-2 text-foreground/20">
                                {item.icon}
                                <span className="text-[9px] font-black tracking-widest uppercase">{item.label}</span>
                             </div>
                             <p className="text-[13px] font-bold text-foreground truncate">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Industry Details */}
                      {biz.industryDetails && Object.keys(biz.industryDetails).length > 0 && (
                        <div className="mb-12 p-10 rounded-[40px] border border-primary/5 bg-primary/[0.01] relative overflow-hidden group/details">
                          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                             <Briefcase className="w-20 h-20" />
                          </div>
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block mb-8 underline decoration-primary/20 underline-offset-8">
                            Internal Compliance Log
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
                            {Object.entries(biz.industryDetails).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-[9px] text-foreground/20 font-black uppercase tracking-widest block mb-1 text-primary/40">{key.replace(/([A-Z])/g, ' $1')}</span>
                                {key === "documents" && Array.isArray(value) ? (
                                  <div className="flex flex-col gap-2 mt-2">
                                    {value.map((v: any, idx: number) => (
                                      <a
                                        key={idx}
                                        href={v.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 text-[11px] font-bold bg-white px-4 py-2 rounded-xl border border-foreground/[0.05] text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        {v.fileName || "View Document"}
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[14px] text-foreground/60 font-bold tracking-tight">{String(value)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Verification Panel */}
                      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-10 border-t border-foreground/[0.03]">
                          <div className="flex items-center gap-4 text-foreground/20 text-[11px] font-black uppercase tracking-widest">
                             <Clock className="w-4 h-4" />
                             Entry: {new Date(biz.createdAt).toLocaleDateString()}
                          </div>

                          {actingOn === biz._id ? (
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
                                  onClick={() => handleRecommend(biz._id, "recommended_approve")}
                                  className="flex-1 px-8 py-4 bg-primary text-white text-[11px] font-black rounded-2xl hover:bg-primary-hover transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase tracking-widest"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Confirm Approval
                                </button>
                                <button
                                  onClick={() => handleRecommend(biz._id, "recommended_reject")}
                                  className="flex-1 px-8 py-4 bg-white border border-red-100 text-red-600 text-[11px] font-black rounded-2xl hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Confirm Rejection
                                </button>
                                <button
                                  onClick={() => { setActingOn(null); setActionNote(""); }}
                                  className="px-8 py-4 text-[11px] font-black text-foreground/30 hover:text-foreground uppercase tracking-widest"
                                >
                                  Abandon Action
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {biz.status === "pending" ? (
                                <button
                                  onClick={() => setActingOn(biz._id)}
                                  className="px-10 py-5 bg-primary text-white text-[11px] font-black rounded-2xl hover:bg-primary-hover shadow-2xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-[0.2em] flex items-center gap-3"
                                >
                                  Begin Resolution Path
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              ) : (
                                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-foreground/[0.03] text-foreground/20">
                                   <AlertCircle className="w-4 h-4" />
                                   <span className="text-[10px] font-black uppercase tracking-widest italic">Historical Record - Immutable</span>
                                </div>
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
