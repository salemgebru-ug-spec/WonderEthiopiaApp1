"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { X, CheckCircle2, Calendar, Car, Clock, CreditCard, Shield, AlertCircle, ChevronRight, MapPin, Fuel, Settings, Users, CalendarDays, DollarSign } from "lucide-react"


interface Booking {
  pick_up_date: string
  return_date: string
}

export default function CarBookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState<{ _id: string; [key: string]: any } | null>(null);
  const [isBooked, setIsBooked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedCar, setSelectedCar] = useState<{ id: string, price: string, name: string } | null>(null)

  const [dates, setDates] = useState({
    pick_up_date: new Date().toISOString().split('T')[0],
    return_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });
  const [existingBookings, setExistingBookings] = useState<Booking | Booking[] | null>(null)
  const [isOccupied,setIsOccupied]=useState(false);

  useEffect(() => {
    const id = searchParams.get("id")
    const price = searchParams.get("price")
    const name = searchParams.get("name") || "Selected Vehicle"

    if (id && price) {
      setSelectedCar({ id, price, name })
      const getExistingBookings = async () => {
        try {
          const bookings = await fetch(`/api/bookings/cars/${id}`, { method: 'GET' })
          const data = await bookings.json()
          setExistingBookings(data.data)
        } catch (err) {
          console.error("Failed to fetch existing bookings:", err)
        }
      }
      

      getExistingBookings();
    } else {
      setError("Missing car information. Please go back and try again.")
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDates(prev => ({ ...prev, [name]: value }));
    setError(null);
  }

  const dailyPrice = selectedCar ? parseFloat(selectedCar.price.replace(/[^0-9.]/g, '')) : 0;
  const start = new Date(dates.pick_up_date);
  const end = new Date(dates.return_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffInMs = end.getTime() - start.getTime();
  const numberOfDays = Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
  const totalPrice = numberOfDays * dailyPrice;
  
  const isPickUpValid = start >= new Date(new Date().setHours(0, 0, 0, 0))
  const isReturnValid = end > start
  const isFormValid = isPickUpValid && isReturnValid && numberOfDays > 0


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

  useEffect(() => {
      if (!dates.pick_up_date || !dates.return_date || !existingBookings) {
        setIsOccupied(false)
        return
      }
  
      const newStart = new Date(dates.pick_up_date).getTime()
      const newEnd = new Date(dates.return_date).getTime()
  
      // Helper to evaluate a single booking instance comparison
      const checkOverlap = (booking: Booking) => {
        const existingStart = new Date(booking.pick_up_date).getTime()
        const existingEnd = new Date(booking.return_date).getTime()
        return newStart < existingEnd && newEnd > existingStart
      }
  
      // Adapt safely whether backend yields an array or a single payload object
      if (Array.isArray(existingBookings)) {
        setIsOccupied(existingBookings.some(checkOverlap))
      } else {
        setIsOccupied(checkOverlap(existingBookings))
      }
    }, [dates.pick_up_date, dates.return_date, existingBookings])
  

  const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCar || !isFormValid) {
      setError("Please check your dates and try again.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        pick_up_date: dates.pick_up_date,
        return_date: dates.return_date,
        total_price: totalPrice,
        car_id: selectedCar.id,
        user_id: currentUser?._id,
        currency: "ETB"
      };

      const res = await fetch("/api/bookings/cars", {
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

  if (error && !selectedCar) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Vehicle</h2>
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

  if (!selectedCar) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl">
          {/* Changed border-blue-600 to border-primary */}
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold text-[#1B263B]">Loading reservation details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 border border-[var(--border)]">
        {isBooked ? (
          <div className="p-12 md:p-16 text-center space-y-6">
            {/* Soft Amber background for the success icon */}
            <div className="bg-[var(--primary)]/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1B263B]">Booking Confirmed! 🚗</h2>
              <p className="text-gray-600">
                Your vehicle <span className="font-semibold text-primary">{selectedCar.name}</span> has been reserved.
              </p>
              <p className="text-sm text-gray-500">A confirmation has been sent to your email.</p>
            </div>
            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-[#1B263B] text-white font-semibold rounded-xl hover:bg-[#415A77] transition-colors"
              >
                Back to Home
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
            {/* Header: Using Navy background with Amber accents */}
            <div className="bg-[#1B263B] px-6 md:px-8 py-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Car Rental</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Reserve Your Ride</h2>
                  <p className="text-primary font-medium text-sm">{selectedCar.name}</p>
                </div>
                <button 
                  onClick={() => router.back()} 
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <form onSubmit={handleBooking} className="p-6 md:p-8">
              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="text-sm font-semibold text-[#1B263B] block mb-3">
                    <Calendar className="w-4 h-4 inline mr-2 text-primary" />
                    Select Rental Period
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Pick-up Date</label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          name="pick_up_date"
                          value={dates.pick_up_date}
                          onChange={handleChange}
                          required
                          type="date"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Return Date</label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          name="return_date"
                          value={dates.return_date}
                          onChange={handleChange}
                          required
                          type="date"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                   {!isPickUpValid && (
                      <p className="text-xs text-red-500 mt-1">Check-in date cannot be in the past</p>
                    )}
                    {!isReturnValid && (
                      <p className="text-xs text-red-500 mt-1">Check-out must be after check-in</p>
                    )}

                    {isOccupied && (
                      <div className="mt-4 flex gap-2 items-center p-3 bg-amber-50 rounded-xl border-2 border-amber-500 text-amber-900 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>This car is occupied during your selected timeframe.</span>
                      </div>
                    )} 
                </div>

                {/* Price Breakdown: Using Cloud White surface */}
                <div className="bg-[#F8F9FA] rounded-xl p-6 border border-[var(--border)]">
                  <h3 className="font-semibold text-[#1B263B] text-sm mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Price Breakdown
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#415A77]">Daily Rate</span>
                      <span className="font-medium text-[#1B263B]">{selectedCar.price} ETB</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#415A77]">Duration</span>
                      <span className="font-medium text-[#1B263B]">{numberOfDays} Days</span>
                    </div>
                    <div className="border-t border-[var(--border)] pt-3 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#1B263B]">Total Amount</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()} ETB</span>
                          <p className="text-xs text-gray-500 uppercase tracking-tighter">VAT Included</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                

                {/* Booking Button: Solid Amber */}
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full bg-primary text-[#1B263B] py-4 rounded-xl font-bold text-lg hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#1B263B] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>CONFIRM BOOKING <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}