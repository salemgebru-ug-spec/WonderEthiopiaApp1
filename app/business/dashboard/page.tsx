"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Building2, Plus, Edit2, Trash2, Bed, Compass, Calendar, Car, 
  MapPin, Phone, Mail, FileText, CheckCircle2, TrendingUp, Users,
  Save, X, Camera, Globe, Box, MoreVertical, Loader2, ArrowRight, ShieldCheck, ChevronLeft
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BusinessDashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "services">("profile");
  
  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  
  const [profileForm, setProfileForm] = useState<any>({
    name: "", description: "", location: { city: "", region: "", address: "" }, 
    contactPhone: "", contactEmail: "", profilePicture: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [filterSvcCategory, setFilterSvcCategory] = useState("all");
  const [expandedSvcId, setExpandedSvcId] = useState<string | null>(null);
  const [activeImageBySvc, setActiveImageBySvc] = useState<Record<string, number>>({});
  const [fullSvcGallery, setFullSvcGallery] = useState<{ serviceId: string, index: number } | null>(null);

  const [serviceForm, setServiceForm] = useState<any>({
    name: "", description: "", category: "room", price: 0, currency: "ETB",
    features: [], availability: { isAvailable: true, quantity: 1 },
    images: [], 
    metadata: {
       // Hotel
       bedType: "King", maxOccupancy: 2, hasAC: true,
       // Tour
       duration: "1 Day", difficulty: "Moderate", includesMeals: true,
       // Car
       carModel: "", transmission: "Auto", fuelType: "Petrol",
       // Event
       venueType: "Indoor", seatingCapacity: 100
    }
  });

  const fetchData = async () => {
    try {
      const [bizRes, svcRes] = await Promise.all([
        fetch("/api/business/profile"),
        fetch("/api/business/services")
      ]);
      const bizData = await bizRes.json();
      const svcData = await svcRes.json();
      
      if (bizData.business) {
        setBusiness(bizData.business);
        setProfileForm(bizData.business);
      }
      if (svcData.services) setServices(svcData.services);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleActive = async () => {
    const nextState = !business.isActive;
    // Optimistic Update
    setBusiness((prev: any) => ({ ...prev, isActive: nextState }));

    try {
      const res = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: business._id, isActive: nextState })
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        // Revert on failure
        setBusiness((prev: any) => ({ ...prev, isActive: !nextState }));
        alert(`Update Failed: ${err.error || 'Server rejected request'}`);
      }
    } catch (e) {
      setBusiness((prev: any) => ({ ...prev, isActive: !nextState }));
      alert("Network Error: Could not reach registry axis.");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        setIsEditingProfile(false);
        fetchData();
        alert("Registry Identity Synchronized Successfully.");
      }
    } catch (e) {
      alert("Synchronization Error: Could not reach central registry.");
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setIsUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const { url } = await res.json();
        setProfileForm({ ...profileForm, profilePicture: url });
      }
    } catch (e) {
      alert("Asset Transfer Failed: Mirroring to cloud infrastructure was unsuccessful.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleServiceAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (serviceForm.images.length + files.length > 10) {
      alert("Institutional Limit: A maximum of 10 visual assets per service is permitted.");
      return;
    }

    setIsUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        
        if (res.ok) {
          const { url } = await res.json();
          setServiceForm((prev: any) => ({
            ...prev,
            images: [...prev.images, url]
          }));
        }
      }
    } catch (e) {
      alert("Asset Portfolio Expansion Failed: Could not synchronize new visuals.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddService = async () => {
    if (!serviceForm.name || !serviceForm.description) {
      alert("Institutional Data Error: Unified Service Identity (Name & Description) is mandatory.");
      return;
    }
    if (serviceForm.images.length === 0) {
      alert("Institutional Mandate: At least one visual asset (image) is required to list a service.");
      return;
    }
    try {
      const res = await fetch("/api/business/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceForm)
      });
      if (res.ok) {
        setIsAddingService(false);
        setServiceForm({ 
          name: "", description: "", category: "room", price: 0, currency: "ETB", 
          features: [], availability: { isAvailable: true, quantity: 1 },
          images: [],
          metadata: { 
            bedType: "King", maxOccupancy: 2, hasAC: true,
            duration: "1 Day", difficulty: "Moderate", includesMeals: true,
            carModel: "", transmission: "Auto", fuelType: "Petrol",
            venueType: "Indoor", seatingCapacity: 100
          }
        });
        fetchData();
      } else {
        const data = await res.json();
        alert(`Registry Transaction Denied: ${data.error || "Internal Cluster Exception"}`);
      }
    } catch (e: any) {
      alert(`Network Transfer Interrupted: ${e.message}`);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to de-list this service?")) return;
    try {
      const res = await fetch(`/api/business/services/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {}
  };

  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="w-12 h-12 text-primary/20 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">Authorizing Partner Credentials...</span>
     </div>
  );

  if (!business) return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Building2 className="w-16 h-16 text-primary/20 mb-10" />
        <h1 className="text-4xl font-bold mb-4 tracking-tighter">Identity Not Verified</h1>
        <p className="text-foreground/40 max-w-sm mb-12 font-medium italic">Your business registry is pending activation by our institutional office.</p>
        <Link href="/" className="px-12 py-5 bg-foreground text-background text-[11px] font-black rounded-full hover:bg-primary transition-all shadow-2xl shadow-foreground/10">Return to Hub</Link>
     </div>
  );

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 lg:py-20 animate-fade-in relative">
      {/* Dynamic Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-[140px] -mr-40 -mt-40 pointer-events-none" />
      
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-12 mb-20 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-[28px] bg-primary/10 flex items-center justify-center text-primary shadow-inner overflow-hidden">
               {business.profilePicture ? (
                 <img src={business.profilePicture} alt={business.name} className="w-full h-full object-cover" />
               ) : (
                 <Building2 className="w-8 h-8" />
               )}
            </div>
            <div>
               <div className="flex items-center gap-2 mb-1 px-3 py-1 bg-primary/5 rounded-full border border-primary/10 w-fit">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">Verified Partner Registry</span>
               </div>
               <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground leading-[0.9]">
                  {business.name}
               </h1>
            </div>
          </div>
          <p className="text-lg text-foreground/40 font-medium italic leading-relaxed max-w-2xl border-l-[3px] border-primary/10 pl-8 ml-2">
             "{business.description}"
          </p>
        </div>

        <div className="flex flex-col gap-8">
           <div className="flex gap-4 items-center">
              <button 
                onClick={handleToggleActive}
                className={`flex items-center gap-4 px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl ${business.isActive ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}
              >
                 <div className={`w-2 h-2 rounded-full animate-pulse ${business.isActive ? 'bg-white' : 'bg-white/40'}`} />
                 {business.isActive ? "Online" : "Offline"}
              </button>

              <button 
                onClick={() => {
                  const defaultCat = 
                    business?.category === "tour_operator" ? "tour" :
                    business?.category === "car_rental" ? "car" :
                    business?.category === "hotel" ? "room" : 
                    business?.category === "restaurant" ? "dining" : "other";

                  setServiceForm({
                    name: "", description: "", category: defaultCat, price: 0, currency: "Birr",
                    features: [], availability: { isAvailable: true, quantity: 1 },
                    images: [],
                    metadata: { bedType: "King", maxOccupancy: 2, duration: "1 Day", carModel: "" }
                  });
                  setIsAddingCustomCategory(false);
                  setIsAddingService(true);
                }}
                className="flex items-center gap-4 px-10 py-5 bg-primary text-white rounded-2xl border border-primary/10 text-[11px] font-black hover:bg-primary-hover transition-all shadow-2xl shadow-primary/20"
              >
                 <Plus className="w-4 h-4" /> Expand Inventory
              </button>

              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center gap-4 px-8 py-5 bg-white border border-foreground/[0.05] rounded-2xl text-[11px] font-black text-foreground hover:bg-foreground hover:text-white transition-all shadow-xl shadow-foreground/5 ml-auto"
                >
                   <Edit2 className="w-4 h-4" /> Edit Registry
                </button>
              )}
           </div>
           
           <div className="flex items-center gap-3 px-6 py-2 bg-foreground/5 rounded-full border border-foreground/5 w-fit">
              <div className={`w-1.5 h-1.5 rounded-full ${business.status === 'approved' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 italic">
                 Institutional Status: {business.status}
              </span>
           </div>
        </div>
      </div>

      {/* Tabs / Navigation */}
      <div className="flex items-center gap-4 mb-16 px-2">
         {[
           { id: "profile", label: "Registry Identity", icon: <FileText className="w-4 h-4" /> },
           { id: "services", label: "Service Inventory", icon: <Box className="w-4 h-4" /> },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`px-10 py-5 rounded-[28px] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 transition-all duration-300 ${activeTab === tab.id ? 'bg-foreground text-background shadow-2xl shadow-foreground/20 translate-y-[-4px]' : 'text-foreground/30 hover:text-primary hover:bg-primary/5'}`}
           >
             {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      {activeTab === "profile" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
           <div className="lg:col-span-12">
              <section className={`bg-white rounded-[60px] p-10 md:p-14 border transition-all duration-500 ${isEditingProfile ? 'border-primary/20 shadow-3xl shadow-primary/5' : 'border-foreground/[0.03] shadow-3xl shadow-foreground/[0.02]'}`}>
                 <div className="flex items-center justify-between mb-16">
                    <h3 className="text-3xl font-bold tracking-tight flex items-center gap-4">
                       <MapPin className="w-7 h-7 text-primary/40" /> Location & Contact Axis
                    </h3>
                    {isEditingProfile && (
                      <div className="flex gap-4">
                         <button onClick={() => setIsEditingProfile(false)} className="px-6 py-3 text-[10px] font-black text-foreground/40 hover:text-red-500 uppercase">Discard</button>
                         <button onClick={handleUpdateProfile} className="px-10 py-3 bg-primary text-white text-[10px] font-black rounded-xl shadow-lg">Save Changes</button>
                      </div>
                    )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black tracking-widest uppercase text-foreground/20 px-4">Entity Identity</label>
                       <input 
                         disabled={!isEditingProfile}
                         value={profileForm.name || ""}
                         onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                         className="w-full px-10 py-6 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[32px] text-lg font-bold outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                       />
                    </div>
                    <div className="space-y-3 md:row-span-2">
                       <label className="text-[10px] font-black tracking-widest uppercase text-foreground/20 px-4">Registry Description</label>
                       <textarea 
                         disabled={!isEditingProfile}
                         value={profileForm.description || ""}
                         onChange={e => setProfileForm({...profileForm, description: e.target.value})}
                         rows={6}
                         className="w-full px-10 py-6 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[40px] text-base font-bold outline-none focus:ring-4 focus:ring-primary/5 resize-none disabled:opacity-50"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black tracking-widest uppercase text-foreground/20 px-4">Region</label>
                          <input 
                            disabled={!isEditingProfile}
                            value={profileForm.location?.region || ""}
                            onChange={e => setProfileForm({...profileForm, location: {...profileForm.location, region: e.target.value}})}
                            className="w-full px-10 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black tracking-widest uppercase text-foreground/20 px-4">City / Axis</label>
                          <input 
                            disabled={!isEditingProfile}
                            value={profileForm.location?.city || ""}
                            onChange={e => setProfileForm({...profileForm, location: {...profileForm.location, city: e.target.value}})}
                            className="w-full px-10 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                          />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black tracking-widest uppercase text-foreground/20 px-4">Contact Phone</label>
                       <input 
                         disabled={!isEditingProfile}
                         value={profileForm.contactPhone || ""}
                         onChange={e => setProfileForm({...profileForm, contactPhone: e.target.value})}
                         className="w-full px-10 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black tracking-widest uppercase text-foreground/20 px-4">Contact Gateway (Email)</label>
                       <input 
                         disabled={!isEditingProfile}
                         value={profileForm.contactEmail || ""}
                         onChange={e => setProfileForm({...profileForm, contactEmail: e.target.value})}
                         className="w-full px-10 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                       />
                    </div>
                     <div className="space-y-3">
                       <label className="text-[10px] font-black tracking-widest uppercase text-foreground/20 px-4">Brand Asset (Profile Picture)</label>
                       <div className="flex gap-4">
                          <div className="flex-1 flex flex-col gap-4">
                             {isEditingProfile && (
                               <div className="flex items-center gap-4">
                                  <input 
                                    type="file" 
                                    id="profile-upload" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleProfileImageUpload}
                                  />
                                  <label 
                                    htmlFor="profile-upload" 
                                    className="px-8 py-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer hover:bg-primary transition-all flex items-center gap-3 shadow-xl whitespace-nowrap"
                                  >
                                     {isUploading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Camera className="w-3 h-3"/>}
                                     {isUploading ? "Upload Brand Asset" : "Sync Local Image"}
                                  </label>
                                  <span className="text-[9px] font-bold text-foreground/20 italic">Maximum recommended: 2MB</span>
                               </div>
                             )}
                          </div>
                          {(profileForm.profilePicture || business.profilePicture) && (
                             <div className="w-28 h-28 rounded-3xl overflow-hidden border border-foreground/10 bg-white p-2 shadow-2xl relative group">
                                <img src={profileForm.profilePicture || business.profilePicture} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                {isUploading && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                     <Loader2 className="w-6 h-6 text-white animate-spin" />
                                  </div>
                                )}
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              </section>
           </div>
        </div>
      ) : (
         <div className="space-y-12">
            {/* Inventory Navigation & Filtration */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-surface p-8 rounded-[40px] border border-foreground/[0.03] shadow-xl shadow-foreground/[0.02]">
               <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => setFilterSvcCategory("all")}
                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterSvcCategory === "all" ? 'bg-primary text-white shadow-lg' : 'bg-foreground/5 text-foreground/30 hover:bg-foreground/10'}`}
                  >
                    Entire Fleet
                  </button>
                  {Array.from(new Set(services.map(s => s.category))).map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setFilterSvcCategory(cat)}
                      className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterSvcCategory === cat ? 'bg-primary text-white shadow-lg' : 'bg-foreground/5 text-foreground/30 hover:bg-foreground/10'}`}
                    >
                      {cat.replace(/_/g, " ")}
                    </button>
                  ))}
               </div>
               
               <div className="flex items-center gap-4 px-6 py-2 bg-primary/5 rounded-full border border-primary/10">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">{services.length} Registered Units</span>
               </div>
            </div>

            {/* Inventory List Implementation */}
            <div className="grid grid-cols-1 gap-8">
               {services.length === 0 ? (
                 <div className="py-40 rounded-[60px] border-4 border-dashed border-foreground/5 bg-surface-elevated/20 text-center animate-pulse">
                    <Plus className="w-16 h-16 text-foreground/5 mx-auto mb-10" />
                    <h3 className="text-3xl font-bold text-foreground/20 tracking-tighter">Your inventory is empty</h3>
                    <p className="text-foreground/10 text-sm font-black uppercase tracking-widest">Initialization required</p>
                 </div>
               ) : (
                  (filterSvcCategory === "all" ? services : services.filter(s => s.category === filterSvcCategory)).map((svc) => (
                    <div 
                      key={svc._id} 
                      className={`group relative bg-white rounded-[50px] border border-foreground/[0.03] overflow-hidden transition-all duration-500 hover:shadow-3xl hover:shadow-primary/5 ${expandedSvcId === svc._id ? 'ring-2 ring-primary/20 shadow-2xl scale-[1.01] z-10' : ''}`}
                    >
                      <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
                        {/* Service Thumbnail */}
                        <div className="relative w-full md:w-48 h-48 rounded-[40px] overflow-hidden shadow-xl border border-foreground/5 flex-shrink-0 cursor-pointer group/img"
                             onClick={() => setFullSvcGallery({ serviceId: svc._id, index: activeImageBySvc[svc._id] || 0 })}
                        >
                           <img 
                             src={svc.images[activeImageBySvc[svc._id] || 0] || "/lalibela.png"} 
                             alt={svc.name} 
                             className="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-110" 
                           />
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <Globe className="w-6 h-6 text-white animate-pulse" />
                           </div>
                           <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-foreground/60">
                              {svc.category}
                           </div>
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 space-y-4 text-center md:text-left">
                           <h3 className="text-2xl font-bold tracking-tight">{svc.name}</h3>
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                              <div className="flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-2xl text-xs font-bold text-foreground/50 uppercase tracking-widest">
                                 {svc.currency} {svc.price.toLocaleString()}
                              </div>
                              <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-2xl text-[9px] font-black text-primary uppercase tracking-widest border border-primary/10">
                                 Unit Active
                              </div>
                           </div>
                        </div>

                        {/* Dashboard Actions */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                           <button 
                             onClick={() => setExpandedSvcId(expandedSvcId === svc._id ? null : svc._id)}
                             className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${expandedSvcId === svc._id ? 'bg-primary text-white shadow-xl' : 'bg-foreground/5 text-foreground/40 hover:bg-foreground hover:text-white'}`}
                           >
                              {expandedSvcId === svc._id ? "Hide Intelligence" : "Expose Metrics"}
                           </button>
                           <button 
                             onClick={() => handleDeleteService(svc._id)}
                             className="p-4 bg-red-500/5 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>

                      {/* Expandable Content Layer */}
                      <div className={`overflow-hidden transition-all duration-700 ease-in-out ${expandedSvcId === svc._id ? 'max-h-[1500px] border-t border-foreground/[0.03] bg-primary/[0.01]' : 'max-h-0'}`}>
                         <div className="p-10 md:p-20 space-y-16 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                               <div className="space-y-8">
                                  <div>
                                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-4 ml-1">Asset Description</h4>
                                     <p className="text-lg text-foreground/60 leading-relaxed font-medium">{svc.description}</p>
                                  </div>
                                  
                                  <div className="pt-8 border-t border-foreground/5 grid grid-cols-2 gap-8">
                                     {Object.entries(svc.metadata || {}).map(([key, val]: [string, any]) => (
                                        <div key={key}>
                                           <div className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-1">{key.replace(/([A-Z])/g, ' $1')}</div>
                                           <div className="font-bold text-foreground/80">{val.toString()}</div>
                                        </div>
                                     ))}
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-6">
                                  {svc.images.map((img, idx) => (
                                     <div 
                                       key={idx} 
                                       onClick={() => setActiveImageBySvc(prev => ({...prev, [svc._id]: idx}))}
                                       className={`relative aspect-square rounded-[32px] overflow-hidden border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${activeImageBySvc[svc._id] === idx ? 'border-primary ring-4 ring-primary/10' : 'border-foreground/5'}`}
                                     >
                                        <img src={img} alt="Detail" className="w-full h-full object-cover" />
                                        {activeImageBySvc[svc._id] === idx && (
                                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                             <ShieldCheck className="w-6 h-6 text-white" />
                                          </div>
                                        )}
                                     </div>
                                  ))}
                               </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row items-center gap-6 pt-10 border-t border-foreground/5">
                               <div className="flex-1 p-8 rounded-[40px] bg-white border border-foreground/5 shadow-xl">
                                  <div className="text-[10px] font-black uppercase text-foreground/20 tracking-widest mb-4">Registry Logistics</div>
                                  <div className="flex items-center gap-12 font-bold text-sm">
                                     <span>Quantity: {svc.availability?.quantity || 1}</span>
                                     <span>Currency: {svc.currency}</span>
                                     <span className="text-primary italic">Status: Validated</span>
                                  </div>
                               </div>
                               <button 
                                 className="w-full md:w-auto px-16 py-6 bg-foreground text-background text-sm font-black rounded-3xl hover:bg-primary transition-all shadow-xl shadow-black/10"
                                 onClick={() => {
                                    setServiceForm(svc);
                                    setIsAddingService(true);
                                 }}
                               >
                                  Update Service Artifact
                               </button>
                            </div>
                         </div>
                      </div>
                    </div>
                  ))
               )}
            </div>
         </div>
      )}

      {/* Service Modal Overlay */}
      {isAddingService && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fade-in" onClick={() => { setIsAddingService(false); setIsAddingCustomCategory(false); }} />
           <div className="relative w-full max-w-4xl bg-white rounded-[60px] shadow-3xl p-10 md:p-20 overflow-y-auto max-h-[90vh] custom-scrollbar animate-slide-up">
              <div className="flex items-center justify-between mb-16">
                 <h2 className="text-4xl font-bold tracking-tighter">Expand Inventory</h2>
                 <button onClick={() => { setIsAddingService(false); setIsAddingCustomCategory(false); }} className="p-4 bg-foreground/5 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X className="w-6 h-6" /></button>
              </div>

              <div className="grid gap-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-4">Service Category</label>
                       <select 
                         value={serviceForm.category || "other"}
                         onChange={e => {
                            if (e.target.value === "custom") {
                               setIsAddingCustomCategory(true);
                               setServiceForm({...serviceForm, category: ""});
                            } else {
                               setIsAddingCustomCategory(false);
                               setServiceForm({...serviceForm, category: e.target.value});
                            }
                         }}
                         className="w-full px-8 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none ring-primary/5 focus:ring-4 transition-all"
                       >
                          {(() => {
                             const map: any = {
                               hotel: [
                                 { value: "room", label: "Guest Room / Suite" },
                                 { value: "dining", label: "In-House Dining" },
                                 { value: "other", label: "Hotel Amenities" }
                               ],
                               tour_operator: [
                                 { value: "tour", label: "Curated Expedition / Tour" },
                                 { value: "event", label: "Special Group Event" }
                               ],
                               car_rental: [
                                 { value: "car", label: "Vehicle / Fleet Rental" }
                               ],
                               event_organizer: [
                                 { value: "event", label: "Banquet / Gala Venue" },
                                 { value: "dining", label: "Catering Services" }
                               ],
                               restaurant: [
                                 { value: "dining", label: "Fixed Menu / Dish" },
                                 { value: "event", label: "Private Dining Event" }
                               ]
                             };
                             const options = map[business?.category] || [
                               { value: "room", label: "General Room" },
                               { value: "tour", label: "General Tour" },
                               { value: "event", label: "General Event" },
                               { value: "car", label: "General Vehicle" },
                               { value: "dining", label: "General Dining" },
                               { value: "other", label: "Other Offering" }
                             ];
                             return [
                                ...options,
                                { value: "custom", label: "+ Add New Industry Category" }
                             ].map((opt:any) => (
                               <option key={opt.value} value={opt.value}>{opt.label}</option>
                             ));
                          })()}
                       </select>
                       {isAddingCustomCategory && (
                          <input 
                             value={serviceForm.category || ""}
                             onChange={e => setServiceForm({...serviceForm, category: e.target.value})}
                             placeholder="Type Custom Category Name..."
                             className="w-full mt-4 px-8 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none ring-primary/5 focus:ring-4 transition-all animate-fade-in"
                          />
                       )}
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-4">Official Name</label>
                       <input 
                         value={serviceForm.name || ""}
                         onChange={e => setServiceForm({...serviceForm, name: e.target.value})}
                         placeholder={
                            serviceForm.category === "room" ? "e.g. Presidential Suite" :
                            serviceForm.category === "tour" ? "e.g. Bale Mountain Expedition" :
                            serviceForm.category === "car" ? "e.g. Platinum Fleet 4x4" :
                            "e.g. Signature Event / Service"
                         }
                         className="w-full px-8 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none ring-primary/5 focus:ring-4 transition-all"
                       />
                    </div>

                    {/* Domain Specific Questions */}
                    <div className="md:col-span-2 p-10 bg-primary/[0.02] border border-primary/10 rounded-[40px] space-y-8">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          <h4 className="text-sm font-black uppercase tracking-widest text-primary">Domain Intelligence</h4>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {serviceForm.category === "room" && (
                            <>
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black tracking-widest text-foreground/40">Bed Architecture</label>
                                  <select 
                                    value={serviceForm.metadata?.bedType || "King"}
                                    onChange={e => setServiceForm({...serviceForm, metadata: {...serviceForm.metadata, bedType: e.target.value}})}
                                    className="w-full bg-white px-6 py-4 rounded-2xl border border-foreground/5 font-bold"
                                  >
                                     <option value="King">King Size</option>
                                     <option value="Queen">Queen Size</option>
                                     <option value="Twin">Twin / Double</option>
                                  </select>
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black tracking-widest text-foreground/40">Max Capacity</label>
                                  <input 
                                    type="number"
                                    value={serviceForm.metadata?.maxOccupancy || 0}
                                    onChange={e => setServiceForm({...serviceForm, metadata: {...serviceForm.metadata, maxOccupancy: e.target.value}})}
                                    className="w-full bg-white px-6 py-4 rounded-2xl border border-foreground/5 font-bold"
                                  />
                               </div>
                            </>
                          )}

                          {serviceForm.category === "tour" && (
                            <>
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black tracking-widest text-foreground/40">Expedition Duration</label>
                                  <input 
                                    value={serviceForm.metadata?.duration || ""}
                                    onChange={e => setServiceForm({...serviceForm, metadata: {...serviceForm.metadata, duration: e.target.value}})}
                                    placeholder="e.g. 3 Days / 2 Nights"
                                    className="w-full bg-white px-6 py-4 rounded-2xl border border-foreground/5 font-bold"
                                  />
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black tracking-widest text-foreground/40">Challenge Level</label>
                                  <select 
                                    value={serviceForm.metadata?.difficulty || "Moderate"}
                                    onChange={e => setServiceForm({...serviceForm, metadata: {...serviceForm.metadata, difficulty: e.target.value}})}
                                    className="w-full bg-white px-6 py-4 rounded-2xl border border-foreground/5 font-bold"
                                  >
                                     <option value="Easy">Easy / Leisure</option>
                                     <option value="Moderate">Moderate / Moderate</option>
                                     <option value="Hard">Elite / Hard</option>
                                  </select>
                               </div>
                            </>
                          )}

                          {serviceForm.category === "car" && (
                            <>
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black tracking-widest text-foreground/40">Vehicle Model</label>
                                  <input 
                                    value={serviceForm.metadata?.carModel || ""}
                                    onChange={e => setServiceForm({...serviceForm, metadata: {...serviceForm.metadata, carModel: e.target.value}})}
                                    placeholder="Toyota Land Cruiser..."
                                    className="w-full bg-white px-6 py-4 rounded-2xl border border-foreground/5 font-bold"
                                  />
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black tracking-widest text-foreground/40">Transmission</label>
                                  <select 
                                    value={serviceForm.metadata?.transmission || "Auto"}
                                    onChange={e => setServiceForm({...serviceForm, metadata: {...serviceForm.metadata, transmission: e.target.value}})}
                                    className="w-full bg-white px-6 py-4 rounded-2xl border border-foreground/5 font-bold"
                                  >
                                     <option value="Auto">Automatic</option>
                                     <option value="Manual">Manual Stick</option>
                                  </select>
                               </div>
                            </>
                          )}
                       </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-4">Detailed Description</label>
                       <textarea 
                         value={serviceForm.description || ""}
                         onChange={e => setServiceForm({...serviceForm, description: e.target.value})}
                         rows={4}
                         className="w-full px-8 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[32px] font-bold outline-none resize-none"
                       />
                    </div>
                    
                    {/* Media Assets */}
                    <div className="md:col-span-2 space-y-4">
                       <div className="flex items-center justify-between px-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Institutional Portfolio (Up to 10 Images)</label>
                          <span className="text-[9px] font-black text-primary uppercase">{serviceForm.images.length}/10 Assets</span>
                       </div>
                       
                       <div className="flex items-center gap-6">
                          <input 
                            type="file" 
                            id="service-assets" 
                            multiple 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleServiceAssetUpload} 
                          />
                          <label 
                            htmlFor="service-assets" 
                            className={`px-10 py-5 bg-foreground text-background rounded-3xl text-[10px] font-bold uppercase transition-all flex items-center gap-4 cursor-pointer hover:bg-primary ${serviceForm.images.length >= 10 ? "opacity-30 cursor-not-allowed pointer-events-none" : "shadow-xl shadow-black/10"}`}
                          >
                             {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera className="w-4 h-4"/>}
                             {isUploading ? "Uploading visual assets..." : "Sync Portfolio Images"}
                          </label>
                          <p className="text-[9px] font-bold text-foreground/20 italic max-w-[200px]">
                             Select professional JPG/PNG images to represent this service.
                          </p>
                       </div>

                          <div className="flex flex-wrap gap-6 mt-10 p-8 border-2 border-dashed border-foreground/5 rounded-[40px] bg-foreground/[0.01]">
                             {serviceForm.images.length === 0 ? (
                                <div className="w-full text-center py-20 animate-pulse">
                                   <Plus className="w-10 h-10 text-foreground/5 mx-auto mb-6" />
                                   <p className="text-[10px] font-black text-foreground/10 uppercase tracking-widest">No assets synchronized</p>
                                </div>
                             ) : (
                                serviceForm.images.map((img: string, i: number) => (
                                  <div key={i} className="relative group w-32 h-32 rounded-3xl overflow-hidden border border-foreground/5 shadow-inner">
                                     <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Service" />
                                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                        <button 
                                          type="button" 
                                          onClick={() => setServiceForm({...serviceForm, images: serviceForm.images.filter((_:any, idx:number) => idx !== i)})}
                                          className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center hover:bg-red-600 transition-all shadow-xl"
                                        >
                                           <Trash2 className="w-5 h-5" />
                                        </button>
                                     </div>
                                     <div className="absolute top-3 left-3 w-6 h-6 rounded-lg glass text-[9px] font-black flex items-center justify-center text-white">
                                        {i + 1}
                                     </div>
                                  </div>
                                ))
                             )}
                          </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-4">Commercial Value</label>
                       <div className="relative">
                          <input 
                            type="number"
                            value={serviceForm.price || 0}
                            onChange={e => setServiceForm({...serviceForm, price: parseFloat(e.target.value)})}
                            className="w-full px-8 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none"
                          />
                          <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary uppercase">Birr</span>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-4">Available Strategic Units</label>
                       <input 
                         type="number"
                         value={serviceForm.availability?.quantity || 0}
                         onChange={e => setServiceForm({...serviceForm, availability: {...serviceForm.availability, quantity: parseInt(e.target.value)}})}
                         className="w-full px-8 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none"
                       />
                    </div>
                 </div>
                 
                 <div className="pt-10 border-t border-foreground/[0.03]">
                    <button 
                      onClick={handleAddService}
                      className="w-full py-6 bg-primary text-white text-base font-black rounded-3xl hover:bg-primary-hover shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] animate-fade-in"
                    >
                       Add Service to Registry
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
      {/* Full Screen Image Modal */}
      {fullSvcGallery && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-fade-in p-6 md:p-20">
           <button 
             onClick={() => setFullSvcGallery(null)}
             className="absolute top-10 right-10 w-16 h-16 rounded-full glass flex items-center justify-center text-foreground hover:bg-white hover:text-black transition-all z-[110]"
           >
              <ShieldCheck className="w-8 h-8 rotate-45" /> {/* Use as X */}
           </button>

           <div className="relative w-full h-full flex items-center justify-center">
              {/* Previous Button */}
              {fullSvcGallery.index > 0 && (
                <button 
                  onClick={() => setFullSvcGallery(prev => prev ? ({ ...prev, index: prev.index - 1 }) : null)}
                  className="absolute left-0 md:-left-24 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full glass flex items-center justify-center hover:bg-white hover:text-black transition-all z-20"
                >
                   <ChevronLeft className="w-8 h-8" />
                </button>
              )}

              <div className="relative w-full h-full rounded-[60px] overflow-hidden shadow-3xl shadow-white/5 border border-white/10">
                 <img 
                    src={services.find(s => s._id === fullSvcGallery.serviceId)?.images[fullSvcGallery.index] || ""} 
                    alt="Immersion"
                    className="w-full h-full object-contain"
                 />
              </div>

              {/* Next Button */}
              {(fullSvcGallery.index < (services.find(s => s._id === fullSvcGallery.serviceId)?.images.length || 0) - 1) && (
                <button 
                  onClick={() => setFullSvcGallery(prev => prev ? ({ ...prev, index: prev.index + 1 }) : null)}
                  className="absolute right-0 md:-right-24 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full glass flex items-center justify-center hover:bg-white hover:text-black transition-all z-20"
                >
                   <ChevronLeft className="w-8 h-8 rotate-180" />
                </button>
              )}

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 glass rounded-full text-xs font-black tracking-[0.2em] uppercase text-foreground">
                 Archive Asset {fullSvcGallery.index + 1} / {services.find(s => s._id === fullSvcGallery.serviceId)?.images.length}
              </div>
           </div>
        </div>
      )}
    </main>
  );
}
