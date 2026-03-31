"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Inbox, Mail, Clock } from "lucide-react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4 text-foreground/20 animate-pulse">
        <Bell className="w-10 h-10" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Checking Registry...</span>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-white rounded-[40px] overflow-hidden animate-fade-in font-sans">
      <div className="px-10 py-8 border-b border-foreground/[0.03] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="w-6 h-6 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm" />
            )}
          </div>
          <div>
            <h2 className="text-[13px] font-black tracking-[0.2em] uppercase text-foreground">
              Event Registry
            </h2>
            <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">System Activity Log</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="px-4 py-2 bg-primary/5 text-primary text-[10px] font-black rounded-2xl border border-primary/10">
            {unreadCount} NEW UPDATES
          </span>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-foreground/[0.03]">
        {notifications.length === 0 ? (
          <div className="py-24 text-center opacity-30 flex flex-col items-center gap-4">
            <Inbox className="w-12 h-12" />
            <p className="text-sm font-bold tracking-tight">Your registry is clear.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`px-10 py-8 transition-all hover:bg-primary/[0.01] ${!n.isRead ? "bg-primary/[0.02]" : ""}`}
            >
              <div className="flex items-start justify-between gap-8">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${!n.isRead ? "bg-primary animate-pulse" : "bg-foreground/10"}`} />
                    <h3 className={`text-[15px] font-bold tracking-tight ${!n.isRead ? "text-foreground" : "text-foreground/40"}`}>
                      {n.title}
                    </h3>
                  </div>
                  
                  <p className="text-[14px] text-foreground/50 leading-relaxed font-medium">
                    {n.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-foreground/20">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                       <Calendar className="w-3 h-3" />
                       {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n._id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[10px] font-black rounded-xl hover:bg-primary-hover transition-all active:scale-95 shadow-lg shadow-primary/10"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    DISMISS
                  </button>
                )}
                {n.isRead && (
                   <div className="text-primary/20">
                      <CheckCircle2 className="w-5 h-5" />
                   </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { Calendar } from "lucide-react";
