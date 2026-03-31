"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, ChevronLeft, Send, User, Calendar, MessageSquare, Phone, Mail, Globe, ShieldCheck, Clock } from "lucide-react";
import { useSession } from "next-auth/react";

interface Business {
  _id: string;
  name: string;
  description: string;
  category: string;
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
  restaurant: "/restaurant.png",
  other: "/lalibela.png",
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
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    if (!id) return;

    async function fetchBusiness() {
      try {
        setLoading(true);
        // We use the public API route for businesses but for a specific ID
        // Note: we might need a dedicated public detail route if this one is protected
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

    try {
      setSubmitting(true);
      setErrorMessage("");
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_id: id,
          target_type: "business",
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
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Top Banner */}
      <section className="relative h-[55vh] pt-24 px-6 md:px-12">
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
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-8 space-y-24">
            
            {/* Gallery / Cover */}
            <div className="relative h-[600px] rounded-[60px] overflow-hidden shadow-2xl shadow-primary/5 border border-foreground/5">
              <Image
                src={business.profilePicture || categoryImages[business.category] || "/lalibela.png"}
                alt={business.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-8 right-8 px-8 py-3 glass rounded-full text-xs font-black tracking-[0.2em] uppercase">
                {business.category.replace("_", " ")}
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
                  {Array.from(new Set(services.map(s => s.category))).map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === cat ? 'bg-primary text-white' : 'bg-foreground/5 text-foreground/30 hover:bg-foreground/10'}`}
                    >
                      {cat.replace(/_/g, " ")}
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
                    className={showAllServices ? "grid grid-cols-1 gap-8" : "flex overflow-x-auto pb-12 gap-8 scroll-smooth no-scrollbar translate-z-0"}
                  >
                    {(filterCategory === "all" ? services : services.filter(s => s.category === filterCategory))
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
                                    {service.category}
                                 </div>
                              </div>

                              {/* Basic Info */}
                              <div className="flex-1 space-y-4 text-center md:text-left">
                                 <h3 className="text-2xl font-bold tracking-tight">{service.name}</h3>
                                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-2xl text-xs font-bold text-foreground/50">
                                       <Star className="w-3.5 h-3.5 text-primary fill-primary" /> 4.9 Priority
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
                               <div className="p-10 md:p-20 space-y-16 animate-fade-in">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                     <div className="space-y-8">
                                        <div>
                                           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-4 ml-1">Asset Description</h4>
                                           <p className="text-lg text-foreground/60 leading-relaxed font-medium">{service.description}</p>
                                        </div>
                                        
                                        <div className="pt-8 border-t border-foreground/5 grid grid-cols-2 gap-8">
                                           {Object.entries(service.metadata || {}).map(([key, val]: [string, any]) => (
                                              <div key={key}>
                                                 <div className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-1">{key.replace(/([A-Z])/g, ' $1')}</div>
                                                 <div className="font-bold text-foreground/80">{val.toString()}</div>
                                              </div>
                                           ))}
                                        </div>
                                     </div>

                                     <div className="grid grid-cols-2 gap-6">
                                        {service.images.map((img, idx) => (
                                           <div 
                                             key={idx} 
                                             onClick={() => setActiveImageByService(prev => ({...prev, [service._id]: idx}))}
                                             className={`relative aspect-square rounded-[32px] overflow-hidden border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${activeImageByService[service._id] === idx ? 'border-primary ring-4 ring-primary/10' : 'border-foreground/5'}`}
                                           >
                                              <Image src={img} alt="Detail" fill className="object-cover" />
                                              {activeImageByService[service._id] === idx && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                   <ShieldCheck className="w-6 h-6 text-white" />
                                                </div>
                                              )}
                                           </div>
                                        ))}
                                     </div>
                                  </div>

                                  <button className="w-full py-6 bg-foreground text-background text-sm font-black rounded-3xl hover:bg-primary transition-all shadow-xl flex items-center justify-center gap-4 group">
                                     Initiate Booking Request <Send className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                  </button>
                               </div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}
                
                {!showAllServices && (filterCategory === "all" ? services : services.filter(s => s.category === filterCategory)).length > 3 && (
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
                              className={`w-4 h-4 ${
                                i < review.rating ? "fill-primary text-primary" : "text-foreground/10"
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
                <form onSubmit={handleSubmitReview} className="space-y-8">
                  <div className="space-y-5">
                    <label className="text-[10px] font-black tracking-[0.2em] uppercase text-foreground/20 ml-2">Rating Scale</label>
                    <div className="flex justify-between p-2 bg-foreground/5 rounded-3xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                            newRating >= star 
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

      {/* Full Screen Image Modal */}
      {fullScreenGallery && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-fade-in p-6 md:p-20">
           <button 
             onClick={() => setFullScreenGallery(null)}
             className="absolute top-10 right-10 w-16 h-16 rounded-full glass flex items-center justify-center text-foreground hover:bg-white hover:text-black transition-all z-[110]"
           >
              <ShieldCheck className="w-8 h-8 rotate-45" /> {/* Use as X */}
           </button>

           <div className="relative w-full h-full flex items-center justify-center">
              {/* Previous Button */}
              {fullScreenGallery.index > 0 && (
                <button 
                  onClick={() => setFullScreenGallery(prev => prev ? ({ ...prev, index: prev.index - 1 }) : null)}
                  className="absolute left-0 md:-left-24 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full glass flex items-center justify-center hover:bg-white hover:text-black transition-all z-20"
                >
                   <ChevronLeft className="w-8 h-8" />
                </button>
              )}

              <div className="relative w-full h-full rounded-[60px] overflow-hidden shadow-3xl shadow-white/5 border border-white/10">
                 <Image 
                    src={services.find(s => s._id === fullScreenGallery.serviceId)?.images[fullScreenGallery.index] || ""} 
                    alt="Immersion"
                    fill
                    className="object-contain"
                 />
              </div>

              {/* Next Button */}
              {(fullScreenGallery.index < (services.find(s => s._id === fullScreenGallery.serviceId)?.images.length || 0) - 1) && (
                <button 
                  onClick={() => setFullScreenGallery(prev => prev ? ({ ...prev, index: prev.index + 1 }) : null)}
                  className="absolute right-0 md:-right-24 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full glass flex items-center justify-center hover:bg-white hover:text-black transition-all z-20"
                >
                   <ChevronLeft className="w-8 h-8 rotate-180" />
                </button>
              )}

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 glass rounded-full text-xs font-black tracking-[0.2em] uppercase text-foreground">
                 Archive Asset {fullScreenGallery.index + 1} / {services.find(s => s._id === fullScreenGallery.serviceId)?.images.length}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
