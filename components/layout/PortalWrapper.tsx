"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  LogOut, 
  LayoutDashboard, 
  Building2, 
  ClipboardList, 
  Users, 
  Globe, 
  Settings, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  Compass,
  Menu,
  X,
  User,
  ChevronRight,
  Calendar,
  MessageSquare,
  Loader2,
  Bell,
  Ticket,
  Landmark,
  Edit2
} from "lucide-react";
import { pusherClient } from "@/lib/pusher-client";
import { toast } from "react-toastify";
import NotificationCenter from "@/components/admin/NotificationCenter";

export default function PortalWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    pendingBusinesses: 0,
    recommendedBusinesses: 0,
    pendingReports: 0,
    unreadDiscussionCount: 0,
  });

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth >= 1024) setIsSidebarOpen(true);
  }, []);

  const fetchAdminStats = async () => {
    try {
      const [bizRes, reportRes, notifyRes] = await Promise.all([
        fetch("/api/businesses"),
        fetch("/api/reports"),
        fetch("/api/notifications"),
      ]);
      const bizData = await bizRes.json();
      const reportData = await reportRes.json();
      const notifyData = await notifyRes.json();

      const businesses = bizData.businesses || [];
      const reports = reportData.reports || [];
      const notifications = notifyData.notifications || [];

      setStats({
        pendingBusinesses: businesses.filter((b: any) => b.status === "pending").length,
        recommendedBusinesses: businesses.filter((b: any) => b.status === "recommended_approve" || b.status === "recommended_reject").length,
        pendingReports: reports.filter((r: any) => r.status === "pending" || r.status === "under_review").length,
        unreadDiscussionCount: notifications.filter((n: any) => !n.isRead && n.type === "internal_chat").length,
      });
    } catch (e) {}
  };

  useEffect(() => {
    if (session?.user?.role === "super_admin" || session?.user?.role === "tourism_admin" || session?.user?.role === "business_owner") {
      fetchAdminStats();

      // Listen for global internal chat/notifications
      let channel: any;
      try {
        if (process.env.NEXT_PUBLIC_PUSHER_KEY) {
          const channelName = session.user.role === "business_owner" 
            ? `admin-notifications-business_owner-${session.user.id}`
            : `admin-notifications-${session.user.role}`;

          channel = pusherClient.subscribe(channelName);
          channel.bind("new-internal-message", (data: any) => {
            toast.info(
              <div className="flex flex-col gap-1">
                <span className="font-black text-[10px] uppercase tracking-widest text-primary">New Notice: {data.senderName}</span>
                <span className="text-[12px] font-medium text-foreground/60 italic">"{data.message}"</span>
              </div>,
              { position: "bottom-right", autoClose: 8000 }
            );
            fetchAdminStats();
          });
        }
      } catch (e) {
        console.error("Global notification subscription error:", e);
      }

      return () => {
        if (channel) {
          try {
            const channelName = session.user.role === "business_owner" 
              ? `admin-notifications-business_owner-${session.user.id}`
              : `admin-notifications-${session.user.role}`;
            pusherClient.unsubscribe(channelName);
          } catch (e) {}
        }
      };
    }
  }, [session]);

  // Exclude landing page, login, register, and business registration from the portal layout
  const excludedPaths = ["/", "/login", "/register", "/business", "/tourist/onboarding", "/setup-security"];
  const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);
  const isExcluded = excludedPaths.includes(pathname);

  useEffect(() => {
    if (!mounted || isExcluded) return;
    
    if (session?.user?.needsPasswordChange && pathname !== "/setup-security") {
      window.location.href = "/setup-security";
      return;
    }
    
    if (session?.user?.role === "tourist") {
      checkOnboarding();
    } else if (session?.user?.role) {
      setIsOnboardingChecked(true);
    }
  }, [session, pathname, mounted, isExcluded]);

  const checkOnboarding = async () => {
    try {
      const res = await fetch("/api/tourist/profile");
      const data = await res.json();
      if (!data.profile || !data.profile.isCompleted) {
        window.location.href = "/tourist/onboarding";
      } else {
        setIsOnboardingChecked(true);
      }
    } catch (e) {
      setIsOnboardingChecked(true);
    }
  };

  if (!mounted || isExcluded) return <>{children}</>;

  if (session?.user?.role === "tourist" && !isOnboardingChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-10 mesh-gradient-rich">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
            <Compass className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute inset-0 bg-primary/20 blur-2xl -z-10" />
        </div>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 italic font-sans">Initializing Explorer Axis...</span>
        </div>
      </div>
    );
  }

  const role = session?.user?.role || "tourist";
  const initials = session?.user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const isNotificationEnabled = role === "super_admin" || role === "tourism_admin" || role === "business_owner";

  const getActions = () => {
    switch (role) {
      case "super_admin":
        return [
          { label: "Business Management", href: "/admin/businesses", icon: <Building2 className="w-5 h-5" />, count: stats.recommendedBusinesses },
          { label: "Report Triage", href: "/admin/reports", icon: <AlertCircle className="w-5 h-5" />, count: stats.pendingReports },
          { label: "Master Registry", href: "/admin/users", icon: <Users className="w-5 h-5" />, count: 0 },
        ];
      case "tourism_admin":
        return [
          { label: "Review Submissions", href: "/tourism-admin/businesses", icon: <Building2 className="w-5 h-5" />, count: stats.pendingBusinesses },
          { label: "Initial Monitoring", href: "/tourism-admin/reports", icon: <ClipboardList className="w-5 h-5" />, count: stats.pendingReports },
        ];
      case "business_owner":
        return [
          { label: "Service Profile", href: "/business/dashboard", icon: <Building2 className="w-5 h-5" />, count: 0 },
          { label: "Compliance Records", href: "/business/reports", icon: <ClipboardList className="w-5 h-5" />, count: stats.pendingReports },
        ];
      default:
        return [
          { label: "Browse Services", href: "/discover/businesses", icon: <Globe className="w-5 h-5" />, count: 0 },
          { label: "My Destinations", href: "/discover/destinations", icon: <Compass className="w-5 h-5" />, count: 0 },
          { label: "My Bookings", href: "/dashboard/bookings", icon: <Calendar className="w-5 h-5" />, count: 0 },
          { label: "Landmark Lens", href: "/landmarks", icon: <Landmark className="w-5 h-5" />, count: 0 }
        ];
    }
  };

  const navActions = getActions();

  return (
    <div className="min-h-screen bg-background font-sans flex overflow-hidden relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Overlay Menu on Mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-full sm:w-80 lg:w-72 bg-white border-r border-foreground/[0.03] transition-transform duration-500 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-2xl shadow-black/10`}>
        <div className="h-full flex flex-col p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-14 px-2">
            <Link href="/" className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20">W</div>
              <span className="text-sm font-black tracking-widest text-foreground uppercase">Wonder Ethiopia</span>
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-foreground/20 hover:text-primary transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
            <Link href="/dashboard" onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)} className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-[13px] font-black tracking-wide transition-all ${pathname === '/dashboard' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-foreground/40 hover:text-primary hover:bg-primary/[0.03]'}`}>
              <LayoutDashboard className="w-5 h-5" />
              Overview
            </Link>
            {navActions.map((action) => (
              <Link key={action.href} href={action.href} onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)} className={`flex items-center justify-between px-4 py-4 rounded-2xl text-[13px] font-black tracking-wide transition-all group ${pathname === action.href ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-foreground/40 hover:text-primary hover:bg-primary/[0.03]'}`}>
                <div className="flex items-center gap-4">
                  <span className="group-hover:scale-110 transition-transform">{action.icon}</span>
                  {action.label}
                </div>
                {action.count > 0 && <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-[10px] flex items-center justify-center animate-pulse">{action.count}</span>}
              </Link>
            ))}
            <div className="h-px bg-foreground/[0.03] my-8" />
            <Link href="/settings" onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)} className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-[13px] font-black tracking-wide transition-all ${pathname === '/settings' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-foreground/40 hover:text-primary hover:bg-primary/[0.03]'}`}>
              <User className="w-5 h-5" />
              Profile
            </Link>
          </nav>

          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-50 text-[13px] font-black tracking-wide transition-all mt-auto pt-8 border-t border-foreground/[0.03]">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-500 ${isSidebarOpen ? 'lg:pl-72' : 'lg:pl-0'}`}>
        {/* Top Header - Fixed/Non-scrollable */}
        <header className="h-20 glass border-b border-foreground/[0.03] px-4 md:px-10 flex items-center justify-between z-40 flex-shrink-0">
           <div className="flex items-center gap-3 md:gap-6 flex-1">
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
               className="p-3 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.05] text-primary transition-all hover:bg-primary hover:text-white"
             >
               <Menu className="w-7 h-7" />
             </button>
           </div>

           <div className="flex items-center gap-4 md:gap-8 relative">
              {isNotificationEnabled && <NotificationCenter />}
              
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 md:gap-8 group hover:opacity-80 transition-opacity outline-none"
              >
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[14px] font-black text-foreground tracking-tight leading-none mb-1">{session?.user?.name}</span>
                  <span className="text-[10px] font-black text-primary tracking-widest uppercase">{role.replace("_", " ")}</span>
                </div>
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white p-1 border border-foreground/[0.05] shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                   <div className="w-full h-full rounded-[14px] bg-primary text-white flex items-center justify-center text-[10px] md:text-[12px] font-black shadow-inner overflow-hidden">
                     {session?.user?.image ? (
                       <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       initials
                     )}
                   </div>
                </div>
              </button>

              {/* Registry Details Overlay */}
              {isProfileOpen && (
                <div className="absolute top-full right-0 mt-4 w-80 bg-white rounded-[32px] p-8 border border-foreground/[0.05] shadow-2xl shadow-foreground/10 animate-slide-up z-50">
                  <div className="flex items-center justify-between gap-3 mb-8">
                    <span className="text-[10px] font-black tracking-widest uppercase text-foreground/40">Registry Identity</span>
                    <div className="flex items-center gap-2">
                      <Link 
                        href="/settings" 
                        onClick={() => setIsProfileOpen(false)}
                        className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary/40 hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><User className="w-4 h-4" /></div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {[
                      { label: "Entity", value: session?.user?.name, icon: <Users className="w-3.5 h-3.5" /> },
                      { label: "Channel", value: session?.user?.email, icon: <Mail className="w-3.5 h-3.5" /> },
                      { label: "Clearance", value: role.replace("_", " "), isRole: true, icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-8 border-b border-foreground/[0.02] pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 text-foreground/20">
                          <span className="text-primary/40">{item.icon}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <span className={`text-[11px] font-bold text-right truncate max-w-[150px] ${item.isRole ? 'text-primary' : 'text-foreground/60'}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
           </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {children}
        </div>
      </div>
    </div>
  );
}
