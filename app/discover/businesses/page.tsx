"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Star, ChevronRight, Bed, Car, Calendar, Box, Loader2, Building2, Compass, ChevronLeft } from "lucide-react";

interface Service {
  _id: string;
  name: string;
  description: string;
  category: string | string[];
  price: number;
  currency: string;
  images: string[];
  avgRating?: number | null;
  businessId: {
    _id: string;
    name: string;
    profilePicture?: string;
    location: { city: string; region: string };
  };
}

const categoryIcons: Record<string, any> = {
  hotel: <Bed className="w-5 h-5" />,
  room: <Bed className="w-5 h-5" />,
  suite: <Bed className="w-5 h-5" />,
  accommodation: <Bed className="w-5 h-5" />,
  tour_operator: <MapPin className="w-5 h-5" />,
  tour: <Compass className="w-4 h-4" />,
  expedition: <Compass className="w-4 h-4" />,
  car_rental: <Car className="w-5 h-5" />,
  vehicle: <Car className="w-5 h-5" />,
  car: <Car className="w-5 h-5" />,
  event_organizer: <Calendar className="w-5 h-5" />,
  event: <Calendar className="w-5 h-5" />,
};

const categoryImages: Record<string, string> = {
  hotel: "/lalibela.png",
  tour_operator: "/simien-mountains.png",
  car_rental: "/restaurant.png",
  event_organizer: "/coffee-ceremony.png",
};

export default function DiscoverBusinesses() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");

  const [preferences, setPreferences] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, region, category]);

  // 1. Fetch user preferences on mount
  useEffect(() => {
    async function fetchUserPreferences() {
      try {
        const res = await fetch('/api/tourist/profile');
        if (!res.ok) throw new Error("Failed to pull preference profile");
        
        const json = await res.json();
        const profile = json.profile || {};

        const userPreferencesObj = {
          accommodationType: profile.accommodation_type,
          amenities: Array.isArray(profile.amenities) ? profile.amenities.join(", ") : profile.amenities,
          durationPreference: profile.duration_preference,
          fitnessLevel: profile.fitness_level,
          groupType: profile.group_type,
          roomType: profile.room_type,
          travelStyle: profile.travel_style,
        };

        const flatPreferencesString = Object.values(userPreferencesObj)
          .filter(Boolean)
          .join(", ");

        if (flatPreferencesString) {
          setPreferences(flatPreferencesString);
        }
      } catch (err) {
        console.error("Error building user preferences data string:", err);
      } finally {
        setPreferencesLoaded(true);
      }
    }
    
    fetchUserPreferences();
  }, []);

  // 2. Fetch Services effect
  useEffect(() => {
    if (!preferencesLoaded) return;

    async function fetchServices() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          search: searchQuery,
          category: category,
          region: region
        });
        
        let res = null;
        
        if (preferences) {
          console.log('case1: Using vector recommendations');
          res = await fetch(`/api/business-recommendation?preferences=${encodeURIComponent(preferences)}&${params.toString()}`, {
            method: 'GET'
          });
        } else {
          console.log('case2: Using fallback default API layout');
          const url = `/api/businesses/public?${params.toString()}`;
          res = await fetch(url);
        }
        
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        
        const data = await res.json();

// Normalize: handle both array and wrapped { services: [] } / { businesses: [] } shapes
const rawList = Array.isArray(data)
  ? data
  : Array.isArray(data.services)
    ? data.services
    : Array.isArray(data.businesses)
      ? data.businesses
      : [];

const availableServices = rawList.filter(
  (d: any) => d?.availability?.isAvailable === true
);
setServices(availableServices);
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchServices();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, category, region, preferences, preferencesLoaded]);

  const categories = [
    { label: "All Categories", value: "all", icon: <Box /> },
    { label: "Hotels", value: "room", icon: <Bed /> },
    { label: "Tour Operators", value: "tour", icon: <MapPin /> },
    { label: "Events", value: "event", icon: <Calendar /> },
    { label: "Car Rentals", value: "car", icon: <Car /> },
  ];

  const regions = ["all", "Addis Ababa", "Amhara", "Oromia", "Tigray", "Afar", "Sidama"];

  // FIX: Access regional strings correctly and implement category protection check safely
  const filteredBusinesses = useMemo(() => {
    return services.filter((serv) => {
      const bizLocation = serv.businessId?.location;
      const svcRegion = bizLocation?.region || "";
      const svcCity = bizLocation?.city || "";
      
      const matchesRegion = region === "all" || svcRegion.toLowerCase() === region.toLowerCase();

      // Front-end Category chips selection verification 
      const rawCat = Array.isArray(serv.category) ? serv.category[0] : serv.category;
      const matchesCategory = category === "all" || (rawCat && rawCat.toLowerCase().includes(category.toLowerCase()));

      const cleanQuery = searchQuery.toLowerCase().trim();
      const matchesSearch =
        cleanQuery === "" ||
        serv.name.toLowerCase().includes(cleanQuery) ||
        svcCity.toLowerCase().includes(cleanQuery) ||
        serv.description.toLowerCase().includes(cleanQuery);

      return matchesRegion && matchesCategory && matchesSearch;
    });
  }, [services, searchQuery, region, category]);

  // FIX: Use filtered calculations to accurately handle dynamic UI pagination requirements
  const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleDestinations = useMemo(() => {
    return filteredBusinesses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBusinesses, startIndex, ITEMS_PER_PAGE]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-background text-foreground font-sans py-10 lg:py-20">
      {/* Header */}
      <section className="mb-16">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
            <div className="text-left max-w-2xl animate-fade-in">
              <span className="text-xs font-black tracking-[0.4em] uppercase text-primary mb-6 block">
                Resource Discovery
              </span>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[0.9]">
                ELITE SERVICES <br /> ACROSS ETHIOPIA
              </h1>
            </div>
            
            {/* Category Filter Chips */}
            {/* Category Filter Chips */}
<div className="flex flex-wrap gap-4 animate-slide-up delay-1">
  {/* REMOVED .slice(1) to let "All Categories" render */}
  {categories.map((cat) => (
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
                placeholder="Search services or experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-base font-bold placeholder:text-foreground/20 py-6"
              />
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
      <section className="max-w-7xl mx-auto px-3 md:px-4 lg:px-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-12 h-12 text-primary/20 animate-spin mb-6" />
            <span className="text-xs font-black tracking-widest uppercase text-foreground/20">Syncing Catalog...</span>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-48 rounded-[60px] border-4 border-dashed border-foreground/5 bg-surface-elevated/20">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-10 text-primary">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-4">No services available</h3>
            <p className="text-foreground/30 font-medium italic">Adjust filters to find curated experiences.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* FIX: Render visibleDestinations instead of mapping raw unfiltered services directly */}
            {visibleDestinations.map((svc) => (
              <div
                key={svc._id}
                className="group bg-white rounded-[60px] p-6 card-hover overflow-hidden shadow-2xl shadow-foreground/5 border border-foreground/[0.03]"
              >
                <div className="relative h-80 rounded-[48px] overflow-hidden mb-10 shadow-inner">
                  <Image
                    src={svc.images?.[0] || 
                       (Array.isArray(svc.category) ? categoryImages[svc.category[0]] : categoryImages[svc.category as string]) || 
                       "/lalibela.png"}
                    alt={svc.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute top-6 left-6 px-3 md:px-4 lg:px-5 py-2 glass rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-3">
                    <span className="text-primary">
                       {Array.isArray(svc.category) ? categoryIcons[svc.category[0]] : categoryIcons[svc.category as string]}
                    </span>
                    {Array.isArray(svc.category) ? svc.category[0].replace("_", " ") : (svc.category as string).replace("_", " ")}
                  </div>
                  <div className="absolute bottom-6 right-6 px-3 md:px-4 lg:px-5 py-2 bg-primary text-white rounded-full text-xs font-black tracking-widest uppercase shadow-xl">
                    {svc.currency} {svc.price.toLocaleString()}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors pr-2 tracking-tighter leading-tight mb-2">
                        {svc.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary/40">
                         <Building2 className="w-3.5 h-3.5" /> {svc.businessId?.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-black text-primary bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
                      <Star className={`w-4 h-4 ${svc.avgRating ? "fill-current" : "opacity-30"}`} />
                      {svc.avgRating ? svc.avgRating.toFixed(1) : <span className="italic text-foreground/40 text-xs uppercase">New</span>}
                    </div>
                  </div>

                  <p className="text-base text-foreground/40 mb-10 line-clamp-2 leading-relaxed font-medium italic">
                    "{svc.description}"
                  </p>

                  <div className="flex items-center justify-between pt-8 border-t border-foreground/5">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-foreground/50 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary/40" />
                        {svc.businessId?.location?.city}
                      </span>
                    </div>
                    <Link
                      href={`/discover/services/${svc._id}`}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 mt-16">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="group flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-foreground/10 bg-surface hover:border-primary hover:bg-primary/5 disabled:opacity-40 disabled:hover:border-foreground/10 disabled:hover:bg-surface disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-foreground/5"
            >
              <ChevronLeft className="w-5 h-5 text-foreground/70 group-hover:text-primary transition-colors group-disabled:text-foreground/40" />
            </button>

            <span className="text-sm font-bold text-foreground/60 select-none">
              Page <span className="text-foreground font-extrabold">{currentPage}</span> of {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="group flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-foreground/10 bg-surface hover:border-primary hover:bg-primary/5 disabled:opacity-40 disabled:hover:border-foreground/10 disabled:hover:bg-surface disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-foreground/5"
            >
              <ChevronRight className="w-5 h-5 text-foreground/70 group-hover:text-primary transition-colors group-disabled:text-foreground/40" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
