"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { X, CheckCircle2, Bed, Users, Info, ShieldCheck, Calendar, AlertCircle } from "lucide-react"

interface HotelData {
  id: string
  price: string
  name: string
}

interface Booking {
  check_in_date: string
  check_out_date: string
}

export default function RoomBookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isOccupied, setIsOccupied] = useState(false)
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isBooked, setIsBooked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [info, setInfo] = useState({
    check_in_date: new Date().toISOString().split('T')[0],
    check_out_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    number_of_guests: 1
  })
  const [hotelData, setHotelData] = useState<HotelData | null>(null)
  const [existingBookings, setExistingBookings] = useState<Booking | Booking[] | null>(null)

  // 1. Sync with URL parameters & Fetch Bookings
  useEffect(() => {
    const id = searchParams.get("id")
    const price = searchParams.get("price")
    const name = searchParams.get("name") || "Selected Room"

    if (id && price) {
      setHotelData({ id, price, name })
      
      const getExistingBookings = async () => {
        try {
          const bookings = await fetch(`/api/bookings/rooms/${id}`, { method: 'GET' })
          const data = await bookings.json()
          setExistingBookings(data.data)
        } catch (err) {
          console.error("Failed to fetch existing bookings:", err)
        }
      }
      getExistingBookings()
    } else {
      setError("Missing room information. Please go back and try again.")
    }
  }, [searchParams])

  // 2. Fetch User Profile
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        const user = await response.json()
        setCurrentUser(user.user)
      } catch (err) {
        console.error(err)
      }
    }
    getCurrentUser()
  }, [])

  // 3. Overlap Check (Fixed Reference from hotelData -> info)
  useEffect(() => {
    if (!info.check_in_date || !info.check_out_date || !existingBookings) {
      setIsOccupied(false)
      return
    }

    const newStart = new Date(info.check_in_date).getTime()
    const newEnd = new Date(info.check_out_date).getTime()

    // Helper to evaluate a single booking instance comparison
    const checkOverlap = (booking: Booking) => {
      const existingStart = new Date(booking.check_in_date).getTime()
      const existingEnd = new Date(booking.check_out_date).getTime()
      return newStart < existingEnd && newEnd > existingStart
    }

    // Adapt safely whether backend yields an array or a single payload object
    if (Array.isArray(existingBookings)) {
      setIsOccupied(existingBookings.some(checkOverlap))
    } else {
      setIsOccupied(checkOverlap(existingBookings))
    }
  }, [info.check_in_date, info.check_out_date, existingBookings])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setInfo(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  // Calculate total price
  const dailyPrice = hotelData ? parseFloat(hotelData.price.replace(/[^0-9.]/g, '')) : 0
  const start = new Date(info.check_in_date)
  const end = new Date(info.check_out_date)
  const diffInMs = end.getTime() - start.getTime()
  const numberOfDays = Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)))
  const numberOfPeople = info.number_of_guests

  const basePrice = numberOfDays * dailyPrice
  const extraGuests = Math.max(0, numberOfPeople - 1)
  const guestMultiplier = extraGuests * 0.5
  const totalPrice = numberOfPeople === 0 ? 0 : basePrice * (1 + guestMultiplier)
  
  // Validate dates
  const isCheckInValid = start >= new Date(new Date().setHours(0, 0, 0, 0))
  const isCheckOutValid = end > start
  // Added !isOccupied validation guard directly to button block state
  const isFormValid = isCheckInValid && isCheckOutValid && numberOfPeople > 0 && hotelData && !isOccupied

  const handleRoomBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!hotelData || !isFormValid) {
      setError("Please check your dates and guest information")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload = {
        check_in_date: info.check_in_date,
        check_out_date: info.check_out_date,
        number_of_guests: info.number_of_guests,
        total_price: Math.round(totalPrice),
        room_id: hotelData.id,
        user_id: currentUser?._id,
        currency: "ETB"
      }
      const res = await fetch("/api/bookings/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (res.ok) {
        if (result.payment_url) {
          window.location.href = result.payment_url
        } else {
          setIsBooked(true)
        }
      } else {
        throw new Error(result.message || result.error || "Booking failed")
      }
    } catch (error: any) {
      console.error("Booking Error:", error)
      setError(error.message || "Failed to complete booking. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (error && !hotelData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl border-4 border-red-500 shadow-[16px_16px_0px_0px_rgba(220,38,38,1)] p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-black mb-2">Error Loading Room</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!hotelData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2D5A2D] border-t-transparent rounded-full animate-spin" />
          <p className="font-black text-black uppercase tracking-widest">Loading Room Details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
     <div className="bg-white w-full max-w-3xl rounded-3xl border-4 border-black shadow-[16px_16px_0px_0px_rgba(45,90,45,1)] overflow-hidden">
        
        {isBooked ? (
          <div className="p-12 md:p-20 text-center space-y-8">
            <div className="relative inline-block">
              <CheckCircle2 className="w-32 h-32 text-primary mx-auto" />
              <ShieldCheck className="absolute -bottom-2 -right-2 w-12 h-12 text-blue-500 bg-white rounded-full p-1 border-4 border-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter italic">Booking Secured!</h2>
              <p className="font-bold text-gray-600 text-lg">
                Your stay at <span className="text-primary">{hotelData.name}</span> is confirmed.
              </p>
              <p className="text-sm text-gray-500">A confirmation email has been sent to your registered email.</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => router.push('/')}
                className="px-8 py-4 bg-black text-white font-black rounded-2xl uppercase hover:scale-105 transition-all shadow-lg"
              >
                Back to Explore
              </button>
              <button 
                onClick={() => router.push('/my-bookings')}
                className="px-8 py-4 border-2 border-black text-black font-black rounded-2xl uppercase hover:bg-gray-100 transition-all"
              >
                View My Bookings
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 md:p-8 bg-primary text-white flex justify-between items-start">
              <div className="space-y-2">
                <span className="bg-white/20 text-white text-xs font-black px-2 py-1 rounded uppercase tracking-widest inline-block">
                  Accommodation
                </span>
                <h2 className="text-2xl md:text-3xl font-black uppercase leading-tight">{hotelData.name}</h2>
                <div className="flex items-center gap-2 text-[#D4A574] font-bold text-sm">
                  <Bed className="w-4 h-4" /> Guest Registration
                </div>
              </div>
              <button 
                onClick={() => router.back()} 
                className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleRoomBooking} className="p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-black uppercase block mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Select Dates
                    </label>
                    <div className="grid grid-cols-2 gap-4 animate-clean">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Check-In</label>
                        <input 
                          value={info.check_in_date}
                          onChange={handleChange}
                          name="check_in_date" 
                          required 
                          type="date" 
                          min={new Date().toISOString().split('T')[0]}
                          className="form-control w-full p-3 rounded-xl border-2 border-gray-200 font-bold text-sm focus:border-black focus:outline-none transition-colors" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Check-Out</label>
                        <input 
                          value={info.check_out_date}
                          onChange={handleChange}
                          name="check_out_date" 
                          required 
                          type="date" 
                          min={info.check_in_date}
                          className="w-full p-3 rounded-xl border-2 border-gray-200 font-bold text-sm focus:border-black focus:outline-none transition-colors" 
                        />
                      </div>
                    </div>
                    
                    {!isCheckInValid && (
                      <p className="text-xs text-red-500 mt-2 font-bold">Check-in date cannot be in the past</p>
                    )}
                    {!isCheckOutValid && (
                      <p className="text-xs text-red-500 mt-2 font-bold">Check-out must be after check-in</p>
                    )}

                    {/* Integrated Neo-brutalist alert callout UI */}
                    {isOccupied && (
                      <div className="mt-4 flex gap-2 items-center p-3 bg-amber-50 rounded-xl border-2 border-amber-500 text-amber-900 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>This room is occupied during your selected timeframe.</span>
                      </div>
                    )} 
                  </div>

                  <div>
                    <label className="text-xs font-black text-black uppercase block mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Number of Guests
                    </label>
                    <input 
                      value={info.number_of_guests}
                      onChange={handleChange}
                      name="number_of_guests" 
                      type="number" 
                      min="1" 
                      max="10"
                      className="w-full p-3 rounded-xl border-2 border-gray-200 font-bold focus:border-black focus:outline-none transition-colors" 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-2xl border-2 border-gray-200 space-y-4">
                    <h3 className="font-black text-black text-sm uppercase tracking-wider">Price Breakdown</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Rate per night:</span>
                        <span className="font-bold text-black">{hotelData.price}</span>
                      </div>
                      
                      {numberOfDays > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{numberOfDays} night(s):</span>
                          <span className="font-bold text-black">{dailyPrice * numberOfDays} ETB</span>
                        </div>
                      )}
                      
                      {numberOfPeople > 1 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Extra guests ({numberOfPeople - 1}):</span>
                          <span className="font-bold text-black">+{(dailyPrice * numberOfDays * (numberOfPeople - 1) * 0.5).toFixed(0)} ETB</span>
                        </div>
                      )}
                      
                      <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3">
                        <div className="flex justify-between items-end">
                          <span className="font-black text-xs uppercase tracking-wider">Total Amount:</span>
                          <span className="text-3xl font-black text-black">{Math.round(totalPrice)} ETB</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-bold mb-1">Booking Policy:</p>
                      <p>Your credit card will not be charged until arrival at the property. Free cancellation up to 48 hours before check-in.</p>
                    </div>
                  </div>

                  {error && (
                    <div className="flex gap-2 items-start p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 font-medium">{error}</p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading || !isFormValid}
                    className="w-full bg-black text-white py-4 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        PROCESSING...
                      </span>
                    ) : (
                      "BOOK THIS ROOM"
                    )}
                  </button>
                  
                  <p className="text-center text-xs text-gray-500">
                    By proceeding, you agree to our Terms of Service and Cancellation Policy
                  </p>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}