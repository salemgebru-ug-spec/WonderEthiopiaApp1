"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Phone, MapPin, Sparkles, Save, Shield, Camera, Globe, Mountain, Compass, History, Hotel, Timer, Dumbbell, UserCheck, Check, Waves, Utensils, Music, Wifi, Bath, Users } from "lucide-react";

import { showToast } from "@/lib/toast";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>({
    name: "",
    email: "",
    phoneNumber: "",
    profileImage: "",
    preferences: {
      categories: [],
      regions: [],
      budget: "mid",
      language: "english"
    }
  });

  const [tourismProfile, setTourismProfile] = useState<any>({
    activity_preferences: [],
    travel_style: "",
    interests: [],
    accommodation_type: "",
    room_type: "",
    amenities: [],
    duration_preference: "",
    fitness_level: "",
    group_type: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, tourismRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/tourist/profile")
        ]);

        const profileData = await profileRes.json();
        if (profileData.user) setProfile(profileData.user);

        if (tourismRes.ok) {
          const tourismData = await tourismRes.json();
          if (tourismData.profile) setTourismProfile(tourismData.profile);
        }
      } catch (e) {
        console.error("Failed to fetch profiles:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = [
        fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile)
        })
      ];

      if (session?.user?.role === "tourist") {
        promises.push(
          fetch("/api/tourist/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tourismProfile)
          })
        );
      }

      const results = await Promise.all(promises);
      if (results.every(r => r.ok)) {
        await update({ image: profile.profileImage }); // sync session with new image
        showToast("Success", "Institutional profile and intelligence axis synchronized.", "success");
      } else {
        showToast("Error", "Partial synchronization failure.", "error");
      }
    } catch (e) {
      showToast("Error", "Synchronization interrupted.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setProfile((prev: any) => ({ ...prev, profileImage: data.url }));
      }
    } catch (e) {
      showToast("Error", "Asset transmission failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const initials = profile.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="text-xs font-black tracking-widest uppercase text-foreground/20">Accessing Vault...</span>
    </div>
  );

  return (
    <main className="max-w-5xl mx-auto px-3 md:px-4 lg:px-5 py-10 lg:py-20 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-16">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-black tracking-[0.3em] uppercase text-primary">Identity Hub</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">Tourist Profile</h1>
          <p className="text-foreground/40 font-medium italic text-lg">Personalize your institutional presence and travel intelligence.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-10 py-5 bg-primary text-white text-sm font-black rounded-3xl hover:bg-primary-hover transition-all active:scale-95 flex items-center gap-4 shadow-2xl shadow-primary/20"
            >
              Edit Intelligence <Sparkles className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-10 py-5 bg-white border border-foreground/10 text-foreground text-sm font-black rounded-3xl hover:bg-foreground hover:text-white transition-all active:scale-95 flex items-center gap-4 shadow-xl shadow-foreground/5"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleSave();
                  setIsEditing(false);
                }}
                disabled={saving}
                className="px-10 py-5 bg-foreground text-background text-sm font-black rounded-3xl hover:bg-primary transition-all active:scale-95 flex items-center gap-4 shadow-2xl shadow-foreground/10"
              >
                {saving ? "Synchronizing..." : <>Sync Changes <Save className="w-4 h-4" /></>}
              </button>
            </>
          )}
        </div>
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
                <label className="text-xs font-black tracking-widest uppercase text-foreground/30 px-2">Official Name</label>
                <input
                  type="text"
                  value={profile.name}
                  disabled={!isEditing}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className={`w-full px-8 py-5 bg-foreground/[0.02] border border-foreground/[0.05] rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black tracking-widest uppercase text-foreground/30 px-2">Contact Line</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                    <input
                      type="text"
                      value={profile.phoneNumber}
                      disabled={!isEditing}
                      onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })}
                      className={`w-full pl-14 pr-8 py-5 bg-foreground/[0.02] border border-foreground/[0.05] rounded-3xl text-sm font-bold outline-none ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="+251..."
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black tracking-widest uppercase text-foreground/30 px-2">Digital Channel</label>
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
                <label className="text-xs font-black tracking-widest uppercase text-primary/40 px-2 flex items-center justify-between">
                  Budget Strategy
                  <Shield className="w-3 h-3" />
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["low", "mid", "high"].map(b => (
                    <button
                      key={b}
                      onClick={() => {
                        if (!isEditing) return;
                        setProfile({ ...profile, preferences: { ...profile.preferences, budget: b } })
                      }}
                      className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${profile.preferences?.budget === b
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                        : "bg-white text-foreground/20 border-foreground/5"
                        } ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-xs font-black tracking-widest uppercase text-primary/40 px-2">Travel Archetypes</label>
                <div className="flex flex-wrap gap-2">
                  {["Culture", "Nature", "Adventure", "Religious", "Coffee", "Modern"].map(cat => {
                    const val = cat.toLowerCase();
                    const active = profile.preferences?.categories?.includes(val);
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          if (!isEditing) return;
                          const cats = profile.preferences?.categories || [];
                          const next = active ? cats.filter((c: any) => c !== val) : [...cats, val];
                          setProfile({ ...profile, preferences: { ...profile.preferences, categories: next } });
                        }}
                        className={`px-3 md:px-4 lg:px-5 py-2.5 rounded-full text-xs font-bold transition-all ${active ? "bg-primary/20 text-primary border border-primary/20" : "bg-white text-foreground/30 border border-foreground/5"
                          } ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>


            </div>
          </section>

          <div className="bg-surface rounded-[40px] p-10 border border-foreground/[0.03] text-center mb-12 relative overflow-hidden group">
            {uploading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[8px] font-black tracking-widest uppercase text-primary">Uploading Asset...</span>
              </div>
            )}

            <div className="w-24 h-24 mx-auto mb-8 relative">
              <div className="w-full h-full rounded-[32px] bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden shadow-inner">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-primary">{initials}</span>
                )}
              </div>
              {isEditing && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 border-4 border-white">
                  <Camera className="w-3 h-3" />
                </div>
              )}
            </div>

            <h4 className="text-lg font-bold mb-2">Visual ID</h4>
            <p className="text-sm text-foreground/30 font-medium mb-6">Your profile image helps partners recognize verified explorers.</p>

            <input
              type="file"
              id="profile-upload"
              hidden
              accept="image/*"
              onChange={handleUpload}
              disabled={!isEditing || uploading}
            />

            <button
              disabled={!isEditing || uploading}
              onClick={() => document.getElementById('profile-upload')?.click()}
              className={`text-xs font-black tracking-widest text-primary uppercase hover:opacity-60 transition-opacity ${(!isEditing || uploading) ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              {uploading ? "Transmitting..." : "Upload New Asset"}
            </button>
          </div>

          {session?.user?.role === "tourist" && (
            <section className="space-y-12 animate-slide-up">
              {/* Tourist Specific: Adventure Protocol */}
              <div className="bg-white rounded-[50px] p-10 border border-foreground/[0.03] shadow-3xl shadow-foreground/[0.02]">
                <h3 className="text-xl font-black tracking-widest uppercase text-primary/40 mb-10 flex items-center gap-4">
                  <Mountain className="w-5 h-5" /> Adventure Protocol
                </h3>

                <div className="space-y-10">
                  <div className="space-y-6">
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/20 px-2">Expedition Style</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "luxury", label: "Luxury" },
                        { id: "budget", label: "Budget" },
                        { id: "backpacking", label: "Backpacking" },
                        { id: "eco_friendly", label: "Eco-friendly" },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (!isEditing) return;
                            setTourismProfile({ ...tourismProfile, travel_style: opt.id })
                          }}
                          className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${tourismProfile.travel_style === opt.id
                            ? "bg-foreground text-background border-foreground shadow-lg"
                            : "bg-white/40 border-foreground/5"
                            } ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/20 px-2">Activity Markers</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "hiking", label: "Hiking", icon: <Mountain className="w-3 h-3" /> },
                        { id: "safari", label: "Safari", icon: <Compass className="w-3 h-3" /> },
                        { id: "water_activities", label: "Water", icon: <Waves className="w-3 h-3" /> },
                      ].map(opt => {
                        const active = tourismProfile.activity_preferences?.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              if (!isEditing) return;
                              const current = tourismProfile.activity_preferences || [];
                              const next = active ? current.filter((a: any) => a !== opt.id) : [...current, opt.id];
                              setTourismProfile({ ...tourismProfile, activity_preferences: next });
                            }}
                            className={`px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${active ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/40 border border-foreground/5 text-foreground/30"
                              } ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/20 px-2">Heritage Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "history", label: "History", icon: <History className="w-3 h-3" /> },
                        { id: "culture", label: "Tradition", icon: <Users className="w-3 h-3" /> },
                        { id: "festivals", label: "Festivals", icon: <Music className="w-3 h-3" /> },
                        { id: "food", label: "Cuisine", icon: <Utensils className="w-3 h-3" /> },
                      ].map(opt => {
                        const active = tourismProfile.interests?.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              if (!isEditing) return;
                              const current = tourismProfile.interests || [];
                              const next = active ? current.filter((a: any) => a !== opt.id) : [...current, opt.id];
                              setTourismProfile({ ...tourismProfile, interests: next });
                            }}
                            className={`px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${active ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/40 border border-foreground/5 text-foreground/30"
                              } ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stay Configuration */}
              <div className="bg-white rounded-[50px] p-10 border border-foreground/[0.03] shadow-3xl shadow-foreground/[0.02]">
                <h3 className="text-xl font-black tracking-widest uppercase text-primary/40 mb-10 flex items-center gap-4">
                  <Hotel className="w-5 h-5" /> Stay Configuration
                </h3>

                <div className="space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[9px] font-black uppercase tracking-widest text-foreground/20 px-2">Accommodation</label>
                      <select
                        value={tourismProfile.accommodation_type}
                        disabled={!isEditing}
                        onChange={e => setTourismProfile({ ...tourismProfile, accommodation_type: e.target.value })}
                        className={`w-full px-6 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-2xl text-sm font-bold outline-none ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <option value="">Select Type</option>
                        <option value="hotel">Hotel</option>
                        <option value="lodge">Lodge</option>
                        <option value="hostel">Hostel</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[9px] font-black uppercase tracking-widest text-foreground/20 px-2">Room Privacy</label>
                      <select
                        value={tourismProfile.room_type}
                        disabled={!isEditing}
                        onChange={e => setTourismProfile({ ...tourismProfile, room_type: e.target.value })}
                        className={`w-full px-6 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-2xl text-sm font-bold outline-none ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <option value="">Select Logic</option>
                        <option value="private">Private</option>
                        <option value="shared">Shared</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/20 px-2">Protocol Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "wifi", label: "WiFi", icon: <Wifi className="w-3 h-3" /> },
                        { id: "pool", label: "Pool", icon: <Waves className="w-3 h-3" /> },
                        { id: "spa", label: "Spa", icon: <Bath className="w-3 h-3" /> },
                      ].map(opt => {
                        const active = tourismProfile.amenities?.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              if (!isEditing) return;
                              const current = tourismProfile.amenities || [];
                              const next = active ? current.filter((a: any) => a !== opt.id) : [...current, opt.id];
                              setTourismProfile({ ...tourismProfile, amenities: next });
                            }}
                            className={`px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${active ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/40 border border-foreground/5 text-foreground/30"
                              } ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Journey Baseline */}
              <div className="bg-white rounded-[50px] p-10 border border-foreground/[0.03] shadow-3xl shadow-foreground/[0.02]">
                <h3 className="text-xl font-black tracking-widest uppercase text-primary/40 mb-10 flex items-center gap-4">
                  <Timer className="w-5 h-5" /> Journey Baseline
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/20 px-2">Duration</label>
                    <select
                      value={tourismProfile.duration_preference}
                      disabled={!isEditing}
                      onChange={e => setTourismProfile({ ...tourismProfile, duration_preference: e.target.value })}
                      className={`w-full px-5 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl text-xs font-bold outline-none ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">Select</option>
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/20 px-2">Fitness</label>
                    <select
                      value={tourismProfile.fitness_level}
                      disabled={!isEditing}
                      onChange={e => setTourismProfile({ ...tourismProfile, fitness_level: e.target.value })}
                      className={`w-full px-5 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl text-xs font-bold outline-none ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">Select</option>
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/20 px-2">Group</label>
                    <select
                      value={tourismProfile.group_type}
                      disabled={!isEditing}
                      onChange={e => setTourismProfile({ ...tourismProfile, group_type: e.target.value })}
                      className={`w-full px-5 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl text-xs font-bold outline-none ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">Select</option>
                      <option value="solo">Solo</option>
                      <option value="couple">Couple</option>
                      <option value="family">Family</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
