"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Star, Heart, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";

interface Destination {
  _id: string;
  name: string;
  description: string;
  region: string;
  city: string;
  images: string[];
  rating: number;
}

export default function DiscoverDestinations() {
  const { data: session } = useSession();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [preferences, setPreferences] = useState<any>();

  useEffect(() => {
    async function fetchUserPreferences() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setPreferences(data.user?.preferences);
        }
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
      }
    }
    if (session) fetchUserPreferences();
  }, [session]);

  useEffect(() => {
    async function fetchDestinations() {
      try {
        setLoading(true);
        let res: Response;

        if (preferences && preferences.categories) {
          res = await fetch(`/api/recommendation?preferences=${preferences.categories}`, {
            method: 'GET'
          });
        } else {
          let url = `/api/destinations?search=${searchQuery}`;
          if (region !== "all") url += `&region=${region}`;
          res = await fetch(url);
        }

        if (res.ok) {
          const data = await res.json();
          setDestinations(Array.isArray(data) ? data : []);
        } else {
          setDestinations([]);
        }
      } catch (error) {
        console.error("Failed to fetch destinations:", error);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchDestinations();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, region, preferences]);

  const regions = [
    "all",
    "Addis Ababa",
    "Amhara",
    "Oromia",
    "Tigray",
    "Afar",
    "Sidama",
    "SNNPR",
    "Gambela",
    "Benishangul-Gumuz",
    "Harari",
    "Somali",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Search Header */}
      <section className="pt-32 pb-16 bg-surface-elevated/30">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-5">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary mb-4 block">
              Discover Ethiopia
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Ancient Wonders & <br /> Majestic Landscapes
            </h1>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto glass p-3 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-xl shadow-primary/5">
            <div className="flex-1 flex items-center px-4 gap-3 border-r border-foreground/10 mb-2 sm:mb-0">
              <Search className="w-5 h-5 text-primary/60" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-foreground/30 py-3"
              />
            </div>
            <div className="flex-1 flex items-center px-4 gap-3 border-r border-foreground/10 mb-2 sm:mb-0">
              <MapPin className="w-5 h-5 text-primary/60" />
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-foreground/70 py-3 appearance-none"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r === "all" ? "All Regions" : r}
                  </option>
                ))}
              </select>
            </div>
            <button className="px-8 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-all active:scale-95 shadow-md shadow-primary/30">
              Explore
            </button>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-20 max-w-7xl mx-auto px-3 md:px-4 lg:px-5">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-[450px] rounded-[40px] bg-surface animate-shimmer" />
            ))}
          </div>
        ) : destinations.length === 0 ? (
          <div className="text-center py-32 rounded-3xl border-2 border-dashed border-foreground/5">
            <p className="text-foreground/40 font-semibold italic text-lg">
              No destinations found for your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations?.map((dest) => (
              <div
                key={dest._id}
                className="group bg-surface rounded-[40px] p-4 card-hover overflow-hidden shadow-xl shadow-foreground/5 border border-foreground/[0.03]"
              >
                <div className="relative h-72 rounded-[32px] overflow-hidden mb-6 shadow-inner">
                  {dest.images && dest.images[0] ? (
                    <img
                      src={dest.images[0]}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary/30">
                      <Star className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 group-hover:scale-110 transition-transform duration-300">
                    <button className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white hover:text-red-500 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors pr-2">
                      {dest.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[12px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-full">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {dest.rating ? dest.rating.toFixed(1) : "New"}
                    </div>
                  </div>

                  <p className="text-sm text-foreground/50 mb-8 line-clamp-2 leading-relaxed font-medium">
                    {dest.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground/30 flex items-center gap-2 uppercase tracking-wider">
                      <MapPin className="w-3 h-3" />
                      {dest.city}, {dest.region}
                    </span>
                    <Link
                      href={`/discover/destinations/${dest._id}`}
                      className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center group-hover:bg-primary transition-all duration-300 shadow-lg shadow-black/10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
