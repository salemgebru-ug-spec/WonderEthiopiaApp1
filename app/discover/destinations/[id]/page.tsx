"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, ChevronLeft, Send, User, Calendar, MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

interface Destination {
  _id: string;
  name: string;
  description: string;
  region: string;
  city: string;
  images: string[];
  rating: number;
  coordinates:{
    latitude:number;
    longitude:number;
  }
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

export default function DestinationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?target_id=${id}&target_type=destination`);
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

    async function fetchDestination() {
      try {
        setLoading(true);
        const res = await fetch(`/api/destinations/${id}`);
        const json = await res.json();
        console.log(json)
        if (json.data) {
          setDestination(json.data);
          await fetchReviews();
        }
      } catch (error) {
        console.error("Failed to fetch destination:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDestination();
  }, [id]);

   const Map = useMemo(() => dynamic(
    () => import('../../../../components/map'),
    { 
      loading: () => <p>A map is loading</p>,
      ssr: false
    }
  ), [])


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
          target_type: "destination",
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
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  
  if (!destination) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Destination Not Found</h1>
        <p className="text-foreground/60 mb-8">The place you are looking for does not exist or has been removed.</p>
        <Link href="/discover/destinations" className="px-8 py-3 bg-primary text-white font-bold rounded-full">
          Back to Discovery
        </Link>
      </div>
    );
  }

  const latitude=destination.coordinates.latitude;
  const longitude=destination.coordinates.longitude;


  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        {destination.images && destination.images[0] ? (
          <img
            src={destination.images[0]}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-background flex items-center justify-center" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-background" />
        
        <div className="absolute top-32 left-6 md:left-12">
          <Link
            href="/discover/destinations"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </Link>
        </div>

        <div className="absolute bottom-12 left-6 md:left-12 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 backdrop-blur-md rounded-full border border-primary/20">
            {destination.region}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6">
            {destination.name}
          </h1>
          <div className="flex items-center gap-6 text-white/80">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
              <Star className="w-5 h-5 fill-primary text-primary" />
              <span className="font-bold">{avgRating ? avgRating.toFixed(1) : "New"}</span>
              <span className="text-xs opacity-60">({reviews.length} reviews)</span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-bold">{destination.city}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 max-w-7xl mx-auto px-3 md:px-4 lg:px-5 grid grid-cols-1 lg:grid-cols-3 gap-20">
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">About this destination</h2>
            <p className="text-lg text-foreground/70 leading-relaxed whitespace-pre-line">
              {destination.description}
            </p>
            <div><Map position={[latitude,longitude]} zoom={13}/></div>
          </div>

          {/* Reviews List */}
          <div className="space-y-10 pt-12 border-t border-foreground/5">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-primary" />
                Community Stories
              </h2>
              <div className="text-sm font-bold text-foreground/40 bg-foreground/5 px-4 py-2 rounded-full">
                {reviews.length} Reviews
              </div>
            </div>

            <div className="grid gap-8">
              {reviews.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-foreground/5 rounded-3xl text-center">
                  <p className="text-foreground/40 italic">Be the first to share your experience!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review._id} className="glass p-8 rounded-[32px] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{review.userId?.name || review.userName || "Explorer"}</h4>
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground/40 uppercase tracking-widest">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? "fill-primary text-primary" : "text-foreground/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-foreground/70 leading-relaxed font-medium pl-14">
                      {review.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Review Form */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-[40px] sticky top-32 shadow-2xl shadow-primary/5 border border-primary/5">
            <h3 className="text-2xl font-bold mb-8 tracking-tight">Write a Review</h3>
            
            {session ? (
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-black tracking-widest uppercase text-foreground/40">
                    Your Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                          newRating >= star 
                            ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" 
                            : "bg-foreground/5 text-foreground/20 hover:bg-foreground/10"
                        }`}
                      >
                        <Star className={`w-6 h-6 ${newRating >= star ? "fill-current" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black tracking-widest uppercase text-foreground/40">
                    Share your experience
                  </label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tell other travelers about your visit..."
                    rows={6}
                    className="w-full bg-foreground/5 border-none rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-foreground/20 resize-none"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-4 rounded-2xl">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 bg-primary text-white font-black rounded-full hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? "Sending..." : (
                    <>
                      Post Review <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <p className="text-foreground/60 mb-8 font-medium">Please login to share your experience with the community.</p>
                <Link
                  href="/login"
                  className="inline-block w-full py-5 bg-foreground text-background font-black rounded-full hover:bg-foreground/90 transition-all shadow-xl shadow-black/10 active:scale-95"
                >
                  Join the Community
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
