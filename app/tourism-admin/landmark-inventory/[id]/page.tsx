"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronLeft, AlertCircle } from "lucide-react";
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

export default function LandmarkDetail() {
  const { id } = useParams();

  const [destination, setDestination] = useState<Landmark | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!id) return;

  async function fetchDestination() {
    try {
      setLoading(true);
      const res = await fetch(`/api/landmarks/${id}`);

      // 1. Check if the HTTP status code is in the 200-299 range
      if (!res.ok) {
        // Try to read error text if the server sent an HTML error wrapper
        const errorText = await res.text();
        console.error(`[API Error] HTTP Status: ${res.status} ${res.statusText}`);
        console.error(`[API Response Snippet]:`, errorText.slice(0, 300)); // Log first 300 chars of the page
        
        throw new Error(`Server responded with status ${res.status}`);
      }

      // 2. Safely parse JSON once we know the response is healthy
      const json = await res.json();
      
      if (json && json.data) {
        setDestination(json.data);
      } else {
        console.warn("[API Warning] JSON parsed successfully, but 'data' field is missing:", json);
      }

    } catch (error) {
      // 3. Catch parsing errors or network failures
      if (error instanceof SyntaxError) {
        console.error("[Client Error] Failed to parse JSON. Expected JSON, received malformed text or raw HTML.", error);
      } else {
        console.error("[Network/Fetch Error] Failed to complete landmark data retrieval:", error);
      }
    } finally {
      setLoading(false);
    }
  }

  fetchDestination();
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

  if (!destination) {
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
          href="/tourism-admin/destination-inventory"
          className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition shadow-lg shadow-primary/20"
        >
          Back to Discovery
        </Link>
      </div>
    );
  }

  const latitude = destination?.coordinates?.latitude;
  const longitude = destination?.coordinates?.longitude;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/10">
      {/* Hero Section */}
      <section className="relative h-[55vh] md:h-[65vh] w-full overflow-hidden">
        {destination.gallery && destination.gallery[0] ? (
          <Image
            src={destination.gallery[0]}
            alt={destination.name}
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
            <span className="text-sm font-medium">Explore</span>
          </Link>
        </div>

        {/* Hero Meta Details */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col justify-end h-full">
          <div className="max-w-3xl space-y-4">
            <div className="flex gap-2">
              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 backdrop-blur-md rounded-md border border-primary/20">
                {destination.region}
              </span>
              {destination.unesco_status && destination.unesco_status !== "None" && (
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wider text-amber-500 uppercase bg-amber-500/10 backdrop-blur-md rounded-md border border-amber-500/20">
                  UNESCO: {destination.unesco_status}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {destination.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white">
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-semibold">{destination.city}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 lg:py-16 space-y-12">
        {/* Destination Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">About this landmark</h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
              {destination.description}
            </p>
            {destination.significance && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Historical Significance</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{destination.significance}</p>
              </div>
            )}
          </div>

          {/* Quick Info Sidebar Panel */}
          <div className="p-6 rounded-2xl border border-border bg-card/40 space-y-4">
            <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">Quick Facts</h3>
            <div className="space-y-3 text-sm">
              {destination.date_of_establishment && (
                <div>
                  <span className="block text-muted-foreground text-xs">Established</span>
                  <span className="font-medium text-foreground">{destination.date_of_establishment}</span>
                </div>
              )}
              {destination.visitor_info?.opening_hours && (
                <div>
                  <span className="block text-muted-foreground text-xs">Opening Hours</span>
                  <span className="font-medium text-foreground">{destination.visitor_info.opening_hours}</span>
                </div>
              )}
              {destination.visitor_info?.fee && (
                <div>
                  <span className="block text-muted-foreground text-xs">Entry Fee</span>
                  <span className="font-medium text-foreground">{destination.visitor_info.fee}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-xl font-bold tracking-tight">Location Map</h3>
          <div className="w-full h-80 md:h-96 rounded-2xl overflow-hidden border border-border bg-muted/30 shadow-sm relative">
            {latitude && longitude ? (
              <Map position={[latitude, longitude]} zoom={13} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground animate-pulse">Gathering location telemetry...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
