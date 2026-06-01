"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  Building2, MapPin, CheckCircle2, XCircle, ArrowLeft, Clock, FileText,
  AlertCircle, ShieldCheck, Phone, History, Info, Loader2, Mail, User, Calendar, MessageSquare, X
} from "lucide-react";
import ChatDrawer from "@/components/admin/ChatDrawer";
import BusinessChat from "@/components/admin/BusinessChat";

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pending Review", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  recommended_approve: { label: "Approval Recommended", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  recommended_reject: { label: "Rejection Recommended", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
  approved: { label: "Live / Approved", color: "text-primary", bg: "bg-primary/5", border: "border-primary/10" },
  rejected: { label: "Denied", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
  suspended: { label: "Suspended", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200" },
};

const getAuditLabel = (n: any): string => {
  if (n.title) {
    if (n.title.includes("Revok")) return "Domain Revoked";
    if (n.title.includes("Suspend")) return "Suspended";
    if (n.title.includes("Unsuspend") || n.title.includes("Restored")) return "Suspension Lifted";
    if (n.title.includes("Approved") || n.title.includes("Admission")) return "Approved";
    if (n.title.includes("Rejected") || n.title.includes("Denial")) return "Rejected";
    if (n.title.includes("Recommended")) return "Recommendation";
    if (n.title.includes("Expansion")) return "Domain Expansion";
    if (n.title.includes("Report")) return "Report Filed";
    if (n.title.includes("Discussion") || n.title.includes("Message")) return "Internal Message";
    if (n.title.includes("Registration")) return "Registration";
  }
  const fallback: Record<string, string> = {
    business_registration: "Registration",
    business_recommended: "Recommendation",
    business_status_update: "Status Change",
    category_request: "Domain Expansion",
    report_filed: "Report",
    internal_chat: "Internal Message",
  };
  return fallback[n.type] || n.type;
};

const parseDescription = (msg: string) => {
  if (!msg) return [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const segments: { type: "text" | "link"; content: string; href?: string }[] = [];
  let lastIndex = 0;
  let match;
  const clean = (s: string) => s.replace(/\*\*/g, "");
  while ((match = linkRegex.exec(msg)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: clean(msg.slice(lastIndex, match.index)) });
    }
    segments.push({ type: "link", content: match[1], href: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < msg.length) {
    segments.push({ type: "text", content: clean(msg.slice(lastIndex)) });
  }
  return segments;
};

export default function TourismAdminBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [showChat, setShowChat] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [actingOn, setActingOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/businesses/${id}`);
      const data = await res.json();
      if (res.ok) {
        setBusiness(data.business);
        setNotifications(data.notifications || []);
      } else {
        toast.error(data.error || "Failed to load business.");
        router.push("/tourism-admin/businesses");
      }
    } catch (e) {
      toast.error("A connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAction = async (action: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: actionNote }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Action completed.");
        setActingOn(false);
        setActionNote("");
        fetchData();
      } else {
        toast.error(data.error || "Action failed.");
      }
    } catch (e) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <Loader2 className="w-12 h-12 text-primary/20 animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">Loading Registry Profile...</span>
    </div>
  );

  if (!business) return null;

  const sc = statusConfig[business.status] || statusConfig.pending;
  const categories = Array.isArray(business.category) ? business.category : [business.category];

  const seen = new Set<string>();
  const dedupedNotifications = notifications.filter((n: any) => {
    if (n.type === "internal_chat") return false;
    const key = `${n.title}__${new Date(n.createdAt).toISOString().slice(0, 16)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const auditItems = [
    ...(business.historyLogs || []).map((log: any) => ({
      action: log.action, description: log.description,
      date: new Date(log.date), documentUrl: log.documentUrl, title: null,
    })),
    ...dedupedNotifications.map((n: any) => ({
      action: getAuditLabel(n), description: n.message,
      date: new Date(n.createdAt), title: n.title, documentUrl: null,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
  const getViewerUrl = (url: string, fileName: string) => {
    // Route through our proxy which streams the file inline with proper headers
    return `/api/proxy-document?url=${encodeURIComponent(url)}&fileName=${encodeURIComponent(fileName || "")}`;
  };
  return (
    <div className="bg-background text-foreground font-sans min-h-screen">
      <main className="max-w-6xl mx-auto px-3 md:px-4 lg:px-5 py-10 lg:py-20">

        <Link href="/tourism-admin/businesses" className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-foreground/30 hover:text-primary transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Registry
        </Link>

        {/* Header */}
        <div className="bg-white rounded-[60px] p-10 md:p-16 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] mb-10 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
            <div className="flex items-start gap-8">
              <div className="w-24 h-24 rounded-[36px] bg-primary/5 flex items-center justify-center text-primary shadow-inner overflow-hidden shrink-0">
                {business.profilePicture
                  ? <img src={business.profilePicture} alt={business.name} className="w-full h-full object-cover" />
                  : <Building2 className="w-12 h-12" />}
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tightest leading-none mb-3">{business.name}</h1>
                <div className="flex flex-wrap gap-3 mb-4">
                  {categories.map((c: string) => (
                    <span key={c} className="px-4 py-1.5 bg-foreground/5 text-foreground/50 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                      {c.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-foreground/30 text-sm font-bold">
                  <MapPin className="w-4 h-4 text-primary/40" />
                  {business.location?.address}, {business.location?.city}, {business.location?.region}
                </div>
              </div>
            </div>
            <div className={`px-8 py-3 rounded-full border ${sc.bg} ${sc.border} ${sc.color} flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shrink-0`}>
              {sc.label}
            </div>
          </div>
          {business.description && (
            <p className="mt-8 text-foreground/50 font-medium italic leading-relaxed border-l-4 border-primary/20 pl-6 max-w-3xl">"{business.description}"</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-10">
          {[
            { id: "overview", label: "Business Overview", icon: <Info className="w-4 h-4" /> },
            { id: "history", label: `Audit History (${auditItems.length})`, icon: <History className="w-4 h-4" /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-10 py-5 rounded-[28px] text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all ${activeTab === tab.id ? "bg-foreground text-background shadow-xl" : "bg-white border border-foreground/5 text-foreground/30 hover:text-primary hover:border-primary/20"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <div className="grid grid-cols-1 gap-10 items-start animate-fade-in">
            {/* LEFT: Main business info & Controls */}
            <div className="space-y-10">
              {/* Info Grid */}
              <div className="bg-white rounded-[60px] p-10 md:p-16 shadow-2xl shadow-foreground/5 border border-foreground/[0.03]">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-10">Registry Identity</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { label: "Permit Number", value: business.permitNumber, icon: <FileText className="w-5 h-5" /> },
                    { label: "Applicant Name", value: business.applicantName, icon: <User className="w-5 h-5" /> },
                    { label: "Official Email", value: business.applicantEmail || business.ownerId?.email, icon: <Mail className="w-5 h-5" /> },
                    { label: "Primary Phone", value: business.contactPhone || "Not provided", icon: <Phone className="w-5 h-5" /> },
                    { label: "Contact Email", value: business.contactEmail || "Not provided", icon: <Mail className="w-5 h-5" /> },
                    { label: "Entry Date", value: new Date(business.createdAt).toLocaleDateString(), icon: <Calendar className="w-5 h-5" /> },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-3 p-6 rounded-[28px] bg-foreground/[0.01] border border-foreground/[0.03]">
                      <div className="flex items-center gap-2 text-primary/40">{item.icon}
                        <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                      </div>
                      <p className="text-[14px] font-bold text-foreground break-all">{item.value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Industry Details */}
              {business.industryDetails && Object.keys(business.industryDetails).length > 0 && (
                <div className="bg-white rounded-[60px] p-10 md:p-16 shadow-2xl shadow-foreground/5 border border-foreground/[0.03]">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-10">Sector-Specific Intelligence Hub</h2>
                  <div className="space-y-12">
                    {categories.map((sector: string) => {
                      const sectorLabels: any = { hotel: "Hotel Intelligence", tour_operator: "Expedition Intelligence", car_rental: "Fleet Logistics", event_organizer: "Event Metrics" };
                      const industryDetails = business.industryDetails || {};
                      const relevantKeys = Object.keys(industryDetails).filter(k => k !== "documents");
                      if (relevantKeys.length === 0) return null;
                      return (
                        <div key={sector}>
                          <div className="flex items-center gap-4 mb-8">
                            <div className="h-[1px] flex-1 bg-foreground/5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 px-4 py-2 border border-foreground/5 rounded-full bg-foreground/[0.01]">
                              {sectorLabels[sector] || sector.replace(/_/g, " ")}
                            </span>
                            <div className="h-[1px] flex-1 bg-foreground/5" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {relevantKeys.map((key) => (
                              <div key={key}>
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary/40 block mb-2">{key.replace(/([A-Z])/g, ' $1')}</span>
                                <p className="text-[14px] font-bold text-foreground/70">{String(industryDetails[key])}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {business.industryDetails?.documents?.length > 0 && (
                      <div className="pt-10 border-t border-foreground/5">
                        <div className="flex items-center gap-3 mb-8">
                          <ShieldCheck className="w-4 h-4 text-emerald-500/40" />
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 italic">Verification Artifacts & Credentials</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {business.industryDetails.documents.map((v: any, idx: number) => (
                            <a key={idx} href={getViewerUrl(v.url, v.fileName)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-4 p-5 rounded-[28px] bg-foreground/[0.01] border border-foreground/[0.05] hover:border-primary/20 hover:shadow-xl transition-all group/doc">
                              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover/doc:bg-primary group-hover/doc:text-white transition-all shrink-0">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[8px] font-black uppercase text-foreground/20 block mb-1">{v.fieldName}</span>
                                <span className="text-[11px] font-extrabold text-foreground/60 truncate block uppercase">{v.fileName || "View Document"}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}


            </div>{/* end left column */}
          </div>

        ) : (
          /* HISTORY TAB */
          <div className="animate-fade-in">
            <div className="bg-white rounded-[60px] p-10 md:p-16 shadow-2xl shadow-foreground/5 border border-foreground/[0.03]">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 rounded-[28px] bg-primary/10 flex items-center justify-center text-primary">
                  <History className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-tightest">Full Audit Trail</h2>
                  <p className="text-foreground/40 font-medium italic mt-2">All admin actions, reports, revocations, and status changes for this business.</p>
                </div>
              </div>

              {auditItems.length === 0 ? (
                <div className="py-24 text-center">
                  <History className="w-16 h-16 text-foreground/10 mx-auto mb-6" />
                  <p className="text-foreground/20 font-black uppercase tracking-widest text-sm">No history entries yet.</p>
                </div>
              ) : (
                <div className="relative pl-4">
                  <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-foreground/5" />
                  <div className="space-y-8">
                    {auditItems.map((item, index) => {
                      const isRevoke = item.action === "Domain Revoked" || item.description?.includes("revoked");
                      const isSuspend = item.action === "Status Change" && item.description?.includes("suspended");
                      const isReport = item.action === "Report" || item.action === "Report Filed";
                      const dotColor = isRevoke ? "bg-rose-500" : isSuspend ? "bg-amber-500" : isReport ? "bg-orange-400" : "bg-primary";
                      const badgeColor = isRevoke ? "text-rose-600 bg-rose-50 border-rose-100" : isSuspend ? "text-amber-600 bg-amber-50 border-amber-100" : isReport ? "text-orange-600 bg-orange-50 border-orange-100" : "text-primary bg-primary/5 border-primary/10";

                      return (
                        <div key={index} className="relative flex items-start gap-8 group">
                          <div className={`w-9 h-9 rounded-full bg-white border-4 border-foreground/10 group-hover:border-foreground/30 flex items-center justify-center shrink-0 z-10 transition-all`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                          </div>
                          <div className="flex-1 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[32px] p-8 -mt-1 group-hover:border-primary/20 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                              <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full border w-fit ${badgeColor}`}>
                                {item.action}
                              </span>
                              <span className="text-[10px] font-bold tracking-widest text-foreground/30 uppercase">
                                {item.date.toLocaleString()}
                              </span>
                            </div>
                            {/* Smart description renderer */}
                            <div className="text-sm font-medium text-foreground/60 leading-relaxed space-y-3">
                              {(() => {
                                const segments = parseDescription(item.description || "");
                                // Separate text from link segments
                                const textParts = segments.filter(s => s.type === "text");
                                const linkParts = segments.filter(s => s.type === "link");
                                return (
                                  <>
                                    <p className="whitespace-pre-wrap">
                                      {textParts.map((s, i) => <span key={i}>{s.content}</span>)}
                                    </p>
                                    {linkParts.length > 0 && (
                                      <div className="flex flex-wrap gap-3 pt-2">
                                        {linkParts.map((s, i) => (
                                        <a key={i}
                                          href={s.href?.startsWith("https://res.cloudinary.com")
                                            ? /api/proxy-document?url=${encodeURIComponent(s.href)}&fileName=${encodeURIComponent(s.content)}
                                            : s.href}
                                          target="_blank" rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-foreground/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm group/doc">
                                          <FileText className="w-3.5 h-3.5" /> {s.content}
                                        </a>
                                      ))}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            {/* Legacy documentUrl fallback (from historyLogs) */}
                            {item.documentUrl && (
                              <a href={item.documentUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 mt-4 px-6 py-3 bg-white border border-foreground/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                                <FileText className="w-4 h-4" /> View Archival Document
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
