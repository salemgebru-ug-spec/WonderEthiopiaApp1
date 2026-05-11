"use client"
import React, { useEffect, useState } from 'react';
import { 
  Calendar, MapPin, Car, Mountain, Ticket, 
  ChevronRight, Clock, ShieldCheck, Filter, 
  Compass,
  Users
} from 'lucide-react';

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState('all');
  const [carBookings,setCarBookings]=useState([]);
  const [roomBookings,setRoomBookings]=useState([]);
  const [eventBookings,setEventBookings]=useState([]);
  const [tourBookings,setTourBookings]=useState([]);

useEffect(() => {
 const getRoomBookings = async () => {
  try {
    // 1. Fetch Room Bookings
    const res = await fetch("/api/bookings/rooms", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Failed to fetch room bookings");

    const json = await res.json();
    console.log("Bookings JSON:", json);

    // Check if bookings exist
    if (!json.data || json.data.length === 0) {
      console.log("No bookings found.");
      setRoomBookings([]);
      return;
    }
    const serviceId=json.data[0].room_id

    const business=await fetch(`/api/business/services/${serviceId}`,{
        method:"GET",
    })
    const businessData=await business.json();
    console.log(businessData);
    // Get the first booking and its paymentId
    const firstBooking = json.data[0];
    const paymentId = firstBooking.payment_id;

    // 2. Fetch Payment Details
    let paymentInfo = {}; // Default empty object

    if (paymentId) {
      try {
        const paymentRes = await fetch(`/api/payments/${paymentId}`);
        const jsonPayment = await paymentRes.json();
        
        // Safety Check: Only use index 0 if data is an array and has items
        if (jsonPayment.data && Array.isArray(jsonPayment.data) && jsonPayment.data.length > 0) {
          paymentInfo = jsonPayment.data[0];
        } else if (jsonPayment.data && !Array.isArray(jsonPayment.data)) {
          // In case your API returns a single object instead of an array
          paymentInfo = jsonPayment.data;
        }
      } catch (err) {
        console.warn("Payment fetch failed, showing booking without payment details", err);
      }
    }

    // 3. Construct the final data with fallbacks (??)
    const bookingData = {
      // Data from Booking
      id: firstBooking._id,

      type: 'room',
      title: "Luxury Room Reservation", // Placeholder or from a room_id join
      number_of_guests: firstBooking.number_of_guests,
      total_price: firstBooking.total_price,
      
      // Data from Payment (using ?? to provide defaults if null/undefined)
      method: paymentInfo.method ?? "Not specified",
      transaction_id: paymentInfo.transaction_id ?? "N/A",
      status: paymentInfo.status ?? "pending"
    };

    console.log("Final Processed Booking:", bookingData);
    setRoomBookings([bookingData]);

  } catch (error) {
    console.error("Error in getRoomBookings:", error.message);
  }
};

 const getCarBookings = async () => {
  try {
    // 1. Fetch Car Bookings
    const res = await fetch("/api/bookings/cars", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Failed to fetch car bookings");

    const json = await res.json();
    console.log("Car Bookings JSON:", json);

    // Check if car bookings exist
    if (!json.data || json.data.length === 0) {
      console.log("No car bookings found.");
      setCarBookings([]);
      return;
    }

    const firstCarBooking = json.data[0];
    
    // FIX 1: Ensure you are accessing the correct ID field. 
    // In your snippet, you had 'room_id' which won't exist in car data.
    // It should likely be 'payment_id' to match your payment API logic.
    const paymentId = firstCarBooking.payment_id;

    // 2. Fetch Payment Details
    let paymentInfo = {};

    if (paymentId) {
      try {
        const paymentRes = await fetch(`/api/payments/${paymentId}`);
        const jsonPayment = await paymentRes.json();
        
        // Safety check for payment data
        if (jsonPayment.data && Array.isArray(jsonPayment.data) && jsonPayment.data.length > 0) {
          paymentInfo = jsonPayment.data[0];
        } else if (jsonPayment.data && !Array.isArray(jsonPayment.data)) {
          paymentInfo = jsonPayment.data;
        }
      } catch (err) {
        console.warn("Car payment fetch failed", err);
      }
    }

    // 3. Construct Booking Data
    const bookingData = {
      id: firstCarBooking._id,
      type: 'car',
      title: "Premium Car Rental", // Placeholder
      // FIX 2: Cars usually use 'number_of_people', rooms use 'number_of_guests'
      number_of_guests: firstCarBooking.number_of_people || firstCarBooking.number_of_guests,
      total_price: firstCarBooking.total_price,
      
      // Payment details with fallbacks
      method: paymentInfo.method ?? "Not specified",
      transaction_id: paymentInfo.transaction_id ?? "N/A",
      status: paymentInfo.status ?? "pending"
    };

    console.log("Final Car Booking Data:", bookingData);
    setCarBookings([bookingData]);

  } catch (error) {
    console.error("Error in getCarBookings:", error.message);
  }
};

  getRoomBookings();
  getCarBookings();
}, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-[#1B263B] mb-2">My Bookings</h1>
            <p className="text-[#415A77]">Manage your upcoming expeditions and reservations.</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-[var(--border)]">
            {['all', 'tours', 'events', 'cars','rooms'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab 
                  ? 'bg-[#1B263B] text-white shadow-md' 
                  : 'text-[#415A77] hover:bg-gray-50'
                } capitalize`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Booking List Container */}
        {/* Booking List Container */}
<div className="space-y-6">
  {/* Combine all bookings into one array for the 'All' tab */}
  {[...roomBookings, ...carBookings, ...eventBookings || [], ...tourBookings || []]
    .filter(booking => activeTab === 'all' || activeTab === (booking.type + 's'))
    .map((booking, index) => (
      <div key={index} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row">
          
          {/* Image Section - Dynamic Icon based on type */}
          <div className="md:w-64 h-48 md:h-auto bg-[#1B263B]/5 relative flex items-center justify-center">
            <div className="absolute top-4 left-4 bg-[#1B263B] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
              {booking.status}
            </div>
            {booking.type === 'car' ? (
              <Car className="w-12 h-12 text-[#1B263B]/30" />
            ) : (
              <Mountain className="w-12 h-12 text-[#1B263B]/30" />
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6 md:p-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 text-primary mb-1">
                  {booking.type === 'car' ? <Car className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {booking.type} Reservation
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#1B263B]">{booking.title}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase">ID</p>
                <p className="font-mono text-sm font-semibold text-[#1B263B]">
                  #{booking.transaction_id?.slice(-6) || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#415A77] text-sm">
                  <Users className="w-4 h-4" />
                  <span>{booking.type === 'car' ? 'Passengers' : 'Guests'}</span>
                </div>
                <p className="font-semibold text-[#1B263B]">
                  {booking.number_of_guests || booking.number_of_people} People
                </p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#415A77] text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Payment</span>
                </div>
                <p className="font-semibold text-[#1B263B] capitalize">{booking.method}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Total:</span>
                <span className="text-xl font-bold text-[#1B263B]">${booking.total_price}</span>
              </div>
              
              <div className="flex gap-2">
                 <button className="px-4 py-2 border border-gray-200 text-sm font-bold rounded-lg hover:bg-gray-50">
                  Receipt
                </button>
                <button className="px-5 py-2 bg-[#1B263B] text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2">
                  Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  ))}
</div>
      </div>
    </div>
  );
}