"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  Users, 
  User, 
  Mail, 
  Calendar, 
  ArrowRight, 
  ChevronRight, 
  Settings, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  Building2, 
  Compass,
  LayoutDashboard
} from "lucide-react";
import { toast } from "react-toastify";

import { showToast } from "@/lib/toast";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const roleConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  super_admin: { label: "Super Admin", color: "text-primary", bg: "bg-primary/5 border-primary/10", icon: <Lock className="w-3.5 h-3.5" /> },
  tourism_admin: { label: "Tourism Admin", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  business_owner: { label: "Business Owner", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Building2 className="w-3.5 h-3.5" /> },
  tourist: { label: "Explorer", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: <Compass className="w-3.5 h-3.5" /> },
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("business_owner"); // Locked to business_owner
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = filter === "all" ? "/api/users" : `/api/users?role=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        showToast("Success", "Identity updated successfully", "success");
        fetchUsers();
      } else {
        const error = await res.json();
        showToast("System Error", error.error || "Quality control failure", "error");
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === session?.user?.id) {
      showToast("System Error", "Self-purge prevention active!", "error");
      return;
    }
    if (!confirm("Are you sure you want to remove this entity from the registry?")) return;
    
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Success", "Entity removed from master registry", "success");
        fetchUsers();
      } else {
        const error = await res.json();
        showToast("System Error", error.error || "Failed to delete user", "error");
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="bg-background text-foreground font-sans">
      <main className="relative z-10 max-w-7xl mx-auto px-3 md:px-4 lg:px-5 py-10 lg:py-20 text-center lg:text-left">
        {/* Title & Filters */}
        <div className="animate-fade-in mb-16 px-4">
          <div className="max-w-4xl mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-black tracking-[0.3em] uppercase text-primary">
                Institutional User Registry
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-[0.9]">
              Authentication <br /> Authority Hub
            </h1>
            <p className="text-foreground/40 text-lg font-medium italic">
              Manage entity identities, access levels, and institutional roles across the platform.
            </p>
          </div>

          {/* Filter logic locked for Super Admin */}
          {session?.user?.role !== "super_admin" && (
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {["all", "super_admin", "tourism_admin", "business_owner", "tourist"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-8 py-3.5 text-sm font-black uppercase tracking-widest rounded-2xl border transition-all duration-300 ${
                    filter === f
                      ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105"
                      : "bg-white text-foreground/30 border-foreground/5 hover:border-primary/20 hover:text-primary"
                  }`}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <span className="text-xs font-black tracking-widest uppercase text-foreground/20">Syncing Master Identities...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-48 bg-white/50 rounded-[60px] border-4 border-dashed border-foreground/5 mx-4">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary/20">
              <User className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground/40 mb-2">No Entities Found</h3>
            <p className="text-foreground/20 font-medium italic">The master registry contains no records matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {users.map((user, i) => {
              const rc = roleConfig[user.role] || roleConfig.tourist;
              const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
              const isSelf = user._id === session?.user?.id;
              
              return (
                <div
                  key={user._id}
                  className="bg-white rounded-[50px] p-10 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] animate-slide-up hover:ring-2 hover:ring-primary/5 transition-all"
                  style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-10">
                    <div className="w-16 h-16 rounded-[24px] bg-primary/5 flex items-center justify-center text-primary font-black text-xl shadow-inner border border-primary/5">
                      {initials}
                    </div>
                    <div className={`px-5 py-2 rounded-full border ${rc.bg} ${rc.color} flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm`}>
                      {rc.icon}
                      {rc.label}
                    </div>
                  </div>

                  <div className="space-y-6 mb-12">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight mb-1 truncate">{user.name}</h3>
                      <div className="flex items-center gap-2 text-foreground/30 text-base font-medium">
                        <Mail className="w-3.5 h-3.5" />
                        {user.email}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-foreground/20">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-foreground/[0.03] flex items-center justify-between gap-4">
                    <div className="relative flex-1 group/select opacity-30 cursor-not-allowed">
                      <select
                        disabled={true}
                        value={user.role}
                        className="w-full bg-foreground/[0.01] border border-foreground/[0.03] text-sm font-black uppercase tracking-widest rounded-2xl px-3 md:px-4 lg:px-5 py-4 appearance-none focus:outline-none transition-all cursor-not-allowed"
                      >
                        <option value="tourist">Explorer</option>
                        <option value="business_owner">Business Owner</option>
                        <option value="tourism_admin">Tourism Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/10">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>

                    <button
                      onClick={() => {}}
                      disabled={true}
                      className="w-14 h-14 rounded-2xl bg-white border border-foreground/[0.03] text-foreground/10 flex items-center justify-center transition-all opacity-20 cursor-not-allowed"
                      title="Purge Restricted"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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
