"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, Inbox, Mail, Clock, Building2, Calendar, X } from "lucide-react";
import { useSession } from "next-auth/react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export default function NotificationCenter() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    
    // Close on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getActionHref = (type: string, role?: string) => {
    const isReport = type.includes("report");
    if (role === "business_owner") return isReport ? "/business/reports" : "/business/dashboard";
    if (role === "super_admin") return isReport ? "/admin/reports" : "/admin/businesses";
    return isReport ? "/tourism-admin/reports" : "/tourism-admin/businesses";
  };
  
  const getActionText = (type: string) => {
    if (type.includes("report")) return "Action Required";
    if (type === "internal_chat") return "Open Discussion";
    if (type === "category_request") return "Review Expansion";
    return "Review Entity";
  };
  
const formatMessage = (msg: string) => {
    const html = msg
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-foreground/80">$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
        const proxyUrl = url.startsWith("https://res.cloudinary.com")
          ? `/api/business/sign-document?url=${encodeURIComponent(url)}`
          : url;
        return `<a href="${proxyUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-black flex items-center gap-1 inline-flex"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> ${text}</a>`;
      });
    return { __html: html };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Button (always visible) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all relative ${
          isOpen ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white border border-foreground/[0.05] text-foreground/40 hover:text-primary hover:border-primary/20 shadow-sm'
        }`}
      >
        <Bell className={`w-5 h-5 md:w-6 md:h-6 ${unreadCount > 0 && !isOpen ? 'animate-pulse text-primary' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce shadow-lg shadow-red-500/20">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-[40px] shadow-2xl shadow-foreground/10 border border-foreground/[0.05] overflow-hidden animate-slide-up z-[100]">
          <div className="px-10 py-8 border-b border-foreground/[0.03] flex items-center justify-between bg-primary/[0.02]">
            <div>
              <h2 className="text-base font-black tracking-[0.2em] uppercase text-foreground">
                Alert Feed
              </h2>
              <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest mt-1">Registry Monitor</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-foreground/20 hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-foreground/[0.02]">
            {loading && notifications.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4 text-foreground/10 animate-pulse">
                <Clock className="w-10 h-10" />
                <span className="text-[9px] font-black uppercase tracking-widest">Scanning Registry...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-24 text-center opacity-30 flex flex-col items-center gap-4">
                <Inbox className="w-12 h-12" />
                <p className="text-sm font-bold tracking-tight">Status: Nominal (No Alerts)</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`px-10 py-8 transition-all hover:bg-primary/[0.01] ${!n.isRead ? "bg-primary/[0.02]" : ""}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${!n.isRead ? "bg-primary animate-pulse" : "bg-foreground/10"}`} />
                        <h3 className={`text-base font-black tracking-tight uppercase ${!n.isRead ? "text-foreground" : "text-foreground/30"}`}>
                          {n.title}
                        </h3>
                      </div>
                      <span className="text-[9px] font-bold text-foreground/20">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div 
                      className="text-[14px] text-foreground/50 leading-relaxed font-medium"
                      dangerouslySetInnerHTML={formatMessage(n.message)} 
                    />
                    
                    <div className="flex items-center justify-between pt-2">
                       {n.relatedId && (
                         <Link 
                           href={getActionHref(n.type, session?.user?.role)}
                           onClick={() => setIsOpen(false)}
                           className="inline-flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:underline"
                         >
                           <Building2 className="w-3.5 h-3.5" /> {getActionText(n.type)}
                         </Link>
                       )}
                       {!n.isRead && (
                         <button
                           onClick={() => markAsRead(n._id)}
                           className="text-[9px] font-black text-foreground/20 uppercase tracking-widest hover:text-primary transition-colors"
                         >
                           Dismiss log
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 bg-foreground/[0.01] border-t border-foreground/[0.03] text-center">
             <span className="text-xs font-black text-foreground/20 uppercase tracking-[0.2em]">Institutional Command Center</span>
          </div>
        </div>
      )}
    </div>
  );
}

