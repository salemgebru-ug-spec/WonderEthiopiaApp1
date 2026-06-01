"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Star, Heart, ChevronRight, ChevronLeft } from "lucide-react";

interface Destination {
  _id: string;
  name: string;
  description: string;
  region: string;
  city: string;
  images: string[];
  rating: number;
}

const ITEMS_PER_PAGE = 6;

export default function DiscoverDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [region, setRegion] = useState("all");
  // undefined = not yet fetched, null = fetched but no preferences, string[] = has preferences
  const [preferences, setPreferences] = useState<string[] | null | undefined>(undefined);

  // 1. Fetch user preferences on mount
  useEffect(() => {
    async function fetchUserPreferences() {
      try {
        const res = await fetch("/api/tourist/profile");
        const data = await res.json();
        // Use interests array; if empty/missing, set null so we fall back to full list
        const interests: string[] = data.profile?.interests ?? [];
        setPreferences(interests.length > 0 ? interests : null);
      } catch {
        setPreferences(null); // on error, show full list
      }
    }
    fetchUserPreferences();
  }, []);

  // 2. Fetch destinations — wait until preferences have been resolved (not undefined)
  useEffect(() => {
    if (preferences === undefined) return; // still loading profile, don't fetch yet

    async function fetchDestinations() {
      try {
        setLoading(true);

        let res: Response;

        if (preferences && preferences.length > 0) {
          // Has preferences → use recommendation engine
          res = await fetch(`/api/recommendation?preferences=${preferences.join(",")}`);
        } else {
          // No preferences → fetch full list with search/region filters
          let url = `/api/destinations?search=${searchQuery}`;
          if (region !== "all") url += `&region=${region}`;
          res = await fetch(url);
        }

        const data = await res.json();
        setDestinations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch destinations:", error);
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchDestinations, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, region, preferences]);

  // 3. Client-side filter
  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest) => {
      const matchesRegion =
        region === "all" || dest.region.toLowerCase() === region.toLowerCase();
      const cleanQuery = searchQuery.toLowerCase().trim();
      const matchesSearch =
        cleanQuery === "" ||
        dest.name.toLowerCase().includes(cleanQuery) ||
        dest.city.toLowerCase().includes(cleanQuery) ||
        dest.description.toLowerCase().includes(cleanQuery);
      return matchesRegion && matchesSearch;
    });
  }, [destinations, searchQuery, region]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, region]);

  const totalPages = Math.ceil(filteredDestinations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleDestinations = filteredDestinations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  const regions = [
    "all", "Addis Ababa", "Amhara", "Oromia", "Tigray", "Afar",
    "Sidama", "SNNPR", "Gambela", "Benishangul-Gumuz", "Harari", "Somali",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Search Header */}
      <section className="pt-32 pb-16 bg-surface-elevated/30">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-5">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-4 block">
              Discover Ethiopia
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Ancient Wonders & <br /> Majestic Landscapes
            </h1>
          </div>

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
        ) : filteredDestinations.length === 0 ? (
          <div className="text-center py-32 rounded-3xl border-2 border-dashed border-foreground/5">
            <p className="text-foreground/40 font-semibold italic text-lg">
              No destinations found for your search.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleDestinations.map((dest) => (
                <div
                  key={dest._id}
                  className="group bg-surface rounded-[40px] p-4 card-hover overflow-hidden shadow-xl shadow-foreground/5 border border-foreground/[0.03]"
                >
                  <div className="relative h-72 rounded-[32px] overflow-hidden mb-6 shadow-inner">
                    {dest.images && dest.images[1] ? (
                      <img
                        src={dest.images[1]}
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
                      <div className="flex items-center gap-1 text-sm font-bold text-primary bg-primary/5 px-2 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {dest.rating ? dest.rating.toFixed(1) : "New"}
                      </div>
                    </div>

                    <p className="text-sm text-foreground/50 mb-8 line-clamp-2 leading-relaxed font-medium">
                      {dest.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground/30 flex items-center gap-2 uppercase tracking-wider">
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 mt-16">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="group flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-foreground/10 bg-surface hover:border-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground/70 group-hover:text-primary transition-colors" />
                </button>
                <span className="text-sm font-bold text-foreground/60 select-none">
                  Page <span className="text-foreground font-extrabold">{currentPage}</span> of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="group flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-foreground/10 bg-surface hover:border-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronRight className="w-5 h-5 text-foreground/70 group-hover:text-primary transition-colors" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
