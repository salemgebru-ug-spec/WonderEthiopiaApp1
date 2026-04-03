"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { X, CheckCircle2, Users, Info, Ticket, Calendar, Loader2, AlertCircle, Clock, MapPin, Music, Sparkles, CreditCard, ChevronRight, DollarSign, PartyPopper, ShieldCheck } from "lucide-react"

export default function EventBookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [currentUser,setCurrentUser]=useState(null);
  const [isBooked, setIsBooked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [info, setInfo] = useState({
    number_of_guests: 1,
    full_name: "",
    email: ""
  });

  const [eventData, setEventData] = useState<{ 
    id: string, 
    price: string, 
    name: string,
    description: string,
    slots_available: number,
    location?: string,
    event_date?: string,
    duration?: string
  } | null>(null)

  useEffect(() => {
    const id = searchParams.get("id")
    const price = searchParams.get("price")
    const name = searchParams.get("name") || "Exclusive Event"
    const description = searchParams.get("description") || "Join us for this special occasion."
    const slots = searchParams.get("slots_available") || "100"
    const location = searchParams.get("location") || "Addis Ababa, Ethiopia"
    const event_date = searchParams.get("event_date") || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    if (id && price) {
      setEventData({ 
        id, 
        price, 
        name, 
        description, 
        slots_available: parseInt(slots),
        location,
        event_date,
        duration: "3 hours"
      })
    } else {
      setError("Missing event information. Please go back and try again.")
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: name === 'number_of_guests' ? parseInt(value) || 0 : value }));
    setError(null);
  }

  const ticketPrice = eventData ? parseFloat(eventData.price.replace(/[^0-9.]/g, '')) : 0;
  const subtotal = ticketPrice * info.number_of_guests;
  const serviceFee = subtotal * 0.03; // 3% service fee
  const totalPrice = subtotal + serviceFee;

  const isFormValid = eventData && info.number_of_guests >= 1 && info.number_of_guests <= eventData.slots_available;


 useEffect(()=>{
    const getCurrentUser=async()=>{
    try{
        const response=await fetch("/api/user/profile",{
             method: "GET",
        headers: { "Content-Type": "application/json" },
        });
        const user=await response.json();
        console.log(user);
        setCurrentUser(user.user);
    }catch(error){
        console.log(error);
    }
  }

  getCurrentUser();
  },[]);

  const handleEventBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(eventData);
    console.log(isFormValid);
    if ( !isFormValid) {
      
      setError("Please fill in all required fields and check ticket availability.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        event_id: eventData.id,
        total_price: totalPrice,
        number_of_tickets: info.number_of_guests,
        user_id: currentUser?._id,
        currency: "ETB"
      };

      const res = await fetch("/api/bookings/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      
      if (res.ok) {
        if (result.payment_url) {
          window.location.href = result.payment_url;
        } else {
          setIsBooked(true);
        }
      } else {
        throw new Error(result.message || result.error || "Booking failed");
      }
    } catch (error: any) {
      console.error("Booking failed", error);
      setError(error.message || "Failed to complete booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (error && !eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Event</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.back()}
            className="w-full px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-lg border border-[var(--border)]">
          {/* Spinner changed to Amber */}
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold text-[#1B263B]">Loading event details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--border)]">
        
        {isBooked ? (
          <div className="p-12 md:p-16 text-center space-y-6">
            {/* Success icon with soft Amber background */}
            <div className="bg-primary/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
              <PartyPopper className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1B263B]">Spot Secured! 🎉</h2>
              <p className="text-gray-600">
                You're officially on the guest list for <span className="font-semibold text-primary">{eventData.name}</span>.
              </p>
              <p className="text-sm text-gray-500">A confirmation email with your tickets has been sent.</p>
            </div>
            <div className="flex gap-4 justify-center pt-4">
              <button 
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-[#1B263B] text-white font-semibold rounded-xl hover:bg-[#415A77] transition-colors"
              >
                Back to Explore
              </button>
              <button 
                onClick={() => router.push('/my-bookings')}
                className="px-6 py-3 border-2 border-[var(--border)] text-[#1B263B] font-semibold rounded-xl hover:bg-[#F8F9FA] transition-colors"
              >
                View My Tickets
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header: Navy Background with Primary accents */}
            <div className="bg-[#1B263B] px-6 md:px-8 py-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary" />
                    <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Exclusive Event</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{eventData.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary" />
                      <span>{new Date(eventData.event_date || '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      <span>{eventData.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>{eventData.location}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => router.back()} 
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEventBooking} className="p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-[#1B263B] block mb-3">
                      Ticket Configuration
                    </label>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Number of Tickets</label>
                    <div className="relative">
                      <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        value={info.number_of_guests}
                        onChange={handleChange}
                        name="number_of_guests" 
                        type="number" 
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border)] font-medium text-[#1B263B] focus:ring-2 focus:ring-primary outline-none transition-all" 
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[11px] text-gray-500 uppercase font-medium">
                        {eventData.slots_available} slots remaining
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[var(--border)]">
                    <h3 className="font-semibold text-[#1B263B] text-sm mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Event Description
                    </h3>
                    <p className="text-sm text-[#415A77] leading-relaxed">{eventData.description}</p>
                  </div>
                </div>

                {/* Right Column - Price Summary */}
                <div className="space-y-6">
                  <div className="bg-[#1B263B]/5 rounded-xl p-6 border border-[var(--border)]">
                    <h3 className="font-bold text-[#1B263B] text-base mb-4 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      Price Summary
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#415A77]">Unit Price</span>
                        <span className="font-semibold text-[#1B263B]">{eventData.price} ETB</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#415A77]">Quantity</span>
                        <span className="font-semibold text-[#1B263B]">{info.number_of_guests}</span>
                      </div>
                      
                      <div className="border-t border-[var(--border)] pt-3 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#1B263B]">Total</span>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()} ETB</span>
                            <p className="text-[10px] text-gray-400 uppercase">Secure Checkout</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Benefit Box */}
                  <div className="bg-[#415A77]/5 rounded-xl p-4 border border-[#415A77]/10">
                    <div className="flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-[#1B263B] mb-1">Your Ticket Includes</p>
                        <p className="text-[#415A77]">✓ Full Entry • ✓ Digital QR Ticket • ✓ Free cancellation (7 days notice)</p>
                      </div>
                    </div>
                  </div>

                  {/* Booking Button: Primary Amber */}
                  <button 
                    type="submit" 
                    disabled={loading || !isFormValid}
                    className="w-full bg-primary text-[#1B263B] py-4 rounded-xl font-bold text-lg hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-[#1B263B] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Ticket className="w-5 h-5" />
                        GET TICKETS NOW
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-gray-400">
                    <CreditCard className="w-3 h-3" />
                    <span>Secure Chapa Gateway</span>
                  </div>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}