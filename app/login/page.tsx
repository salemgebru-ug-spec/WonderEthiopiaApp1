"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithRedirect, getRedirectResult, auth, googleProvider } from "@/lib/firebase";
import { ArrowLeft, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestingNew, setRequestingNew] = useState(false);

  // Handle Firebase redirect result
  useEffect(() => {
    (async () => {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        const idToken = await result.user.getIdToken();
        const nextAuthResult = await signIn("credentials", {
          idToken,
          redirect: false,
        });
        if (nextAuthResult?.error) {
          setError(nextAuthResult.error);
          setLoading(false);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    })();
  }, [router]);

  const handleRequestNewPassword = async () => {
    if (!email) {
      setError("Please enter your email address above first.");
      return;
    }
    setRequestingNew(true);
    try {
      const res = await fetch("/api/auth/request-new-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setError("Success! New credentials have been sent to your email.");
      } else {
        setError(data.error || "Failed to request new credentials.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setRequestingNew(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithRedirect(auth, googleProvider);
      // Result handled in useEffect
    } catch (err: any) {
      setError(err.message || "Google sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[440px] animate-fade-in">
        <Link href="/" className="inline-flex items-center gap-2 text-base font-bold text-foreground/40 hover:text-primary transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Explorations
        </Link>

        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl mx-auto mb-6 shadow-lg shadow-primary/20">W</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Welcome Back</h1>
          <p className="text-foreground/40 text-[14px] font-medium italic">
            Continue your journey through the Land of Origins
          </p>
        </div>

        {/* Card */}
        <div className="glass-elevated rounded-[32px] p-8 md:p-10 shadow-2xl shadow-foreground/5 border border-foreground/[0.03]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className={`border rounded-2xl p-4 text-base text-center font-bold animate-shake ${
                  error.startsWith("Success!")
                    ? "bg-green-50 border-green-100 text-green-600"
                    : "bg-red-50 border-red-100 text-red-500"
                }`}
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-black text-foreground/30 uppercase tracking-[0.1em]">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-2xl text-foreground text-[14px] font-medium placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all duration-300"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-black text-foreground/30 uppercase tracking-[0.1em]">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-2xl text-foreground text-[14px] font-medium placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all duration-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white text-[14px] font-bold rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign Into Account"
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px bg-foreground/[0.05] flex-1" />
            <span className="text-foreground/20 text-xs font-black uppercase tracking-widest">
              Secure Login
            </span>
            <div className="h-px bg-foreground/[0.05] flex-1" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 glass text-foreground font-bold text-[14px] rounded-2xl border-foreground/5 hover:bg-foreground/[0.02] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4334" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <div className="mt-10 text-center">
            <p className="text-foreground/40 text-[14px] font-medium">
              New to the platform?{' '}
              <Link href="/register" className="text-primary hover:text-primary-hover font-bold transition-all border-b border-primary/20 hover:border-primary pb-0.5">
                Begin Registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
