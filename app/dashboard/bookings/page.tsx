"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Star
} from "lucide-react";

interface Booking {
  _id: string;
  serviceId: { name: string; category: string; price: number };
  businessId: { name: string };
  startDate: string;
  endDate?: string;
  guests: number;
  totalPrice: number;
  currency: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "paid" | "refunded";
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Reserved", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed: { label: "Secured", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled: { label: "Aborted", color: "text-red-600", bg: "bg-red-50 border-red-100", icon: <XCircle className="w-3.5 h-3.5" /> },
  completed: { label: "Fulfilled", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
};

export default function UserBookingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAndFetch() {
      if (txRef) {
        try {
          await fetch(`/api/bookings/verify?tx_ref=${txRef}`);
        } catch (e) {
          console.error("Verification Trigger Failed:", e);
        }
      }
      
      try {
        setLoading(true);
        const res = await fetch("/api/bookings");
        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session) verifyAndFetch();
  }, [session, txRef]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 md:p-12 lg:p-20">
      <main className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-black tracking-[0.3em] uppercase text-primary">
              Personal Asset Log
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-none">
            Your Reservations
          </h1>
          <p className="text-foreground/40 text-lg font-medium italic max-w-2xl">
            Track and manage your upcoming explorations across the Wonder Ethiopia partner network.
          </p>
        </div>

        {/* Content */}
        {bookings.length === 0 ? (
          <div className="py-40 text-center rounded-[60px] border-4 border-dashed border-foreground/5 bg-surface-elevated/20">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-10 text-primary">
              <Calendar className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground/40 mb-4 tracking-tight">Registry is empty</h3>
            <p className="text-foreground/20 font-medium italic mb-10">You haven't secured any assets yet.</p>
            <Link href="/discover/businesses" className="px-10 py-5 bg-primary text-white font-black rounded-full shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
               Start Discovering
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {bookings.map((booking, i) => {
              const sc = statusConfig[booking.status] || statusConfig.pending;
              return (
                <div 
                  key={booking._id}
                  className="group relative bg-white rounded-[50px] p-10 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] hover:shadow-primary/5 transition-all animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex flex-col gap-8">
                    {/* Top Row: Service & Status */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-primary/40">
                          <Building2 className="w-3.5 h-3.5" />
                          {booking.businessId?.name}
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                          {booking.serviceId?.name}
                        </h2>
                      </div>
                      <div className={`px-5 py-2 rounded-full border ${sc.bg} ${sc.color} flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] shadow-sm`}>
                         {sc.icon}
                         {sc.label}
                      </div>
                    </div>

                    {/* Middle Row: Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t border-foreground/5">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">Arrival</span>
                        <div className="font-bold flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-primary/40" />
                          {new Date(booking.startDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">Explorers</span>
                        <div className="font-bold">{booking.guests} People</div>
                      </div>
                      <div className="space-y-1 col-span-2 md:col-span-1">
                        <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">Financial Log</span>
                        <div className="flex items-center gap-3">
                          <div className="font-black text-primary">{booking.currency} {booking.totalPrice.toLocaleString()}</div>
                          <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-tighter border border-emerald-500/20">Paid ✓</div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="flex items-center justify-between pt-8 mt-4">
                       <span className="text-xs font-bold text-foreground/30">ID: ...{booking._id.slice(-8).toUpperCase()}</span>
                       <div className="flex items-center gap-2 md:gap-4">
                         <Link 
                           href={`/discover/businesses/${booking.businessId?._id}`}
                           className="px-3 md:px-4 lg:px-5 py-3 bg-foreground text-background text-xs font-black rounded-2xl hover:bg-primary transition-all flex items-center gap-3 uppercase tracking-widest"
                         >
                           Partner Intel
                         </Link>
                         <Link 
                           href={`/discover/businesses/${booking.businessId?._id}`}
                           className="px-3 md:px-4 lg:px-5 py-3 bg-primary text-white text-xs font-black rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all flex items-center gap-2 uppercase tracking-widest"
                         >
                           <Star className="w-3.5 h-3.5 fill-current" /> Rate Asset
                         </Link>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
