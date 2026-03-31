"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MapPin, Star, Building2, Palmtree, ArrowRight, Compass, Camera } from "lucide-react";

export default function DiscoverHub() {
  const sections = [
    {
      title: "Ancient Destinations",
      description: "From the rock-hewn churches of Lalibela to the peaks of Simien, discover the heart of Ethiopia.",
      link: "/discover/destinations",
      image: "/simien-mountains.png",
      icon: <Palmtree className="w-8 h-8" />,
      tag: "Nature & History"
    },
    {
      title: "Trusted Partners",
      description: "Find the best hotels, tour operators, and agencies verified by our tourism office.",
      link: "/discover/businesses",
      image: "/lalibela.png", // fallback image
      icon: <Building2 className="w-8 h-8" />,
      tag: "Services & Support"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 scale-105">
           <Image
            src="/simien-mountains.png"
            alt="Landscape"
            fill
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
        </div>

        <div className="relative z-10 text-center max-w-5xl px-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 mb-10 text-[10px] font-black tracking-[0.4em] text-primary uppercase bg-primary/10 backdrop-blur-xl rounded-full border border-primary/20">
            Discovery Hub <Compass className="w-4 h-4" />
          </div>

          <h1 className="text-6xl md:text-[120px] font-bold mb-12 tracking-[-0.05em] leading-[0.8] text-foreground">
            UNFOLD THE <br />
            <span className="text-primary italic font-light">UNSEEN</span> ROUTE
          </h1>

          <p className="text-xl md:text-2xl text-foreground/50 mb-16 max-w-2xl mx-auto font-medium leading-relaxed">
            Your comprehensive guide to Ethiopia's majestic landscapes and verified travel services.
          </p>
        </div>
      </section>

      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.link}
              className="group relative h-[600px] rounded-[60px] overflow-hidden card-hover shadow-2xl shadow-primary/5 border border-foreground/5"
            >
              <Image
                src={section.image}
                alt={section.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-1000 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              <div className="absolute top-10 left-10 flex items-center gap-4">
                 <div className="w-16 h-16 rounded-3xl glass flex items-center justify-center text-white scale-110">
                  {section.icon}
                </div>
                <div className="px-5 py-2 glass rounded-full text-[10px] font-black tracking-widest text-white uppercase">
                  {section.tag}
                </div>
              </div>

              <div className="absolute bottom-12 left-12 right-12 text-white">
                <h3 className="text-4xl font-bold mb-6 tracking-tight">{section.title}</h3>
                <p className="text-lg opacity-60 mb-10 font-medium max-w-md leading-relaxed">
                  {section.description}
                </p>
                <div className="flex items-center gap-4 text-xs font-black tracking-[0.2em] uppercase group-hover:gap-6 transition-all">
                  Explore Now <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-32 bg-primary relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[150px] -mr-40 -mt-40" />
         <div className="max-w-7xl mx-auto px-6 text-center text-white relative z-10">
           <Camera className="w-16 h-16 mx-auto mb-12 opacity-20" />
           <h2 className="text-4xl md:text-6xl font-bold mb-10 tracking-tighter max-w-3xl mx-auto leading-tight">
             CAPTURE THE ESSENCE OF <br /> ETHIOPIAN HOSPITALITY
           </h2>
           <p className="text-xl md:text-2xl font-medium opacity-60 max-w-2xl mx-auto mb-16">
             Join thousands of travelers sharing their authentic stories and ratings across the land of origins.
           </p>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex -space-x-4">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className="w-14 h-14 rounded-full border-4 border-primary bg-foreground/10 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                ))}
              </div>
              <span className="text-sm font-bold tracking-widest uppercase opacity-40">10k+ Community Reviews</span>
           </div>
         </div>
      </section>
    </div>
  );
}

import { User } from "lucide-react";
