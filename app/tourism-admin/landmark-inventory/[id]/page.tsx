"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, ChevronLeft, User, Calendar, MessageSquare, AlertCircle, Edit3, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";

interface Landmark {
  _id: string;
  name: string;
  description: string;
  region: string;
  city: string;
  gallery: string[];
  date_of_establishment: string;
  significance: string;
  unesco_status: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  visitor_info: {
    fee: string;
    opening_hours: string;
  };
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

export default function LandmarkDetail() {
  const { id } = useParams();

  const [landmark, setLandmark] = useState<Landmark | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleEditReview = (reviewId: string) => {
    console.log("Edit review:", reviewId);
  };

  const handleDeleteReview = async (reviewId: string) => {
    console.log("Delete review:", reviewId);
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?target_id=${id}&target_type=landmark`);
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

    async function fetchLandmark() {
      try {
        setLoading(true);
        const res = await fetch(`/api/landmarks/${id}`);
        const json = await res.json();
        console.log(json);
        if (json.data) {
          setLandmark(json.data);
          await fetchReviews();
        }
      } catch (error) {
        console.error("Failed to fetch landmark:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLandmark();
  }, [id]);

  const Map = useMemo(
    () =>
      dynamic(() => import("../../../../components/map"), {
        loading: () => (
          <div className="w-full h-full flex items-center justify-center bg-muted/40 animate-pulse text-sm text-muted-foreground">
            Mapping telemetry loading...
          </div>
        ),
        ssr: false,
      }),
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background space-y-8 animate-pulse">
        <div className="h-[50vh] bg-muted w-full relative" />
        <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-6 pt-8">
          <div className="h-8 bg-muted w-1/3 rounded-lg" />
          <div className="h-24 bg-muted w-full rounded-2xl" />
          <div className="h-96 bg-muted w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!landmark) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Landmark Not Found</h1>
        <p className="text-muted-foreground max-w-sm mb-8">
          The landmark you are looking for does not exist or has been permanently moved.
        </p>
        <Link
          href="/tourism-admin/landmark-inventory"
          className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition shadow-lg shadow-primary/20"
        >
          Back to Inventory
        </Link>
      </div>
    );
  }

  const latitude = landmark?.coordinates?.latitude;
  const longitude = landmark?.coordinates?.longitude;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/10">
      {/* Hero Section */}
      <section className="relative h-[55vh] md:h-[65vh] w-full overflow-hidden">
        {landmark.gallery && landmark.gallery[0] ? (
          <Image
            src={landmark.gallery[0]}
            alt={landmark.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-muted to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />

        {/* Back Button */}
        <div className="absolute top-24 left-4 md:left-8 z-10">
          <Link
            href="/tourism-admin/landmark-inventory"
            className="inline-flex items-center gap-2 text-white bg-black/30 hover:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Inventory</span>
          </Link>
        </div>

        {/* Hero Meta Details */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col justify-end h-full">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 backdrop-blur-md rounded-md border border-primary/20">
              {landmark.region}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {landmark.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white">
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{avgRating ? avgRating.toFixed(1) : "New"}</span>
                <span className="opacity-70">({reviews.length} reviews)</span>
              </div>
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-semibold">{landmark.city}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 lg:py-16 space-y-12">
        {/* Landmark Info */}
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">About this landmark</h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
            {landmark.description}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block mb-1">UNESCO Status</span>
                <span className="text-foreground font-medium">{landmark.unesco_status || "None"}</span>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Established</span>
                <span className="text-foreground font-medium">{landmark.date_of_establishment || "Unknown"}</span>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Visitor Fee</span>
                <span className="text-foreground font-medium">{landmark.visitor_info?.fee || "Free"}</span>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Opening Hours</span>
                <span className="text-foreground font-medium">{landmark.visitor_info?.opening_hours || "Always Open"}</span>
            </div>
          </div>
          
          {landmark.significance && (
              <div className="mt-6">
                  <h3 className="text-xl font-bold tracking-tight mb-3">Significance</h3>
                  <p className="text-muted-foreground leading-relaxed">
                      {landmark.significance}
                  </p>
              </div>
          )}

          {/* Map Canvas Container */}
          <div className="w-full h-80 md:h-96 rounded-2xl overflow-hidden border border-border bg-muted/30 shadow-sm relative mt-8">
            {latitude && longitude ? (
              <Map position={[latitude, longitude]} zoom={13} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground animate-pulse">Gathering location telemetry...</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews View Section */}
        <div className="space-y-8 pt-10 border-t border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-primary" />
              Community Stories
            </h2>
            <div className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
            </div>
          </div>

          <div className="grid gap-6">
            {reviews.length === 0 ? (
              <div className="py-12 border border-dashed border-border rounded-2xl text-center bg-muted/10">
                <p className="text-muted-foreground italic text-sm">No reviews have been posted for this location yet.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review._id}
                  className="p-6 rounded-2xl border border-border/60 bg-card/50 shadow-sm hover:border-border transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">
                          {review.userId?.name || review.userName || "Explorer"}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(review.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Panel & Star Matrix Container */}
                    <div className="flex items-center gap-3">
                      {/* Dynamic Star Badges */}
                      <div className="flex items-center gap-0.5 bg-muted px-2 py-1 rounded-lg">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Edit and Trash Action Buttons */}
                      <div className="flex items-center border border-border/50 rounded-lg overflow-hidden bg-background shadow-sm">
                        <button
                          onClick={() => handleEditReview(review._id)}
                          title="Edit review"
                          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition border-r border-border/50"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          title="Delete review"
                          className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-4 pl-0 md:pl-13">
                    {review.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
