"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { signInWithPopup, auth, googleProvider } from "@/lib/firebase";
import { ArrowLeft, User, Mail, Lock, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
      } else {
        router.push("/login?registered=true");
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
      const result = await signInWithPopup(auth, googleProvider);
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
    } catch (err: any) {
      setError(err.message || "Google sign in failed");
      setLoading(false);
    }
  };

  const fields = [
    { id: "name", label: "Full Name", type: "text", placeholder: "Abebe Kebede", icon: <User className="w-4 h-4" /> },
    { id: "email", label: "Email Address", type: "email", placeholder: "abebe@example.com", icon: <Mail className="w-4 h-4" /> },
    { id: "password", label: "Password", type: "password", placeholder: "••••••••", minLength: 6, icon: <Lock className="w-4 h-4" /> },
    { id: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "••••••••", minLength: 6, icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-20">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[460px] animate-fade-in">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-base font-bold text-foreground/40 hover:text-primary transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Explorations
        </Link>

        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl mx-auto mb-6 shadow-lg shadow-primary/20">W</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Join Wonder Ethiopia</h1>
          <p className="text-foreground/40 text-[14px] font-medium italic">
            Start your discovery of 3,000 years of heritage
          </p>
        </div>

        {/* Card */}
        <div className="glass-elevated rounded-[40px] p-8 md:p-10 shadow-2xl shadow-foreground/5 border border-foreground/[0.03]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-500 text-base text-center font-bold animate-shake">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5">
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label
                    htmlFor={field.id}
                    className="block text-sm font-black text-foreground/30 uppercase tracking-[0.1em]"
                  >
                    {field.label}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors">
                      {field.icon}
                    </div>
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      value={formData[field.id as keyof typeof formData]}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-2xl text-foreground text-[14px] font-medium placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all duration-300"
                      placeholder={field.placeholder}
                      minLength={field.minLength}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white text-[14px] font-bold rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Explorer Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px bg-foreground/[0.05] flex-1" />
            <span className="text-foreground/20 text-xs font-black uppercase tracking-widest">
              Social Join
            </span>
            <div className="h-px bg-foreground/[0.05] flex-1" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 glass text-foreground font-bold text-[14px] rounded-2xl border-foreground/5 hover:bg-foreground/[0.02] transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="mt-10 text-center space-y-4">
          <p className="text-foreground/40 text-[14px] font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary-hover font-bold transition-all border-b border-primary/20 hover:border-primary pb-0.5"
            >
              Log in here
            </Link>
          </p>
          <div className="h-px w-12 bg-foreground/5 mx-auto" />
          <p className="text-foreground/40 text-base font-medium">
            Are you a local business?{" "}
            <Link
              href="/business"
              className="text-primary hover:text-primary-hover font-bold transition-all"
            >
              List your service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
