"use client";

import { useEffect, useState, useRef } from "react";
import {
  BarChart2, Building2, AlertCircle, ShieldCheck, Users, Star,
  Calendar, TrendingUp, Download, Loader2, RefreshCw, FileText,
  ChevronRight, CheckCircle2, XCircle, Clock, MapPin, Activity
} from "lucide-react";

interface AnalyticsData {
  generatedAt: string;
  businesses: {
    stats: {
      total: number;
      pending: number;
      recommended: number;
      approved: number;
      rejected: number;
      suspended: number;
    };
    byCategory: Record<string, number>;
    byRegion: { region: string; count: number }[];
    monthlyTrend: { label: string; count: number }[];
  };
  reports: {
    stats: {
      total: number;
      pending: number;
      under_review: number;
      dismissed: number;
      suspended: number;
      warned: number;
    };
    byReason: { reason: string; count: number }[];
  };
  users: {
    tourists: number;
    businessOwners: number;
    tourismAdmins: number;
  };
  reviews: {
    total: number;
    avgRating: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

const categoryLabels: Record<string, string> = {
  hotel: "Hotels & Accommodations",
  tour_operator: "Tour Operators",
  car_rental: "Car Rental Services",
  event_organizer: "Event Organizers",
};

const reasonLabels: Record<string, string> = {
  misconduct: "Misconduct",
  fraudulent_behavior: "Fraudulent Behavior",
  poor_service: "Poor Service",
  false_information: "False Information",
  safety_concern: "Safety Concern",
  other: "Other",
};

function BarSegment({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-4 group">
      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30 w-24 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-2.5 bg-foreground/[0.04] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-black text-foreground/60 w-8 shrink-0">{value}</span>
    </div>
  );
}

export default function TourismAdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tourism-admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-[28px] bg-primary/10 flex items-center justify-center">
            <BarChart2 className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-primary/10 blur-2xl -z-10" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-primary/40 animate-spin" />
          <span className="text-xs font-black uppercase tracking-[0.4em] text-foreground/20 italic">Compiling Intelligence Report...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-foreground/40 font-bold">{error || "Failed to load analytics"}</p>
        <button onClick={fetchData} className="px-8 py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-primary-hover transition-all flex items-center gap-3">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const { businesses, reports, users, reviews, bookings } = data;
  const maxBizStat = Math.max(businesses.stats.pending, businesses.stats.approved, businesses.stats.rejected, businesses.stats.suspended, businesses.stats.recommended);
  const maxReportStat = Math.max(reports.stats.pending, reports.stats.under_review, reports.stats.dismissed, reports.stats.suspended, reports.stats.warned);
  const maxRegion = businesses.byRegion[0]?.count || 1;
  const maxMonthly = Math.max(...businesses.monthlyTrend.map(m => m.count), 1);
  const genDate = new Date(data.generatedAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          /* Reset wrapper restrictions to allow multi-page printing */
          body, html { height: auto !important; overflow: visible !important; }
          [class*="overflow-hidden"], [class*="overflow-y-auto"], [class*="h-screen"], [class*="min-h-screen"], main, aside, div {
             height: auto !important;
             min-height: auto !important;
             max-height: none !important;
             overflow: visible !important;
          }
          body * { visibility: hidden; }
          #analytics-report, #analytics-report * { visibility: visible; }
          #analytics-report { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            margin: 0; 
            padding: 0;
            display: block !important;
          }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          /* Avoid page breaks inside individual cards */
          .grid > div { break-inside: avoid; page-break-inside: avoid; }
          @page { margin: 15mm; size: A4 portrait; }
        }
      `}</style>

      <div id="analytics-report" ref={reportRef} className="bg-background text-foreground font-sans">
        <main className="max-w-7xl mx-auto px-3 md:px-4 lg:px-5 py-10 lg:py-16">

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 animate-fade-in">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-black tracking-[0.3em] uppercase text-primary">Live Intelligence Report</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-4 leading-[0.9]">
                Platform <br /><span className="text-primary/30 italic font-light">Analytics</span>
              </h1>
              <p className="text-foreground/40 font-medium italic text-sm flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Generated: {genDate}
              </p>
            </div>
            <div className="flex items-center gap-4 no-print">
              <button
                onClick={fetchData}
                className="flex items-center gap-3 px-6 py-3.5 bg-white border border-foreground/5 text-foreground/40 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-primary hover:border-primary/20 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-3 px-8 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-95"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>

          {/* ── KPI Cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-12 animate-slide-up">
            {[
              { label: "Total Businesses", value: businesses.stats.total, icon: <Building2 className="w-5 h-5" />, color: "text-primary bg-primary/5" },
              { label: "Pending Review", value: businesses.stats.pending, icon: <Clock className="w-5 h-5" />, color: "text-amber-500 bg-amber-50" },
              { label: "Approved Partners", value: businesses.stats.approved, icon: <ShieldCheck className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50" },
              { label: "Active Grievances", value: reports.stats.pending + reports.stats.under_review, icon: <AlertCircle className="w-5 h-5" />, color: "text-rose-500 bg-rose-50" },
              { label: "Total Tourists", value: users.tourists, icon: <Users className="w-5 h-5" />, color: "text-blue-500 bg-blue-50" },
              { label: "Avg. Platform Rating", value: reviews.avgRating > 0 ? reviews.avgRating.toFixed(1) : "—", icon: <Star className="w-5 h-5" />, color: "text-yellow-500 bg-yellow-50" },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-[32px] p-6 shadow-xl shadow-foreground/5 border border-foreground/[0.03] flex flex-col gap-3 hover-lift group">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${card.color} shadow-inner`}>
                  {card.icon}
                </div>
                <div className="text-4xl font-black text-foreground tracking-tightest leading-none">{card.value}</div>
                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20">{card.label}</p>
              </div>
            ))}
          </div>

          {/* ── Main Grid ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">

            {/* Business Status Breakdown */}
            <div className="xl:col-span-6 bg-white rounded-[40px] p-8 md:p-10 shadow-xl shadow-foreground/5 border border-foreground/[0.03]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tighter text-foreground leading-none">Business Registry</h2>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mt-0.5">Status Distribution</p>
                </div>
              </div>
              <div className="space-y-5">
                <BarSegment label="Pending" value={businesses.stats.pending} max={maxBizStat} color="bg-amber-400" />
                <BarSegment label="Recommended" value={businesses.stats.recommended} max={maxBizStat} color="bg-blue-400" />
                <BarSegment label="Approved" value={businesses.stats.approved} max={maxBizStat} color="bg-emerald-500" />
                <BarSegment label="Rejected" value={businesses.stats.rejected} max={maxBizStat} color="bg-red-400" />
                <BarSegment label="Suspended" value={businesses.stats.suspended} max={maxBizStat} color="bg-orange-400" />
              </div>
              <div className="mt-8 pt-6 border-t border-foreground/[0.03] grid grid-cols-2 gap-4">
                {Object.entries(businesses.byCategory).map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary/30 shrink-0" />
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-foreground/20">{categoryLabels[cat] || cat}</p>
                      <p className="text-xl font-black text-foreground leading-none">{count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Intelligence */}
            <div className="xl:col-span-6 bg-white rounded-[40px] p-8 md:p-10 shadow-xl shadow-foreground/5 border border-foreground/[0.03]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-inner">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tighter text-foreground leading-none">Grievance Intelligence</h2>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mt-0.5">Report Status & Reason Breakdown</p>
                </div>
              </div>
              <div className="space-y-5 mb-8">
                <BarSegment label="Pending" value={reports.stats.pending} max={maxReportStat} color="bg-amber-400" />
                <BarSegment label="Under Review" value={reports.stats.under_review} max={maxReportStat} color="bg-blue-400" />
                <BarSegment label="Warned" value={reports.stats.warned} max={maxReportStat} color="bg-orange-400" />
                <BarSegment label="Suspended" value={reports.stats.suspended} max={maxReportStat} color="bg-red-500" />
                <BarSegment label="Dismissed" value={reports.stats.dismissed} max={maxReportStat} color="bg-foreground/20" />
              </div>
              <div className="pt-6 border-t border-foreground/[0.03]">
                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mb-4">Top Report Reasons</p>
                <div className="space-y-3">
                  {reports.byReason.slice(0, 4).map(({ reason, count }) => (
                    <div key={reason} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground/50">{reasonLabels[reason] || reason}</span>
                      <span className="text-xs font-black text-rose-500">{count}</span>
                    </div>
                  ))}
                  {reports.byReason.length === 0 && (
                    <p className="text-xs text-foreground/20 italic">No reports on file.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Second Row ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">

            {/* Monthly Registration Trend */}
            <div className="xl:col-span-8 bg-white rounded-[40px] p-8 md:p-10 shadow-xl shadow-foreground/5 border border-foreground/[0.03]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tighter text-foreground leading-none">Registration Trend</h2>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mt-0.5">Business Registrations — Last 6 Months</p>
                </div>
              </div>
              <div className="flex items-end gap-3 h-44">
                {businesses.monthlyTrend.map(({ label, count }, i) => {
                  const heightPct = maxMonthly > 0 ? Math.max((count / maxMonthly) * 100, count > 0 ? 8 : 2) : 2;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-black text-foreground/40">{count}</span>
                      <div className="w-full flex items-end" style={{ height: "120px" }}>
                        <div
                          className="w-full rounded-t-2xl bg-primary/20 hover:bg-primary/40 transition-all duration-300 relative group"
                          style={{ height: `${heightPct}%` }}
                        >
                          {count > 0 && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
                              {count} registered
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Users & Bookings */}
            <div className="xl:col-span-4 space-y-6">
              {/* Users */}
              <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-foreground/5 border border-foreground/[0.03]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tighter text-foreground leading-none">Platform Users</h2>
                    <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Registry count by role</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Tourists", value: users.tourists, color: "text-blue-500" },
                    { label: "Business Owners", value: users.businessOwners, color: "text-primary" },
                    { label: "Tourism Admins", value: users.tourismAdmins, color: "text-purple-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-foreground/[0.03] last:border-0">
                      <span className="text-xs font-black uppercase tracking-widest text-foreground/30">{label}</span>
                      <span className={`text-2xl font-black ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bookings */}
              <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-foreground/5 border border-foreground/[0.03]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tighter text-foreground leading-none">Bookings</h2>
                    <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Total: {bookings.total}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Confirmed", value: bookings.confirmed, color: "text-emerald-600" },
                    { label: "Completed", value: bookings.completed, color: "text-primary" },
                    { label: "Pending", value: bookings.pending, color: "text-amber-500" },
                    { label: "Cancelled", value: bookings.cancelled, color: "text-red-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-foreground/[0.03] last:border-0">
                      <span className="text-xs font-black uppercase tracking-widest text-foreground/30">{label}</span>
                      <span className={`text-2xl font-black ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Regional Distribution ──────────────────────────────── */}
          <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl shadow-foreground/5 border border-foreground/[0.03] mb-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tighter text-foreground leading-none">Geographic Distribution</h2>
                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mt-0.5">Business registrations by region</p>
              </div>
            </div>
            {businesses.byRegion.length === 0 ? (
              <p className="text-foreground/20 italic text-sm">No regional data available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businesses.byRegion.map(({ region, count }, i) => (
                  <div key={region} className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-foreground/20 w-4 shrink-0">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-foreground/60">{region}</span>
                        <span className="text-xs font-black text-primary">{count}</span>
                      </div>
                      <div className="h-1.5 bg-foreground/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/40 rounded-full transition-all duration-700"
                          style={{ width: `${(count / maxRegion) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Reviews & Footer ───────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="md:col-span-1 bg-primary rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <Star className="w-10 h-10 opacity-20 absolute top-6 right-6" />
              <div className="relative z-10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-4">Platform Rating</p>
                <div className="text-6xl font-black tracking-tightest leading-none mb-2">
                  {reviews.avgRating > 0 ? reviews.avgRating.toFixed(2) : "—"}
                </div>
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`w-4 h-4 ${n <= Math.round(reviews.avgRating) ? 'fill-current' : 'opacity-30'}`} />
                  ))}
                </div>
                <p className="text-sm opacity-60 italic">{reviews.total} total reviews across all services</p>
              </div>
            </div>
            <div className="md:col-span-2 bg-white rounded-[40px] p-8 shadow-xl shadow-foreground/5 border border-foreground/[0.03] flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mb-4">System Summary</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Registry Health", value: businesses.stats.approved > 0 ? `${Math.round((businesses.stats.approved / businesses.stats.total) * 100)}%` : "—", note: "Approval rate" },
                    { label: "Compliance Rate", value: reports.stats.total > 0 ? `${Math.round(((reports.stats.dismissed + reports.stats.warned) / reports.stats.total) * 100)}%` : "—", note: "Resolved reports" },
                    { label: "Booking Completion", value: bookings.total > 0 ? `${Math.round((bookings.completed / bookings.total) * 100)}%` : "—", note: "Of all bookings" },
                    { label: "Total Reviews", value: reviews.total, note: "Across all services" },
                  ].map(({ label, value, note }) => (
                    <div key={label} className="p-4 rounded-2xl bg-foreground/[0.01] border border-foreground/[0.03]">
                      <p className="text-[8px] font-black uppercase tracking-widest text-foreground/20 mb-1">{label}</p>
                      <p className="text-2xl font-black text-foreground">{value}</p>
                      <p className="text-[9px] text-foreground/20 italic">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-foreground/[0.03]">
                <Activity className="w-4 h-4 text-primary/40" />
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20">
                  WondarEthiopia — Institutional Intelligence Report · {new Date(data.generatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
