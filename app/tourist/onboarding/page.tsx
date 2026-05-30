"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ChevronRight, ChevronLeft, Check, Loader2, 
  Sparkles, Mountain, Waves, Compass, 
  History, Utensils, Music, MapPin,
  Hotel, Home, Users, Wifi, Bath, 
  Calendar, Timer, Dumbbell, UserCheck, Heart
} from "lucide-react";
import { toast } from "react-toastify";

import { showToast } from "@/lib/toast";

const steps = [
  { id: "activities", title: "Adventure", icon: <Mountain className="w-5 h-5" /> },
  { id: "style", title: "Style", icon: <Compass className="w-5 h-5" /> },
  { id: "cultural", title: "Cultural", icon: <History className="w-5 h-5" /> },
  { id: "accommodation", title: "Stays", icon: <Hotel className="w-5 h-5" /> },
  { id: "constraints", title: "Comfort", icon: <Timer className="w-5 h-5" /> },
];

const activityOptions = [
  { id: "hiking", label: "Hiking & Trekking", icon: <Mountain className="w-5 h-5" /> },
  { id: "safari", label: "Wildlife Safari", icon: <Compass className="w-5 h-5" /> },
  { id: "water_activities", label: "Water Activities", icon: <Waves className="w-5 h-5" /> },
];

const styleOptions = [
  { id: "luxury", label: "Luxury", desc: "Top-tier comfort" },
  { id: "budget", label: "Budget", desc: "Value focused" },
  { id: "backpacking", label: "Backpacking", desc: "Authentic & raw" },
  { id: "eco_friendly", label: "Eco-friendly", desc: "Sustainability first" },
];

const interestOptions = [
  { id: "history", label: "Historical Sites", icon: <History className="w-5 h-5" /> },
  { id: "culture", label: "Local Traditions", icon: <Users className="w-5 h-5" /> },
  { id: "festivals", label: "Festivals", icon: <Music className="w-5 h-5" /> },
  { id: "food", label: "Food Experiences", icon: <Utensils className="w-5 h-5" /> },
];

const accommodationOptions = [
  { id: "hotel", label: "Hotel" },
  { id: "lodge", label: "Lodge" },
  { id: "hostel", label: "Hostel" },
];

const amenityOptions = [
  { id: "wifi", label: "WiFi", icon: <Wifi className="w-4 h-4" /> },
  { id: "pool", label: "Pool", icon: <Waves className="w-4 h-4" /> },
  { id: "spa", label: "Spa", icon: <Bath className="w-4 h-4" /> },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    activity_preferences: [] as string[],
    travel_style: "",
    interests: [] as string[],
    accommodation_type: "",
    room_type: "",
    amenities: [] as string[],
    duration_preference: "",
    fitness_level: "",
    group_type: "",
  });

  // Role guard: Only tourists should see this page
  useEffect(() => {
    if (authStatus === "authenticated") {
      if (session?.user?.role !== "tourist") {
        router.push("/dashboard");
      }
    } else if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [session, authStatus, router]);
  
  // Loading state for auth check
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (authStatus === "unauthenticated" || session?.user?.role !== "tourist") {
    return null;
  }


  const toggleMulti = (field: "activity_preferences" | "interests" | "amenities", id: string) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(id)) {
        return { ...prev, [field]: current.filter(a => a !== id) };
      } else {
        return { ...prev, [field]: [...current, id] };
      }
    });
  };

  const setSingle = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    switch(currentStep) {
      case 0: return formData.activity_preferences.length > 0;
      case 1: return !!formData.travel_style;
      case 2: return formData.interests.length > 0;
      case 3: return !!formData.accommodation_type && !!formData.room_type;
      case 4: return !!formData.duration_preference && !!formData.fitness_level && !!formData.group_type;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (!validateStep()) {
      showToast("Notice", "Please complete your profile pointers.", "warn");
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tourist/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showToast("Success", "Intelligence profile synchronized.", "success");
        window.location.href = "/dashboard";
      }
    } catch {
      showToast("System Error", "Synchronization interrupted.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tourist/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        showToast("Intelligence", "Profile setup skipped. You can update it later.", "info");
        window.location.href = "/dashboard";
      }
    } catch {
      showToast("System Error", "An error occurred while skipping.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 overflow-hidden mesh-gradient-rich">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[120px] -mr-20 -mt-20 pointer-events-none" />
      
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12 lg:py-20 min-h-screen flex flex-col items-center">
        
        {/* Step Progress */}
        <div className="flex gap-2 mb-12 w-full max-w-[200px]">
          {steps.map((s, idx) => (
            <div key={s.id} className={`h-1 flex-1 rounded-full transition-all duration-700 ${idx <= currentStep ? "bg-primary" : "bg-foreground/5"}`} />
          ))}
        </div>

        <div className="w-full">
          
          {/* Step 1: Adventure & Activity */}
          {currentStep === 0 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center">
                <div className="text-primary font-black text-xs tracking-[0.4em] mb-4 uppercase">Protocol 01</div>
                <h1 className="text-4xl font-black tracking-tightest uppercase text-foreground mb-4">Adventure <span className="text-primary italic">& Activity.</span></h1>
                <p className="text-foreground/40 text-sm font-medium italic">Define your expedition signals</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {activityOptions.map(opt => (
                  <button key={opt.id} onClick={() => toggleMulti('activity_preferences', opt.id)}
                    className={`p-6 rounded-3xl border transition-all flex items-center justify-between ${formData.activity_preferences.includes(opt.id) ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white/40 border-foreground/5 hover:border-primary/20"}`}>
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${formData.activity_preferences.includes(opt.id) ? "bg-white text-primary" : "bg-primary/5 text-primary"}`}>
                        {opt.icon}
                      </div>
                      <span className="text-lg font-black tracking-tight">{opt.label}</span>
                    </div>
                    {formData.activity_preferences.includes(opt.id) && <Check className="w-6 h-6" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Travel Style */}
          {currentStep === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center">
                <div className="text-primary font-black text-xs tracking-[0.4em] mb-4 uppercase">Protocol 02</div>
                <h1 className="text-4xl font-black tracking-tightest uppercase text-foreground mb-4">Travel <span className="text-primary italic">Style.</span></h1>
                <p className="text-foreground/40 text-sm font-medium italic">Your primary exploration baseline</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {styleOptions.map(opt => (
                  <button key={opt.id} onClick={() => setSingle('travel_style', opt.id)}
                    className={`p-8 rounded-[40px] border transition-all text-left ${formData.travel_style === opt.id ? "bg-foreground text-background border-foreground shadow-xl" : "bg-white/40 border-foreground/5 hover:border-primary/20"}`}>
                    <h3 className="text-xl font-black tracking-tight mb-2">{opt.label}</h3>
                    <p className={`text-sm font-medium italic ${formData.travel_style === opt.id ? "opacity-40" : "text-foreground/30"}`}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Cultural Interest */}
          {currentStep === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center">
                <h1 className="text-4xl font-black tracking-tightest uppercase text-foreground mb-4">Cultural <span className="text-primary italic">Interests.</span></h1>
                <p className="text-foreground/40 text-sm font-medium italic">Define your intellectual heritage markers</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {interestOptions.map(opt => (
                  <button key={opt.id} onClick={() => toggleMulti('interests', opt.id)}
                    className={`px-8 py-5 rounded-full text-base font-black transition-all flex items-center gap-4 ${formData.interests.includes(opt.id) ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" : "bg-white/40 border-foreground/5 text-foreground/40 hover:text-primary"}`}>
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Accommodation Layer */}
          {currentStep === 3 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center">
                <h1 className="text-4xl font-black tracking-tightest uppercase text-foreground mb-4">Stay <span className="text-primary italic">Configuration.</span></h1>
              </div>
              
              <div className="space-y-6">
                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/20 block text-center">Type Baseline</label>
                <div className="grid grid-cols-3 gap-3">
                  {accommodationOptions.map(opt => (
                    <button key={opt.id} onClick={() => setSingle('accommodation_type', opt.id)}
                      className={`py-4 rounded-2xl text-sm font-black uppercase tracking-widest border transition-all ${formData.accommodation_type === opt.id ? "bg-foreground text-background border-foreground shadow-lg" : "border-foreground/5 hover:border-primary/20"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/20 block text-center">Room Logic</label>
                <div className="flex justify-center gap-4">
                  {["private", "shared"].map(opt => (
                    <button key={opt} onClick={() => setSingle('room_type', opt)}
                      className={`flex-1 max-w-[140px] py-4 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${formData.room_type === opt ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "border-foreground/5 hover:text-primary"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/20 block text-center">Protocol Amenities</label>
                <div className="flex flex-wrap justify-center gap-3">
                  {amenityOptions.map(opt => (
                    <button key={opt.id} onClick={() => toggleMulti('amenities', opt.id)}
                      className={`px-6 py-3 rounded-xl border text-sm font-bold transition-all flex items-center gap-3 ${formData.amenities.includes(opt.id) ? "bg-primary/10 text-primary border-primary shadow-sm" : "border-foreground/5 opacity-40 hover:opacity-100"}`}>
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Trip Constraints & Comfort */}
          {currentStep === 4 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center">
                <h1 className="text-4xl font-black tracking-tightest uppercase text-foreground mb-4">Journey <span className="text-primary italic">Baseline.</span></h1>
                <p className="text-foreground/40 text-sm font-medium italic">Critical recommender signals</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                   <div className="flex items-center gap-2 mb-2">
                     <Timer className="w-4 h-4 text-primary" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Duration</span>
                   </div>
                   <div className="flex flex-col gap-2">
                     {[{id:"short", l:"1–3 Days"}, {id:"medium", l:"1 Week"}, {id:"long", l:"Extended"}].map(opt => (
                       <button key={opt.id} onClick={() => setSingle('duration_preference', opt.id)}
                         className={`px-4 py-3 rounded-xl text-sm font-bold text-left border transition-all ${formData.duration_preference === opt.id ? "bg-primary text-white border-primary" : "border-foreground/5 hover:border-primary/20"}`}>
                         {opt.l}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 mb-2">
                     <Dumbbell className="w-4 h-4 text-primary" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Fitness</span>
                   </div>
                   <div className="flex flex-col gap-2">
                     {["easy", "moderate", "hard"].map(opt => (
                       <button key={opt} onClick={() => setSingle('fitness_level', opt)}
                         className={`px-4 py-3 rounded-xl text-sm font-bold text-left border capitalize transition-all ${formData.fitness_level === opt ? "bg-primary text-white border-primary" : "border-foreground/5 hover:border-primary/20"}`}>
                         {opt}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 mb-2">
                     <UserCheck className="w-4 h-4 text-primary" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Group</span>
                   </div>
                   <div className="flex flex-col gap-2">
                     {["solo", "couple", "family"].map(opt => (
                       <button key={opt} onClick={() => setSingle('group_type', opt)}
                         className={`px-4 py-3 rounded-xl text-sm font-bold text-left border capitalize transition-all ${formData.group_type === opt ? "bg-primary text-white border-primary" : "border-foreground/5 hover:border-primary/20"}`}>
                         {opt}
                       </button>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-16 flex items-center justify-between gap-6 w-full">
            <div className="flex items-center gap-4">
              {currentStep > 0 ? (
                <button onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/20 hover:text-primary transition-colors">
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>
              ) : <div />}
              
              <button onClick={handleSkip} disabled={isSubmitting}
                className="flex items-center gap-2 text-xs font-bold text-foreground/40 hover:text-foreground transition-colors ml-4 underline underline-offset-4 decoration-foreground/20 hover:decoration-foreground">
                Skip for now
              </button>
            </div>
            
            <button onClick={handleNext} disabled={isSubmitting}
              className="px-12 h-14 bg-foreground text-background text-sm font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary hover:text-white transition-all transform active:scale-95 shadow-premium flex items-center justify-center gap-3">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-background" />
              ) : (
                <>
                  {currentStep === steps.length - 1 ? "Synchronize Identity" : "Continue Journey"}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
