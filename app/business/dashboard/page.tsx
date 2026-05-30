"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
  Building2, Plus, Edit2, Trash2, Bed, Compass, Calendar, Car,
  MapPin, Phone, Mail, FileText, CheckCircle2, TrendingUp, Users, User,
  Save, X, Camera, Globe, Box, MoreVertical, Loader2, ArrowRight, ShieldCheck,
  ChevronLeft, Check, Layout, Utensils, Sparkles, Waves, Briefcase, Upload, ChevronDown, Star, Monitor, GlassWater
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { showToast } from "@/lib/toast";

export default function BusinessDashboardPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "services" | "bookings">("profile");

  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
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
  const [showSectorSelection, setShowSectorSelection] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showTourTypeDropdown, setShowTourTypeDropdown] = useState(false);
  const [isRequestingCategory, setIsRequestingCategory] = useState(false);
  const [categoryRequestForm, setCategoryRequestForm] = useState<any>({
    categories: [] as string[],
    reason: "",
    industryDetails: {} as Record<string, string>,
    industryFiles: {} as Record<string, File | null>,
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [isRevokingCategory, setIsRevokingCategory] = useState(false);
  const [revokeForm, setRevokeForm] = useState<{ category: string, reason: string, document: File | null }>({ category: "", reason: "", document: null });
  const [isSubmittingRevoke, setIsSubmittingRevoke] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const defaultTourMetadata = {
    duration: "1 Day", difficulty: "Moderate",
    inclusionMatrix: {
      meals: false,
      transport: false,
      guide: false,
      insurance: false,
      accommodation: false,
      equipment: false
    },
    destinations: "", tourType: "Cultural",
    pricingType: "Per Person", included: "", notIncluded: "",
    startLocation: "", departureDates: "", minGroupSize: 1, maxGroupSize: 10,
    accommodationType: "", roomType: "", accommodationAmenities: "",
    transportType: "", transportCondition: "", internalFlights: "",
    ageLimits: "", fitnessLevel: "Basic", requiredDocuments: "", specialGear: "",
    emergencyContact: "", insuranceRequirements: "", guideQualifications: "",
    cancellationDeadline: "", refundPolicy: "", reschedulingOptions: "",
    uniqueExperiences: "", bonuses: "",
    itinerary: []
  };

  const [serviceForm, setServiceForm] = useState<any>({
    name: "", description: "", category: ["room"], price: 0, currency: "ETB",
    features: [], availability: { isAvailable: true, quantity: 1 },
    images: [],
    metadata: {
      bedType: "King", maxOccupancy: 2, hasAC: true,
      carModel: "", transmission: "Auto", fuelType: "Petrol",
      venueType: "Indoor", seatingCapacity: 100,
      ...defaultTourMetadata
    }
  });

  const handleAddItineraryDay = () => {
    const currentItinerary = serviceForm.metadata?.itinerary || [];
    setServiceForm({
      ...serviceForm,
      metadata: {
        ...serviceForm.metadata,
        itinerary: [
          ...currentItinerary,
          { day: currentItinerary.length + 1, title: "", activities: "", overnightStay: "", timing: "" }
        ]
      }
    });
  };

  const handleUpdateItineraryDay = (index: number, field: string, value: string) => {
    const updated = [...(serviceForm.metadata?.itinerary || [])];
    updated[index] = { ...updated[index], [field]: value };
    setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, itinerary: updated } });
  };

  const handleRemoveItineraryDay = (index: number) => {
    const updated = [...(serviceForm.metadata?.itinerary || [])];
    updated.splice(index, 1);
    updated.forEach((d, i) => d.day = i + 1);
    setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, itinerary: updated } });
  };

  // Dynamic Pricing Synchronization Logic
  useEffect(() => {
    if (!serviceForm.metadata || selectedSector !== "hotel") return;

    let total = 0;
    const m = serviceForm.metadata;

    // Sub-Service Financial Accumulation
    if (m.accommodationPrice) total += parseFloat(m.accommodationPrice) || 0;
    if (m.wellnessPrice) total += parseFloat(m.wellnessPrice) || 0;
    if (m.leisurePrice) total += parseFloat(m.leisurePrice) || 0;
    if (m.transportPrice) total += parseFloat(m.transportPrice) || 0;
    if (m.generalServicePrice) total += parseFloat(m.generalServicePrice) || 0;

    // Culinary Artifact Aggregation
    if (Array.isArray(m.diningArtifacts)) {
      m.diningArtifacts.forEach((v: any) => {
        total += parseFloat(v.price) || 0;
      });
    }

    // Business Intelligence Pricing
    if (m.pricePerHour) total += parseFloat(m.pricePerHour) || 0;

    // Synchronize with Institutional Root
    if (serviceForm.price !== total) {
      setServiceForm(prev => ({ ...prev, price: total }));
    }
  }, [serviceForm.metadata, selectedSector, serviceForm.price]);

  const handleRequestCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryRequestForm.categories.length === 0) {
      alert("Please select at least one protocol expansion domain.");
      return;
    }
    setIsSubmittingRequest(true);
    try {
      const formData = new FormData();
      formData.append("category", categoryRequestForm.categories.join(", "));
      formData.append("reason", categoryRequestForm.reason);
      formData.append("industryDetails", JSON.stringify(categoryRequestForm.industryDetails));

      // Append files with file_ prefix
      Object.entries(categoryRequestForm.industryFiles).forEach(([key, file]) => {
        if (file) formData.append(`file_${key}`, file);
      });

      const res = await fetch("/api/business/category-request", {
        method: "POST",
        body: formData, // Sending FormData instead of JSON
      });
      if (res.ok) {
        setIsRequestingCategory(false);
        setCategoryRequestForm({ categories: [], reason: "", industryDetails: {}, industryFiles: {} });
        alert("Your expansion request with documentation has been submitted.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleRequestCategoryToggle = (val: string) => {
    setCategoryRequestForm((prev: any) => {
      const current = prev.categories || [];
      if (current.includes(val)) {
        return { ...prev, categories: current.filter((c: string) => c !== val) };
      } else {
        return { ...prev, categories: [...current, val] };
      }
    });
  };

  const handleRequestIndustryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCategoryRequestForm({
      ...categoryRequestForm,
      industryDetails: { ...categoryRequestForm.industryDetails, [e.target.name]: e.target.value },
    });
  };

  const handleRequestFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCategoryRequestForm({
        ...categoryRequestForm,
        industryFiles: { ...categoryRequestForm.industryFiles, [e.target.name]: e.target.files[0] },
      });
    }
  };

  const fetchData = async () => {
    if (status !== "authenticated" || session?.user?.role !== "business_owner") return;

    try {
      const [bizRes, svcRes, bookRes] = await Promise.all([
        fetch("/api/business/profile"),
        fetch("/api/business/services"),
        fetch("/api/bookings")
      ]);

      if (!bizRes.ok || !svcRes.ok || !bookRes.ok) {
        console.group("Institutional Sync Failed");
        console.error("Profile Registry:", bizRes.status, bizRes.statusText);
        console.error("Service Inventory:", svcRes.status, svcRes.statusText);
        console.error("Mission Registry:", bookRes.status, bookRes.statusText);
        console.groupEnd();

        // If profile fails, we can't proceed with dashboard loading
        if (!bizRes.ok) return;
      }

      const bizData = await bizRes.json();
      const svcData = await svcRes.json();
      const bookData = await bookRes.json();

      if (bizData.business) {
        setBusiness(bizData.business);
        setProfileForm(bizData.business);
      }
      if (svcData.services) setServices(svcData.services);
      if (bookData.bookings) setBookings(bookData.bookings);
    } catch (e) {
      console.error("Critical Registry Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  const handleToggleActive = async () => {
    if (business?.status === "suspended" || business?.status === "rejected") {
      alert("CRITICAL LOCK: Your registry status (Suspended or Denied) prevents online listing. Please contact the Tourism Office or Master Admin to resolve your credentials.");
      return;
    }
    const nextState = !business?.isActive;
    // Optimistic Update
    setBusiness((prev: any) => ({ ...prev, isActive: nextState }));

    try {
      const res = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: business?._id, isActive: nextState })
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
    if (serviceForm.metadata?.departureDates) {
      const departureDate = new Date(serviceForm.metadata.departureDates);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      if (departureDate < today) {
        alert("Temporal Error: The departure date cannot be in the past. Expeditions must be registered for future commencement.");
        return;
      }

      if (serviceForm.metadata?.cancellationDeadline) {
        if (new Date(serviceForm.metadata.cancellationDeadline) > departureDate) {
          alert("Chronological Error: The official cancellation deadline must occur before the service commencement date.");
          return;
        }
      }
    }

    try {
      setIsAdding(true);
      const finalCategory = [...(Array.isArray(serviceForm.category) ? serviceForm.category : [])];
      if (isAddingCustomCategory && serviceForm.customCategory?.trim()) {
        finalCategory.push(serviceForm.customCategory.trim());
      }

      const isUpdate = !!serviceForm._id;
      const url = isUpdate ? `/api/business/services/${serviceForm._id}` : "/api/business/services";
      const method = isUpdate ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...serviceForm,
          category: finalCategory
        })
      });
      if (res.ok) {
        setIsAddingService(false);
        setIsAddingCustomCategory(false);
        setServiceForm({
          name: "", description: "", category: ["room"], price: 0, currency: "ETB",
          features: [], availability: { isAvailable: true, quantity: 1 },
          images: [],
          metadata: {
            // Defaults will be populated by sector-specific logic
            ...defaultTourMetadata
          }
        });
        fetchData();
      } else {
        let errorMessage = "Internal Cluster Exception";
        try {
          const data = await res.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          errorMessage = `Server Error (${res.status}): Registry synchronization was interrupted.`;
        }
        alert(`Registry Transaction Denied: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Registry Sync Error:", error);
      alert("Institutional Sync Failure: Critical connection error during registry broadcast.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to de-list this service?")) return;
    try {
      const res = await fetch(`/api/business/services/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) { }
  };

  const submitRevokeCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeForm.category || !revokeForm.reason) {
      showToast("System Error", "Both a designated category and a justification must be provided to proceed with revocation.", "error");
      return;
    }
    try {
      setIsSubmittingRevoke(true);
      const formData = new FormData();
      formData.append("category", revokeForm.category);
      formData.append("reason", revokeForm.reason);
      if (revokeForm.document) {
        formData.append("document", revokeForm.document);
      }

      const res = await fetch("/api/business/category-revoke", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Success", data.message || "Domain credential successfully revoked.", "success");
        setRevokeForm({ category: "", reason: "", document: null });
        setIsRevokingCategory(false);
        fetchData();
      } else {
        showToast("System Error", data.error || "The revocation process encountered a denial anomaly.", "error");
      }
    } catch (error) {
      console.error("Revocation submission error:", error);
      showToast("System Error", "An internal error interrupted the transmission process.", "error");
    } finally {
      setIsSubmittingRevoke(false);
    }
  };

  useEffect(() => {
    if (fullSvcGallery) {
      document.body.style.setProperty('overflow', 'hidden', 'important');
      document.documentElement.style.setProperty('overflow', 'hidden', 'important');
      document.body.style.setProperty('overscroll-behavior', 'none', 'important');
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
    };




  }, [fullSvcGallery]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <Loader2 className="w-12 h-12 text-primary/20 animate-spin" />
      <span className="text-xs font-black uppercase tracking-widest text-foreground/20 italic">Authorizing Partner Credentials...</span>
    </div>
  );

  return (
    <>
      <main className="min-h-screen mesh-gradient-rich animate-fade-in relative noise-overlay">
        {/* Dynamic Background Decor */}
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary/[0.03] rounded-full blur-[160px] -mr-60 -mt-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-secondary/[0.02] rounded-full blur-[140px] -ml-40 -mb-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-5 py-12 lg:py-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-12 mb-20 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-16 rounded-[28px] bg-primary/10 flex items-center justify-center text-primary shadow-inner overflow-hidden">
                  {business?.profilePicture ? (
                    <img src={business?.profilePicture} alt={business?.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 px-3 py-1 bg-primary/5 rounded-full border border-primary/10 w-fit">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">Verified Partner Registry</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tightest text-foreground leading-[0.85]">
                    {business?.name || "Initializing..."}
                  </h1>
                  {business?.avgRating !== undefined && (
                    <div className="flex items-center gap-3 mt-4 ml-1">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
                        <Star className={`w-4 h-4 ${business?.avgRating ? "fill-current text-primary" : "text-primary/30"}`} />
                        <span className="text-sm font-black text-primary">
                          {business?.avgRating ? Number(business?.avgRating).toFixed(1) : "New Registry"}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-foreground/30 uppercase tracking-widest italic">Global Partner Rating</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xl text-foreground/50 font-medium italic leading-relaxed max-w-2xl border-l-[4px] border-primary/20 pl-10 ml-2 text-balance">
                "{business?.description || "Synchronizing registry details..."}"
              </p>
            </div>

            <div className="flex flex-col gap-8">
              <div className="flex gap-4 items-center">
                <button
                  onClick={handleToggleActive}
                  disabled={business?.status === "suspended" || business?.status === "rejected"}
                  className={`flex items-center gap-4 px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl ${business?.status === 'suspended' || business?.status === 'rejected'
                    ? 'bg-red-950 text-secondary cursor-not-allowed border border-primary/20 shadow-none'
                    : business?.isActive ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:scale-105 hover:bg-emerald-400' : 'bg-red-500 text-white shadow-red-500/20 hover:scale-105 hover:bg-red-400'
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full ${business?.status === "suspended" || business?.status === "rejected" ? "bg-primary" : "animate-pulse " + (business?.isActive ? 'bg-white' : 'bg-white/40')}`} />
                  {business?.status === "suspended" || business?.status === "rejected" ? "SUSPENDED" : business?.isActive ? "Online" : "Offline"}
                </button>

                <button
                  onClick={() => {
                    const categories = business?.category || [];
                    const soleCategory = categories[0] || "hotel";
                    const defaultCat =
                      soleCategory === "tour_operator" ? "tour" :
                        soleCategory === "car_rental" ? "car" :
                          soleCategory === "hotel" ? "room" :
                            soleCategory === "event_organizer" ? "event" : "other";

                    setServiceForm({
                      name: "", description: "", category: [defaultCat], price: 0, currency: "ETB",
                      features: [], availability: { isAvailable: true, quantity: 1 },
                      images: [],
                      metadata: { bedType: "King", maxOccupancy: 2, carModel: "", venueType: "Indoor", seatingCapacity: 100, ...defaultTourMetadata }
                    });

                    if (categories.length > 1) {
                      setShowSectorSelection(true);
                    } else {
                      setSelectedSector(soleCategory);
                      setShowSectorSelection(false);
                    }
                    setIsAddingService(true);
                  }}
                  className="flex items-center gap-4 px-10 py-5 bg-primary text-white rounded-2xl border border-primary/10 text-sm font-black hover:bg-primary-hover transition-all shadow-2xl shadow-primary/20"
                >
                  <Plus className="w-4 h-4" /> Expand Inventory
                </button>

                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-4 px-8 py-5 bg-white border border-foreground/[0.05] rounded-2xl text-sm font-black text-foreground hover:bg-foreground hover:text-white transition-all shadow-xl shadow-foreground/5 ml-auto"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Registry
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 px-3 md:px-4 lg:px-5 py-2 bg-foreground/5 rounded-full border border-foreground/5 w-fit">
                <div className={`w-1.5 h-1.5 rounded-full ${business?.status === 'approved' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 italic">
                  Institutional Status: {business?.status || "Synchronizing..."}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-20 px-2 overflow-x-auto no-scrollbar pb-4">
            {[
              { id: "profile", label: "Registry Identity", icon: <FileText className="w-4 h-4" /> },
              { id: "services", label: "Service Inventory", icon: <Box className="w-4 h-4" /> },
              { id: "bookings", label: "Mission Registry", icon: <Calendar className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-12 py-6 rounded-[32px] text-sm font-black uppercase tracking-[0.2em] flex items-center gap-4 transition-all duration-500 whitespace-nowrap ${activeTab === tab.id ? 'bg-foreground text-background shadow-premium translate-y-[-6px]' : 'text-foreground/30 hover:text-primary hover:bg-white/50'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "profile" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-12">
                <section className={`floating-glass rounded-[64px] p-12 md:p-20 transition-all duration-700 ${isEditingProfile ? 'ring-2 ring-primary/20 shadow-premium' : 'shadow-3xl shadow-foreground/[0.02]'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-20">
                    <h3 className="text-4xl font-black tracking-tightest flex items-center gap-6">
                      <MapPin className="w-10 h-10 text-primary/30" /> Location & Contact Axis
                    </h3>
                    {isEditingProfile && (
                      <div className="flex gap-4">
                        <button onClick={() => setIsEditingProfile(false)} className="px-8 py-4 text-sm font-black text-foreground/40 hover:text-red-500 uppercase tracking-widest transition-colors">Discard</button>
                        <button onClick={handleUpdateProfile} className="px-14 py-5 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-premium hover:bg-primary-hover active:scale-95 transition-all">Save Changes</button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
                    <div className="space-y-3">
                      <label className="text-xs font-black tracking-widest uppercase text-foreground/20 px-4">Entity Identity</label>
                      <input
                        required
                        disabled={!isEditingProfile}
                        value={profileForm.name || ""}
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-10 py-6 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[32px] text-lg font-bold outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-3 md:row-span-2">
                      <label className="text-xs font-black tracking-widest uppercase text-foreground/20 px-4">Registry Description</label>
                      <textarea
                        required
                        disabled={!isEditingProfile}
                        value={profileForm.description || ""}
                        onChange={e => setProfileForm({ ...profileForm, description: e.target.value })}
                        rows={6}
                        className="w-full px-10 py-6 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[40px] text-base font-bold outline-none focus:ring-4 focus:ring-primary/5 resize-none disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <div className="flex items-center justify-between px-4 pb-2">
                        <label className="text-xs font-black tracking-widest uppercase text-foreground/20">Entity Classification</label>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              if ((business?.category || []).length <= 1) {
                                showToast("System Error", "Cannot revoke your only operating domain. Contact support to close your business.", "error");
                                return;
                              }
                              setIsRevokingCategory(true);
                            }}
                            className="text-xs font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-2 px-3 py-1 bg-rose-500/5 rounded-lg transition-all hover:bg-rose-500/10 relative z-[50]"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Revoke Domain
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              console.log("Opening category request modal...");
                              setIsRequestingCategory(true);
                            }}
                            className="text-xs font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-lg transition-all hover:bg-primary/10 relative z-[50]"
                          >
                            <Plus className="w-3.5 h-3.5" /> Request Expansion
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 px-4 py-2">
                        {(business?.category || []).map((cat: string) => (
                          <div key={cat} className="px-3 md:px-4 lg:px-5 py-3 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-black uppercase tracking-widest">
                            {cat.replace(/_/g, " ")}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-xs font-black tracking-widest uppercase text-foreground/20 px-4">Region</label>
                        <input
                          required
                          disabled={!isEditingProfile}
                          value={profileForm.location?.region || ""}
                          onChange={e => setProfileForm({ ...profileForm, location: { ...profileForm.location, region: e.target.value } })}
                          className="w-full px-10 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black tracking-widest uppercase text-foreground/20 px-4">City / Axis</label>
                        <input
                          required
                          disabled={!isEditingProfile}
                          value={profileForm.location?.city || ""}
                          onChange={e => setProfileForm({ ...profileForm, location: { ...profileForm.location, city: e.target.value } })}
                          className="w-full px-10 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-xs font-black tracking-widest uppercase text-foreground/20 px-4">Specific Address / HQ</label>
                        <input
                          required
                          disabled={!isEditingProfile}
                          value={profileForm.location?.address || ""}
                          onChange={e => setProfileForm({ ...profileForm, location: { ...profileForm.location, address: e.target.value } })}
                          className="w-full px-10 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black tracking-widest uppercase text-foreground/20 px-4">Contact Phone</label>
                      <input
                        required
                        disabled={!isEditingProfile}
                        value={profileForm.contactPhone || ""}
                        onChange={e => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                        className="w-full px-10 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black tracking-widest uppercase text-foreground/20 px-4">Contact Gateway (Email)</label>
                      <input
                        required
                        disabled={!isEditingProfile}
                        value={profileForm.contactEmail || ""}
                        onChange={e => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                        className="w-full px-10 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-3xl font-bold outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black tracking-widest uppercase text-foreground/20 px-4">Brand Asset (Profile Picture)</label>
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
                                className="px-8 py-3 bg-foreground text-background text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer hover:bg-primary transition-all flex items-center gap-3 shadow-xl whitespace-nowrap"
                              >
                                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                                {isUploading ? "Upload Brand Asset" : "Sync Local Image"}
                              </label>
                              <span className="text-[9px] font-bold text-foreground/20 italic">Maximum recommended: 2MB</span>
                            </div>
                          )}
                        </div>
                        {(profileForm.profilePicture || business?.profilePicture) && (
                          <div className="w-28 h-28 rounded-3xl overflow-hidden border border-foreground/10 bg-white p-2 shadow-2xl relative group">
                            <img src={profileForm.profilePicture || business?.profilePicture} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
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

                {/* Formal History Logs / Audit Matrix */}
                {business?.historyLogs && business.historyLogs.length > 0 && (
                  <div className="mt-12 floating-glass rounded-[64px] p-12 md:p-20 shadow-3xl shadow-foreground/[0.02]">
                    <div className="flex items-center gap-6 mb-12">
                      <div className="w-16 h-16 rounded-[28px] bg-primary/10 flex items-center justify-center text-primary">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-4xl font-black tracking-tightest">Institutional Audit Log</h3>
                        <p className="text-foreground/40 font-medium italic mt-2">Chronological record of vital registry modifications.</p>
                      </div>
                    </div>

                    <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-foreground/5 pl-2 mt-12">
                      {[...(business?.historyLogs || [])].reverse().map((log: any, index: number) => (
                        <div key={index} className="relative flex items-start gap-8 group">
                          <div className="w-9 h-9 rounded-full bg-white border-4 border-foreground/5 flex items-center justify-center shrink-0 z-10 transition-all group-hover:border-primary/30">
                            <div className="w-2.5 h-2.5 rounded-full bg-foreground/20 group-hover:bg-primary transition-colors" />
                          </div>
                          <div className="flex-1 bg-foreground/[0.02] border border-foreground/[0.05] rounded-[32px] p-8 -mt-2 group-hover:border-primary/20 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                              <span className="text-xs font-black uppercase tracking-[0.3em] text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                                {log.action}
                              </span>
                              <span className="text-xs font-bold tracking-widest text-foreground/30 uppercase">
                                {new Date(log.date).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-foreground/70 leading-relaxed mb-4">
                              {log.description}
                            </p>
                            {log.documentUrl && (
                              <a
                                href={log.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-3 md:px-4 lg:px-5 py-3 bg-white border border-foreground/5 rounded-2xl text-xs font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                              >
                                <FileText className="w-4 h-4" /> View Archival Document
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "bookings" ? (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-surface p-10 rounded-[50px] border border-foreground/[0.03] shadow-xl">
                <div>
                  <h2 className="text-4xl font-black tracking-tightest mb-2 uppercase">Mission <span className="text-primary italic">Registry.</span></h2>
                  <p className="text-xs font-bold text-foreground/30 uppercase tracking-[0.3em]">Real-time traveler intake synchronization</p>
                </div>
                <div className="flex gap-4">
                  <div className="px-8 py-4 bg-primary/5 rounded-3xl border border-primary/10 text-center">
                    <div className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Active Reservations</div>
                    <div className="text-2xl font-black">{bookings.length}</div>
                  </div>
                  <div className="px-8 py-4 bg-foreground/5 rounded-3xl border border-foreground/10 text-center text-balance">
                    <div className="text-[9px] font-black uppercase tracking-widest text-foreground/30 mb-1">Aggregate Yield</div>
                    <div className="text-2xl font-black text-emerald-500">{business?.currency || "ETB"} {bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {bookings.length === 0 ? (
                  <div className="py-32 flex flex-col items-center justify-center bg-foreground/[0.02] rounded-[60px] border border-dashed border-foreground/5">
                    <Calendar className="w-12 h-12 text-foreground/10 mb-6" />
                    <p className="text-sm font-black uppercase tracking-widest text-foreground/20 italic">No mission records detected in registry axis.</p>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <div
                      key={booking._id}
                      onClick={() => setSelectedBooking(booking)}
                      className="group bg-white p-8 rounded-[40px] border border-foreground/[0.03] shadow-lg hover:shadow-2xl hover:scale-[1.01] transition-all flex flex-col md:flex-row items-center justify-between gap-10 cursor-pointer"
                    >
                      <div className="flex items-center gap-8 w-full md:w-auto">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                          <div className="text-[9px] font-black uppercase tracking-widest mb-1">{new Date(booking.startDate).toLocaleString('default', { month: 'short' })}</div>
                          <div className="text-2xl font-black leading-none">{new Date(booking.startDate).getDate()}</div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xl font-black tracking-tight">{booking.serviceId?.name || "Unidentified Service"}</h4>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground/40 uppercase">
                              <Users className="w-3.5 h-3.5" /> {booking.guests} Explorers
                            </div>
                            <div className="w-1 h-1 rounded-full bg-foreground/10" />
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground/40 uppercase">
                              {booking.userId?.name || "Guest Traveler"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <div className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mb-1">Financial State</div>
                          <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            Paid ✓
                          </div>
                        </div>

                        <div className="text-right min-w-[120px]">
                          <div className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mb-1">Protocol Value</div>
                          <div className="text-xl font-black text-primary">{booking.currency} {booking.totalPrice?.toLocaleString()}</div>
                        </div>

                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${booking.status === 'confirmed' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-primary/5 text-primary border-primary/10'}`}>
                          {booking.status === 'confirmed' ? <CheckCircle2 className="w-6 h-6" /> : <Loader2 className="w-6 h-6 animate-spin" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Inventory Navigation & Filtration */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-surface p-8 rounded-[40px] border border-foreground/[0.03] shadow-xl shadow-foreground/[0.02]">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setFilterSvcCategory("all")}
                    className={`px-3 md:px-4 lg:px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${filterSvcCategory === "all" ? 'bg-primary text-white shadow-lg' : 'bg-foreground/5 text-foreground/30 hover:bg-foreground/10'}`}
                  >
                    Entire Fleet
                  </button>
                  {(business?.category || []).map((bizCat: string) => (
                    <button
                      key={bizCat}
                      onClick={() => setFilterSvcCategory(bizCat)}
                      className={`px-3 md:px-4 lg:px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${filterSvcCategory === bizCat ? 'bg-primary text-white shadow-lg' : 'bg-foreground/5 text-foreground/30 hover:bg-foreground/10'}`}
                    >
                      {bizCat.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inventory List Implementation */}
              <div className="grid grid-cols-1 gap-12">
                {services.length === 0 ? (
                  <div className="py-40 rounded-[64px] border-4 border-dashed border-foreground/5 bg-white/30 text-center animate-pulse shadow-inner">
                    <Plus className="w-20 h-20 text-foreground/5 mx-auto mb-10" />
                    <h3 className="text-4xl font-black text-foreground/20 tracking-tightest uppercase">Inventory Data Void</h3>
                    <p className="text-foreground/10 text-xs font-black uppercase tracking-[0.3em] mt-2">Strategic Initialization Required</p>
                  </div>
                ) : (
                  (filterSvcCategory === "all" ? services : services.filter(s => {
                    const svcCats = Array.isArray(s.category) ? s.category : [s.category];
                    // Map business category to the service-level tag groups
                    const bizCatTagMap: Record<string, string[]> = {
                      hotel: ["room", "suite", "stay", "accommodation"],
                      tour_operator: ["tour", "expedition", "culture", "wildlife", "hiking", "transfer", "custom"],
                      car_rental: ["car", "rental", "vehicle", "driver"],
                      event_organizer: ["event"],
                    };
                    const matchTags = bizCatTagMap[filterSvcCategory];
                    if (matchTags) {
                      return svcCats.some(c => matchTags.includes(String(c)));
                    }
                    // Fallback: direct match against any service category tag
                    return svcCats.some(c => String(c) === filterSvcCategory);
                  })).map((svc) => (
                    <div
                      key={svc._id}
                      className={`group relative floating-glass rounded-[56px] overflow-hidden transition-all duration-700 hover-lift ${expandedSvcId === svc._id ? 'ring-2 ring-primary/20 shadow-premium scale-[1.01] z-20' : 'z-10'}`}
                    >
                      <div className="p-10 md:p-14 flex flex-col md:flex-row items-center gap-12">
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
                            <div className="flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-2xl text-xs font-bold text-foreground/50 border border-foreground/5">
                              <Star className={`w-3.5 h-3.5 ${svc.avgRating ? "text-primary fill-primary" : "text-foreground/10"}`} />
                              {svc.avgRating ? Number(svc.avgRating).toFixed(1) : <span className="italic text-xs opacity-40">New Asset</span>}
                            </div>
                          </div>
                        </div>

                        {/* Dashboard Actions */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <button
                            onClick={() => setExpandedSvcId(expandedSvcId === svc._id ? null : svc._id)}
                            className={`px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all ${expandedSvcId === svc._id ? 'bg-primary text-white shadow-xl' : 'bg-foreground/5 text-foreground/40 hover:bg-foreground hover:text-white'}`}
                          >
                            {expandedSvcId === svc._id ? "Hide Intelligence" : "Expose Metrics"}
                          </button>
                          <button
                            onClick={() => {
                              setServiceForm(svc);
                              const categories = Array.isArray(svc.category) ? svc.category : [];

                              // Robust sector detection
                              let derivedSector = "tour_operator"; // Default fallback

                              const hotelTags = ["room", "suite", "stay", "accommodation"];
                              const tourTags = ["tour", "expedition", "culture", "wildlife", "hiking", "transfer", "custom"];
                              const carTags = ["car", "rental", "vehicle", "driver"];

                              if (categories.some(c => hotelTags.includes(c))) derivedSector = "hotel";
                              else if (categories.some(c => tourTags.includes(c))) derivedSector = "tour_operator";
                              else if (categories.some(c => carTags.includes(c))) derivedSector = "car_rental";
                              else derivedSector = business?.category?.[0] || "tour_operator";

                              setSelectedSector(derivedSector);
                              setShowSectorSelection(false);
                              setIsAddingService(true);
                            }}
                            className="p-4 bg-primary/5 text-primary rounded-full hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/10"
                          >
                            <Edit2 className="w-4 h-4" />
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
                      <div className={`overflow-hidden transition-all duration-700 ease-in-out ${expandedSvcId === svc._id ? 'max-h-[5000px] border-t border-foreground/[0.03] bg-primary/[0.01]' : 'max-h-0'}`}>
                        <div className="p-10 md:p-20 space-y-16 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-8">
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/20 mb-4 ml-1">Asset Description</h4>
                                <p className="text-lg text-foreground/60 leading-relaxed font-medium">{svc.description}</p>
                              </div>

                              <div className="pt-8 border-t border-foreground/5 space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                  {/* Inclusion Artifacts Header */}
                                  {(() => {
                                    const categories = Array.isArray(svc.category) ? svc.category : [svc.category];
                                    const isTour = categories.includes("tour") || categories.includes("expedition") || categories.includes("culture") || categories.includes("hiking") || categories.includes("wildlife");

                                    if (!isTour || !svc.metadata?.inclusionMatrix) return null;

                                    const activeInclusions = Object.entries(svc.metadata.inclusionMatrix)
                                      .filter(([_, included]) => included);

                                    if (activeInclusions.length === 0) return null;

                                    return (
                                      <div className="col-span-full mb-2">
                                        <div className="text-xs font-black uppercase tracking-[0.3em] text-primary/40 border-b border-primary/5 pb-2">Strategic Inclusions</div>
                                        <div className="flex flex-wrap gap-3 mt-4">
                                          {activeInclusions.map(([key]) => {
                                            const labels: any = { meals: "🍽️ Meals", transport: "🚐 Transport", guide: "👤 Guide", insurance: "🛡️ Insurance", accommodation: "🏨 Stay", equipment: "⛺ Gear" };
                                            return (
                                              <div key={key} className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-[9px] font-black uppercase tracking-widest text-primary">
                                                {labels[key] || key}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {(() => {
                                    const categories = Array.isArray(svc.category) ? svc.category : [svc.category];
                                    const carTags = ["car", "rental", "vehicle", "driver", "economy", "luxury", "van", "transfer", "transport"];
                                    const isTransport = categories.some(c => carTags.includes(c));

                                    const protocolGroups = [
                                      {
                                        id: "accommodation",
                                        label: "Accommodation Artifacts",
                                        keys: ["accommodationPrice", "maxOccupancy", "bedType", "roomSize", "bathroomType", "viewType", "roomServiceAvailable"],
                                        active: categories.includes("accommodation") || categories.includes("room")
                                      },
                                      {
                                        id: "dining",
                                        label: "Culinary Portfolio",
                                        keys: ["diningType", "cuisine", "menuAvailable", "openingHours", "priceRange", "reservationRequired"],
                                        active: categories.includes("dining")
                                      },
                                      {
                                        id: "wellness",
                                        label: "Wellness Intelligence",
                                        keys: ["wellnessType", "wellnessDuration", "wellnessPrice", "therapistAvailable", "appointmentRequired"],
                                        active: categories.includes("wellness")
                                      },
                                      {
                                        id: "leisure",
                                        label: "Leisure & Recreation",
                                        keys: ["facilityType", "accessType", "leisureHours", "ageRestriction", "equipmentAvailable", "leisurePrice"],
                                        active: categories.includes("leisure")
                                      },
                                      {
                                        id: "business",
                                        label: "Business & Event Metrics",
                                        keys: ["spaceType", "eventCapacity", "pricePerHour", "pricePerDay", "eventEquipment", "layoutTypes", "eventBookingRequired"],
                                        active: categories.includes("business_events")
                                      },
                                      {
                                        id: "transport_core",
                                        label: "Fleet Core Identity",
                                        keys: ["vehicleName", "vehicleType", "location", "comfortLevel", "features"],
                                        active: isTransport
                                      },
                                      {
                                        id: "transport_pricing",
                                        label: "Pricing & Deposit Protocol",
                                        keys: ["pricingType", "minRentalDuration", "depositRequired", "depositAmount"],
                                        active: isTransport
                                      },
                                      {
                                        id: "transport_specs",
                                        label: "Vehicle Specifications",
                                        keys: ["brand", "model", "year", "fuelType", "transmission", "transportCapacity", "luggageCapacity", "airConditioning", "color"],
                                        active: isTransport
                                      },
                                      {
                                        id: "transport_driver",
                                        label: "Driver & Personnel Options",
                                        keys: ["withDriver", "driverIncludedPrice", "selfDriveAvailable", "driverLanguages"],
                                        active: isTransport
                                      },
                                      {
                                        id: "transport_logistics",
                                        label: "Fleet Logistics & Terms",
                                        keys: ["fuelPolicy", "mileageLimit", "pickupLocation", "cancellationPolicy", "allowedAreas", "notAllowedUses"],
                                        active: isTransport
                                      },
                                      {
                                        id: "transport_insurance",
                                        label: "Insurance & Safety Framework",
                                        keys: ["insuranceIncluded", "insuranceType", "safetyFeatures", "extraKmCharge"],
                                        active: isTransport
                                      },
                                      {
                                        id: "general",
                                        label: "General Service Intelligence",
                                        keys: ["generalServiceType", "generalServiceAvailability", "generalServicePrice", "responseTime"],
                                        active: categories.includes("general_services")
                                      },
                                      {
                                        id: "tour",
                                        label: "Expedition Parameters",
                                        keys: ["duration", "difficulty", "tourType", "minGroupSize", "maxGroupSize", "destinations", "departureDates", "cancellationDeadline", "pricingType"],
                                        active: categories.includes("tour") || categories.includes("expedition") || categories.includes("culture") || categories.includes("hiking") || categories.includes("wildlife")
                                      }
                                    ];

                                    return protocolGroups.map(group => {
                                      if (!group.active) return null;

                                      const groupMeta = Object.entries(svc.metadata || {})
                                        .filter(([key, val]) =>
                                          group.keys.includes(key) &&
                                          val !== null && val !== undefined && val !== "" &&
                                          !(Array.isArray(val) && val.length === 0)
                                        );

                                      if (groupMeta.length === 0) return null;

                                      return (
                                        <div key={group.id} className="col-span-full space-y-6 pt-6 border-t border-foreground/[0.03]">
                                          <div className="text-xs font-black uppercase tracking-[0.3em] text-primary/40 ml-1">{group.label}</div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {groupMeta.map(([key, val]) => {
                                              let displayValue = String(val);
                                              if (typeof val === 'boolean') {
                                                displayValue = val ? "Yes" : "No";
                                              } else if (Array.isArray(val)) {
                                                displayValue = val.join(', ');
                                              } else if (typeof val === 'object') {
                                                const booleans = Object.entries(val).filter(([_, v]) => v === true);
                                                if (booleans.length > 0) {
                                                  displayValue = booleans.map(([k]) => k.replace(/([A-Z])/g, ' $1').trim()).join(", ");
                                                } else {
                                                  displayValue = Object.entries(val)
                                                    .filter(([_, v]) => v !== false && v !== null && v !== "")
                                                    .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`)
                                                    .join(' | ') || "None";
                                                }
                                              }

                                              if (displayValue === "None" || displayValue === "") return null;

                                              return (
                                                <div key={key} className="group/meta relative bg-foreground/[0.02] p-5 rounded-3xl border border-foreground/5">
                                                  <div className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40 group-hover/meta:text-primary transition-colors duration-500 mb-2 break-words">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                  </div>
                                                  <div className="font-bold text-sm text-foreground/80 break-words leading-tight capitalize">
                                                    {displayValue}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>

                                {/* Special Handling for Itinerary */}
                                {Array.isArray(svc.metadata?.itinerary) && svc.metadata.itinerary.length > 0 && (
                                  <div className="mt-8 pt-8 border-t border-foreground/10">
                                    <h4 className="text-sm font-black uppercase tracking-[0.4em] text-primary mb-8 pb-3 border-b border-primary/10">
                                      {(() => {
                                        const categories = Array.isArray(svc.category) ? svc.category : [];
                                        if (categories.includes("culture")) return "Strategic Cultural Itinerary";
                                        if (categories.includes("expedition")) return "Strategic Expedition Itinerary";
                                        if (categories.includes("hiking")) return "Trekking & Hiking Itinerary";
                                        if (categories.includes("wildlife")) return "Wildlife Safari Sequence";
                                        if (categories.includes("custom") && svc.customCategory) return `${svc.customCategory} Itinerary`;
                                        return "Strategic Expedition Itinerary";
                                      })()}
                                    </h4>
                                    <div className="space-y-6 max-w-4xl">
                                      {svc.metadata.itinerary.map((item: any, idx: number) => (
                                        <div key={idx} className="relative pl-8 pb-8 border-l-2 border-primary/20 last:border-transparent last:pb-0">
                                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-background border-4 border-primary shadow-sm" />
                                          <div className="bg-foreground/[0.02] p-6 rounded-3xl border border-foreground/5 -mt-4">
                                            <div className="flex items-center gap-3 mb-3">
                                              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest">Day {item.day || idx + 1}</span>
                                              <span className="text-xs font-bold text-foreground/40">{item.timing || "Full Day"}</span>
                                            </div>
                                            <p className="font-bold text-sm text-foreground/80 mb-2">{item.activities}</p>
                                            {item.overnightStay && (
                                              <div className="text-xs text-foreground/50 flex items-center gap-2 mt-3 pt-3 border-t border-foreground/5">
                                                <MapPin className="w-3 h-3" /> Stay: {item.overnightStay}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="text-xs font-black uppercase tracking-[0.3em] text-foreground/20 ml-2">Visual Artifact Intelligence</div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {svc.images.map((img: string, idx: number) => (
                                  <div
                                    key={idx}
                                    onClick={() => setActiveImageBySvc(prev => ({ ...prev, [svc._id]: idx }))}
                                    className={`relative aspect-[4/3] rounded-[28px] overflow-hidden border transition-all duration-700 cursor-pointer hover-lift ${activeImageBySvc[svc._id] === idx ? 'border-primary ring-8 ring-primary/5 z-10' : 'border-foreground/5 shadow-inner opacity-70 hover:opacity-100'}`}
                                  >
                                    <img src={img} alt="Detail" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                    {activeImageBySvc[svc._id] === idx && (
                                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                                        <div className="px-4 py-2 bg-white rounded-2xl text-[8px] font-black uppercase tracking-widest text-primary shadow-2xl flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                          Primary Artifact
                                        </div>
                                      </div>
                                    )}
                                    {idx === 0 && activeImageBySvc[svc._id] !== idx && (
                                      <div className="absolute top-3 left-3 px-3 py-1 bg-foreground/80 backdrop-blur-md rounded-xl text-[7px] font-black uppercase tracking-widest text-background">
                                        Master Registry
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="pt-10 border-t border-foreground/5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-10 rounded-[50px] bg-white border border-foreground/5 shadow-premium">
                              <div className="space-y-4">
                                <div className="text-xs font-black uppercase text-foreground/20 tracking-widest">Trade Currency</div>
                                <div className="flex items-center gap-4">
                                  <Globe className="w-5 h-5 text-primary/40" />
                                  <span className="font-black text-lg tracking-tighter text-foreground">{svc.currency}</span>
                                </div>
                              </div>
                              <div className="space-y-4 border-t sm:border-t-0 sm:border-l border-foreground/5 pt-4 sm:pt-0 sm:pl-8">
                                <div className="text-xs font-black uppercase text-foreground/20 tracking-widest">Verification Tier</div>
                                <div className="flex items-center gap-4">
                                  <ShieldCheck className="w-5 h-5 text-primary" />
                                  <span className="font-black text-lg tracking-tighter text-primary italic">Institutional</span>
                                </div>
                              </div>
                            </div>
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
            <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-8">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fade-in" onClick={() => { setIsAddingService(false); setIsAddingCustomCategory(false); }} />
              <div className="relative w-full max-w-5xl bg-white rounded-[60px] shadow-premium p-6 md:p-12 overflow-y-auto max-h-[95vh] custom-scrollbar animate-slide-up border border-foreground/5">
                {/* Institutional Background Accent */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/[0.03] to-transparent pointer-events-none" />

                {showSectorSelection ? (
                  <div className="animate-slide-in-left relative z-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
                      <div className="max-w-xl">
                        <div className="text-sm font-black tracking-[0.3em] uppercase text-primary mb-4 animate-pulse">Inventory Registry Hub</div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tightest leading-none">Choose Your <span className="text-foreground/20">Sector.</span></h2>
                        <p className="text-sm text-foreground/70 mt-4 font-medium max-w-sm">Define the operational domain for your new inventory artifact to begin the synchronization process.</p>
                      </div>
                      <button onClick={() => setIsAddingService(false)} className="w-14 h-14 bg-foreground/5 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all group">
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {(business?.category || []).map((cat: string) => {
                        const labels: any = {
                          hotel: "Accommodations & Rooms",
                          tour_operator: "Tours & Expeditions",
                          car_rental: "Vehicle & Transports",
                          event_organizer: "Events & Venues",
                          restaurant: "Dining & Culinary"
                        };
                        const icons: any = {
                          hotel: <Bed className="w-8 h-8" />,
                          tour_operator: <Compass className="w-8 h-8" />,
                          car_rental: <Car className="w-8 h-8" />,
                          event_organizer: <Calendar className="w-8 h-8" />,
                          restaurant: <Utensils className="w-8 h-8" />
                        };
                        const label = labels[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '));
                        const icon = icons[cat] || <Box className="w-8 h-8" />;
                        return (
                          <button
                            key={cat}
                            onClick={() => {
                              const defaultCat =
                                cat === "tour_operator" ? "tour" :
                                  cat === "car_rental" ? "car" :
                                    cat === "hotel" ? "room" :
                                      cat === "event_organizer" ? "event" : "other";

                              setServiceForm({
                                name: "", description: "", category: [defaultCat], price: 0, currency: "ETB",
                                features: [], availability: { isAvailable: true, quantity: 1, type: "available" },
                                images: [],
                                metadata: {
                                  // Common Hotel Defaults
                                  ...defaultTourMetadata,
                                  bedType: "King",
                                  maxOccupancy: 2,
                                  roomSize: 30,
                                  bathroomType: "private",
                                  viewType: "city",
                                  roomServiceAvailable: "yes",
                                  diningArtifacts: [],
                                  wellness: { serviceType: "massage", duration: 60, therapistAvailable: "yes", appointmentRequired: "yes" },
                                  leisure: { facilityType: "pool", accessType: "free", openingHours: "", ageRestriction: "None", equipmentAvailable: "no" },
                                  businessEvents: { spaceType: "meeting_room", capacity: 20, pricePerHour: 0, pricePerDay: 0, equipment: [], layouts: ["theater"], bookingRequired: "yes" },
                                  transport: { serviceType: "airport_transfer", pricingType: "per_trip", availability: "24/7", vehicleType: "SUV", capacity: 4, bookingRequired: "yes" },
                                  generalServices: { serviceType: "laundry", availability: "24/7", responseTime: "Quick" }
                                }
                              });
                              setSelectedSector(cat);
                              setShowSectorSelection(false);
                              setIsAddingService(true);
                            }}
                            className="flex flex-col items-start p-16 rounded-[60px] border border-foreground/[0.05] bg-foreground/[0.01] hover:bg-white hover:border-primary/20 hover:shadow-premium transition-all group overflow-hidden relative"
                          >
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/[0.02] rounded-full group-hover:bg-primary/[0.05] transition-colors duration-700" />

                            <div className="w-24 h-24 rounded-[36px] bg-white shadow-xl shadow-foreground/[0.03] flex items-center justify-center text-foreground/40 group-hover:text-primary transition-all group-hover:scale-110 duration-500 mb-10">
                              {icon}
                            </div>

                            <div className="relative z-10 text-left">
                              <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground/60 mb-1 block group-hover:text-primary transition-colors">Strategic Domain</span>
                              <span className="text-xl font-black tracking-tighter text-foreground group-hover:translate-x-1 transition-transform block">{label}</span>
                            </div>

                            <div className="mt-12 flex items-center gap-4 text-xs font-black uppercase tracking-widest text-primary group-hover:gap-6 transition-all">
                              <span>Initialize Domain</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="animate-slide-in-right relative z-10">
                    <div className="flex items-start justify-between gap-12 mb-12 pb-10 border-b border-foreground/5">
                      <div className="flex items-start gap-6">
                        {business?.category?.length > 1 && (
                          <button
                            onClick={() => { setIsAddingService(true); setShowSectorSelection(true); }}
                            className="mt-1 w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/40 hover:bg-white hover:text-primary hover:shadow-premium transition-all"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                        )}
                        <div>
                          <div className="text-sm font-black tracking-[0.3em] uppercase text-primary mb-3">
                            {serviceForm._id ? "Inventory Modification Protocol" : "Inventory Expansion Protocol"}
                          </div>
                          <h2 className="text-4xl md:text-6xl font-black tracking-tightest leading-none">
                            {serviceForm._id ? "Update" : "Register"} <span className="text-foreground/20">Artifact.</span>
                          </h2>
                          <div className="flex items-center gap-4 mt-4">
                            <div className="px-3 py-1.5 rounded-full glass border border-foreground/5 text-xs font-black uppercase tracking-widest text-foreground/70 flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                              Domain: {String(selectedSector || "").replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => { setIsAddingService(false); setIsAddingCustomCategory(false); setShowSectorSelection(false); }} className="w-12 h-12 bg-foreground/[0.02] rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid gap-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 space-y-6 relative group">
                          <label className="text-sm font-black uppercase tracking-[0.3em] text-foreground/60 px-3 md:px-4 lg:px-5 mb-2 block">Registry Identification Name (Official)</label>
                          <input
                            value={serviceForm.name || ""}
                            onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                            placeholder={
                              (Array.isArray(serviceForm.category) && serviceForm.category.includes("room")) ? "e.g. Royal Imperial Suite" :
                                (Array.isArray(serviceForm.category) && serviceForm.category.includes("tour")) ? "e.g. Blue Nile Midnight Expedition" :
                                  (Array.isArray(serviceForm.category) && serviceForm.category.includes("car")) ? "e.g. Black Obsidian Executive 4x4" :
                                    "e.g. Institutional Offering / Service Asset"
                            }
                            className="w-full px-8 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[24px] font-black text-base tracking-tight outline-none ring-primary/5 focus:ring-8 focus:bg-white focus:border-primary/20 transition-all placeholder:text-foreground/5"
                          />
                        </div>

                        {selectedSector !== "tour_operator" && (
                          <div className="md:col-span-2 space-y-4">
                            <label className="text-sm font-black uppercase tracking-[0.2em] text-primary px-4 mb-2 block">Sector Classification Artifacts</label>
                            {selectedSector === "car_rental" ? (
                              <div className="relative group/select">
                                <select
                                  value={Array.isArray(serviceForm.category) ? serviceForm.category[0] : ""}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val === "custom") {
                                      setIsAddingCustomCategory(true);
                                      setServiceForm({ ...serviceForm, category: ["custom"] });
                                    } else {
                                      setIsAddingCustomCategory(false);
                                      setServiceForm({ ...serviceForm, category: [val] });
                                    }
                                  }}
                                  className="w-full bg-foreground/[0.02] px-8 py-6 rounded-[32px] border border-foreground/[0.05] font-black text-sm outline-none focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-16"
                                >
                                  <option value="" disabled>Choose Domain Classification</option>
                                  {(() => {
                                    const sectorMap: any = {
                                      car_rental: [
                                        { value: "economy", label: "Compact / Economy" },
                                        { value: "luxury", label: "Luxury SUV / Elite" },
                                        { value: "van", label: "Van / Mini-Bus" },
                                        { value: "driver", label: "Chauffeur Service" },
                                        { value: "transfer", label: "One-Way Transfer" }
                                      ]
                                    };
                                    const opts = sectorMap.car_rental;
                                    return (
                                      <>
                                        {opts.map((opt: any) => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                        <option value="custom">Custom Type</option>
                                      </>
                                    );
                                  })()}
                                </select>
                                <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(() => {
                                  const sectorMap: any = {
                                    hotel: [
                                      { value: "accommodation", label: "Accommodation (Rooms)" },
                                      { value: "dining", label: "Dining & Culinary" },
                                      { value: "wellness", label: "Wellness & Spa" },
                                      { value: "leisure", label: "Leisure & Recreation" },
                                      { value: "business_events", label: "Business & Events" },
                                      { value: "transport", label: "Hotel Transport" },
                                      { value: "general_services", label: "General Hotel Services" }
                                    ],
                                    tour_operator: [
                                      { value: "tour", label: "Curated Tour" },
                                      { value: "expedition", label: "Multi-Day Expedition" },
                                      { value: "culture", label: "Cultural Experience" },
                                      { value: "wildlife", label: "Wildlife Safari" },
                                      { value: "hiking", label: "Hiking & Trekking" }
                                    ],
                                    event_organizer: [
                                      { value: "venue", label: "Event Venue" },
                                      { value: "corporate", label: "Corporate Meeting" },
                                      { value: "catering", label: "Catering Service" }
                                    ],
                                    restaurant: [
                                      { value: "dining", label: "Fixed Menu / Dish" },
                                      { value: "seating", label: "Table Reservation" },
                                      { value: "event", label: "Private Dining Event" },
                                      { value: "bar", label: "Lounge / Bar Access" },
                                      { value: "catering", label: "External Catering" }
                                    ]
                                  };
                                  const options = sectorMap[selectedSector || ""] || [
                                    { value: "other", label: "General Service Offering" }
                                  ];
                                  return options.map((opt: any) => {
                                    const isChecked = Array.isArray(serviceForm.category) && serviceForm.category.includes(opt.value);
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          const current = Array.isArray(serviceForm.category) ? [...serviceForm.category] : [];
                                          const next = isChecked ? current.filter(c => c !== opt.value) : [...current, opt.value];
                                          setServiceForm({ ...serviceForm, category: next });
                                        }}
                                        className={`group relative flex flex-col items-start gap-4 p-6 rounded-[32px] border transition-all duration-700 hover-lift ${isChecked ? 'bg-primary text-white border-primary shadow-premium' : 'bg-foreground/[0.01] border-foreground/[0.05] text-foreground/40 hover:border-primary/20 hover:bg-white'}`}
                                      >
                                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${isChecked ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]' : 'bg-foreground/20 group-hover:bg-primary/20'}`} />
                                        <span className={`text-sm font-black uppercase tracking-[0.3em] leading-tight ${isChecked ? 'text-white' : 'text-foreground/60'}`}>{opt.label}</span>
                                      </button>
                                    );
                                  });
                                })()}

                                {/* Custom Tag Option */}
                                <button
                                  type="button"
                                  onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                                  className={`group relative flex flex-col items-start gap-4 p-6 rounded-[32px] border-2 border-dashed transition-all duration-700 hover-lift ${isAddingCustomCategory ? 'bg-foreground text-background border-foreground shadow-premium' : 'bg-foreground/[0.01] border-foreground/[0.05] text-foreground/40 hover:border-primary/20 hover:bg-white'}`}
                                >
                                  <Plus className={`w-5 h-5 transition-all duration-500 ${isAddingCustomCategory ? 'rotate-45 text-background' : 'text-foreground/40'}`} />
                                  <span className={`text-sm font-black uppercase tracking-[0.3em] ${isAddingCustomCategory ? 'text-background' : 'text-foreground/60'}`}>Custom Type</span>
                                </button>
                              </div>
                            )}

                            {isAddingCustomCategory && (
                              <div className="mt-6 animate-slide-up relative group">
                                <label className="absolute left-8 -top-3 px-3 bg-white text-[9px] font-black uppercase tracking-[0.3em] text-primary z-20">Niche Descriptor</label>
                                <input
                                  value={serviceForm.customCategory || ""}
                                  onChange={(e) => setServiceForm({ ...serviceForm, customCategory: e.target.value })}
                                  placeholder="Traditional Coffee Ceremony, Luxury Helicopter Tour..."
                                  className="w-full px-8 py-6 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[28px] font-black text-sm outline-none ring-primary/5 focus:ring-8 focus:bg-white focus:border-primary/20 transition-all placeholder:text-foreground/10"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                  <span className="text-[8px] font-black uppercase tracking-widest text-foreground/20">Awaiting Indexing</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                            {/* 1. ACCOMMODATION */}
                            {selectedSector === "hotel" && Array.isArray(serviceForm.category) && serviceForm.category.includes("accommodation") && (
                              <div className="col-span-full space-y-10 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5 relative overflow-hidden group/acc">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                                  <Bed className="w-4 h-4" /> Accommodation Intelligence
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Room Identifier</label>
                                    <input
                                      value={serviceForm.metadata?.roomType || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, roomType: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="e.g. Deluxe Suite"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Max Occupancy</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.maxOccupancy || 2}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, maxOccupancy: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Bed Type</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.bedType || "King"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, bedType: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="King">King Bed</option>
                                        <option value="Queen">Queen Bed</option>
                                        <option value="Twin">Twin Beds</option>
                                        <option value="Suite">Master Suite Level</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Room Size (SQM)</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.roomSize || 30}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, roomSize: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Bathroom Type</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.bathroomType || "private"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, bathroomType: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="private">Private En-suite</option>
                                        <option value="shared">Shared Facility</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">View Type</label>
                                    <input
                                      value={serviceForm.metadata?.viewType || "City View"}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, viewType: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="City, Garden, Sea, Forest..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Room Service</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.roomServiceAvailable || "yes"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, roomServiceAvailable: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="yes">Available 24/7</option>
                                        <option value="no">Not Available</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 3. DINING */}
                            {selectedSector === "hotel" && Array.isArray(serviceForm.category) && serviceForm.category.includes("dining") && (
                              <div className="col-span-full space-y-10 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5 relative overflow-hidden group/dining">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                                  <Utensils className="w-4 h-4" /> Culinary Portfolio Intelligence
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Service Type</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.diningType || "restaurant"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, diningType: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="restaurant">Full Restaurant</option>
                                        <option value="bar">Bar / Lounge</option>
                                        <option value="cafe">Café / Bistro</option>
                                        <option value="room_service">Dedicated Room Service</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Cuisine Archetype</label>
                                    <input
                                      value={serviceForm.metadata?.cuisine || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, cuisine: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Habesha, Italian, Continental..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Menu Artifact Available</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.menuAvailable || "yes"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, menuAvailable: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="yes">Yes (Digital/Physical)</option>
                                        <option value="no">Buffet Only / No Menu</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Opening Hours</label>
                                    <input
                                      value={serviceForm.metadata?.diningHours || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, diningHours: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="e.g. 06:00 - 23:00"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Price Range</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.priceRange || "mid"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, priceRange: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="budget">Budget (Affordable)</option>
                                        <option value="mid">Mid-Range (Standard)</option>
                                        <option value="luxury">Luxury (Fine Dining)</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Reservation Required</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.reservationRequired || "no"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, reservationRequired: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="yes">Mandatory</option>
                                        <option value="no">Walk-ins Welcome</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 4. WELLNESS & SPA */}
                            {selectedSector === "hotel" && Array.isArray(serviceForm.category) && serviceForm.category.includes("wellness") && (
                              <div className="col-span-full space-y-8 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary border-b border-primary/10 pb-2 mb-6 ml-2 flex items-center gap-3">
                                  <Sparkles className="w-4 h-4" /> Wellness Intelligence
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Service Type</label>
                                    <input
                                      value={serviceForm.metadata?.wellnessType || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, wellnessType: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Massage, Sauna, Steam, Yoga..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Duration (Min)</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.wellnessDuration || 60}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, wellnessDuration: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Service Price</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.wellnessPrice || 0}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, wellnessPrice: parseFloat(e.target.value) } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Expert Available</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.therapistAvailable || "yes"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, therapistAvailable: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="yes">Yes (Certified)</option>
                                        <option value="no">Self-Service</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Appointment Required</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.appointmentRequired || "yes"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, appointmentRequired: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="yes">Mandatory</option>
                                        <option value="no">Drop-ins Possible</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 5. LEISURE & RECREATION */}
                            {selectedSector === "hotel" && Array.isArray(serviceForm.category) && serviceForm.category.includes("leisure") && (
                              <div className="col-span-full space-y-8 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary border-b border-primary/10 pb-2 mb-6 ml-2 flex items-center gap-3">
                                  <Waves className="w-4 h-4" /> Leisure Intelligence
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Facility Type</label>
                                    <input
                                      value={serviceForm.metadata?.facilityType || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, facilityType: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Pool, Gym, Playground, Cinema..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Access Type</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.accessType || "free"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, accessType: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="free">Complimentary for Guests</option>
                                        <option value="paid">Paid Access Artifact</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Opening Hours</label>
                                    <input
                                      value={serviceForm.metadata?.leisureHours || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, leisureHours: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="e.g. 08:00 - 20:00"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Age Restriction</label>
                                    <input
                                      value={serviceForm.metadata?.ageRestriction || "None"}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, ageRestriction: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Adults only, 12+, All ages..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Equipment Available</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.equipmentAvailable || "no"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, equipmentAvailable: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="yes">Yes (Provided)</option>
                                        <option value="no">Bring Your Own</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 6. BUSINESS & EVENTS */}
                            {selectedSector === "hotel" && Array.isArray(serviceForm.category) && serviceForm.category.includes("business_events") && (
                              <div className="col-span-full space-y-8 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary border-b border-primary/10 pb-2 mb-6 ml-2 flex items-center gap-3">
                                  <Briefcase className="w-4 h-4" /> Business Intelligence
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Space Archetype</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.spaceType || "meeting_room"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, spaceType: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="meeting_room">Meeting Room</option>
                                        <option value="conference_hall">Conference Hall</option>
                                        <option value="ballroom">Ballroom / Event Suite</option>
                                        <option value="office">Private Shared Office</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Delegate Capacity</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.eventCapacity || 20}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, eventCapacity: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Hourly Rate</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.pricePerHour || 0}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, pricePerHour: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Full Day Rate</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.pricePerDay || 0}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, pricePerDay: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Available Equipment</label>
                                    <input
                                      value={serviceForm.metadata?.eventEquipment || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, eventEquipment: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Projector, Mic, Whiteboard..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Layout Types</label>
                                    <input
                                      value={serviceForm.metadata?.layoutTypes || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, layoutTypes: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Theater, Classroom, U-Shape..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Booking Required</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.eventBookingRequired || "yes"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, eventBookingRequired: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="yes">Mandatory</option>
                                        <option value="no">Subject to Availability</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 7. TRANSPORTATION & CAR RENTAL */}
                            {(selectedSector === "car_rental" || (selectedSector === "hotel" && Array.isArray(serviceForm.category) && serviceForm.category.includes("transport"))) && (


                              <div className="col-span-full grid grid-cols-1 xl:grid-cols-2 gap-16">
                                {/* Left Hemisphere: Identity, Pricing & Engineering */}
                                <div className="space-y-12">
                                  {/* 1. Core Identity */}
                                  <div className="space-y-6">
                                    <div className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30">1. Core Identification</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Vehicle Name</label>
                                        <input value={serviceForm.metadata?.vehicleName || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, vehicleName: e.target.value } })} placeholder="e.g. Toyota Land Cruiser" className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" />
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Vehicle Type</label>
                                        <select value={serviceForm.metadata?.vehicleType || "SUV"} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, vehicleType: e.target.value } })} className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none appearance-none cursor-pointer">
                                          <option value="SUV">SUV (Sport Utility)</option>
                                          <option value="sedan">Sedan</option>
                                          <option value="minibus">Minibus / Van</option>
                                          <option value="pickup">Pickup Truck</option>
                                        </select>
                                      </div>
                                      <div className="space-y-3 col-span-full">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Base Operations Hub</label>
                                        <input value={serviceForm.metadata?.location || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, location: e.target.value } })} placeholder="Pickup Location" className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* 2. Pricing & Financial Protocol */}
                                  <div className="space-y-6">
                                    <div className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30">2. Pricing & Financial Protocol</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-primary/[0.01] p-8 rounded-[40px] border border-primary/5">
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Pricing Type</label>
                                        <select value={serviceForm.metadata?.pricingType || "per_day"} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, pricingType: e.target.value } })} className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none appearance-none cursor-pointer">
                                          <option value="per_hour">Per Hour</option>
                                          <option value="per_day">Per Day</option>
                                          <option value="per_trip">Per Trip / Transfer</option>
                                        </select>
                                      </div>

                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Deposit Req.</label>
                                        <select value={serviceForm.metadata?.depositRequired || "no"} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, depositRequired: e.target.value } })} className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none appearance-none cursor-pointer">
                                          <option value="no">No Deposit</option>
                                          <option value="yes">Mandatory Deposit</option>
                                        </select>
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Deposit Amount</label>
                                        <input type="number" value={serviceForm.metadata?.depositAmount || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, depositAmount: e.target.value } })} placeholder="Amount in ETB" className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* 3. Specifications & Architecture */}
                                  <div className="space-y-6">
                                    <div className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30">3. Specifications & Engineering</div>
                                    <div className="grid grid-cols-2 gap-8">
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Brand</label>
                                        <input value={serviceForm.metadata?.brand || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, brand: e.target.value } })} placeholder="Toyota, Ford..." className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white transition-all" />
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Model</label>
                                        <input value={serviceForm.metadata?.model || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, model: e.target.value } })} placeholder="V8, Hilux..." className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white transition-all" />
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Manufacturing Year</label>
                                        <input type="number" value={serviceForm.metadata?.year || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, year: e.target.value } })} placeholder="2024" className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white transition-all" />
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Fuel Type</label>
                                        <select value={serviceForm.metadata?.fuelType || "diesel"} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, fuelType: e.target.value } })} className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none appearance-none cursor-pointer">
                                          <option value="petrol">Petrol</option>
                                          <option value="diesel">Diesel</option>
                                          <option value="electric">Electric</option>
                                          <option value="hybrid">Hybrid</option>
                                        </select>
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Transmission</label>
                                        <select value={serviceForm.metadata?.transmission || "automatic"} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, transmission: e.target.value } })} className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none appearance-none cursor-pointer">
                                          <option value="automatic">Automatic</option>
                                          <option value="manual">Manual Transmission</option>
                                        </select>
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Seating</label>
                                        <input type="number" value={serviceForm.metadata?.transportCapacity || 4} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, transportCapacity: e.target.value } })} className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Luggage</label>
                                        <input value={serviceForm.metadata?.luggageCapacity || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, luggageCapacity: e.target.value } })} placeholder="e.g. 3 Bags" className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">A/C Status</label>
                                        <select value={serviceForm.metadata?.airConditioning || "yes"} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, airConditioning: e.target.value } })} className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none appearance-none cursor-pointer">
                                          <option value="yes">A/C Included</option>
                                          <option value="no">No A/C</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Hemisphere: Features, Roles & Governance */}
                                <div className="space-y-12">
                                  <div className="space-y-6">
                                    <div className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30">4. Features & Comfort Artifacts</div>
                                    <div className="bg-foreground/[0.01] p-8 rounded-[40px] border border-foreground/5 space-y-8">
                                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                        {[
                                          { key: "gps", label: "GPS" },
                                          { key: "bluetooth", label: "Bluetooth" },
                                          { key: "usb", label: "USB Charging" },
                                          { key: "child_seat", label: "Child Seat" },
                                          { key: "sunroof", label: "Sunroof" }
                                        ].map(feat => (
                                          <button
                                            key={feat.key}
                                            type="button"
                                            onClick={() => {
                                              const current = serviceForm.metadata?.features || [];
                                              const next = current.includes(feat.key) ? current.filter((k: string) => k !== feat.key) : [...current, feat.key];
                                              setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, features: next } });
                                            }}
                                            className={`px-4 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${serviceForm.metadata?.features?.includes(feat.key) ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-foreground/5 text-foreground/40'}`}
                                          >
                                            {feat.label}
                                          </button>
                                        ))}
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                          <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Comfort Tier</label>
                                          <select value={serviceForm.metadata?.comfortLevel || "standard"} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, comfortLevel: e.target.value } })} className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none appearance-none cursor-pointer">
                                            <option value="standard">Standard Level</option>
                                            <option value="luxury">Luxury / VIP</option>
                                          </select>
                                        </div>
                                        <div className="space-y-3">
                                          <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Exterior Color</label>
                                          <input value={serviceForm.metadata?.color || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, color: e.target.value } })} placeholder="Silver, Black..." className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 5. Driver & Fleet Options */}
                                  <div className="space-y-6">
                                    <div className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30">5. Driver & Operational Modes</div>
                                    <div className="grid grid-cols-1 gap-8">
                                      <div className="bg-foreground/[0.01] p-8 rounded-[40px] border border-foreground/5 space-y-6">
                                        <div className="flex items-center gap-4">
                                          <input type="checkbox" checked={serviceForm.metadata?.withDriver || false} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, withDriver: e.target.checked } })} className="w-6 h-6 rounded-lg accent-primary" />
                                          <label className="text-xs font-black uppercase tracking-widest text-foreground/60">Chauffeur Service (With Driver)</label>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6">
                                          <div className="space-y-3">
                                            <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Driver Inc. Price</label>
                                            <input type="number" value={serviceForm.metadata?.driverIncludedPrice || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, driverIncludedPrice: e.target.value } })} placeholder="+ Amount" className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                          </div>
                                          <div className="space-y-3">
                                            <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Experience</label>
                                            <input value={serviceForm.metadata?.driverExperience || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, driverExperience: e.target.value } })} placeholder="e.g. 5+ Years" className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                          </div>
                                          <div className="space-y-3">
                                            <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Driver Languages</label>
                                            <input value={serviceForm.metadata?.driverLanguages || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, driverLanguages: e.target.value } })} placeholder="Amharic, English, French..." className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="bg-foreground/[0.01] p-8 rounded-[40px] border border-foreground/5 space-y-6">
                                        <div className="flex items-center gap-4">
                                          <input type="checkbox" checked={serviceForm.metadata?.selfDriveAvailable !== false} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, selfDriveAvailable: e.target.checked } })} className="w-6 h-6 rounded-lg accent-primary" />
                                          <label className="text-xs font-black uppercase tracking-widest text-foreground/60">Self-Drive Permission</label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                </div>

                                {/* Full Width Sub-Grid: Governance & Safety */}
                                <div className="col-span-full grid grid-cols-1 xl:grid-cols-2 gap-12 pt-12 border-t-2 border-foreground/[0.03]">
                                  <div className="space-y-8">
                                    <div className="text-xs font-black uppercase tracking-[0.3em] text-primary border-b border-primary/5 pb-2">Governance & Rental Terms</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Fuel Policy</label>
                                        <input value={serviceForm.metadata?.fuelPolicy || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, fuelPolicy: e.target.value } })} placeholder="Full-to-Full, Prepaid..." className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Mileage Limit</label>
                                        <input value={serviceForm.metadata?.mileageLimit || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, mileageLimit: e.target.value } })} placeholder="km/day or Unlimited" className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                      </div>
                                      <div className="space-y-3 col-span-full">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Usage Restrictions</label>
                                        <input value={serviceForm.metadata?.notAllowedUses || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, notAllowedUses: e.target.value } })} placeholder="e.g. No Off-road, No Cross-border..." className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-8">
                                    <div className="text-xs font-black uppercase tracking-[0.3em] text-primary border-b border-primary/5 pb-2">Safety & Insurance Framework</div>
                                    <div className="space-y-6 bg-primary/[0.01] p-8 rounded-[40px] border border-primary/5">
                                      <div className="flex items-center gap-4">
                                        <input type="checkbox" checked={serviceForm.metadata?.insuranceIncluded || true} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, insuranceIncluded: e.target.checked } })} className="w-6 h-6 rounded-lg accent-primary" />
                                        <label className="text-xs font-black uppercase tracking-widest text-foreground/60">Insurance Included</label>
                                      </div>
                                      <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                          <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Insurance Type</label>
                                          <input value={serviceForm.metadata?.insuranceType || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, insuranceType: e.target.value } })} placeholder="Basic / Full Coverage" className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                        </div>
                                        <div className="space-y-3">
                                          <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Extra KM Charge</label>
                                          <input type="number" value={serviceForm.metadata?.extraKmCharge || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, extraKmCharge: e.target.value } })} placeholder="Price/km" className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none" />
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40">Safety Artifacts</label>
                                        <div className="flex flex-wrap gap-3">
                                          {["Airbags", "ABS", "Rear Camera"].map(safe => (
                                            <button
                                              key={safe}
                                              type="button"
                                              onClick={() => {
                                                const current = serviceForm.metadata?.safetyFeatures || "";
                                                const next = current.includes(safe) ? current.replace(safe, "").replace(", ,", ",").trim() : `${current}${current ? ', ' : ''}${safe}`;
                                                setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, safetyFeatures: next } });
                                              }}
                                              className={`px-4 py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${serviceForm.metadata?.safetyFeatures?.includes(safe) ? 'bg-primary border-primary text-white' : 'bg-white border-foreground/5 text-foreground/30'}`}
                                            >
                                              {safe}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                            )}

                            {/* 8. GENERAL HOTEL SERVICES */}
                            {selectedSector === "hotel" && Array.isArray(serviceForm.category) && serviceForm.category.includes("general_services") && (
                              <div className="col-span-full space-y-8 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary border-b border-primary/10 pb-2 mb-6 ml-2 flex items-center gap-3">
                                  <ShieldCheck className="w-4 h-4" /> Comprehensive General Intelligence
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Service Type</label>
                                    <input
                                      value={serviceForm.metadata?.generalServiceType || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, generalServiceType: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Laundry, Concierge, Gift Shop..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Availability Loop</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.generalAvailability || "24/7"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, generalAvailability: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="24/7">24/7 Operations</option>
                                        <option value="daytime">Daytime Only</option>
                                        <option value="seasonal">Seasonal Operations</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Service Price</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.generalServicePrice || 0}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, generalServicePrice: parseFloat(e.target.value) } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Response Time</label>
                                    <input
                                      value={serviceForm.metadata?.responseTime || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, responseTime: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Instant, < 30 mins, 24 hours..."
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {(selectedSector === "tour_operator" || (Array.isArray(serviceForm.category) && serviceForm.category.includes("tour"))) && (
                              <div className="col-span-full space-y-16 animate-fade-in relative mt-8 pt-8 border-t border-foreground/[0.05]">
                                {/* 1. Basic Tour Overview */}
                                <div className="space-y-6">
                                  <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary/60 border-b border-primary/10 pb-2">1. Basic Tour Overview</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Expedition Duration</label>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="relative group">
                                          <div className="absolute top-1/2 -translate-y-1/2 right-6 text-xs font-black text-foreground/20 uppercase tracking-widest pointer-events-none group-focus-within:text-primary transition-colors">Days</div>
                                          <input
                                            type="number"
                                            min="1"
                                            placeholder="1"
                                            value={serviceForm.metadata?.durationDays || ""}
                                            onChange={e => {
                                              const d = parseInt(e.target.value) || 0;
                                              setServiceForm({
                                                ...serviceForm,
                                                metadata: {
                                                  ...serviceForm.metadata,
                                                  durationDays: d,
                                                  durationNights: serviceForm.metadata?.durationNights || Math.max(0, d - 1)
                                                }
                                              });
                                            }}
                                            className="w-full bg-white px-8 py-5 rounded-[28px] border border-foreground/5 font-black text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20 appearance-none"
                                          />
                                        </div>
                                        <div className="relative group">
                                          <div className="absolute top-1/2 -translate-y-1/2 right-6 text-xs font-black text-foreground/20 uppercase tracking-widest pointer-events-none group-focus-within:text-primary transition-colors">Nights</div>
                                          <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={serviceForm.metadata?.durationNights ?? ""}
                                            onChange={e => {
                                              const n = parseInt(e.target.value) || 0;
                                              setServiceForm({
                                                ...serviceForm,
                                                metadata: {
                                                  ...serviceForm.metadata,
                                                  durationNights: n,
                                                  durationDays: serviceForm.metadata?.durationDays || n + 1
                                                }
                                              });
                                            }}
                                            className="w-full bg-white px-8 py-5 rounded-[28px] border border-foreground/5 font-black text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20 appearance-none"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 px-3 md:px-4 lg:px-5 py-3 bg-primary/[0.03] rounded-2xl border border-primary/5 w-fit">
                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-xs font-black uppercase tracking-wider text-primary/60">
                                          Registry Sync: {serviceForm.metadata?.durationDays || 0} Days & {serviceForm.metadata?.durationNights || 0} Nights
                                        </span>
                                      </div>
                                    </div>
                                    <div className="space-y-3 relative">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Tour Type</label>
                                      {selectedSector === "tour_operator" ? (
                                        <div className="relative">
                                          <button
                                            type="button"
                                            onClick={() => setShowTourTypeDropdown(!showTourTypeDropdown)}
                                            className="w-full bg-white px-8 py-5 rounded-[30px] border border-foreground/5 font-black text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20 flex items-center justify-between"
                                          >
                                            <div className="flex flex-wrap gap-2 truncate pr-4">
                                              {Array.isArray(serviceForm.category) && serviceForm.category.length > 0 ? (
                                                serviceForm.category.map((c: string) => {
                                                  const labels: any = {
                                                    tour: "Curated Tour", expedition: "Multi-Day Expedition", culture: "Cultural Experience",
                                                    wildlife: "Wildlife Safari", hiking: "Hiking & Trekking", logistics: "Logistics & Transport",
                                                    niche: "Niche Artifact", custom: "Custom Category"
                                                  };
                                                  return <span key={c} className="bg-primary/5 text-primary px-3 py-1 rounded-full text-xs">{labels[c] || c}</span>;
                                                })
                                              ) : (
                                                <span className="text-foreground/20">Select Strategic Tour Classifications...</span>
                                              )}
                                            </div>
                                            <ChevronLeft className={`w-4 h-4 text-primary transition-transform duration-500 ${showTourTypeDropdown ? 'rotate-90' : '-rotate-90'}`} />
                                          </button>

                                          {showTourTypeDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-4 p-6 bg-white border border-foreground/[0.05] rounded-[40px] shadow-premium z-[110] space-y-3 animate-fade-in backdrop-blur-xl">
                                              {[
                                                { value: "tour", label: "Curated Tour" },
                                                { value: "expedition", label: "Multi-Day Expedition" },
                                                { value: "culture", label: "Cultural Experience" },
                                                { value: "wildlife", label: "Wildlife Safari" },
                                                { value: "hiking", label: "Hiking & Trekking" },
                                                { value: "logistics", label: "Logistics & Transport" },
                                                { value: "niche", label: "Niche Artifact" }
                                              ].map((opt: any) => {
                                                const isChecked = Array.isArray(serviceForm.category) && serviceForm.category.includes(opt.value);
                                                return (
                                                  <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => {
                                                      const current = Array.isArray(serviceForm.category) ? [...serviceForm.category] : [];
                                                      const next = isChecked ? current.filter(c => c !== opt.value) : [...current, opt.value];
                                                      setServiceForm({ ...serviceForm, category: next });
                                                    }}
                                                    className={`w-full flex items-center justify-between p-4 rounded-[20px] transition-all ${isChecked ? 'bg-primary/5 text-primary' : 'hover:bg-foreground/[0.02] text-foreground/40'}`}
                                                  >
                                                    <span className="text-sm font-black uppercase tracking-widest">{opt.label}</span>
                                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-primary border-primary' : 'border-foreground/10'}`}>
                                                      {isChecked && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                  </button>
                                                );
                                              })}

                                              {/* Add Custom Type Action */}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const isRemoving = isAddingCustomCategory;
                                                  setIsAddingCustomCategory(!isRemoving);
                                                  setShowTourTypeDropdown(false);

                                                  const current = Array.isArray(serviceForm.category) ? [...serviceForm.category] : [];
                                                  if (!isRemoving) {
                                                    // When adding, ensure 'tour' is present so form fields show up
                                                    const next = Array.from(new Set([...current, "tour", "custom"]));
                                                    setServiceForm({ ...serviceForm, category: next });
                                                  } else {
                                                    // When removing, just remove the 'custom' tag
                                                    setServiceForm({ ...serviceForm, category: current.filter(c => c !== 'custom') });
                                                  }
                                                }}
                                                className={`w-full flex items-center justify-between p-4 rounded-[20px] transition-all border-2 border-dashed ${isAddingCustomCategory ? 'bg-foreground text-background border-foreground shadow-lg' : 'border-foreground/5 text-foreground/40 hover:border-primary/20 hover:bg-white'}`}
                                              >
                                                <span className="text-sm font-black uppercase tracking-widest">{isAddingCustomCategory ? 'Modify Custom Type' : 'Add Custom Type'}</span>
                                                <Plus className={`w-4 h-4 transition-all ${isAddingCustomCategory ? 'rotate-45' : ''}`} />
                                              </button>
                                            </div>
                                          )}

                                          {isAddingCustomCategory && (
                                            <div className="mt-8 animate-slide-up relative group">
                                              <div className="absolute -top-3 left-8 px-3 bg-white text-[9px] font-black uppercase tracking-[0.3em] text-primary z-20">Custom Type Descriptor</div>
                                              <input
                                                value={serviceForm.customCategory || ""}
                                                onChange={(e) => setServiceForm({ ...serviceForm, customCategory: e.target.value })}
                                                placeholder="Traditional Coffee Ceremony, Luxury Helicopter Tour..."
                                                className="w-full px-8 py-6 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[28px] font-black text-sm outline-none ring-primary/5 focus:ring-8 focus:bg-white focus:border-primary/20 transition-all placeholder:text-foreground/5"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <input required value={serviceForm.metadata?.tourType || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, tourType: e.target.value } })} placeholder="Adventure, Cultural, Luxury..." className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                      )}
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Destination(s)</label>
                                      <input required value={serviceForm.metadata?.destinations || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, destinations: e.target.value } })} placeholder="Cities, regions, landmarks" className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                  </div>
                                </div>

                                {/* 2. Pricing & Included */}
                                <div className="space-y-6">
                                  <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary/60 border-b border-primary/10 pb-2">2. Pricing & What's Included</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Pricing Type</label>
                                        <div className="relative group/select">
                                          <select
                                            value={serviceForm.metadata?.pricingType || "Per Person"}
                                            onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, pricingType: e.target.value } })}
                                            className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none cursor-pointer focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20 appearance-none pr-12"
                                          >
                                            <option value="Per Person">Per Person</option>
                                            <option value="Per Group">Per Group</option>
                                          </select>
                                          <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Maximum Capacity</label>
                                        <input
                                          type="number"
                                          value={serviceForm.availability?.quantity || 1}
                                          onChange={e => setServiceForm({ ...serviceForm, availability: { ...serviceForm.availability, quantity: parseInt(e.target.value) || 1 } })}
                                          className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20"
                                        />
                                      </div>
                                    <div className="md:col-span-2 space-y-4">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Inclusion Inventory (Standard Artifacts)</label>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {[
                                          { key: "meals", label: "Meals", icon: "🍽️" },
                                          { key: "transport", label: "Transport", icon: "🚐" },
                                          { key: "guide", label: "Guide", icon: "👤" },
                                          { key: "insurance", label: "Insurance", icon: "🛡️" },
                                          { key: "accommodation", label: "Stay", icon: "🏨" },
                                          { key: "equipment", label: "Gear", icon: "⛺" }
                                        ].map((item) => {
                                          const isIncluded = serviceForm.metadata?.inclusionMatrix?.[item.key];
                                          return (
                                            <button
                                              key={item.key}
                                              type="button"
                                              onClick={() => setServiceForm({
                                                ...serviceForm,
                                                metadata: {
                                                  ...serviceForm.metadata,
                                                  inclusionMatrix: {
                                                    ...(serviceForm.metadata?.inclusionMatrix || {}),
                                                    [item.key]: !isIncluded
                                                  }
                                                }
                                              })}
                                              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isIncluded ? 'bg-primary/5 border-primary/20 text-primary shadow-sm' : 'bg-white border-foreground/5 text-foreground/30 hover:border-foreground/10'}`}
                                            >
                                              <span className="text-lg">{item.icon}</span>
                                              <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                                              {isIncluded && <Check className="w-3 h-3 ml-auto" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Specific Inclusions / Extra Details</label>
                                      <input required value={serviceForm.metadata?.included || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, included: e.target.value } })} placeholder="e.g. Park entrance fees, tent, local airfare..." className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">NOT Included</label>
                                      <input required value={serviceForm.metadata?.notIncluded || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, notIncluded: e.target.value } })} placeholder="Flights, Personal expenses..." className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                  </div>
                                </div>

                                {/* 3. Departure & Logistics */}
                                <div className="space-y-6">
                                  <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary/60 border-b border-primary/10 pb-2">3. Departure Details</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-3 lg:col-span-2">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Start Location</label>
                                      <input required value={serviceForm.metadata?.startLocation || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, startLocation: e.target.value } })} placeholder="Exact starting place" className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                    <div className="space-y-3 lg:col-span-2">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Departure Date (Official Commencement)</label>
                                      <input
                                        required
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={serviceForm.metadata?.departureDates || ""}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, departureDates: e.target.value } })}
                                        className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20"
                                      />
                                      {serviceForm.metadata?.departureDates && new Date(serviceForm.metadata.departureDates) < new Date().setHours(0, 0, 0, 0) && (
                                        <div className="mt-2 text-xs font-bold text-red-500 italic px-4">
                                          ⚠ Temporal Exception: Departure date must be in the future.
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-3 lg:col-span-2">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Min Group Size</label>
                                      <input required type="number" value={serviceForm.metadata?.minGroupSize || 1} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, minGroupSize: parseInt(e.target.value) || 1 } })} className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                    <div className="space-y-3 lg:col-span-2">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Max Group Size</label>
                                      <input required type="number" value={serviceForm.metadata?.maxGroupSize || 10} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, maxGroupSize: parseInt(e.target.value) || 10 } })} className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                  </div>
                                </div>

                                {/* 4. Infrastructure */}
                                <div className="space-y-6">
                                  <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary/60 border-b border-primary/10 pb-2">4. Accommodation & Transport</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Accommodation Type</label>
                                      <input required value={serviceForm.metadata?.accommodationType || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, accommodationType: e.target.value } })} placeholder="Budget, mid-range, luxury" className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                    <div className="space-y-3">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Room Specs & Amenities</label>
                                      <input required value={serviceForm.metadata?.accommodationAmenities || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, accommodationAmenities: e.target.value } })} placeholder="Shared/Private, WiFi..." className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                    <div className="space-y-3">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Transport Protocol</label>
                                      <input required value={serviceForm.metadata?.transportType || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, transportType: e.target.value } })} placeholder="Minibus, SUV, Flight..." className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                    <div className="space-y-3">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Transport Condition</label>
                                      <input required value={serviceForm.metadata?.transportCondition || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, transportCondition: e.target.value } })} placeholder="AC, comfort level" className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                  </div>
                                </div>

                                {/* 5. Requirements & Safety */}
                                <div className="space-y-6">
                                  <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary/60 border-b border-primary/10 pb-2">5. Requirements & Safety Info</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Fitness Level</label>
                                      <div className="relative group/select">
                                        <select
                                          value={serviceForm.metadata?.fitnessLevel || "Basic"}
                                          onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, fitnessLevel: e.target.value } })}
                                          className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none cursor-pointer focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20 appearance-none pr-12"
                                        >
                                          <option value="Basic">Basic / Leisure</option>
                                          <option value="Moderate">Moderate / Active</option>
                                          <option value="Advanced">Advanced / Elite</option>
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Required Documents</label>
                                      <input required value={serviceForm.metadata?.requiredDocuments || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, requiredDocuments: e.target.value } })} placeholder="Passport, Visa..." className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Emergency Contact & Safety</label>
                                      <input required value={serviceForm.metadata?.emergencyContact || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, emergencyContact: e.target.value } })} placeholder="Emergency numbers, guide qualifications" className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                  </div>
                                </div>

                                {/* 6. Policy & Standing Out */}
                                <div className="space-y-6">
                                  <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary/60 border-b border-primary/10 pb-2">6. Policy & Extra Value</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Official Cancellation Deadline Date</label>
                                      <input required type="date" value={serviceForm.metadata?.cancellationDeadline || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, cancellationDeadline: e.target.value } })} className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                      {serviceForm.metadata?.departureDates && serviceForm.metadata?.cancellationDeadline &&
                                        new Date(serviceForm.metadata.cancellationDeadline) > new Date(serviceForm.metadata.departureDates) && (
                                          <div className="mt-2 text-xs font-bold text-red-500 italic px-4 animate-pulse">
                                            ⚠ Policy Exception: Cancellation deadline cannot fall after the commencement date.
                                          </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Value Proposition</label>
                                      <input required value={serviceForm.metadata?.uniqueExperiences || ""} onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, uniqueExperiences: e.target.value } })} placeholder="Unique experiences, bonuses" className="w-full bg-white px-3 md:px-4 lg:px-5 py-4 rounded-3xl border border-foreground/5 font-bold text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all focus:border-primary/20" />
                                    </div>
                                  </div>
                                </div>

                                {/* 7. Detailed Itinerary Builder */}
                                <div className="space-y-6 mt-8 pt-8 border-t border-foreground/10">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-black uppercase tracking-[0.4em] text-primary">
                                      {(() => {
                                        const categories = Array.isArray(serviceForm.category) ? serviceForm.category : [];
                                        if (categories.includes("culture")) return "7. Cultural Experience Itinerary";
                                        if (categories.includes("expedition")) return "7. Detailed Expedition Itinerary";
                                        if (categories.includes("hiking")) return "7. Trekking & Hiking Itinerary";
                                        if (categories.includes("wildlife")) return "7. Wildlife Safari Sequence";
                                        if (categories.includes("custom") && serviceForm.customCategory) return `7. ${serviceForm.customCategory} Itinerary`;
                                        return "7. Detailed Strategic Itinerary";
                                      })()}
                                    </h5>
                                    <button type="button" onClick={handleAddItineraryDay} className="flex items-center gap-2 px-3 md:px-4 lg:px-5 py-3 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                                      <Plus className="w-3 h-3" /> Add Day
                                    </button>
                                  </div>
                                  <div className="space-y-6">
                                    {(serviceForm.metadata?.itinerary || []).map((day: any, idx: number) => (
                                      <div key={idx} className="p-8 bg-white border border-foreground/5 rounded-[30px] shadow-sm relative group transition-all hover:border-primary/20">
                                        <button type="button" onClick={() => handleRemoveItineraryDay(idx)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="mb-6 flex items-center gap-3">
                                          <span className="px-4 py-1.5 bg-foreground/5 rounded-full text-xs font-black uppercase tracking-[0.2em] text-foreground/40 border border-foreground/10">Day {day.day}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="space-y-3">
                                            <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-2">Activities / Locations</label>
                                            <input required value={day.activities || ""} onChange={e => handleUpdateItineraryDay(idx, "activities", e.target.value)} placeholder="Main events, sights..." className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-xs outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all" />
                                          </div>
                                          <div className="space-y-3">
                                            <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-2">Overnight Stay</label>
                                            <input required value={day.overnightStay || ""} onChange={e => handleUpdateItineraryDay(idx, "overnightStay", e.target.value)} placeholder="Hotel, Lodge, Camping..." className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-xs outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all" />
                                          </div>
                                          <div className="space-y-3 md:col-span-2">
                                            <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-2">Timing / Sequence</label>
                                            <input required value={day.timing || ""} onChange={e => handleUpdateItineraryDay(idx, "timing", e.target.value)} placeholder="08:00 AM - Departure, 12:00 PM - Lunch..." className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-xs outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all" />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    {(!serviceForm.metadata?.itinerary || serviceForm.metadata.itinerary.length === 0) && (
                                      <div className="text-center py-12 px-3 md:px-4 lg:px-5 border-2 border-dashed border-foreground/5 rounded-[40px] bg-foreground/[0.01]">
                                        <Compass className="w-10 h-10 text-foreground/10 mx-auto mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest text-foreground/30">No Itinerary Days Segmented</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ========================================== */}
                            {/* EVENT ORGANIZER DETAILS */}
                            {/* ========================================== */}
                            
                            {/* EVENT VENUE */}
                            {selectedSector === "event_organizer" && Array.isArray(serviceForm.category) && serviceForm.category.includes("venue") && (
                              <div className="col-span-full space-y-10 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5 relative overflow-hidden group/venue">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                                  <Box className="w-4 h-4" /> Event Venue Intelligence
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Space Type</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.spaceType || "indoor"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, spaceType: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="indoor">Indoor Hall</option>
                                        <option value="outdoor">Outdoor / Garden</option>
                                        <option value="rooftop">Rooftop Terrace</option>
                                        <option value="mixed">Mixed Indoor & Outdoor</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Maximum Capacity</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.capacity || 100}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, capacity: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Seating Layouts Available</label>
                                    <input
                                      value={serviceForm.metadata?.layouts || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, layouts: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Theater, Banquet, Classroom..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">AV Equipment Included</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.avIncluded || "no"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, avIncluded: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="yes">Yes (Projector, Mic, Sound)</option>
                                        <option value="no">No (Bring Your Own)</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* CATERING */}
                            {(selectedSector === "event_organizer" || selectedSector === "restaurant") && Array.isArray(serviceForm.category) && serviceForm.category.includes("catering") && (
                              <div className="col-span-full space-y-10 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5 relative overflow-hidden group/catering">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                                  <Utensils className="w-4 h-4" /> Catering & Culinary Intelligence
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Menu Archetype</label>
                                    <input
                                      value={serviceForm.metadata?.menuType || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, menuType: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Buffet, Plated 3-Course, Cocktail Canapés..."
                                    />
                                  </div>

                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Maximum Capacity</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.capacity || 100}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, capacity: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>

                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Service Staff Included</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.staffIncluded || "yes"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, staffIncluded: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="yes">Waiters & Servers Included</option>
                                        <option value="no">Food Drop-off Only</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Dietary Options</label>
                                    <input
                                      value={serviceForm.metadata?.dietary || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, dietary: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Vegan, Fasting (Tsom), Gluten-Free..."
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* CORPORATE MEETING */}
                            {selectedSector === "event_organizer" && Array.isArray(serviceForm.category) && serviceForm.category.includes("corporate") && (
                              <div className="col-span-full space-y-10 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5 relative overflow-hidden group/corporate">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                                  <Briefcase className="w-4 h-4" /> Corporate Meeting Intelligence
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Meeting Format</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.meetingFormat || "boardroom"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, meetingFormat: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="boardroom">Boardroom</option>
                                        <option value="seminar">Seminar / Workshop</option>
                                        <option value="conference">Large Conference</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Business Amenities Included</label>
                                    <input
                                      value={serviceForm.metadata?.businessAmenities || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, businessAmenities: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="High-Speed Wi-Fi, Print Station, Whiteboards..."
                                    />
                                  </div>

                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Maximum Capacity</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.capacity || 100}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, capacity: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* AV / TECH SUPPORT */}
                            {selectedSector === "event_organizer" && Array.isArray(serviceForm.category) && serviceForm.category.includes("av") && (
                              <div className="col-span-full space-y-10 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5 relative overflow-hidden group/av">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                                  <Monitor className="w-4 h-4" /> AV & Tech Intelligence
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Equipment Domain</label>
                                    <input
                                      value={serviceForm.metadata?.avEquipment || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, avEquipment: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Sound Systems, LED Screens, Lighting Rigs..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">On-Site Technician Included</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.technicianIncluded || "yes"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, technicianIncluded: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="yes">Yes, Dedicated Technician</option>
                                        <option value="no">Equipment Drop-off Only</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ========================================== */}
                            {/* RESTAURANT DETAILS */}
                            {/* ========================================== */}
                            
                            {/* DINING & SEATING */}
                            {selectedSector === "restaurant" && Array.isArray(serviceForm.category) && (serviceForm.category.includes("dining") || serviceForm.category.includes("seating")) && (
                              <div className="col-span-full space-y-10 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5 relative overflow-hidden group/rest-dining">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                                  <Utensils className="w-4 h-4" /> Dining & Seating Intelligence
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Cuisine Identity</label>
                                    <input
                                      value={serviceForm.metadata?.cuisineIdentity || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, cuisineIdentity: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Traditional Habesha, Italian Fusion..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Seating Experience</label>
                                    <div className="relative group/select">
                                      <select
                                        value={serviceForm.metadata?.seatingType || "indoor"}
                                        onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, seatingType: e.target.value } })}
                                        className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-12"
                                      >
                                        <option value="indoor">Main Dining Room</option>
                                        <option value="outdoor">Patio / Garden</option>
                                        <option value="private">Private VIP Room</option>
                                        <option value="bar">Chef's Table / Bar</option>
                                      </select>
                                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-3 md:col-span-2">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Atmosphere / Vibe</label>
                                    <input
                                      value={serviceForm.metadata?.vibe || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, vibe: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Romantic, Casual, Fine-Dining, High-Energy..."
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* RESTAURANT PRIVATE EVENT & BAR */}
                            {selectedSector === "restaurant" && Array.isArray(serviceForm.category) && (serviceForm.category.includes("event") || serviceForm.category.includes("bar")) && (
                              <div className="col-span-full space-y-10 animate-fade-in p-8 rounded-[40px] bg-white border border-foreground/5 relative overflow-hidden group/rest-event">
                                <h5 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                                  <GlassWater className="w-4 h-4" /> Lounge & Event Intelligence
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Beverage Focus</label>
                                    <input
                                      value={serviceForm.metadata?.beverageFocus || ""}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, beverageFocus: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Signature Cocktails, Craft Beers, Wine Selection..."
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/40 ml-4">Private Hire Minimum Spend</label>
                                    <input
                                      type="number"
                                      value={serviceForm.metadata?.minSpend || 0}
                                      onChange={e => setServiceForm({ ...serviceForm, metadata: { ...serviceForm.metadata, minSpend: e.target.value } })}
                                      className="w-full bg-foreground/[0.02] px-3 md:px-4 lg:px-5 py-4 rounded-2xl border border-foreground/5 font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                      placeholder="Amount in your currency..."
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                        <div className="md:col-span-2 space-y-4 group">
                          <label className="text-sm font-black uppercase tracking-[0.3em] text-foreground/60 px-3 md:px-4 lg:px-5">Detailed Strategic Narrative</label>
                          <textarea
                            required
                            value={serviceForm.description || ""}
                            onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                            rows={6}
                            placeholder="Describe the unique experiential parameters of this institutional artifact..."
                            className="w-full px-8 py-6 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[32px] font-bold text-sm outline-none resize-none focus:ring-8 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all placeholder:text-foreground/5"
                          />
                        </div>

                        {/* Media Assets */}
                        <div className="md:col-span-2 space-y-8">
                          <div className="flex items-center justify-between px-3 md:px-4 lg:px-5">
                            <label className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30">Institutional Portfolio Synchronization</label>
                            <span className="px-4 py-1 rounded-full bg-primary/10 text-[9px] font-black text-primary uppercase tracking-widest">{serviceForm.images.length} / 10 Assets</span>
                          </div>

                          <div className="flex flex-col md:flex-row items-center gap-8 p-10 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[50px] group hover:bg-white hover:border-primary/20 hover:shadow-premium transition-all duration-700">
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
                              className={`w-full md:w-auto px-12 py-7 bg-foreground text-background rounded-[30px] text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-5 cursor-pointer hover:bg-primary active:scale-95 ${serviceForm.images.length >= 10 ? "opacity-30 cursor-not-allowed pointer-events-none" : "shadow-2xl shadow-black/20"}`}
                            >
                              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                              {isUploading ? "Synchronizing..." : "Sync Visual Artifacts"}
                            </label>
                            <div className="flex-1 text-center md:text-left">
                              <p className="text-xs font-black text-foreground/20 uppercase tracking-[0.1em]">Atmospheric Asset Requirements</p>
                              <p className="text-xs text-foreground/40 font-medium mt-1 italic">High-resolution JPG/PNG landscape preferred for institutional indexing.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6 mt-6">
                            {serviceForm.images.length === 0 ? (
                              <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-foreground/5 rounded-[40px] bg-foreground/[0.005]">
                                <Box className="w-12 h-12 text-foreground/5 mb-4" />
                                <p className="text-xs font-black text-foreground/10 uppercase tracking-[0.4em]">Zero Visual Artifacts Synchronized</p>
                              </div>
                            ) : (
                              serviceForm.images.map((img: string, i: number) => (
                                <div key={i} className="relative group aspect-[4/3] rounded-[24px] overflow-hidden border border-foreground/[0.05] shadow-inner bg-white hover-lift transition-all duration-700">
                                  <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" alt="Service" />
                                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-4">
                                    <button
                                      type="button"
                                      onClick={() => setServiceForm({ ...serviceForm, images: serviceForm.images.filter((_: any, idx: number) => idx !== i) })}
                                      className="w-10 h-10 bg-red-500/90 text-white rounded-xl flex items-center justify-center hover:bg-red-600 transition-all shadow-xl hover:rotate-90 duration-500"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[8px] font-black flex items-center gap-1.5 text-foreground shadow-sm">
                                    <span className="text-primary">{i + 1}</span>
                                    {i === 0 && <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />}
                                    {i === 0 && <span className="text-[7px] text-primary/60">Primary Identity</span>}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="space-y-6">
                          <label className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30 px-3 md:px-4 lg:px-5">Institutional Pricing (ETB)</label>
                          <div className="relative group">
                            <input
                              required
                              type="number"
                              value={serviceForm.price || 0}
                              readOnly={selectedSector === "hotel"}
                              onChange={e => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                              className={`w-full px-8 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[24px] font-black text-xl tracking-tighter outline-none transition-all ${selectedSector === "hotel" ? 'cursor-not-allowed opacity-70' : 'focus:bg-white focus:border-primary/20 focus:ring-8 focus:ring-primary/5'}`}
                            />
                            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary uppercase tracking-[0.3em]">
                              {selectedSector === "hotel" ? "Calculated (Birr)" : "Official Birr"}
                            </span>
                          </div>
                        </div>





                        <div className="space-y-6">
                          <label className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30 px-3 md:px-4 lg:px-5">Trade Currency</label>
                          <div className="relative group/select">
                            <select
                              value={serviceForm.currency || "ETB"}
                              onChange={e => setServiceForm({ ...serviceForm, currency: e.target.value })}
                              className="w-full px-8 py-5 bg-foreground/[0.01] border border-foreground/[0.05] rounded-[24px] font-black text-sm uppercase tracking-widest outline-none focus:bg-white focus:border-primary/20 focus:ring-8 focus:ring-primary/5 transition-all appearance-none cursor-pointer pr-16"
                            >
                              <option value="ETB">ETB (Ethiopian Birr)</option>
                              <option value="USD">USD (US Dollar)</option>
                              <option value="EUR">EUR (Euro)</option>
                            </select>
                            <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-12 mt-4 border-t border-foreground/[0.05] flex flex-col items-center">
                        <div className="max-w-md text-center mb-8">
                          <p className="text-sm font-black text-foreground/60 uppercase tracking-[0.3em]">
                            {serviceForm._id ? "Registry Update Confirmation" : "Final Terminal Action"}
                          </p>
                          <p className="text-sm text-foreground/70 mt-2 font-medium">
                            {serviceForm._id ? "Synchronize these modifications with the global Wondar Ethiopia registry." : "Synchronize this experiential artifact with the global Wondar Ethiopia registry."}
                          </p>
                        </div>
                        <button
                          onClick={handleAddService}
                          disabled={isAdding}
                          className="w-full max-w-sm py-6 bg-foreground text-background text-sm font-black uppercase tracking-[0.3em] rounded-[30px] hover:bg-primary transition-all active:scale-[0.98] shadow-2xl shadow-black/20 flex items-center justify-center gap-4 group disabled:opacity-50"
                        >
                          {isAdding ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse group-hover:bg-background" />
                          )}
                          {isAdding ? "Finalizing Registry..." : (serviceForm._id ? "Commit Registry Updates" : "Finalize Registry")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>



        {/* Category Request Modal (Registration Portal Style) */}
        {isRequestingCategory && (
          <div className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/80 backdrop-blur-xl animate-fade-in p-6 sm:p-8 overflow-y-auto pt-10 sm:pt-20">
            <div className="bg-white rounded-[60px] w-full max-w-4xl overflow-hidden shadow-premium animate-slide-up relative">
              <div className="max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="p-12 md:p-20 space-y-16">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-[9px] font-black tracking-[0.2em] text-primary uppercase bg-primary/5 rounded-full border border-primary/10">
                        Institutional Expansion Portal
                      </div>
                      <h3 className="text-4xl font-black tracking-tightest leading-none">Expansion <span className="text-primary italic">Registry.</span></h3>
                      <p className="text-foreground/40 text-sm mt-4 font-medium italic">Apply for new certified business domains within the Wonder Ethiopia ecosystem.</p>
                    </div>
                    <button
                      onClick={() => setIsRequestingCategory(false)}
                      className="w-16 h-16 rounded-[28px] bg-foreground/5 flex items-center justify-center text-foreground/40 hover:bg-red-50 hover:text-red-500 transition-all group"
                    >
                      <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                  </div>

                  <form onSubmit={handleRequestCategory} className="space-y-16">
                    {/* Category Selection */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 text-primary">
                        <Layout className="w-5 h-5" />
                        <h3 className="text-sm font-black uppercase tracking-[0.3em]">Protocol Domains</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { value: "hotel", label: "Hotels & Lodging", icon: <Bed className="w-5 h-5" /> },
                          { value: "tour_operator", label: "Tour Operator", icon: <Compass className="w-5 h-5" /> },
                          { value: "car_rental", label: "Car Rental", icon: <Car className="w-5 h-5" /> },
                          { value: "event_organizer", label: "Events & MICE", icon: <Calendar className="w-5 h-5" /> }
                        ].map((cat) => {
                          const isOwned = business?.category?.includes(cat.value);
                          const isSelected = categoryRequestForm.categories.includes(cat.value);
                          return (
                            <div
                              key={cat.value}
                              onClick={() => !isOwned && handleRequestCategoryToggle(cat.value)}
                              className={`p-6 rounded-[32px] border-2 transition-all duration-500 flex flex-col items-center justify-center gap-4 text-center group cursor-pointer ${isOwned ? "bg-foreground/[0.02] border-foreground/[0.05] opacity-50 cursor-not-allowed" :
                                isSelected ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" :
                                  "bg-white border-foreground/[0.05] hover:border-primary/30 hover:bg-primary/[0.01]"
                                }`}
                            >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-white/20 text-white' : 'bg-primary/5 text-primary group-hover:scale-110'}`}>
                                {cat.icon}
                              </div>
                              <span className="text-sm font-black uppercase tracking-widest leading-none">{cat.label}</span>
                              {isOwned && <span className="text-[8px] font-black uppercase text-foreground/20 italic tracking-tighter">Already Verified</span>}
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Industry Fields (Dynamic) */}
                    {(categoryRequestForm.categories.length > 0) && (
                      <div className="space-y-12 animate-fade-in p-10 rounded-[40px] bg-foreground/[0.01] border border-foreground/[0.03]">
                        <div className="flex items-center gap-4 text-primary">
                          <FileText className="w-5 h-5" />
                          <h3 className="text-sm font-black uppercase tracking-[0.3em]">Institutional Verification Data</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-12">
                          {categoryRequestForm.categories.includes("hotel") && (
                            <div className="space-y-6 pt-4 border-t border-foreground/[0.03]">
                              <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em]">Hotel Expansion Protocol</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative group/select">
                                  <select
                                    required
                                    name="stars"
                                    onChange={handleRequestIndustryChange}
                                    className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none focus:ring-8 focus:ring-primary/5 appearance-none cursor-pointer pr-16"
                                  >
                                    <option value="">Star Rating Target</option>
                                    <option value="1">1 Star</option>
                                    <option value="2">2 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="5">5 Stars</option>
                                  </select>
                                  <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-hover/select:text-primary transition-colors pointer-events-none" />
                                </div>
                                <input required name="website" type="text" placeholder="Institutional Website" onChange={handleRequestIndustryChange} className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none focus:ring-8 focus:ring-primary/5" />
                                <div className="md:col-span-2 space-y-4">
                                  <label className="text-xs font-black tracking-widest uppercase text-foreground/30 px-3 md:px-4 lg:px-5">Upload Hospitality License</label>
                                  <div className="relative group">
                                    <input required name="hotelLicense" id="hotelLicense" type="file" onChange={handleRequestFileChange} className="hidden" accept=".pdf,image/*" />
                                    <label htmlFor="hotelLicense" className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none flex items-center justify-between cursor-pointer group-hover:border-primary/20 transition-all">
                                      <span className={categoryRequestForm.industryFiles?.hotelLicense ? "text-foreground truncate max-w-[80%]" : "text-foreground/40"}>
                                        {categoryRequestForm.industryFiles?.hotelLicense ? categoryRequestForm.industryFiles.hotelLicense.name : "Select Official Document..."}
                                      </span>
                                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                        {categoryRequestForm.industryFiles?.hotelLicense ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {categoryRequestForm.categories.includes("tour_operator") && (
                            <div className="space-y-6 pt-6 border-t border-foreground/[0.03]">
                              <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em]">Operator Expansion Protocol</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input required name="languages" type="text" placeholder="Global Languages Supported" onChange={handleRequestIndustryChange} className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none focus:ring-8 focus:ring-primary/5" />
                                <input required name="specialization" type="text" placeholder="Expedition Archetype Focus" onChange={handleRequestIndustryChange} className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none focus:ring-8 focus:ring-primary/5" />
                                <div className="md:col-span-2 space-y-4">
                                  <label className="text-xs font-black tracking-widest uppercase text-foreground/30 px-3 md:px-4 lg:px-5">Tour Operator Certificate</label>
                                  <div className="relative group">
                                    <input required name="tourCert" id="tourCert" type="file" onChange={handleRequestFileChange} className="hidden" accept=".pdf,image/*" />
                                    <label htmlFor="tourCert" className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none flex items-center justify-between cursor-pointer group-hover:border-primary/20 transition-all">
                                      <span className={categoryRequestForm.industryFiles?.tourCert ? "text-foreground truncate max-w-[80%]" : "text-foreground/40"}>
                                        {categoryRequestForm.industryFiles?.tourCert ? categoryRequestForm.industryFiles.tourCert.name : "Select Official Document..."}
                                      </span>
                                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                        {categoryRequestForm.industryFiles?.tourCert ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {categoryRequestForm.categories.includes("car_rental") && (
                            <div className="space-y-6 pt-6 border-t border-foreground/[0.03]">
                              <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em]">Transport Expansion Protocol</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input required name="fleetSize" type="number" placeholder="Fleet Density (Artifact Count)" onChange={handleRequestIndustryChange} className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none focus:ring-8 focus:ring-primary/5" />
                                <input required name="vehicleTypes" type="text" placeholder="Vehicle Archetypes (e.g. 4x4, Luxury)" onChange={handleRequestIndustryChange} className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none focus:ring-8 focus:ring-primary/5" />
                                <div className="md:col-span-2 space-y-4">
                                  <label className="text-xs font-black tracking-widest uppercase text-foreground/30 px-3 md:px-4 lg:px-5">Transport & Rental License</label>
                                  <div className="relative group">
                                    <input required name="carRentalLicense" id="carRentalLicense" type="file" onChange={handleRequestFileChange} className="hidden" accept=".pdf,image/*" />
                                    <label htmlFor="carRentalLicense" className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none flex items-center justify-between cursor-pointer group-hover:border-primary/20 transition-all">
                                      <span className={categoryRequestForm.industryFiles?.carRentalLicense ? "text-foreground truncate max-w-[80%]" : "text-foreground/40"}>
                                        {categoryRequestForm.industryFiles?.carRentalLicense ? categoryRequestForm.industryFiles.carRentalLicense.name : "Select Official Document..."}
                                      </span>
                                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                        {categoryRequestForm.industryFiles?.carRentalLicense ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {categoryRequestForm.categories.includes("event_organizer") && (
                            <div className="space-y-6 pt-6 border-t border-foreground/[0.03]">
                              <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em]">Events Expansion Protocol</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input required name="experienceYears" type="number" placeholder="Operational Experience (Years)" onChange={handleRequestIndustryChange} className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none focus:ring-8 focus:ring-primary/5" />
                                <input required name="eventType" type="text" placeholder="Primary Event Specialization" onChange={handleRequestIndustryChange} className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none focus:ring-8 focus:ring-primary/5" />
                                <div className="md:col-span-2 space-y-4">
                                  <label className="text-xs font-black tracking-widest uppercase text-foreground/30 px-3 md:px-4 lg:px-5">Event Organizer Certificate</label>
                                  <div className="relative group">
                                    <input required name="eventCert" id="eventCert" type="file" onChange={handleRequestFileChange} className="hidden" accept=".pdf,image/*" />
                                    <label htmlFor="eventCert" className="w-full px-8 py-5 bg-white border border-foreground/[0.05] rounded-[24px] text-sm font-bold outline-none flex items-center justify-between cursor-pointer group-hover:border-primary/20 transition-all">
                                      <span className={categoryRequestForm.industryFiles?.eventCert ? "text-foreground truncate max-w-[80%]" : "text-foreground/40"}>
                                        {categoryRequestForm.industryFiles?.eventCert ? categoryRequestForm.industryFiles.eventCert.name : "Select Official Document..."}
                                      </span>
                                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                        {categoryRequestForm.industryFiles?.eventCert ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <label className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30 px-3 md:px-4 lg:px-5">Strategic Justification</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Outline why your business is requesting these domain expansions..."
                        value={categoryRequestForm.reason}
                        onChange={e => setCategoryRequestForm({ ...categoryRequestForm, reason: e.target.value })}
                        className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-[40px] px-10 py-8 font-bold text-base outline-none focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all resize-none italic"
                      />
                    </div>

                    <div className="pt-8">
                      <button
                        type="submit"
                        disabled={isSubmittingRequest || categoryRequestForm.categories.length === 0}
                        className="w-full py-8 text-white text-sm font-black uppercase tracking-[0.4em] rounded-[32px] shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-6 group active:scale-[0.98]"
                        style={{ backgroundColor: '#FFAA33' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E6992E')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFAA33')}
                      >
                        {isSubmittingRequest ? <Loader2 className="w-6 h-6 animate-spin" /> : <div className="w-3 h-3 rounded-full bg-white group-hover:scale-150 transition-transform" />}
                        {isSubmittingRequest ? "Transmitting Credentials..." : "Finalize Expansion Request"}
                      </button>
                      <p className="text-center text-xs font-black text-foreground/20 uppercase tracking-[0.3em] mt-10 italic">
                        Reviewed by institutional tourism & super admin authorities.
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Category Revocation Modal */}
        {isRevokingCategory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl overflow-hidden relative my-8">
              <button
                onClick={() => setIsRevokingCategory(false)}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-foreground/[0.03] flex items-center justify-center text-foreground/40 hover:bg-rose-500 hover:text-white transition-all z-10 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
              <div className="p-12 md:p-20">
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tightest">Domain Revocation Protocol</h2>
                    <p className="text-foreground/40 font-medium italic mt-2">Voluntarily surrender operational credentials for a specific category.</p>
                  </div>
                </div>
                <form onSubmit={submitRevokeCategory} className="space-y-12">
                  <div className="space-y-6">
                    <label className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30 px-3 md:px-4 lg:px-5">Select Domain to Revoke</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(business?.category || []).map((cat: string) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setRevokeForm({ ...revokeForm, category: cat })}
                          className={`p-6 rounded-3xl text-left transition-all border-2 ${revokeForm.category === cat ? 'border-rose-500 bg-rose-500/5 shadow-lg shadow-rose-500/10' : 'border-foreground/5 bg-foreground/[0.01] hover:border-rose-500/30'}`}
                        >
                          <span className="block text-sm font-black uppercase tracking-widest">{cat.replace(/_/g, " ")}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <label className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30 px-3 md:px-4 lg:px-5">Revocation Justification</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Provide the institutional reason for surrendering this credential..."
                      value={revokeForm.reason}
                      onChange={e => setRevokeForm({ ...revokeForm, reason: e.target.value })}
                      className="w-full bg-foreground/[0.02] border border-foreground/[0.05] rounded-[40px] px-10 py-8 font-bold text-base outline-none focus:bg-white focus:ring-8 focus:ring-rose-500/10 transition-all resize-none italic"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black tracking-widest uppercase text-foreground/30 px-3 md:px-4 lg:px-5">Supporting Document (Optional)</label>
                    <div className="relative group">
                      <input id="revokeDoc" type="file" onChange={(e) => setRevokeForm({ ...revokeForm, document: e.target.files?.[0] || null })} className="hidden" accept=".pdf,image/*" />
                      <label htmlFor="revokeDoc" className="w-full px-8 py-5 bg-foreground/[0.02] border border-foreground/[0.05] rounded-[40px] text-sm font-bold outline-none flex items-center justify-between cursor-pointer group-hover:border-rose-500/30 transition-all">
                        <span className={revokeForm.document ? "text-foreground truncate max-w-[80%]" : "text-foreground/40"}>
                          {revokeForm.document ? revokeForm.document.name : "Select Official Document..."}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 group-hover:bg-rose-500 group-hover:text-white transition-all shrink-0">
                          {revokeForm.document ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-8">
                    <button
                      type="submit"
                      disabled={isSubmittingRevoke || !revokeForm.category || !revokeForm.reason}
                      className="w-full py-8 text-white text-sm font-black uppercase tracking-[0.4em] rounded-[32px] shadow-2xl shadow-rose-500/20 transition-all flex items-center justify-center gap-6 group hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed bg-rose-500"
                    >
                      {isSubmittingRevoke ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      {isSubmittingRevoke ? "Executing Revocation..." : "Confirm Domain Surrender"}
                    </button>
                    <p className="text-center text-xs font-black text-rose-500/40 uppercase tracking-[0.3em] mt-10 italic">
                      Warning: This action is immediate and irrevocable.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Full Screen Image Modal - Root Level Placement */}
      {fullSvcGallery && (
        <div className="fixed inset-0 h-[100dvh] w-screen z-[9999] flex items-center justify-center bg-black animate-fade-in p-0 overflow-hidden touch-none"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="relative w-full h-[80vh] md:h-[85vh] flex items-center justify-center px-3 md:px-4 lg:px-5 md:px-24">
            <div className="relative w-full h-full rounded-[60px] overflow-hidden shadow-3xl shadow-white/5 border border-white/10 group/gallery">
              <Image
                src={services.find(s => s._id === fullSvcGallery.serviceId)?.images[fullSvcGallery.index] || ""}
                alt="Immersion"
                fill
                className="object-contain"
                priority
              />

              {/* Close Button Integrated Inside Image Box */}
              <button
                onClick={() => setFullSvcGallery(null)}
                className="absolute top-8 right-8 w-14 h-14 rounded-full glass flex items-center justify-center text-white hover:bg-white hover:text-black transition-all z-[70] shadow-2xl opacity-0 group-hover/gallery:opacity-100"
              >
                <ShieldCheck className="w-8 h-8 rotate-45" />
              </button>

              {/* Navigation Arrows Integrated Inside Image Container */}
              {fullSvcGallery.index > 0 && (
                <button
                  onClick={() => setFullSvcGallery(prev => prev ? ({ ...prev, index: prev.index - 1 }) : null)}
                  className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full glass flex items-center justify-center text-white hover:bg-white hover:text-black transition-all z-[60] shadow-2xl opacity-0 group-hover/gallery:opacity-100"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}

              {fullSvcGallery.index < (services.find(s => s._id === fullSvcGallery.serviceId)?.images.length || 0) - 1 && (
                <button
                  onClick={() => setFullSvcGallery(prev => prev ? ({ ...prev, index: prev.index + 1 }) : null)}
                  className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full glass flex items-center justify-center text-white hover:bg-white hover:text-black transition-all z-[60] shadow-2xl opacity-0 group-hover/gallery:opacity-100"
                >
                  <ChevronLeft className="w-8 h-8 rotate-180" />
                </button>
              )}

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-3 glass rounded-full text-xs font-black tracking-[0.2em] uppercase text-white z-50">
                Archive Asset {fullSvcGallery.index + 1} / {services.find(s => s._id === fullSvcGallery.serviceId)?.images.length}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mission Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl animate-fade-in" onClick={() => setSelectedBooking(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[64px] border border-foreground/[0.05] shadow-3xl overflow-hidden animate-slide-up">
            <div className="p-12 md:p-16 space-y-12">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-black tracking-[0.3em] uppercase text-primary">Mission Intel Report</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tightest uppercase">{selectedBooking.serviceId?.name || "Service Profile"}</h2>
                  <div className="text-xs font-bold text-foreground/30 uppercase mt-2">Registry ID: {selectedBooking._id}</div>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="w-14 h-14 rounded-full bg-foreground/5 hover:bg-foreground hover:text-white transition-all flex items-center justify-center">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mb-3">Primary Explorer</div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{selectedBooking.userId?.name || "Guest traveler"}</div>
                        <div className="text-xs text-foreground/40 font-medium">{selectedBooking.userId?.email}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mb-3">Logistics Frame</div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-primary/30" />
                        <div className="text-sm font-bold uppercase tracking-tight">Deployment: {new Date(selectedBooking.startDate).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Users className="w-5 h-5 text-primary/30" />
                        <div className="text-sm font-bold uppercase tracking-tight">{selectedBooking.guests} Total Explorers</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mb-3">Financial Settlement</div>
                    <div className="bg-primary/5 border border-primary/10 p-6 rounded-[32px]">
                      <div className="text-3xl font-black text-primary tracking-tighter leading-none mb-2">
                        {selectedBooking.currency} {selectedBooking.totalPrice?.toLocaleString()}
                      </div>
                      <div className="text-xs font-black uppercase tracking-widest text-emerald-500">Inventory Paid ✓</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-foreground/20 mb-3">Special Requirements</div>
                    <p className="text-sm font-bold text-foreground/60 leading-relaxed italic border-l-2 border-primary/20 pl-6">
                      {selectedBooking.specialRequests || "No specific modifications requested for this mission."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-foreground/5">
                <button onClick={() => setSelectedBooking(null)} className="w-full py-5 bg-foreground text-background rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-foreground/5">
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
