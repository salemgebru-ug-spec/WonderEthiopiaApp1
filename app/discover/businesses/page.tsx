"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Star, ChevronRight, Filter, Coffee, Bed, Car, Calendar, Utensils, Box, Loader2 } from "lucide-react";

interface Business {
  _id: string;
  name: string;
  description: string;
  category: "hotel" | "tour_operator" | "car_rental" | "event_organizer" | "restaurant" | "other";
  location: { city: string; region: string };
  contactPhone: string;
  profilePicture?: string;
}

const categoryIcons: Record<string, any> = {
  hotel: <Bed className="w-5 h-5" />,
  tour_operator: <MapPin className="w-5 h-5" />,
  car_rental: <Car className="w-5 h-5" />,
  event_organizer: <Calendar className="w-5 h-5" />,
  restaurant: <Utensils className="w-5 h-5" />,
  other: <Box className="w-5 h-5" />,
};

const categoryImages: Record<string, string> = {
  hotel: "/lalibela.png",
  tour_operator: "/simien-mountains.png",
  car_rental: "/restaurant.png",
  event_organizer: "/coffee-ceremony.png",
  restaurant: "/restaurant.png",
  other: "/lalibela.png",
};

export default function DiscoverBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          search: searchQuery,
          category: category,
          region: region
        });
        
        const url = `/api/businesses/public?${params.toString()}`;
        console.log("Fetching from:", url); // Debug help
        
        const res = await fetch(url);
       
        
        if (!res.ok) {
           const text = await res.text();
           console.error("API error response (text):", text.slice(0, 500));
           throw new Error(`Server returned ${res.status}`);
        }
        
        const data = await res.json();
        console.log(data);
        setBusinesses(data.businesses || []);
      } catch (error) {
        console.error("Failed to fetch businesses:", error);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchBusinesses();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, category, region]);

  const categories = [
    { label: "All Categories", value: "all", icon: <Box /> },
    { label: "Hotels", value: "hotel", icon: <Bed /> },
    { label: "Tour Operators", value: "tour_operator", icon: <MapPin /> },
    { label: "Events", value: "event_organizer", icon: <Calendar /> },
    { label: "Car Rentals", value: "car_rental", icon: <Car /> },
    { label: "Restaurants", value: "restaurant", icon: <Utensils /> },
  ];

  const regions = ["all", "Addis Ababa", "Amhara", "Oromia", "Tigray", "Afar", "Sidama"];

  return (
    <div className="bg-background text-foreground font-sans py-10 lg:py-20">
      {/* Header */}
      <section className="mb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
            <div className="text-left max-w-2xl animate-fade-in">
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary mb-6 block">
                Partner Registry
              </span>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[0.9]">
                ELITE SERVICES <br /> ACROSS ETHIOPIA
              </h1>
            </div>
            
            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-4 animate-slide-up delay-1">
              {categories.slice(1, 4).map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value === category ? "all" : cat.value)}
                  className={`px-8 py-4 rounded-3xl flex items-center gap-4 text-sm font-black tracking-wide transition-all duration-300 ${
                    category === cat.value
                      ? "bg-primary text-white shadow-2xl shadow-primary/30 -translate-y-1"
                      : "bg-surface-elevated text-foreground/40 hover:text-primary hover:bg-white"
                  }`}
                >
                  <span className={category === cat.value ? "text-white" : "text-primary"}>
                    {cat.icon}
                  </span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Combined Filters Glass */}
          <div className="max-w-6xl mx-auto glass rounded-[50px] p-4 flex flex-col md:flex-row gap-4 shadow-3xl shadow-primary/5 animate-slide-up delay-2">
            <div className="flex-[2] flex items-center px-8 gap-5 border-r border-foreground/5 mb-4 md:mb-0 bg-white/5 rounded-[32px]">
              <Search className="w-6 h-6 text-primary/40" />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-base font-bold placeholder:text-foreground/20 py-6"
              />
            </div>
            <div className="flex-1 flex items-center px-8 gap-5 border-r border-foreground/5 mb-4 md:md-0 hover:bg-white/10 transition-colors rounded-[32px]">
              <Filter className="w-6 h-6 text-primary/20" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-black text-foreground/50 py-6 appearance-none uppercase tracking-widest"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 flex items-center px-8 gap-5 hover:bg-white/10 transition-colors rounded-[32px]">
              <MapPin className="w-6 h-6 text-primary/20" />
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-black text-foreground/50 py-6 appearance-none uppercase tracking-widest"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>{r === "all" ? "All Regions" : r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-12 h-12 text-primary/20 animate-spin mb-6" />
            <span className="text-[10px] font-black tracking-widest uppercase text-foreground/20">Syncing Registry...</span>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-48 rounded-[60px] border-4 border-dashed border-foreground/5 bg-surface-elevated/20">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-10 text-primary">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-4">No results in this registry</h3>
            <p className="text-foreground/30 font-medium italic">Adjust filters to uncover new possibilities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {businesses.map((biz) => (
              <div
                key={biz._id}
                className="group bg-white rounded-[60px] p-6 card-hover overflow-hidden shadow-2xl shadow-foreground/5 border border-foreground/[0.03]"
              >
                <div className="relative h-80 rounded-[48px] overflow-hidden mb-10 shadow-inner">
                  <Image
                    src={biz.profilePicture || categoryImages[biz.category] || "/lalibela.png"}
                    alt={biz.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute top-6 right-6 px-6 py-2 glass rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-3">
                    <span className="text-primary">{categoryIcons[biz.category]}</span>
                    {biz.category.replace("_", " ")}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <div className="flex items-start justify-between mb-6">
                    <h3 className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors pr-2 tracking-tighter leading-none">
                      {biz.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[12px] font-black text-primary bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
                      <Star className="w-4 h-4 fill-current" />
                      5.0
                    </div>
                  </div>

                  <p className="text-base text-foreground/40 mb-12 line-clamp-2 leading-relaxed font-bold italic">
                    "{biz.description}"
                  </p>

                  <div className="flex items-center justify-between pt-8 border-t border-foreground/5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-black text-foreground/50 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary/40" />
                        {biz.location.city}
                      </span>
                    </div>
                    <Link
                      href={`/discover/businesses/${biz._id}`}
                      className="w-16 h-16 rounded-[28px] bg-foreground text-background flex items-center justify-center group-hover:bg-primary transition-all duration-500 shadow-2xl shadow-black/10 active:scale-90"
                    >
                      <ChevronRight className="w-8 h-8" />
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
