"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { X, CheckCircle2, Users, Info, ShieldCheck, MapPin, Compass, Calendar, Loader2, Clock, Mountain, Camera, Star, ChevronRight, AlertCircle, CreditCard, Ticket, Sun, Cloud, Thermometer, CalendarDays, Clock8, DollarSign } from "lucide-react"

export default function TourBookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [currentUser,setCurrentUser]=useState(null);
  const [isBooked, setIsBooked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState({
    number_of_guests: 1,
  });
   const [existingBookings, setExistingBookings] = useState<Object>();

  const [tourData, setTourData] = useState<{ 
    id: string, 
    price: string, 
    name: string,
    slots: number,
    
  } | null>(null)

  useEffect(() => {
    const id = searchParams.get("id")
    const price = searchParams.get("price")
    const name = searchParams.get("name") || "Selected Tour"
   
    const slots = parseInt(searchParams.get("quantity") || "10")
    

    if (id && price) {
      setTourData({ id, price, name, slots })
      const getExistingBookings = async () => {
        try {
          const bookings = await fetch(`/api/bookings/tours/${id}`, { method: 'GET' })
          const data = await bookings.json()
          setExistingBookings(data.data)
        } catch (err) {
          console.error("Failed to fetch existing bookings:", err)
        }
      }
      getExistingBookings();
    } else {
      setError("Missing tour information. Please go back and try again.")
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: name === 'number_of_guests' ? parseInt(value) || 0 : value }));
    setError(null);
  }

 
  const pricePerNight = tourData ? parseFloat(tourData.price.replace(/[^0-9.]/g, '')) : 0;
  const subtotal = tourData ? (pricePerNight * info.number_of_guests) : 0;
  const totalPrice = subtotal ;

  const isFormValid = tourData && info.number_of_guests >= 1 && info.number_of_guests <= tourData.slots;

 

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

  const handleTourBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tourData || !isFormValid) {
      setError("Please check the number of guests and try again.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        tour_id: tourData.id,
        user_id: currentUser?._id,
        number_of_people: info.number_of_guests,
        total_price: totalPrice,
        currency: "ETB"
      };

      const res = await fetch("/api/bookings/tours", {
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

  if (error && !tourData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Tour</h2>
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

  if (!tourData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-lg border border-[var(--border)]">
          {/* Spinner in Amber */}
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold text-[#1B263B]">Preparing expedition details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--border)]">
        
        {isBooked ? (
          <div className="p-12 md:p-16 text-center space-y-6">
            {/* Success Icon with Brand Colors */}
            <div className="bg-primary/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1B263B]">Expedition Ready! 🏔️</h2>
              <p className="text-gray-600">
                Your journey to <span className="font-semibold text-primary">{tourData.name}</span> is confirmed.
              </p>
              <p className="text-sm text-gray-500">A detailed itinerary has been sent to your email.</p>
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
                View My Bookings
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header: Navy Theme */}
            <div className="bg-[#1B263B] px-6 md:px-8 py-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-primary" />
                    <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Tour Package</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{tourData.name}</h2>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>{tourData.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      <span>{tourData.rating} rating</span>
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

            <form onSubmit={handleTourBooking} className="p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Booking Details */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-[#1B263B] block mb-3">
                      Traveler Details
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        value={info.number_of_guests}
                        onChange={handleChange}
                        name="number_of_guests" 
                        type="number" 
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border)] font-medium text-[#1B263B] focus:ring-2 focus:ring-primary outline-none transition-all" 
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 uppercase font-medium">
                      {tourData.slots} spots available for departure
                    </p>
                  </div>
                </div>

                {/* Right Column - Price Summary */}
                <div className="space-y-6">
                  <div className="bg-[#1B263B]/5 rounded-xl p-6 border border-[var(--border)]">
                    <h3 className="font-bold text-[#1B263B] text-base mb-4 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      Price Breakdown
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#415A77]">Rate per Guest</span>
                        <span className="font-semibold text-[#1B263B]">${tourData.price}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#415A77]">Duration</span>
                        <span className="font-semibold text-[#1B263B]">{tourData.nights} Nights</span>
                      </div>
                      
                      <div className="border-t border-[var(--border)] pt-3 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#1B263B]">Total Price</span>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-primary">${totalPrice.toLocaleString()}</span>
                           
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  

                  {/* Reserve Button: Primary Amber */}
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
                        RESERVE TOUR
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}