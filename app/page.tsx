"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Camera, ChevronRight, Menu, X, Users, Star, Globe, Shield, ArrowRight } from "lucide-react";

interface Business {
  _id: string;
  name: string;
  description: string;
  category: string;
  location: { city: string; region: string };
  contactPhone: string;
  profilePicture?: string;
}

const categoryImages: Record<string, string> = {
  hotel: "/lalibela.png",
  tour_operator: "/simien-mountains.png",
  car_rental: "/restaurant.png",
  event_organizer: "/coffee-ceremony.png",
  restaurant: "/restaurant.png",
  other: "/lalibela.png",
};

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bizRes, destRes] = await Promise.all([
          fetch("/api/businesses/public?limit=3", { cache: 'no-store' }),
          fetch("/api/destinations", { cache: 'no-store' })
        ]);
        
        const bizData = await bizRes.json();
        const destData = await destRes.json();

        setBusinesses(bizData.businesses?.slice(0, 3) || []);
        setDestinations(destData.slice(0, 3) || []);
      } catch (error) {
        console.error("Failed to fetch landing page data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    // Initial fetch
    fetchData();

    // Live sync interval (poll every 10s for immediate visibility updates)
    const syncInterval = setInterval(fetchData, 10000);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(syncInterval);
    };
  }, []);

  const categories = [
    { name: "Hotels & Lodges", value: "hotel", icon: <Globe className="w-5 h-5" /> },
    { name: "Tour Operators", value: "tour_operator", icon: <MapPin className="w-5 h-5" /> },
    { name: "Events", value: "event_organizer", icon: <Calendar className="w-5 h-5" /> },
    { name: "Car Rentals", value: "car_rental", icon: <Camera className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-all duration-500 font-sans selection:bg-primary/10 selection:text-primary">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? "py-4 glass shadow-sm" : "py-8 bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tighter text-primary flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">W</div>
            WONDER ETHIOPIA
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            <Link
              href={status === "authenticated" ? "/discover" : "#"}
              className="text-[13px] font-bold text-primary transition-all duration-300 relative group"
            >
              Discover
              <span className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-primary transition-all duration-300" />
            </Link>
            {[
              { name: "Destinations", href: "/discover/destinations", anchor: "#destinations" },
              { name: "Partners", href: "/discover/businesses", anchor: "#partners" },
            ].map((item) => (
              <Link
                key={item.name}
                href={status === "authenticated" ? item.href : item.anchor}
                className="text-[13px] font-medium text-foreground/70 hover:text-primary transition-all duration-300 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-primary group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-6">
              {session ? (
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-full hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-300 active:scale-95"
                >
                  My Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-[13px] font-semibold text-foreground/80 hover:text-primary transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-6 py-2.5 bg-foreground text-background text-[13px] font-semibold rounded-full hover:bg-foreground/90 transition-all duration-300 active:scale-95"
                  >
                    Join Us
                  </Link>
                </>
              )}
            </div>
            <button 
              className="md:hidden p-2 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background Content */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/simien-mountains.png"
            alt="Ethiopian Highlands"
            fill
            className="object-cover scale-105"
            priority
            quality={100}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
        </div>

        <div className="relative z-10 text-center max-w-5xl px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-[10px] font-bold tracking-[0.3em] text-primary uppercase bg-primary/10 backdrop-blur-md rounded-full animate-fade-in border border-primary/20">
            Discover the Land of Origins
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-[100px] font-bold mb-8 tracking-[-0.04em] leading-[0.9] text-foreground animate-slide-up">
            EXPLORE THE <br />
            <span className="text-primary italic font-light">ETHIOPIAN</span> SPIRIT
          </h1>

          <p className="text-lg md:text-xl text-foreground/60 mb-12 max-w-2xl mx-auto font-medium leading-relaxed animate-slide-up delay-1">
            Experience the majestic Simien Mountains, ancient wonders, and the vibrant cultural tapestry of a nation with 3,000 years of history.
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto glass p-3 rounded-2xl flex flex-col sm:flex-row gap-2 animate-slide-up delay-2 shadow-xl shadow-primary/5">
            <div className="flex-1 flex items-center px-4 gap-3 border-r border-foreground/10 mb-2 sm:mb-0">
              <Search className="w-5 h-5 text-primary/60" />
              <input
                type="text"
                placeholder="Where to next?"
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-foreground/30 py-3"
              />
            </div>
            <div className="flex-1 flex items-center px-4 gap-3 border-r border-foreground/10 mb-2 sm:mb-0">
              <MapPin className="w-5 h-5 text-primary/60" />
              <select className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-foreground/70 py-3 appearance-none">
                <option>All Regions</option>
                <option>Amhara</option>
                <option>Oromia</option>
                <option>Tigray</option>
                <option>Afar</option>
              </select>
            </div>
            <button className="px-8 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-all active:scale-95 shadow-md shadow-primary/30">
              Search Destination
            </button>
          </div>
        </div>
      </section>

      {/* Top Destinations */}
      <section id="destinations" className="py-32 bg-surface-elevated/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-xl">
               <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary mb-4 block">Legendary Landmarks</span>
               <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Imperial Destinations</h2>
               <p className="text-foreground/40 font-medium italic">Discover the ancient soul of Ethiopia through its most iconic heritage sites.</p>
            </div>
            <Link href="/discover/destinations" className="hidden sm:flex items-center gap-3 px-8 py-4 bg-white rounded-2xl text-[11px] font-black uppercase text-foreground/40 hover:text-primary transition-all shadow-xl shadow-foreground/5 relative group">
               View Full Atlas <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {destinations.length > 0 ? (
              destinations.map((dest: any) => (
                <div key={dest._id} className="group relative h-[450px] rounded-[40px] overflow-hidden shadow-2xl shadow-primary/5 cursor-pointer">
                   <Image 
                    src={
  (() => {
    const img = dest.images?.[0];
    // Must exist, not be empty, and either start with / or http
    if (img && img.trim() !== "" && (img.startsWith('/') || img.startsWith('http'))) {
      return img;
    }
    return "/lalibela.png";
  })()
}
                     alt={dest.name}
                     fill
                     className="object-cover group-hover:scale-110 transition-all duration-700"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                   <div className="absolute bottom-0 left-0 w-full p-10 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-center gap-2 mb-3 text-[9px] font-black tracking-widest uppercase text-primary">
                         <MapPin className="w-3 h-3" /> {dest.region}
                      </div>
                      <h3 className="text-3xl font-bold mb-4 tracking-tight">{dest.name}</h3>
                      <p className="text-xs font-medium opacity-0 group-hover:opacity-60 transition-opacity duration-500 line-clamp-2 italic mb-6">"{dest.description}"</p>
                      <Link href={status === "authenticated" ? `/discover/destinations/${dest._id}` : "/login"} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-primary transition-colors">
                         Begin Discovery <ArrowRight className="w-3 h-3" />
                      </Link>
                   </div>
                </div>
              ))
            ) : (
              [1, 2, 3].map(n => (
                <div key={n} className="h-[450px] rounded-[40px] bg-surface animate-shimmer" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Trust & Quality Section */}
      <section className="py-32 border-y border-foreground/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { icon: <Shield className="w-6 h-6" />, title: "Verified Partners", desc: "Every operator is manually vetted by our tourism office." },
              { icon: <Users className="w-6 h-6" />, title: "Authentic Connection", desc: "Connecting you directly with local communities & crafts." },
              { icon: <Star className="w-6 h-6" />, title: "Quality Guarantee", desc: "Top-rated services across all regions of Ethiopia." },
              { icon: <Camera className="w-6 h-6" />, title: "Unreal Landscapes", desc: "Access the hidden gems you won't find on maps." },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="text-primary">{feature.icon}</div>
                <h4 className="font-bold text-lg">{feature.title}</h4>
                <p className="text-sm text-foreground/50 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section id="partners" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary mb-4 block">Hand-Picked Agencies</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Best Tour Operators</h2>
            </div>
            <Link href="/discover/businesses" className="text-primary font-bold text-sm flex items-center gap-2 group">
              View All Partners <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-96 rounded-3xl bg-surface animate-shimmer" />
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-32 rounded-3xl border-2 border-dashed border-foreground/5">
              <p className="text-foreground/40 font-semibold italic text-lg">
                Curating premium experiences for you soon...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {businesses.map((biz) => (
                <div
                  key={biz._id}
                  className="group bg-surface rounded-[40px] p-4 card-hover overflow-hidden shadow-xl shadow-foreground/5 border border-foreground/[0.03]"
                >
                  <div className="relative h-64 rounded-[32px] overflow-hidden mb-6 shadow-inner">
                    <Image
                      src={biz.profilePicture || categoryImages[biz.category] || "/lalibela.png"}
                      alt={biz.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 px-4 py-1.5 glass rounded-full text-[9px] font-black tracking-widest uppercase">
                      {biz.category.replace("_", " ")}
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors pr-2">
                        {biz.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[12px] font-bold text-primary">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        5.0
                      </div>
                    </div>
                    <p className="text-sm text-foreground/50 mb-8 line-clamp-2 leading-relaxed font-medium">
                      {biz.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-foreground/30 flex items-center gap-2 uppercase tracking-wider">
                        <MapPin className="w-3 h-3" />
                        {biz.location.city}
                      </span>
                      <button
                        onClick={() => {
                          if (status === "authenticated") {
                            // Already signed in
                            if (session?.user?.role === "tourist") {
                              router.push("/dashboard");
                            } else if (session?.user?.role === "tourism_admin") {
                              router.push("/tourism-admin/businesses");
                            } else {
                              router.push("/dashboard");
                            }
                          } else {
                            // First time sign-in: direct to Discovery Hub after login
                            router.push("/login?callbackUrl=" + encodeURIComponent("/discover/businesses"));
                          }
                        }}
                        className="w-16 h-16 rounded-[28px] bg-foreground text-background flex items-center justify-center group-hover:bg-primary transition-all duration-500 shadow-2xl shadow-black/10 active:scale-90"
                      >
                        <ChevronRight className="w-8 h-8" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto relative overflow-hidden rounded-[50px] shadow-2xl">
          <div className="absolute inset-0 bg-primary/95" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40" />

          <div className="relative z-10 p-20 md:p-32 text-center text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tighter leading-tight">
              LIST YOUR SERVICE <br /> ON WONDER ETHIOPIA
            </h2>
            <p className="text-lg md:text-xl font-medium opacity-80 max-w-2xl mx-auto mb-12">
              Join the largest network of tourism professionals in Ethiopia. Grow your brand with authentic exposure.
            </p>
            <Link
              href="/business"
              className="inline-block px-12 py-5 bg-white text-primary text-base font-black rounded-full hover:bg-white/90 transition-all duration-300 shadow-xl shadow-black/10 active:scale-95"
            >
              Get Started Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-elevated pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="text-2xl font-bold text-primary tracking-tighter mb-8 block">WONDER ETHIOPIA</Link>
              <p className="text-foreground/50 text-base leading-relaxed max-w-sm font-medium">
                Designing the future of Ethiopian tourism through technology and authentic discovery.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-black tracking-[0.3em] uppercase text-primary mb-8">Navigation</h4>
              <ul className="space-y-4">
                {["Our Story", "Destinations", "Apply for Partner"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm font-bold text-foreground/60 hover:text-primary transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black tracking-[0.3em] uppercase text-primary mb-8">Connect</h4>
              <ul className="space-y-4">
                {["Instagram", "LinkedIn", "Contact Office"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm font-bold text-foreground/60 hover:text-primary transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-foreground/[0.03] flex justify-between items-center text-[11px] font-bold tracking-widest text-foreground/30 uppercase">
            <p>© {new Date().getFullYear()} Wonder Ethiopia</p>
            <p>Made with heart in Addis Ababa</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
