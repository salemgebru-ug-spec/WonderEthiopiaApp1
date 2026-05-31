"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  ShieldAlert,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

import { showToast } from "@/lib/toast";

export default function SetupSecurityPage() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extract unauthenticated state from URL
  const emailParam = searchParams.get("email");
  const tempParam = searchParams.get("temp");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tempPassword, setTempPassword] = useState(tempParam || "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync tempParam if it arrives late
  useEffect(() => {
    if (tempParam) setTempPassword(tempParam);
  }, [tempParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showToast("System Error", "Credential mismatch. Please synchronize your passwords.", "error");
      return;
    }

    if (!tempPassword) {
      showToast("System Error", "Institutional verification error. Temporary password is required.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("System Error", "Security threshold error. Password must be at least 6 characters.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          newPassword,
          email: emailParam,
          tempPassword: tempPassword 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        showToast("Success", "Security perimeter secured successfully.", "success");
        
        if (session) {
          await update({ 
            needsPasswordChange: false,
            role: data.role 
          });
          setTimeout(() => window.location.href = "/dashboard", 2000);
        }
      } else {
        const data = await res.json();
        showToast("System Error", data.error || "Failed to update security credentials.", "error");
      }
    } catch (error) {
      showToast("System Error", "Network communication failure. Please retry.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 py-20 mesh-gradient-rich">
        <div className="w-full max-w-xl bg-white p-16 rounded-[64px] shadow-3xl text-center border border-foreground/[0.03] animate-scale-in">
           <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12" />
           </div>
           <h2 className="text-4xl font-black tracking-tightest uppercase mb-4">Identity <span className="text-emerald-500 italic">Secured.</span></h2>
           <p className="text-foreground/40 font-bold text-sm uppercase tracking-widest mb-12">Institutional credentials modernized</p>
           
           <div className="space-y-6">
              <div className="p-8 bg-foreground/[0.02] border border-foreground/[0.05] rounded-3xl text-sm leading-relaxed text-foreground/60 italic font-medium">
                 Your unique partner credentials have been successfully established in our registry. You may now proceed to the authentication gateway.
              </div>
              <Link
                href="/login"
                className="block w-full bg-foreground text-background py-6 rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:bg-primary transition-all group"
              >
                Proceed to Login <ArrowRight className="inline-block w-5 h-5 ml-4 group-hover:translate-x-2 transition-transform" />
              </Link>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-20 mesh-gradient-rich relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="w-full max-w-xl relative animate-slide-up">
        <div className="flex flex-col items-center mb-16">
          <div className="w-20 h-20 bg-foreground text-background rounded-3xl flex items-center justify-center shadow-2xl mb-8 group hover:scale-110 transition-transform">
             <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-black tracking-[0.4em] uppercase text-primary">Institutional Security Axis</span>
            <Sparkles className="w-3 h-3 text-primary animate-bounce" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tightest uppercase text-center leading-none">Initialize <span className="text-primary italic">Credentials.</span></h1>
        </div>

        <div className="bg-amber-50/50 border border-amber-200/50 rounded-3xl p-8 mb-12 flex gap-6 items-start">
           <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
           </div>
           <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-tight text-amber-900">Mandatory Security Protocol</h3>
              <p className="text-base font-medium text-amber-800/60 leading-relaxed">
                Your account for <strong>{emailParam || "Wonder Ethiopia Partner"}</strong> requires unique credentials. Please establishment your private password below before proceeding to login.
              </p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 md:p-14 rounded-[50px] shadow-3xl border border-foreground/[0.03]">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/30 px-2">
                {(session?.user as any)?.needsPasswordChange === false ? "Current Security Key" : "Temporary Security Key"}

              </label>
              <div className="relative group">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors">
                    <ShieldAlert className="w-5 h-5" />
                 </div>
                 <input
                   type={showPassword ? "text" : "password"}
                   required
                   value={tempPassword}
                   onChange={e => setTempPassword(e.target.value)}
                   className="w-full pl-16 pr-16 py-6 bg-foreground/[0.02] border border-foreground/[0.05] rounded-3xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-foreground/10"
                   placeholder="Enter verification key"
                 />
                 <button 
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-6 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-primary transition-colors"
                 >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/30 px-2">New Security Hash</label>
              <div className="relative group">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                 </div>
                 <input
                   type={showPassword ? "text" : "password"}
                   required
                   value={newPassword}
                   onChange={e => setNewPassword(e.target.value)}
                   className="w-full pl-16 pr-16 py-6 bg-foreground/[0.02] border border-foreground/[0.05] rounded-3xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-foreground/10"
                   placeholder="Minimum 6 characters"
                 />
                 <button 
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-6 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-foreground transition-colors"
                 >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/30 px-2">Synchronize Password</label>
              <div className="relative group">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 <input
                   type={showPassword ? "text" : "password"}
                   required
                   value={confirmPassword}
                   onChange={e => setConfirmPassword(e.target.value)}
                   className="w-full pl-16 pr-16 py-6 bg-foreground/[0.02] border border-foreground/[0.05] rounded-3xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-foreground/10"
                   placeholder="Match secret credentials"
                 />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background py-6 rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:bg-primary transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
          >
            {loading ? (
              <>Encrypting Identity <Loader2 className="w-5 h-5 animate-spin" /></>
            ) : (
              <>Commit Security Change <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></>
            )}
          </button>
          
          <div className="pt-6 border-t border-foreground/5 text-center">
             <Link 
               href="/login"
               className="text-xs font-black uppercase tracking-widest text-foreground/20 hover:text-primary transition-colors"
             >
                Return to Login Gateway
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
