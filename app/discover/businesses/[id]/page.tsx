"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Star, 
  MapPin, 
  ChevronLeft, 
  ShieldCheck, 
  Globe, 
  AlertTriangle, 
  ArrowRight, 
  CalendarDays, 
  Compass, 
  Car, 
  Building, 
  Send, 
  User 
} from "lucide-react";
import { useSession } from "next-auth/react";

interface Business {
  _id: string;
  name: string;
  description: string;
  category: string | string[];
  location: { city: string; region: string; address: string };
  contactPhone: string;
  contactEmail: string;
  profilePicture?: string;
  updatedAt: string;
}

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    role: string;
  };
  userName?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Service {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  images: string[];
  metadata: Record<string, any>;
}

const categoryImages: Record<string, string> = {
  hotel: "/lalibela.png",
  tour_operator: "/simien-mountains.png",
  car_rental: "/restaurant.png",
  event_organizer: "/coffee-ceremony.png",
};

export default function BusinessDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAllServices, setShowAllServices] = useState(false);
  const [activeImageByService, setActiveImageByService] = useState<Record<string, number>>({});
  const [fullScreenGallery, setFullScreenGallery] = useState<{ serviceId: string, index: number } | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [selectedReviewService, setSelectedReviewService] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [eligibleServiceIds, setEligibleServiceIds] = useState<string[]>([]);

  // Reporting State
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?target_id=${id}&target_type=business`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        setAvgRating(data.avgRating);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  useEffect(() => {
    if (fullScreenGallery) {
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
  }, [fullScreenGallery]);

  useEffect(() => {
    if (!id) return;

    async function fetchBusiness() {
      try {
        setLoading(true);
        const res = await fetch(`/api/businesses/${id}`);
        const json = await res.json();
        
        if (json.data) {
          setBusiness(json.data);
          if (json.services) setServices(json.services);
          await fetchReviews();
        }
      } catch (error) {
        console.error("Failed to fetch business:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [id]);

  useEffect(() => {
    async function fetchBookings() {
      if (session?.user && id) {
        try {
          const res = await fetch("/api/bookings");
          const json = await res.json();
          if (json.bookings) {
            const eligible = json.bookings.filter((b: any) =>
              (b.businessId?._id === id || b.businessId === id) &&
              ["confirmed", "completed", "pending"].includes(b.status)
            );
            const uniqueIds = Array.from(new Set(eligible.map((b: any) => b.serviceId?._id || b.serviceId))) as string[];
            setEligibleServiceIds(uniqueIds);

            if (uniqueIds.length > 0 && !selectedReviewService) {
              setSelectedReviewService(uniqueIds[0]);
            }
          }
        } catch (e) {
          console.error("Failed to fetch past bookings for review validation", e);
        }
      }
    }
    fetchBookings();
  }, [session, id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }

    if (!newComment.trim()) {
      setErrorMessage("Please write a comment.");
      return;
    }

    if (!selectedReviewService) {
      setErrorMessage("Please select a service you have booked to review.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_id: selectedReviewService,
          target_type: "service",
          rating: newRating,
          comment: newComment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewComment("");
        setNewRating(5);
        await fetchReviews();
      } else {
        setErrorMessage(data.error || "Failed to submit review.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }

    if (!reportReason || !reportDescription) {
      setErrorMessage("Please fill all reporting fields.");
      return;
    }

    try {
      setReportStatus("submitting");
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: id,
          reason: reportReason,
          description: reportDescription,
        }),
      });

      if (res.ok) {
        setReportStatus("success");
        setReportReason("");
        setReportDescription("");
        setTimeout(() => {
          setReportModal(false);
          setReportStatus("idle");
        }, 2000);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to submit report.");
        setReportStatus("error");
      }
    } catch (error) {
      setErrorMessage("An error occurred.");
      setReportStatus("error");
    }
  };

  // Safe categorization check helper to choose target path dynamically
  const getRouteCategory = (svc: Service) => {
    const rawCat = Array.isArray(svc.category) ? svc.category[0] : svc.category;
    const standardCat = String(rawCat).toLowerCase();
    
    if (standardCat.includes('car') || standardCat.includes('rental') || standardCat.includes('vehicle')) {
      return "car_booking";
    }
    if (standardCat.includes('hotel') || standardCat.includes('room') || standardCat.includes('stay')) {
      return "hotel_booking";
    }
    return "general_booking";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <h1 className="text-4xl font-black mb-6 tracking-tight">Business Profile Not Found</h1>
        <p className="text-foreground/40 font-medium mb-10 max-w-sm">This partner profile may be private or has been temporarily de-listed.</p>
        <Link href="/discover/businesses" className="px-12 py-5 bg-primary text-white font-black rounded-full shadow-2xl shadow-primary/20">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background text-foreground font-sans">
        {/* Top Banner */}
        <section className="relative h-[55vh] pt-24 px-3 md:px-4 lg:px-5">
          <div className="absolute inset-0 z-0 h-[45vh] bg-surface-elevated/50" />

          <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-start gap-12">
            <Link
              href="/discover/businesses"
              className="flex items-center gap-2 text-foreground/40 hover:text-primary transition-all bg-white/50 backdrop-blur-xl px-5 py-2.5 rounded-full border border-foreground/5 shadow-sm font-bold text-xs"
            >
              <ChevronLeft className="w-4 h-4" /> Discover Hub
            </Link>

            <div className="flex flex-col md:flex-row items-end justify-between w-full gap-12 mt-12 mb-20">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 mb-6 text-xs font-black tracking-[0.2em] text-primary uppercase bg-primary/10 rounded-full border border-primary/10">
                  Verified Partner <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[0.9]">
                  {business.name}
                </h1>
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex items-center gap-2.5 bg-primary/5 px-5 py-2.5 rounded-2xl border border-primary/10">
                    <Star className="w-5 h-5 fill-primary text-primary" />
                    <span className="font-black text-lg">{avgRating ? avgRating.toFixed(1) : "5.0"}</span>
                    <span className="text-xs font-black text-foreground/30 uppercase tracking-widest ml-2">{reviews.length} Experiences</span>
                  </div>
                  <div className="flex items-center gap-3 bg-foreground/5 px-5 py-2.5 rounded-2xl border border-foreground/5 font-bold text-sm text-foreground/60">
                    <MapPin className="w-5 h-5 text-primary/40" />
                    {business.location.city}, {business.location.region}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setReportModal(true)}
                className="flex items-center gap-3 px-8 py-4 bg-red-500/5 text-red-500 border border-red-500/10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/5 group"
              >
                <AlertTriangle className="w-4 h-4 group-hover:animate-bounce" /> Report Entity
              </button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="pb-24 px-3 md:px-4 lg:px-5">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">

            {/* Left Column: Details */}
            <div className="lg:col-span-8 space-y-24">

              {/* Gallery / Cover */}
              <div className="relative h-[600px] rounded-[60px] overflow-hidden shadow-2xl shadow-primary/5 border border-foreground/5">
                <Image
                  src={business.profilePicture ||
                    (Array.isArray(business.category) ? categoryImages[business.category[0]] : categoryImages[business.category]) ||
                    "/lalibela.png"}
                  alt={business.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-8 right-8 px-8 py-3 glass rounded-full text-xs font-black tracking-[0.2em] uppercase">
                  {Array.isArray(business.category)
                    ? business.category.map(c => c.replace("_", " ")).join(", ")
                    : business.category.replace("_", " ")}
                </div>
              </div>

              <div className="space-y-12">
                <h2 className="text-4xl font-bold tracking-tight">Our Mission</h2>
                <p className="text-xl text-foreground/50 leading-relaxed font-medium whitespace-pre-line max-w-4xl">
                  {business.description}
                </p>
              </div>

              {/* Partner Inventory / Services Section */}
              <div className="pt-24 border-t border-foreground/5 space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold tracking-tight">Partner Offerings</h2>
                    <p className="text-foreground/40 font-bold uppercase text-xs tracking-[0.3em]">Direct Inventory & Strategic Facilities</p>
                  </div>

                  {/* Filtration Chips */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setFilterCategory("all")}
                      className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${filterCategory === "all" ? 'bg-primary text-white' : 'bg-foreground/5 text-foreground/30 hover:bg-foreground/10'}`}
                    >
                      All Units
                    </button>
                    {(Array.isArray(business?.category) ? business.category : business?.category ? [business.category] : []).map((bizCat: string) => (
                      <button
                        key={bizCat}
                        onClick={() => setFilterCategory(bizCat)}
                        className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${filterCategory === bizCat ? 'bg-primary text-white' : 'bg-foreground/5 text-foreground/30 hover:bg-foreground/10'}`}
                      >
                        {bizCat === "event_organizer" ? "events" : bizCat.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider / Grid View */}
                <div className="relative">
                  {services.length === 0 ? (
                    <div className="py-20 rounded-[50px] bg-foreground/[0.02] border border-dashed border-foreground/5 text-center">
                      <p className="text-xl font-bold text-foreground/20 italic">Awaiting inventory synchronization...</p>
                    </div>
                  ) : (
                    <div
                      ref={sliderRef}
                      className={showAllServices ? "grid grid-cols-1 gap-8" : "flex overflow-x-auto pb-4 gap-8 scroll-smooth no-scrollbar translate-z-0"}
                    >
                      {(filterCategory === "all" ? services : services.filter(s => {
                        const svcCats = Array.isArray(s.category) ? s.category : [s.category];
                        const bizCatTagMap: Record<string, string[]> = {
                          hotel: ["room", "suite", "stay", "accommodation"],
                          tour_operator: ["tour", "expedition", "culture", "wildlife", "hiking", "transfer", "custom"],
                          car_rental: ["car", "rental", "vehicle", "driver"],
                          event_organizer: ["event"],
                        };
                        const matchTags = bizCatTagMap[filterCategory];
                        if (matchTags) {
                          return svcCats.some(c => matchTags.includes(String(c)));
                        }
                        return svcCats.some(c => String(c) === filterCategory);
                      }))
                        .slice(0, showAllServices ? undefined : 6)
                        .map((service, idx) => {
                          const isLastInSlider = !showAllServices && idx === 5 && services.length > 6;

                          if (isLastInSlider) {
                            return (
                              <button
                                key="view-all"
                                onClick={() => setShowAllServices(true)}
                                className="flex-shrink-0 w-[400px] h-[300px] rounded-[50px] bg-primary/5 border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-4 group hover:bg-primary/10 transition-all"
                              >
                                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                                  <ChevronLeft className="w-8 h-8 rotate-180" />
                                </div>
                                <span className="text-sm font-black uppercase tracking-widest text-primary">View All {services.length} Assets</span>
                              </button>
                            );
                          }

                          const serviceReviews = reviews.filter(r => (r.targetId as any)?._id === service._id || r.targetId === service._id);
                          const serviceAvgRating = serviceReviews.length > 0
                            ? (serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length).toFixed(1)
                            : "New";

                          const targetRoute = getRouteCategory(service);

                          return (
                            <div
                              key={service._id}
                              className={`group relative bg-surface rounded-[50px] border border-foreground/[0.03] overflow-hidden transition-all duration-500 hover:shadow-3xl hover:shadow-primary/5 flex-shrink-0 ${showAllServices ? 'w-full' : 'w-[500px] md:w-[600px]'} ${expandedService === service._id ? 'ring-2 ring-primary/20 shadow-2xl bg-white' : ''}`}
                            >
                              <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
                                {/* Service Thumbnail */}
                                <div className="relative w-full md:w-48 h-48 rounded-[40px] overflow-hidden shadow-xl border border-foreground/5 flex-shrink-0 cursor-pointer group/img"
                                  onClick={() => setFullScreenGallery({ serviceId: service._id, index: activeImageByService[service._id] || 0 })}
                                >
                                  <Image
                                    src={service.images[activeImageByService[service._id] || 0] || "/lalibela.png"}
                                    alt={service.name}
                                    fill
                                    className="object-cover transition-all duration-700 group-hover/img:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-white animate-pulse" />
                                  </div>
                                  <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white">
                                    {Array.isArray(service.category) ? service.category[0] : service.category}
                                  </div>
                                </div>

                                {/* Basic Info */}
                                <div className="flex-1 space-y-4 text-center md:text-left">
                                  <h3 className="text-2xl font-bold tracking-tight">{service.name}</h3>
                                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-2xl text-xs font-bold text-foreground/50">
                                      <Star className={`w-3.5 h-3.5 ${serviceAvgRating === "New" ? "text-foreground/20" : "text-primary fill-primary"}`} />
                                      <span className={serviceAvgRating === "New" ? "text-foreground/40 italic" : "text-foreground/80 font-black"}>
                                        {serviceAvgRating}
                                      </span>
                                      {serviceAvgRating !== "New" && <span className="font-medium">Rating</span>}
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-2xl text-xs font-bold text-foreground/50 uppercase tracking-widest text-primary">
                                      {service.currency} {service.price.toLocaleString()}
                                    </div>
                                  </div>
                                </div>

                                {/* Action Panel */}
                                <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
                                  <Link
                                    href={`/booking/${targetRoute}/${service._id}`}
                                    className="px-8 py-4 bg-primary text-white text-center rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 group/btn"
                                  >
                                    Book Now
                                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                                  </Link>
                                  <button
                                    onClick={() => setExpandedService(expandedService === service._id ? null : service._id)}
                                    className={`px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all ${expandedService === service._id ? 'bg-foreground text-background' : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10'}`}
                                  >
                                    {expandedService === service._id ? "Hide Details" : "View Assets"}
                                  </button>
                                </div>
                              </div>

                              {/* Expandable Content Layer */}
                              <div className={`overflow-hidden transition-all duration-700 ease-in-out ${expandedService === service._id ? 'max-h-[1500px] border-t border-foreground/[0.03] bg-primary/[0.01]' : 'max-h-0'}`}>
                                <div className="p-10 md:p-12 flex flex-col animate-fade-in relative bg-background/50">
                                  <div className="space-y-12 pb-6">
                                    {/* Sub-gallery Slider */}
                                    <div className="space-y-4">
                                      <div className="text-xs font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">Asset Portfolio Gallery</div>
                                      <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar snap-x">
                                        {service.images.map((img, idx) => (
                                          <div
                                            key={idx}
                                            onClick={() => setActiveImageByService(prev => ({ ...prev, [service._id]: idx }))}
                                            className={`relative w-[240px] aspect-[4/3] flex-shrink-0 snap-center rounded-[24px] overflow-hidden border transition-all cursor-pointer hover:scale-[1.02] ${activeImageByService[service._id] === idx ? 'border-primary ring-4 ring-primary/10' : 'border-foreground/5'}`}
                                          >
                                            <Image src={img} alt="Detail view portfolio" fill className="object-cover" />
                                            {activeImageByService[service._id] === idx && (
                                              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                <ShieldCheck className="w-6 h-6 text-white" />
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/30 mb-3 ml-1">Detailed Features & Specifications</h4>
                                      <p className="text-base text-foreground/70 leading-relaxed font-medium whitespace-pre-line bg-foreground/[0.01] p-6 rounded-3xl border border-foreground/[0.02]">
                                        {service.description}
                                      </p>
                                    </div>

                                    {/* Direct Action Footer inside Expanded Layout */}
                                    <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                                      <div className="space-y-1 text-center sm:text-left">
                                        <div className="text-sm font-black tracking-tight text-foreground">Ready to secure this option?</div>
                                        <div className="text-xs text-foreground/40 font-medium">Verify structural conditions and parameters inside custom portals.</div>
                                      </div>
                                      <Link
                                        href={`/booking/${targetRoute}/${service._id}`}
                                        className="w-full sm:w-auto px-8 py-4 bg-primary text-white text-center rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-xl shadow-primary/10 flex items-center justify-center gap-2"
                                      >
                                        Proceed to Booking Form <ArrowRight className="w-4 h-4" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Experiences & Reviews Section */}
              <div className="pt-24 border-t border-foreground/5 space-y-16">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold tracking-tight">Verified Feedback</h2>
                  <p className="text-foreground/40 font-bold uppercase text-xs tracking-[0.3em]">Authentic operational reports from previous clients</p>
                </div>

                {/* Review Form Area */}
                {session && eligibleServiceIds.length > 0 && (
                  <form onSubmit={handleSubmitReview} className="bg-surface p-8 md:p-12 rounded-[40px] border border-foreground/[0.02] space-y-8">
                    <h3 className="text-xl font-bold tracking-tight">Log Your Experience Matrix</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-foreground/40 block ml-1">Select Target Module</label>
                        <select
                          value={selectedReviewService}
                          onChange={(e) => setSelectedReviewService(e.target.value)}
                          className="w-full bg-background px-6 py-4 rounded-2xl border border-foreground/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                        >
                          {services.filter(s => eligibleServiceIds.includes(s._id)).map(s => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-foreground/40 block ml-1">Rating Scalar</label>
                        <div className="flex items-center gap-3 h-14 bg-background px-6 rounded-2xl border border-foreground/10">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setNewRating(star)}
                              className="text-primary hover:scale-110 transition-transform"
                            >
                              <Star className={`w-5 h-5 ${star <= newRating ? "fill-primary text-primary" : "text-foreground/20"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-foreground/40 block ml-1">Operational Summary Comments</label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Detail performance logs, physical asset condition, and timeline deviations..."
                        rows={4}
                        className="w-full bg-background p-6 rounded-2xl border border-foreground/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-foreground/20"
                      />
                    </div>

                    {errorMessage && <p className="text-sm font-semibold text-red-500 bg-red-500/5 px-4 py-2.5 rounded-xl border border-red-500/10">{errorMessage}</p>}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-10 py-4 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary-hover disabled:opacity-50 transition-all flex items-center gap-3"
                    >
                      {submitting ? "Transmitting..." : "Submit Verified Report"} <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="py-16 text-center italic text-foreground/30 font-medium">No system experience metrics logged for this asset branch yet.</div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev._id} className="p-8 bg-surface rounded-[32px] border border-foreground/[0.02] space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-sm">{rev.userId?.name || rev.userName || "System User"}</div>
                              <div className="text-xs text-foreground/30 font-black uppercase tracking-widest">{rev.userId?.role || "Verified Client"}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 rounded-xl text-xs font-black text-primary">
                            <Star className="w-3.5 h-3.5 fill-primary text-primary" /> {rev.rating.toFixed(1)}
                          </div>
                        </div>
                        <p className="text-sm text-foreground/60 leading-relaxed font-medium">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Static Context Display Card */}
            <div className="lg:col-span-4">
              <div className="sticky top-32 bg-surface p-8 md:p-10 rounded-[50px] border border-foreground/[0.03] space-y-8 shadow-2xl shadow-primary/[0.02]">
                <div className="space-y-2">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-primary">Operational Branch Context</div>
                  <h3 className="text-2xl font-bold tracking-tight">Entity Directory</h3>
                </div>

                <div className="space-y-6 border-y border-foreground/5 py-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/5 text-primary rounded-2xl border border-primary/5">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-foreground/30 uppercase tracking-widest mb-0.5">Physical Head Office</div>
                      <div className="text-sm font-bold text-foreground/70">{business.location.address || "Main Boulevard Center"}</div>
                      <div className="text-xs font-semibold text-foreground/40">{business.location.city}, {business.location.region}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/5 text-primary rounded-2xl border border-primary/5">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-foreground/30 uppercase tracking-widest mb-0.5">Asset Categories Managed</div>
                      <div className="text-sm font-bold text-foreground/70 uppercase tracking-wide text-xs">
                        {Array.isArray(business.category) ? business.category.join(' / ') : business.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/5 text-primary rounded-2xl border border-primary/5">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-foreground/30 uppercase tracking-widest mb-0.5">Last Manifest Sync</div>
                      <div className="text-sm font-bold text-foreground/70">{new Date(business.updatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-foreground/[0.02] p-6 rounded-3xl border border-foreground/[0.02] space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
                    <Building className="w-4 h-4" /> System Policy Guard
                  </div>
                  <p className="text-xs text-foreground/40 leading-relaxed font-semibold">
                    All inventory display blocks are fetched straight from verified local endpoints. Bookings route down to explicit secure forms handling automated payments instantly.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* Global Image Gallery Overlay */}
      {fullScreenGallery && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setFullScreenGallery(null)}
        >
          <div className="relative w-full max-w-5xl aspect-[16/10] rounded-[32px] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <Image
              src={services.find(s => s._id === fullScreenGallery.serviceId)?.images[fullScreenGallery.index] || "/lalibela.png"}
              alt="High-resolution asset audit"
              fill
              className="object-contain"
            />
          </div>
          <div className="mt-6 text-white/50 text-xs font-black tracking-widest uppercase">
            Asset Visual Frame {fullScreenGallery.index + 1} of {services.find(s => s._id === fullScreenGallery.serviceId)?.images.length || 1}
          </div>
        </div>
      )}

      {/* Reporting Modal Layer */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-xl rounded-[40px] border border-foreground/5 p-8 md:p-10 shadow-3xl space-y-6">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Flag Entity Malpractice</h3>
              <p className="text-xs text-foreground/40 font-semibold mt-1">Submit an immediate system operations audit on {business.name}.</p>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-foreground/40 ml-1">Infraction Category</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-foreground/5 px-5 py-4 rounded-xl border border-foreground/5 text-sm font-bold"
                >
                  <option value="">Select Reason...</option>
                  <option value="misrepresentation">Inventory Misrepresentation</option>
                  <option value="pricing_fraud">Inconsistent Pricing Matrix</option>
                  <option value="operational_failure">Total Operational Default</option>
                  <option value="other">Other Structural Violation</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-foreground/40 ml-1">Event Logs & Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide precise chronological logs regarding system discrepancies..."
                  rows={4}
                  className="w-full bg-foreground/5 p-5 rounded-xl border border-foreground/5 text-sm font-medium"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModal(false)}
                  className="flex-1 py-4 bg-foreground/5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-foreground/10 transition-all"
                >
                  Abstain
                </button>
                <button
                  type="submit"
                  disabled={reportStatus === "submitting"}
                  className="flex-1 py-4 bg-red-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-600 shadow-xl shadow-red-500/10 transition-all"
                >
                  {reportStatus === "submitting" ? "Transmitting Violation..." : "File Official Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}