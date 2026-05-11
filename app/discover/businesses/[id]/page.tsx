"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, ChevronLeft, Send, User, Calendar, MessageSquare, Phone, Mail, Globe, ShieldCheck, Clock, AlertTriangle, Loader2 } from "lucide-react";
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

  // Booking State
  const [bookingModal, setBookingModal] = useState<Service | null>(null);
  const [bookingGuests, setBookingGuests] = useState(1);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [bookingStatus, setBookingStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

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
        // We use the public API route for businesses but for a specific ID
        // Note: we might need a dedicated public detail route if this one is protected
        const res = await fetch(`/api/businesses/${id}`);
        const json = await res.json();
<<<<<<< HEAD

=======
        console.log(json);
        
>>>>>>> origin/salem-branch
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
            // Compile unique service IDs that the user has booked
            const uniqueIds = Array.from(new Set(eligible.map((b: any) => b.serviceId?._id || b.serviceId))) as string[];
            setEligibleServiceIds(uniqueIds);

            // Pre-select the first available service
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

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }

    if (!bookingDate) {
      setErrorMessage("Please select a date.");
      return;
    }

    try {
      setBookingStatus("submitting");
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: bookingModal?._id,
          startDate: bookingDate,
          endDate: bookingEndDate || undefined,
          guests: bookingGuests,
          specialRequests: bookingNote,
        }),
      });

      const data = await res.json();
      console.log("Booking Response Data:", data); // ADDED LOGGING
      if (res.ok) {
        setBookingStatus("success");

        // If Chapa checkout URL is provided, redirect after a short delay
        if (data.checkoutUrl) {
          console.log("Redirecting to Chapa:", data.checkoutUrl);
          setTimeout(() => {
            window.location.href = data.checkoutUrl;
          }, 1500);
          return;
        } else {
          setErrorMessage("Payment initialization failed. Please try again later.");
          setBookingStatus("error");
          return;
        }
      } else {
        setErrorMessage(data.error || "Booking failed.");
        setBookingStatus("error");
      }
    } catch (error) {
      setErrorMessage("An error occurred.");
      setBookingStatus("error");
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
              <div className="inline-flex items-center gap-3 px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-primary uppercase bg-primary/10 rounded-full border border-primary/10">
                Verified Partner <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[0.9]">
                {business.name}
              </h1>
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-2.5 bg-primary/5 px-5 py-2.5 rounded-2xl border border-primary/10">
                  <Star className="w-5 h-5 fill-primary text-primary" />
                  <span className="font-black text-lg">{avgRating ? avgRating.toFixed(1) : "5.0"}</span>
                  <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest ml-2">{reviews.length} Experiences</span>
                </div>
                <div className="flex items-center gap-3 bg-foreground/5 px-5 py-2.5 rounded-2xl border border-foreground/5 font-bold text-sm text-foreground/60">
                  <MapPin className="w-5 h-5 text-primary/40" />
                  {business.location.city}, {business.location.region}
                </div>
              </div>
            </div>

            <button
              onClick={() => setReportModal(true)}
              className="flex items-center gap-3 px-8 py-4 bg-red-500/5 text-red-500 border border-red-500/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/5 group"
            >
              <AlertTriangle className="w-4 h-4 group-hover:animate-bounce" /> Report Entity
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-0 px-3 md:px-4 lg:px-5">
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
                  <p className="text-foreground/40 font-bold uppercase text-[10px] tracking-[0.3em]">Direct Inventory & Strategic Facilities</p>
                </div>

                {/* Filtration Chips */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setFilterCategory("all")}
                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === "all" ? 'bg-primary text-white' : 'bg-foreground/5 text-foreground/30 hover:bg-foreground/10'}`}
                  >
                    All Units
                  </button>
                  {(Array.isArray(business?.category) ? business.category : business?.category ? [business.category] : []).map((bizCat: string) => (
                    <button
                      key={bizCat}
                      onClick={() => setFilterCategory(bizCat)}
                      className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === bizCat ? 'bg-primary text-white' : 'bg-foreground/5 text-foreground/30 hover:bg-foreground/10'}`}
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
                    className={showAllServices ? "grid grid-cols-1 gap-8" : "flex overflow-x-auto pb-0 gap-8 scroll-smooth no-scrollbar translate-z-0"}
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
                      .map((service, idx, arr) => {
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

                              {/* Action - Expand Details */}
                              <button
                                onClick={() => setExpandedService(expandedService === service._id ? null : service._id)}
                                className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${expandedService === service._id ? 'bg-primary text-white' : 'bg-foreground/5 text-foreground/40 hover:bg-foreground hover:text-white'}`}
                              >
                                {expandedService === service._id ? "Close" : "Details"}
                              </button>
                            </div>

                            {/* Expandable Content Layer */}
                            <div className={`overflow-hidden transition-all duration-700 ease-in-out ${expandedService === service._id ? 'max-h-[1500px] border-t border-foreground/[0.03] bg-primary/[0.01]' : 'max-h-0'}`}>
                              <div className="p-10 md:p-20 flex flex-col animate-fade-in relative bg-background/50">
                                <div className="overflow-y-auto overflow-x-hidden max-h-[60vh] md:pr-6 space-y-16 pb-10">
                                  {/* Visual Artifacts - Row Scroll */}
                                  <div className="space-y-6">
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 ml-1">Visual Artifact Intelligence</div>
                                    <div className="flex overflow-x-auto gap-6 pb-6 no-scrollbar snap-x">
                                      {service.images.map((img, idx) => (
                                        <div
                                          key={idx}
                                          onClick={() => setActiveImageByService(prev => ({ ...prev, [service._id]: idx }))}
                                          className={`relative w-[280px] md:w-[320px] aspect-[4/3] flex-shrink-0 snap-center rounded-[32px] overflow-hidden border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${activeImageByService[service._id] === idx ? 'border-primary ring-4 ring-primary/10' : 'border-foreground/5'}`}
                                        >
                                          <Image src={img} alt="Detail" fill className="object-cover" />
                                          {activeImageByService[service._id] === idx && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                              <ShieldCheck className="w-8 h-8 text-white" />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-12">
                                    <div>
                                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-4 ml-1">Asset Description</h4>
                                      <p className="text-lg text-foreground/60 leading-relaxed font-medium max-w-5xl">{service.description}</p>
                                    </div>

                                    <div className="pt-8 border-t border-foreground/5 space-y-12">
                                      {(() => {
                                        const categories = Array.isArray(service.category) ? service.category : [service.category];
                                        const carTags = ["car", "rental", "vehicle", "driver", "economy", "luxury", "van", "transfer", "transport"];
                                        const isTransport = categories.some(c => carTags.includes(String(c).toLowerCase()));

                                        const protocolGroups = [
                                          {
                                            id: "accommodation", label: "Accommodation Artifacts",
                                            keys: ["accommodationPrice", "maxOccupancy", "bedType", "roomSize", "bathroomType", "viewType", "roomServiceAvailable", "accommodationAmenities", "accommodationType", "roomType"],
                                            active: categories.some(c => ["accommodation", "room", "suite", "stay", "hotel"].includes(String(c).toLowerCase()))
                                          },
                                          {
                                            id: "transport_core", label: "Fleet Core Identity",
                                            keys: ["vehicleName", "vehicleType", "location", "comfortLevel", "features"],
                                            active: isTransport
                                          },
                                          {
                                            id: "transport_pricing", label: "Pricing & Deposit Protocol",
                                            keys: ["pricingType", "minRentalDuration", "depositRequired", "depositAmount", "transportPrice"],
                                            active: isTransport
                                          },
                                          {
                                            id: "transport_specs", label: "Vehicle Specifications",
                                            keys: ["brand", "model", "year", "fuelType", "transmission", "transportCapacity", "luggageCapacity", "airConditioning", "color"],
                                            active: isTransport
                                          },
                                          {
                                            id: "transport_driver", label: "Driver & Personnel Options",
                                            keys: ["withDriver", "driverIncludedPrice", "selfDriveAvailable", "driverLanguages", "driver"],
                                            active: isTransport
                                          },
                                          {
                                            id: "transport_logistics", label: "Fleet Logistics & Terms",
                                            keys: ["fuelPolicy", "mileageLimit", "pickupLocation", "cancellationPolicy", "allowedAreas", "notAllowedUses", "transportCondition", "transportType"],
                                            active: isTransport
                                          },
                                          {
                                            id: "transport_insurance", label: "Insurance & Safety Framework",
                                            keys: ["insuranceIncluded", "insuranceType", "safetyFeatures", "extraKmCharge"],
                                            active: isTransport
                                          },
                                          {
                                            id: "business", label: "Business & Event Metrics",
                                            keys: ["spaceType", "eventCapacity", "pricePerHour", "pricePerDay", "eventEquipment", "layoutTypes", "eventBookingRequired", "venueType", "seatingCapacity", "facilityType", "accessType", "businessEvents"],
                                            active: categories.some(c => ["business_events", "event", "conference_hall", "venue", "event_organizer"].includes(String(c).toLowerCase()))
                                          },
                                          {
                                            id: "tour", label: "Expedition Parameters",
                                            keys: ["duration", "difficulty", "tourType", "minGroupSize", "maxGroupSize", "destinations", "departureDates", "cancellationDeadline", "pricingType", "startLocation", "internalFlights", "ageLimits", "requiredDocuments", "specialGear", "emergencyContact", "insuranceRequirements", "guideQualifications", "uniqueExperiences", "bonuses", "inclusionMatrix"],
                                            active: categories.some(c => ["tour", "expedition", "culture", "hiking", "wildlife", "custom", "tour_operator", "tour_operator"].includes(String(c).toLowerCase()))
                                          }
                                        ];

                                        return protocolGroups.map(group => {
                                          if (!group.active) return null;

                                          const groupMeta = Object.entries(service.metadata || {})
                                            .filter(([key, val]) =>
                                              group.keys.includes(key) &&
                                              val !== null && val !== undefined && val !== "" &&
                                              !(Array.isArray(val) && val.length === 0)
                                            );

                                          if (groupMeta.length === 0) return null;

                                          return (
                                            <div key={group.id} className="space-y-6">
                                              <div className="text-[12px] font-black uppercase tracking-[0.3em] text-primary/40 ml-1 pb-2 border-b border-foreground/5">{group.label}</div>
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
                                                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 group-hover/meta:text-primary transition-colors duration-500 mb-2 break-words">
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

                                      {service.metadata?.itinerary && service.metadata.itinerary.length > 0 && (
                                        <div className="mt-12 pt-8 border-t border-foreground/10">
                                          <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-primary mb-8 pb-3 border-b border-primary/10">Expedition Itinerary</h4>
                                          <div className="space-y-6 max-w-4xl">
                                            {service.metadata.itinerary.map((day: any, idx: number) => (
                                              <div key={idx} className="relative pl-8 pb-8 border-l-2 border-primary/20 last:border-transparent last:pb-0">
                                                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-primary shadow-sm" />
                                                <div className="bg-foreground/[0.02] p-6 rounded-3xl border border-foreground/5 -mt-4">
                                                  <div className="flex items-center gap-3 mb-3">
                                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest">Day {day.day}</span>
                                                    <span className="text-xs font-bold text-foreground/40">{day.timing || "Full Day"}</span>
                                                  </div>
                                                  <p className="font-bold text-sm text-foreground/80 mb-2">{day.activities}</p>
                                                  {day.overnightStay && (
                                                    <div className="text-xs text-foreground/50 flex items-center gap-2 mt-3 pt-3 border-t border-foreground/5">
                                                      <MapPin className="w-3 h-3" /> Stay: {day.overnightStay}
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
                                </div>

                                <div className="pt-6 mt-4 border-t border-foreground/10 shrink-0 sticky bottom-0 bg-background/80 backdrop-blur-xl pb-4">
                                  <button
                                    onClick={() => {
                                      if (!session) {
                                        router.push("/login");
                                        return;
                                      }
                                      const bizCat = Array.isArray(business?.category) ? business.category[0] : business?.category;
                                      switch (bizCat) {
                                        case "car_rental":
                                          router.push(`/booking/car_booking?id=${id}&price=${service.price}&name=${service.name}&serviceId=${service._id}`)
                                          break
                                        case "hotel":
                                          router.push(`/booking/room_booking?id=${id}&price=${service.price}&name=${service.name}&serviceId=${service._id}`)
                                          break
                                        case "event_organizer":
                                          router.push(`/booking/event_booking?id=${id}&price=${service.price}&name=${service.name}&serviceId=${service._id}`)
                                          break
                                        case "tour_operator":
                                          router.push(`/booking/tour_booking?id=${id}&price=${service.price}&name=${service.name}&serviceId=${service._id}`)
                                          break
                                        default:
                                          setBookingModal(service);
                                      }
                                    }}
                                    className="w-full py-6 bg-foreground text-background text-sm font-black rounded-3xl hover:bg-primary transition-all shadow-xl flex items-center justify-center gap-4 group"
                                  >
                                    Initiate Booking Request <Send className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}

                {!showAllServices && (filterCategory === "all" ? services : services.filter(s => {
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
                })).length > 3 && (
                    <button
                      onClick={() => {
                        if (sliderRef.current) sliderRef.current.scrollBy({ left: 500, behavior: 'smooth' });
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center text-primary z-20 hover:scale-110 transition-all border border-foreground/5"
                    >
                      <ChevronLeft className="w-8 h-8 rotate-180" />
                    </button>
                  )}
              </div>

              {showAllServices && (
                <div className="flex justify-center pt-8">
                  <button
                    onClick={() => setShowAllServices(false)}
                    className="px-12 py-5 bg-foreground/5 text-foreground/40 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-foreground hover:text-white transition-all"
                  >
                    Minimize View
                  </button>
                </div>
              )}
            </div>

            {/* Reviews Hub */}
            <div className="pt-24 border-t border-foreground/5 space-y-16">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight mb-4">The Guest Book</h2>
                  <p className="text-foreground/40 font-bold uppercase text-[10px] tracking-[0.3em]">Authentic experiences from our travelers</p>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <div className="text-center px-8">
                    <div className="text-3xl font-black text-primary mb-1">{avgRating ? avgRating.toFixed(1) : "5.0"}</div>
                    <div className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">Average</div>
                  </div>
                  <div className="w-[1px] h-12 bg-foreground/5" />
                  <div className="text-center px-8">
                    <div className="text-3xl font-black text-foreground/80 mb-1">{reviews.length}</div>
                    <div className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">Reviews</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-12">
                {reviews.length === 0 ? (
                  <div className="py-24 rounded-[50px] bg-surface/30 border-4 border-dashed border-foreground/5 text-center px-12">
                    <MessageSquare className="w-16 h-16 text-primary/10 mx-auto mb-8" />
                    <p className="text-2xl font-bold text-foreground/20 italic">Sharing the first spark of wonder...</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="relative bg-surface rounded-[50px] p-10 md:p-14 shadow-xl shadow-foreground/5 border border-foreground/[0.03]">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/5">
                            <User className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xl mb-1">{review.userId?.name || review.userName || "Guest Explorer"}</h4>
                            <div className="flex items-center gap-2.5 text-[10px] font-black tracking-widest text-foreground/30 uppercase">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-foreground/10"
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-lg text-foreground/60 leading-relaxed font-medium md:pl-20">
                        "{review.comment}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Contact & Action */}
          <div className="lg:col-span-4 space-y-12">

            {/* Contact Card */}
            <div className="glass p-10 rounded-[50px] space-y-10 shadow-3xl shadow-primary/10 border-2 border-primary/5">
              <h3 className="text-2xl font-bold tracking-tight mb-8">Service Inquiry</h3>

              <div className="space-y-8">
                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1">Direct Line</div>
                    <div className="font-bold text-foreground/80">{business.contactPhone || "Request via app"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1">Electronic Mail</div>
                    <div className="font-bold text-foreground/80 break-all">{business.contactEmail}</div>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1">Official Path</div>
                    <div className="font-bold text-foreground/80">www.{business.name.toLowerCase().replace(/\s/g, "")}.et</div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-foreground/5 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-foreground/30 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Response Time</span>
                  <span className="text-primary italic">~2 Hours</span>
                </div>
                <button className="w-full py-5 bg-foreground text-background font-black rounded-full hover:bg-foreground/90 transition-all active:scale-95 shadow-xl shadow-black/10">
                  Secure Consultation
                </button>
              </div>
            </div>

            {/* Review Form Card */}
            <div className="glass p-10 rounded-[50px] shadow-xl shadow-primary/5 border border-primary/5">
              <h3 className="text-2xl font-bold mb-8 tracking-tight">Share Experience</h3>

              {session ? (
                eligibleServiceIds.length > 0 ? (
                  <form onSubmit={handleSubmitReview} className="space-y-8">
                    <div className="space-y-5">
                      <label className="text-[10px] font-black tracking-[0.2em] uppercase text-foreground/20 ml-2">Rate Your Recent Bookings</label>
                      <div className="flex flex-wrap gap-4">
                        {eligibleServiceIds.map(svcId => {
                          const svc = services.find(s => s._id === svcId);
                          if (!svc) return null;
                          return (
                            <button
                              key={svcId}
                              type="button"
                              onClick={() => setSelectedReviewService(svcId)}
                              className={`px-5 py-3 rounded-2xl text-xs font-black capitalize tracking-wider transition-all border-2 ${selectedReviewService === svcId
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 border-primary'
                                : 'bg-foreground/[0.02] text-foreground/60 border-foreground/5 hover:border-primary/30 hover:bg-foreground/5'
                                }`}
                            >
                              {svc.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <label className="text-[10px] font-black tracking-[0.2em] uppercase text-foreground/20 ml-2">Rating Scale</label>
                      <div className="flex justify-between p-2 bg-foreground/5 rounded-3xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${newRating >= star
                              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                              : "text-foreground/20 hover:text-primary hover:bg-primary/5"
                              }`}
                          >
                            <Star className={`w-6 h-6 ${newRating >= star ? "fill-current" : ""}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <label className="text-[10px] font-black tracking-[0.2em] uppercase text-foreground/20 ml-2">Your Story</label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="The hospitality, the service, the memories..."
                        rows={6}
                        className="w-full bg-foreground/5 border-none rounded-[32px] p-8 text-sm font-bold focus:ring-4 focus:ring-primary/10 placeholder:text-foreground/10 resize-none leading-relaxed"
                      />
                    </div>

                    {errorMessage && (
                      <div className="text-[10px] font-black text-red-500 bg-red-50 p-5 rounded-3xl uppercase tracking-widest text-center border border-red-100">
                        {errorMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-5 bg-primary text-white font-black rounded-full hover:bg-primary-hover shadow-2xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                      {submitting ? "Transmitting..." : (
                        <>
                          Broadcast Review <Send className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6">
                      <Star className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-foreground/40 mb-2 font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed">Awaiting Your Journey</p>
                    <h3 className="text-lg font-bold text-foreground/80 tracking-tight max-w-[250px] mx-auto">Complete a booking to unlock the review module</h3>
                  </div>
                )
              ) : (
                <div className="text-center py-12 px-6">
                  <p className="text-foreground/30 mb-10 font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed">Identity confirmation required to authenticate reviews.</p>
                  <Link
                    href="/login"
                    className="inline-block w-full py-5 bg-foreground text-background font-black rounded-full hover:bg-foreground/90 transition-all active:scale-95 shadow-xl shadow-black/10"
                  >
                    Authenticate Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>



      {/* Booking Modal Overlay */}
      {bookingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in p-6">
          <div className="bg-white rounded-[50px] w-full max-w-2xl overflow-hidden shadow-3xl animate-scale-up">
            <div className="p-8 md:p-12 space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-primary uppercase mb-2 block">Reservation Desk</span>
                  <h3 className="text-3xl font-bold tracking-tight">Booking for {bookingModal.name}</h3>
                </div>
                <button
                  onClick={() => setBookingModal(null)}
                  className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:bg-foreground hover:text-white transition-all font-black"
                >
                  X
                </button>
              </div>

              {bookingStatus === "success" ? (
                <div className="py-20 text-center space-y-6 animate-bounce-subtle">
                  <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
                    <ShieldCheck className="w-12 h-12" />
                  </div>
                  <h4 className="text-2xl font-bold">Reservation Secured!</h4>
                  <p className="text-foreground/40 font-medium">Redirecting you to the secure payment portal...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitBooking} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-2">Arrival Date</label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-foreground/5 border-none rounded-2xl p-5 text-sm font-bold focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                    {bookingModal.category === "hotel" && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-2">Departure Date</label>
                        <input
                          type="date"
                          value={bookingEndDate}
                          onChange={(e) => setBookingEndDate(e.target.value)}
                          className="w-full bg-foreground/5 border-none rounded-2xl p-5 text-sm font-bold focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-2">Explorer Count</label>
                      <div className="flex items-center gap-4 bg-foreground/5 p-2 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setBookingGuests(Math.max(1, bookingGuests - 1))}
                          className="w-12 h-12 bg-white rounded-xl shadow-sm text-lg font-bold hover:bg-primary hover:text-white transition-all">-</button>
                        <span className="flex-1 text-center font-black">{bookingGuests}</span>
                        <button
                          type="button"
                          onClick={() => setBookingGuests(bookingGuests + 1)}
                          className="w-12 h-12 bg-white rounded-xl shadow-sm text-lg font-bold hover:bg-primary hover:text-white transition-all">+</button>
                      </div>
                    </div>
                    <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 text-center">
                      <div className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-1">Estimated Intensity</div>
                      <div className="text-2xl font-black text-primary">{bookingModal.currency} {(bookingModal.price * bookingGuests).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-2">Institutional Notes</label>
                    <textarea
                      placeholder="Special requirements, dietary needs, or transportation requests..."
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      className="w-full bg-foreground/5 border-none rounded-3xl p-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 resize-none"
                      rows={3}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bookingStatus === "submitting"}
                    className="w-full py-6 bg-primary text-white text-sm font-black rounded-full shadow-2xl shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {bookingStatus === "submitting" ? "Securing Asset..." : (
                      <>Pay & Request Reservation <ShieldCheck className="w-5 h-5" /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-24 bg-foreground/90 backdrop-blur-3xl">
          <div className="bg-white w-full max-w-2xl rounded-[60px] overflow-hidden shadow-premium animate-slide-up">
            <div className="p-10 md:p-20 space-y-12">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-red-500 font-black tracking-widest text-[10px] uppercase">
                    <AlertTriangle className="w-4 h-4" /> Misconduct Report
                  </div>
                  <h2 className="text-4xl font-black tracking-tight">Report Business</h2>
                </div>
                <button onClick={() => setReportModal(false)} className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:bg-foreground hover:text-white transition-all">✕</button>
              </div>

              {reportStatus === "success" ? (
                <div className="text-center py-12 space-y-8 animate-fade-in">
                  <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                    <ShieldCheck className="w-12 h-12" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black tracking-tight">Report Logged</h3>
                    <p className="text-foreground/40 font-medium italic">Our integrity team has been notified. We will investigate the misconduct shortly.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black tracking-widest uppercase text-foreground/20 ml-4">Primary Reason</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-8 py-5 bg-foreground/5 border-none rounded-[32px] text-sm font-bold focus:ring-4 focus:ring-red-500/10 appearance-none"
                    >
                      <option value="">Select a reason...</option>
                      <option value="misconduct">General Misconduct</option>
                      <option value="fraudulent_behavior">Fraudulent Behavior</option>
                      <option value="poor_service">Severe Poor Service</option>
                      <option value="false_information">False Listing Information</option>
                      <option value="safety_concern">Safety Concern</option>
                      <option value="other">Other Concern</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black tracking-widest uppercase text-foreground/20 ml-4">Detailed Evidence</label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Please provide specific details about the misconduct..."
                      rows={6}
                      className="w-full px-8 py-8 bg-foreground/5 border-none rounded-[40px] text-sm font-bold focus:ring-4 focus:ring-red-500/10 resize-none placeholder:text-foreground/10"
                    />
                  </div>

                  {errorMessage && reportStatus === "error" && (
                    <div className="p-6 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest text-center rounded-[32px] border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    disabled={reportStatus === "submitting"}
                    className="w-full py-6 bg-red-500 text-white font-black rounded-full shadow-2xl shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {reportStatus === "submitting" ? (
                      <>Transmitting Intelligence <Loader2 className="w-5 h-5 animate-spin" /></>
                    ) : "Transmit Formal Report"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Full Screen Image Modal - Root Level Placement */}
    {fullScreenGallery && (
      <div className="fixed inset-0 h-[100dvh] w-screen z-[9999] flex items-center justify-center bg-black animate-fade-in p-0 overflow-hidden touch-none"
           style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="relative w-full h-[85vh] flex items-center justify-center px-6 md:px-32">
          <div className="relative w-full h-full rounded-[60px] overflow-hidden shadow-3xl shadow-white/5 border border-white/10 group/gallery">
            <Image
              src={services.find(s => s._id === fullScreenGallery.serviceId)?.images[fullScreenGallery.index] || ""}
              alt="Immersion"
              fill
              className="object-contain"
              priority
            />

            {/* Close Button Integrated Inside Image Box */}
            <button
              onClick={() => setFullScreenGallery(null)}
              className="absolute top-8 right-8 w-14 h-14 rounded-full glass flex items-center justify-center text-white hover:bg-white hover:text-black transition-all z-[70] shadow-2xl opacity-0 group-hover/gallery:opacity-100"
            >
              <ShieldCheck className="w-8 h-8 rotate-45" /> {/* Use as X */}
            </button>

            {/* Navigation Arrows Integrated Inside Image Container */}
            {fullScreenGallery.index > 0 && (
              <button
                onClick={() => setFullScreenGallery(prev => prev ? ({ ...prev, index: prev.index - 1 }) : null)}
                className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full glass flex items-center justify-center text-white hover:bg-white hover:text-black transition-all z-[60] shadow-2xl opacity-0 group-hover/gallery:opacity-100"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {fullScreenGallery.index < (services.find(s => s._id === fullScreenGallery.serviceId)?.images.length || 0) - 1 && (
              <button
                onClick={() => setFullScreenGallery(prev => prev ? ({ ...prev, index: prev.index + 1 }) : null)}
                className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full glass flex items-center justify-center text-white hover:bg-white hover:text-black transition-all z-[60] shadow-2xl opacity-0 group-hover/gallery:opacity-100"
              >
                <ChevronLeft className="w-8 h-8 rotate-180" />
              </button>
            )}

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-3 glass rounded-full text-xs font-black tracking-[0.2em] uppercase text-white z-50">
              Archive Asset {fullScreenGallery.index + 1} / {services.find(s => s._id === fullScreenGallery.serviceId)?.images.length}
            </div>
          </div>
        </div>
      </div>
    )}
  </>
);
}
