"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Phone, MapPin, Sparkles, Save, Shield, Camera, Globe } from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    name: "",
    email: "",
    phoneNumber: "",
    bio: "",
    preferences: {
      categories: [],
      regions: [],
      budget: "mid",
      language: "english"
    }
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.user) setProfile(data.user);
      } catch (e) {} finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        await update(); // sync session
        alert("Institutional profile synchronized successfully.");
      }
    } catch (e) {
      alert("Failed to sync profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="text-[10px] font-black tracking-widest uppercase text-foreground/20">Accessing Vault...</span>
    </div>
  );

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 lg:py-20 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-16">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">Identity Hub</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">Account <br /> Architecture</h1>
          <p className="text-foreground/40 font-medium italic text-lg">Personalize your institutional presence and travel intelligence.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-10 py-5 bg-foreground text-background text-[11px] font-black rounded-3xl hover:bg-primary transition-all active:scale-95 flex items-center gap-4 shadow-2xl shadow-foreground/10"
        >
          {saving ? "Synchronizing..." : <>Sync Changes <Save className="w-4 h-4" /></>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Core Profile */}
        <div className="lg:col-span-7 space-y-12">
          <section className="bg-white rounded-[50px] p-10 md:p-14 border border-foreground/[0.03] shadow-3xl shadow-foreground/[0.02]">
            <h3 className="text-2xl font-bold mb-10 flex items-center gap-4">
              <User className="w-6 h-6 text-primary" /> Core Credentials
            </h3>
            <div className="grid gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black tracking-widest uppercase text-foreground/30 px-2">Official Name</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full px-8 py-5 bg-foreground/[0.02] border border-foreground/[0.05] rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black tracking-widest uppercase text-foreground/30 px-2">Institutional Bio</label>
                <textarea 
                  value={profile.bio}
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                  rows={4}
                  className="w-full px-8 py-5 bg-foreground/[0.02] border border-foreground/[0.05] rounded-[32px] text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                  placeholder="Share your travel philosophy..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-widest uppercase text-foreground/30 px-2">Contact Line</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                    <input 
                      type="text" 
                      value={profile.phoneNumber}
                      onChange={e => setProfile({...profile, phoneNumber: e.target.value})}
                      className="w-full pl-14 pr-8 py-5 bg-foreground/[0.02] border border-foreground/[0.05] rounded-3xl text-sm font-bold outline-none"
                      placeholder="+251..."
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-widest uppercase text-foreground/30 px-2">Digital Channel</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                    <input 
                      type="email" 
                      value={profile.email}
                      disabled
                      className="w-full pl-14 pr-8 py-5 bg-foreground/[0.01] border border-foreground/[0.03] rounded-3xl text-sm font-bold text-foreground/30 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Intelligence / Preferences */}
        <div className="lg:col-span-5 space-y-12">
          <section className="bg-primary/[0.02] rounded-[50px] p-10 border border-primary/10 shadow-xl shadow-primary/[0.02]">
            <h3 className="text-2xl font-bold mb-10 flex items-center gap-4 text-primary">
              <Sparkles className="w-6 h-6" /> Discovery Intelligence
            </h3>
            <div className="space-y-10">
              <div className="space-y-6">
                <label className="text-[10px] font-black tracking-widest uppercase text-primary/40 px-2 flex items-center justify-between">
                  Budget Strategy
                  <Shield className="w-3 h-3" />
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["low", "mid", "high"].map(b => (
                    <button
                      key={b}
                      onClick={() => setProfile({...profile, preferences: {...profile.preferences, budget: b}})}
                      className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        profile.preferences?.budget === b 
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                        : "bg-white text-foreground/20 border-foreground/5"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-black tracking-widest uppercase text-primary/40 px-2">Travel Archetypes</label>
                <div className="flex flex-wrap gap-2">
                  {["Culture", "Nature", "Adventure", "Religious", "Coffee", "Modern"].map(cat => {
                    const val = cat.toLowerCase();
                    const active = profile.preferences?.categories?.includes(val);
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          const cats = profile.preferences?.categories || [];
                          const next = active ? cats.filter((c:any) => c !== val) : [...cats, val];
                          setProfile({...profile, preferences: {...profile.preferences, categories: next}});
                        }}
                        className={`px-6 py-2.5 rounded-full text-[10px] font-bold transition-all ${
                          active ? "bg-primary/20 text-primary border border-primary/20" : "bg-white text-foreground/30 border border-foreground/5"
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-primary/5">
                <div className="flex items-center gap-4 p-6 bg-white rounded-[32px] border border-primary/5">
                   <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                     <Globe className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                     <div className="text-[9px] font-black uppercase tracking-widest text-primary/30 mb-0.5">Primary Dialect</div>
                     <select 
                       value={profile.preferences?.language}
                       onChange={e => setProfile({...profile, preferences: {...profile.preferences, language: e.target.value}})}
                       className="w-full bg-transparent border-none p-0 text-sm font-black text-foreground/60 focus:ring-0 appearance-none outline-none"
                     >
                       <option value="english">English (Primary)</option>
                       <option value="amharic">Amharic (Native)</option>
                       <option value="french">French</option>
                       <option value="chinese">Chinese</option>
                     </select>
                   </div>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-surface rounded-[40px] p-10 border border-foreground/[0.03] text-center">
            <Camera className="w-10 h-10 text-foreground/10 mx-auto mb-6" />
            <h4 className="text-lg font-bold mb-2">Visual ID</h4>
            <p className="text-[11px] text-foreground/30 font-medium mb-6">Your profile image helps partners recognize verified explorers.</p>
            <button className="text-[10px] font-black tracking-widest text-primary uppercase hover:opacity-60 transition-opacity">Upload New Asset</button>
          </div>
        </div>
      </div>
    </main>
  );
}
