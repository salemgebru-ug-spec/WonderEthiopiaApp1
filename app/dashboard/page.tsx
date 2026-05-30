"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Building2, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  TrendingUp,
  Plus,
  Mail,
  User,
  ChevronRight,
  Bell
} from "lucide-react";

interface Stats {
  totalBusinesses: number;
  pendingBusinesses: number;
  recommendedBusinesses: number;
  totalReports: number;
  pendingReports: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalBusinesses: 0,
    pendingBusinesses: 0,
    recommendedBusinesses: 0,
    totalReports: 0,
    pendingReports: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  useEffect(() => {
    if (session?.user?.role === "super_admin" || session?.user?.role === "tourism_admin") {
      fetchAdminStats();
    }
  }, [session]);

  const fetchAdminStats = async () => {
    setLoadingStats(true);
    try {
      const [bizRes, reportRes] = await Promise.all([
        fetch("/api/businesses"),
        fetch("/api/reports"),
      ]);
      const bizData = await bizRes.json();
      const reportData = await reportRes.json();
      const businesses = bizData.businesses || [];
      const reports = reportData.reports || [];

      setStats({
        totalBusinesses: businesses.length,
        pendingBusinesses: businesses.filter((b: any) => b.status === "pending").length,
        recommendedBusinesses: businesses.filter((b: any) => b.status === "recommended_approve" || b.status === "recommended_reject").length,
        totalReports: reports.length,
        pendingReports: reports.filter((r: any) => r.status === "pending" || r.status === "under_review").length,
      });
    } catch (e) {} finally {
      setLoadingStats(false);
    }
  };

  const role = session?.user?.role || "tourist";
  const isAdmin = role === "super_admin" || role === "tourism_admin";

  const getRoleConfig = () => {
    switch (role) {
      case "super_admin":
        return {
          actions: [
            { label: "Business Management", href: "/admin/businesses", icon: <Building2 className="w-5 h-5" />, desc: "Approvals and recommendations" },
            { label: "Report Triage", href: "/admin/reports", icon: <AlertCircle className="w-5 h-5" />, desc: "Execute final resolutions" },
            { label: "Master Registry", href: "/admin/users", icon: <Users className="w-5 h-5" />, desc: "User identities and security" },
          ]
        };
      case "tourism_admin":
        return {
          actions: [
            { label: "Review Submissions", href: "/tourism-admin/businesses", icon: <Building2 className="w-5 h-5" />, desc: "Verify new travel applications" },
            { label: "Initial Monitoring", href: "/tourism-admin/reports", icon: <AlertCircle className="w-5 h-5" />, desc: "Analyze tourist grievances" },
          ]
        };
      case "business_owner":
        return {
          actions: [
            { label: "Service Profile", href: "/business/dashboard", icon: <Building2 className="w-5 h-5" />, desc: "Refine your market presence" },
          ]
        };
      default:
        return {
          actions: [
            { label: "Refine Identity", href: "/settings", icon: <User className="w-5 h-5" />, desc: "Update your travel intelligence" },
            { label: "Browse Services", href: "/discover/businesses", icon: <Building2 className="w-5 h-5" />, desc: "Find verified hotels and guides" },
          ]
        };
    }
  };

  const config = getRoleConfig();

  return (
    <main className="min-h-screen mesh-gradient-rich animate-fade-in relative noise-overlay">
       {/* Ambient Backgrounds */}
       <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary/[0.04] rounded-full blur-[180px] -mr-60 -mt-60 pointer-events-none opacity-50" />
       <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-secondary/[0.03] rounded-full blur-[160px] -ml-40 -mb-40 pointer-events-none opacity-30" />

        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-5 py-12 lg:py-24 relative w-full z-10">

       {/* Breadcrumbs */}
       <div className="flex items-center gap-3 mb-10 text-xs font-black uppercase tracking-widest text-foreground/20 animate-fade-in relative z-10">
          <Link href="/" className="hover:text-primary transition-colors">Origins</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground/40 italic">Hub Overview</span>
       </div>

       {/* Hero Section */}
       <div className="mb-20 animate-fade-in relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-12">
             <div className="max-w-3xl">
                <div className="flex items-center gap-4 mb-8">
                   <TrendingUp className="w-5 h-5 text-primary" />
                   <span className="text-sm font-black tracking-[0.4em] uppercase text-primary">System Pulse Active</span>
                </div>
                <h1 className="text-6xl md:text-[84px] font-black text-foreground tracking-tighter mb-8 leading-[0.8]">
                   Command <br /> <span className="italic font-light text-primary/30">Overview</span>
                </h1>
                <p className="text-foreground/40 text-2xl font-medium tracking-tight">
                   Greetings, {session?.user?.name?.split(" ")[0]}. Access institutional registry controls and platform metrics.
                </p>
             </div>


          </div>
       </div>

       {/* Dashboard Grid */}
       <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 relative z-10">
          {/* Main Actions column */}
          <div className={isAdmin ? "xl:col-span-12 space-y-10" : "xl:col-span-8 space-y-10"}>
             {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up delay-1">
                    {[
                      { label: "Total Partners", value: stats.totalBusinesses, icon: <Building2 className="w-6 h-6" />, trend: "+4 this quarter" },
                      { label: "Active Grievances", value: stats.totalReports, icon: <AlertCircle className="w-6 h-6" />, trend: "Protocol A1" },
                      { label: "Registry Health", value: "98.4%", icon: <ShieldCheck className="w-6 h-6" />, trend: "Consolidated" },
                    ].map((card, i) => (
                      <div key={i} className="floating-glass p-10 rounded-[56px] shadow-premium hover-lift group">
                         <div className="w-16 h-16 rounded-[24px] bg-primary/5 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                            {card.icon}
                         </div>
                         <div className="text-6xl font-black text-foreground tracking-tightest mb-4 leading-none">{card.value}</div>
                         <div className="flex items-center justify-between">
                            <p className="text-sm font-black text-foreground/20 uppercase tracking-[0.2em]">{card.label}</p>
                            <span className="text-xs font-black text-primary uppercase tracking-widest">{card.trend}</span>
                         </div>
                      </div>
                    ))}
                </div>
             )}

             {/* Module Tiles */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-slide-up delay-2">
                {config.actions.map((action, i) => (
                  <Link key={action.href} href={action.href} className="floating-glass rounded-[64px] p-16 shadow-premium group hover-lift overflow-hidden relative border-none">
                     <div className="absolute top-0 right-0 p-12 text-primary/[0.04] scale-[3] group-hover:rotate-12 transition-transform duration-1000">
                        {action.icon}
                     </div>
                     <div className="relative z-10 h-full flex flex-col">
                        <div className="w-24 h-24 rounded-[32px] bg-primary/[0.03] text-primary flex items-center justify-center mb-12 group-hover:scale-110 transition-transform duration-700 shadow-inner">
                           {action.icon}
                        </div>
                        <div className="flex-1">
                           <h3 className="text-4xl font-black text-foreground group-hover:text-primary transition-colors tracking-tightest mb-6 leading-none">
                              {action.label}
                           </h3>
                           <p className="text-xl text-foreground/40 font-medium leading-relaxed italic mb-12 text-balance">
                              {action.desc}
                           </p>
                        </div>
                        <div className="flex items-center gap-6 text-primary font-black text-sm uppercase tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-all">
                           Synchronize Registry <ArrowRight className="w-5 h-5 group-hover:translate-x-4 transition-transform" />
                        </div>
                     </div>
                  </Link>
                ))}

                <div className="bg-primary rounded-[50px] p-12 text-white flex flex-col justify-between group overflow-hidden relative shadow-2xl shadow-primary/20 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    <Plus className="w-16 h-16 opacity-10 absolute top-10 right-10 group-hover:scale-125 transition-transform duration-700" />
                    <div className="relative z-10">
                       <h3 className="text-3xl font-black tracking-tighter mb-6 leading-none">Expand <br /> Capabilities</h3>
                       <p className="text-lg opacity-60 font-medium leading-relaxed mb-10 italic">
                          Need a new institutional module? Command a custom tool.
                       </p>
                    </div>
                    <div className="relative z-10 flex items-center gap-4 text-sm font-black uppercase tracking-[0.2em] group-hover:gap-6 transition-all">
                       Institutional Request <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                </div>
             </div>
          </div>

          {/* Sidebar Info column */}
          {!isAdmin && (
             <div className="xl:col-span-4 space-y-10">
                <div className="bg-white rounded-[40px] border border-foreground/[0.03] p-10 shadow-xl shadow-foreground/5 flex flex-col items-center text-center">
                   <div className="w-20 h-20 bg-primary/5 rounded-[32px] flex items-center justify-center text-primary mb-8 shadow-inner">
                      <ShieldCheck className="w-10 h-10" />
                   </div>
                   <h3 className="text-2xl font-black text-foreground tracking-tight mb-4 leading-none">Certified Support</h3>
                   <p className="text-[14px] text-foreground/40 font-medium leading-relaxed mb-8 italic">
                      Professional institutional backing for all verified travel entities in the Land of Origins.
                   </p>
                   <button className="w-full py-4 rounded-2xl bg-foreground text-background text-sm font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-foreground/5 active:scale-95">
                      Contact Office
                   </button>
                </div>
             </div>
          )}
       </div>
      </div>
    </main>
  );
}
