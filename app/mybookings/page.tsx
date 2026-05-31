"use client"
import React, { useEffect, useState } from 'react';
import {
  Calendar, MapPin, Car, Mountain, Ticket,
  ChevronRight, Clock, ShieldCheck, Filter,
  Compass, Users, X, Receipt, Building, Hash, Info
} from 'lucide-react';
import Image from 'next/image';

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState('all');
  const [carBookings, setCarBookings] = useState<any[]>([]);
  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  const [eventBookings, setEventBookings] = useState<any[]>([]);
  const [tourBookings, setTourBookings] = useState<any[]>([]);

  // Modal & Drawer State Management
const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
const [selectedDetails, setSelectedDetails] = useState<any>(null);

  useEffect(() => {
   const getRoomBookings = async () => {
  try {
    const res = await fetch("/api/bookings/rooms", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {throw new Error("Failed to fetch room bookings");}
    const json = await res.json();

    if (!json.data || json.data.length === 0) {
      setRoomBookings([]);
      return;
    }

    // Use Promise.all to map over ALL bookings concurrently
    const allRoomBookings = await Promise.all(
      json.data.map(async (booking: any) => {
        const serviceId = booking.room_id;
        const paymentId = booking.payment_id;

        let serviceDetails = null;
        if (serviceId) {
          try {
            const business = await fetch(`/api/business/services/byBusinessId/${serviceId}`);
            const businessData = await business.json();
            if (businessData && businessData.data) {
              serviceDetails = businessData.data;
            }
          } catch (err) {
            console.warn("Business service details fetch failed", err);
          }
        }

        let paymentInfo: any = {};
        if (paymentId) {
          try {
            const paymentRes = await fetch(`/api/payments/${paymentId}`);
            const jsonPayment = await paymentRes.json();
            if (jsonPayment.data && Array.isArray(jsonPayment.data) && jsonPayment.data.length > 0) {
              paymentInfo = jsonPayment.data[0];
            } else if (jsonPayment.data && !Array.isArray(jsonPayment.data)) {
              paymentInfo = jsonPayment.data;
            }
          } catch (err) {
            console.warn("Payment fetch failed", err);
          }
        }

        return {
          id: booking._id,
          type: 'room',
          title: serviceDetails?.name || "Luxury Room Reservation",
          businessName: serviceDetails?.businessId?.name || "Unknown Hotel",
          image: serviceDetails?.images?.[0],
          description: serviceDetails?.description || "No description provided.",
          features: serviceDetails?.features || [],
          number_of_guests: booking.number_of_guests,
          total_price: booking.total_price,
          method: paymentInfo.method ?? "Not specified",
          transaction_id: paymentInfo.transaction_id ?? "N/A",
          status: paymentInfo.status ?? "pending",
          rawBooking: booking
        };
      })
    );

    setRoomBookings(allRoomBookings); // Pass the whole array instead of just one item
  } catch (error: any) {
  console.error("Error in getRoomBookings:", error.message);
}
};

const getCarBookings = async () => {
  try {
    const res = await fetch("/api/bookings/cars", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Failed to fetch car bookings");
    const json = await res.json();

    if (!json.data || json.data.length === 0) {
      setCarBookings([]);
      return;
    }

    const allCarBookings = await Promise.all(
      json.data.map(async (booking: any) => {
        const carServiceId = booking.car_id || booking.service_id;
        const paymentId = booking.payment_id;

        let carDetails = null;
        if (carServiceId) {
          try {
            const business = await fetch(`/api/business/services/byBusinessId/${carServiceId}`);
            const businessData = await business.json();
            if (businessData && businessData.data) {
              carDetails = businessData.data;
            }
          } catch (err) {
            console.warn("Car business service details fetch failed", err);
          }
        }

        let paymentInfo: any = {};
        if (paymentId) {
          try {
            const paymentRes = await fetch(`/api/payments/${paymentId}`);
            const jsonPayment = await paymentRes.json();
            if (jsonPayment.data && Array.isArray(jsonPayment.data) && jsonPayment.data.length > 0) {
              paymentInfo = jsonPayment.data[0];
            } else if (jsonPayment.data && !Array.isArray(jsonPayment.data)) {
              paymentInfo = jsonPayment.data;
            }
          } catch (err) {
            console.warn("Car payment fetch failed", err);
          }
        }

        return {
          id: booking._id,
          type: 'car',
          title: carDetails?.name || "Premium Car Rental",
          image: carDetails?.images?.[0],
          description: carDetails?.description || "No description provided.",
          features: carDetails?.features || [],
          businessName: carDetails?.businessId?.name || "Unknown Agency",
          number_of_guests: booking.number_of_people || booking.number_of_guests,
          total_price: booking.total_price,
          method: paymentInfo.method ?? "Not specified",
          transaction_id: paymentInfo.transaction_id ?? "N/A",
          status: paymentInfo.status ?? "pending",
          rawBooking: booking
        };
      })
    );

    setCarBookings(allCarBookings);
  } catch (error: any) {
    console.error("Error in getCarBookings:", error.message);
  }
};

const getTourBookings = async () => {
  try {
    const res = await fetch("/api/bookings/tours", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Failed to fetch tour bookings");
    const json = await res.json();

    if (!json.data || json.data.length === 0) {
      setTourBookings([]);
      return;
    }

    const allTourBookings = await Promise.all(
      json.data.map(async (booking: any) => {
        const tourServiceId = booking.tour_id || booking.service_id;
        const paymentId = booking.payment_id;

        let tourDetails = null;
        if (tourServiceId) {
          try {
            const business = await fetch(`/api/business/services/byBusinessId/${tourServiceId}`);
            const businessData = await business.json();
            if (businessData && businessData.data) {
              tourDetails = businessData.data;
            }
          } catch (err) {
            console.warn("Tour business service details fetch failed", err);
          }
        }

        let paymentInfo: any = {};
        if (paymentId) {
          try {
            const paymentRes = await fetch(`/api/payments/${paymentId}`);
            const jsonPayment = await paymentRes.json();
            if (jsonPayment.data && Array.isArray(jsonPayment.data) && jsonPayment.data.length > 0) {
              paymentInfo = jsonPayment.data[0];
            } else if (jsonPayment.data && !Array.isArray(jsonPayment.data)) {
              paymentInfo = jsonPayment.data;
            }
          } catch (err) {
            console.warn("Tour payment fetch failed", err);
          }
        }

        return {
          id: booking._id,
          type: 'tour',
          title: tourDetails?.name || "Guided Wilderness Tour",
          image: tourDetails?.images?.[0],
          description: tourDetails?.description || "No description provided.",
          features: tourDetails?.features || [],
          businessName: tourDetails?.businessId?.name || "Unknown Agency",
          number_of_guests: booking.number_of_people || booking.number_of_guests,
          total_price: booking.total_price,
          method: paymentInfo.method ?? "Not specified",
          transaction_id: paymentInfo.transaction_id ?? "N/A",
          status: paymentInfo.status ?? "pending",
          rawBooking: booking
        };
      })
    );

    setTourBookings(allTourBookings);
  } catch (error: any) {
    console.error("Error in getTourBookings:", error.message);
  }
};

const getEventBookings = async () => {
  try {
    const res = await fetch("/api/bookings/events", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Failed to fetch event bookings");
    const json = await res.json();

    if (!json.data || json.data.length === 0) {
      setEventBookings([]);
      return;
    }

    const allEventBookings = await Promise.all(
      json.data.map(async (booking: any) => {
        const eventServiceId = booking.event_id || booking.service_id;
        const paymentId = booking.payment_id;

        let eventDetails = null;
        if (eventServiceId) {
          try {
            const business = await fetch(`/api/business/services/byBusinessId/${eventServiceId}`);
            const businessData = await business.json();
            if (businessData && businessData.data) {
              eventDetails = businessData.data;
            }
          } catch (err) {
            console.warn("Event business service details fetch failed", err);
          }
        }

        let paymentInfo: any = {};
        if (paymentId) {
          try {
            const paymentRes = await fetch(`/api/payments/${paymentId}`);
            const jsonPayment = await paymentRes.json();
            if (jsonPayment.data && Array.isArray(jsonPayment.data) && jsonPayment.data.length > 0) {
              paymentInfo = jsonPayment.data[0];
            } else if (jsonPayment.data && !Array.isArray(jsonPayment.data)) {
              paymentInfo = jsonPayment.data;
            }
          } catch (err) {
            console.warn("Event payment fetch failed", err);
          }
        }

        return {
          id: booking._id,
          type: 'event',
          title: eventDetails?.name || "Special Ticketed Event",
          image: eventDetails?.images?.[0],
          description: eventDetails?.description || "No description provided.",
          features: eventDetails?.features || [],
          businessName: eventDetails?.businessId?.name || "Unknown Agency",
          number_of_guests: booking.number_of_people || booking.number_of_guests,
          total_price: booking.total_price,
          method: paymentInfo.method ?? "Not specified",
          transaction_id: paymentInfo.transaction_id ?? "N/A",
          status: paymentInfo.status ?? "pending",
          rawBooking: booking
        };
      })
    );

    setEventBookings(allEventBookings);
  } catch (error: any) {
    console.error("Error in getEventBookings:", error.message);
  }
};
    Promise.allSettled([getRoomBookings(), getCarBookings(), getEventBookings(), getTourBookings()]);
  }, []);

  useEffect(()=>{
    console.log(carBookings)
    console.log(roomBookings);
    console.log(eventBookings);
    console.log(tourBookings)
  },[carBookings,eventBookings,roomBookings,tourBookings])

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-5xl mx-auto">

        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-[#1B263B] mb-2">My Bookings</h1>
            <p className="text-[#415A77]">Manage your upcoming expeditions and reservations.</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            {['all', 'tours', 'events', 'cars', 'rooms'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab
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
        <div className="space-y-6">
          {[...roomBookings, ...carBookings, ...eventBookings, ...tourBookings]
            .filter(booking => activeTab === 'all' || activeTab === (booking.type + 's'))
            .map((booking, index) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row">

                  {/* Image Container with Absolute Layout Context */}
                  <div className="md:w-64 h-48 md:h-auto bg-[#1B263B]/5 relative flex items-center justify-center overflow-hidden min-h-[180px]">
                    <div className="absolute top-4 left-4 z-10 bg-[#1B263B] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {booking.status}
                    </div>
                    {booking.image ? (
                      <Image
                        src={booking.image}
                        alt={booking.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 256px"
                        className="object-cover"
                        priority={index === 0}
                      />
                    ) : (
                      <div className="text-[#1B263B]/30 flex flex-col items-center gap-2">
                        {(() => {
                          switch (booking.type) {
                            case 'car': return <Car className="w-12 h-12" />;
                            case 'room': return <Mountain className="w-12 h-12" />;
                            case 'event': return <Ticket className="w-12 h-12" />;
                            case 'tour': return <Compass className="w-12 h-12" />;
                            default: return <Mountain className="w-12 h-12" />;
                          }
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-6 md:p-8">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-[#415A77] mb-1">
                          <span className="text-xs font-bold uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded text-[#1B263B]">
                            {booking.type}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-[#1B263B]">{booking.title}</h3>
                        <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5" /> {booking.businessName}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">TXID</p>
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
                          {booking.number_of_guests} {booking.number_of_guests === 1 ? 'Person' : 'People'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#415A77] text-sm">
                          <Clock className="w-4 h-4" />
                          <span>Payment Method</span>
                        </div>
                        <p className="font-semibold text-[#1B263B] capitalize">{booking.method}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Total Price paid:</span>
                        <span className="text-xl font-bold text-[#1B263B]">${booking.total_price}</span>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedReceipt(booking)}
                          className="px-4 py-2 border border-gray-200 text-sm font-bold text-[#1B263B] rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                        >
                          <Receipt className="w-4 h-4" /> Receipt
                        </button>
                        <button 
                          onClick={() => setSelectedDetails(booking)}
                          className="px-5 py-2 bg-[#1B263B] text-white text-sm font-bold rounded-lg hover:bg-[#2c3e50] transition-all flex items-center gap-2"
                        >
                          Details <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {/* Empty State Fallback */}
          {[...roomBookings, ...carBookings, ...eventBookings, ...tourBookings].filter(b => activeTab === 'all' || activeTab === (b.type + 's')).length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200 text-gray-400">
              <Info className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No active {activeTab} reservations found.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- RECEIPT MODAL --- */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative animate-scale-up">
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 window-control right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center pb-6 border-b border-dashed border-gray-200 mt-2">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1B263B]">Transaction Receipt</h2>
              <p className="text-xs text-gray-400 mt-1 font-mono">ID: {selectedReceipt.id}</p>
            </div>

            <div className="py-6 space-y-4 text-sm border-b border-dashed border-gray-200">
              <div className="flex justify-between"><span className="text-gray-400">Merchant:</span><span className="font-semibold text-[#1B263B]">{selectedReceipt.businessName}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Service:</span><span className="font-semibold text-[#1B263B]">{selectedReceipt.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Type:</span><span className="font-semibold text-[#1B263B] capitalize">{selectedReceipt.type}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Gateway Method:</span><span className="font-semibold text-[#1B263B] capitalize">{selectedReceipt.method}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Reference Token:</span><span className="font-mono text-xs font-semibold text-gray-700">{selectedReceipt.transaction_id}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Payment Status:</span><span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">{selectedReceipt.status}</span></div>
            </div>

            <div className="pt-6 flex justify-between items-center">
              <span className="text-base font-bold text-[#1B263B]">Amount Paid</span>
              <span className="text-2xl font-black text-[#1B263B]">${selectedReceipt.total_price}</span>
            </div>

            <button 
              onClick={() => window.print()}
              className="mt-6 w-full py-3 bg-[#1B263B] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-md"
            >
              Print Document
            </button>
          </div>
        </div>
      )}

      {/* --- DETAILS SIDE-DRAWER --- */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white h-screen max-w-lg w-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-gray-100 animate-slide-left">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
                <h2 className="text-xl font-bold text-[#1B263B] flex items-center gap-2">
                  <Hash className="w-5 h-5 text-gray-400" /> Booking Details
                </h2>
                <button 
                  onClick={() => setSelectedDetails(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedDetails.image && (
                <div className="w-full h-52 relative rounded-xl overflow-hidden mb-6 bg-gray-100 shadow-inner">
                  <Image src={selectedDetails.image} alt={selectedDetails.title} fill className="object-cover" />
                </div>
              )}

              <h3 className="text-2xl font-black text-[#1B263B] mb-1">{selectedDetails.title}</h3>
              <p className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-1">
                <Building className="w-4 h-4" /> Hosted by {selectedDetails.businessName}
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Service Overview</h4>
                <p className="text-sm text-[#415A77] leading-relaxed">{selectedDetails.description}</p>
              </div>

              {selectedDetails.features?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Amenities & Perks</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDetails.features.map((feature: any, fIndex: number) => (
                      <span key={fIndex} className="text-xs font-medium bg-[#1B263B]/5 text-[#1B263B] px-3 py-1 rounded-lg">
                        ✓ {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">System Metadata</h4>
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 font-mono text-xs p-2 bg-gray-50/50">
                  {Object.entries(selectedDetails.rawBooking).map(([key, val]: [string, any]) => {
                    if (typeof val === 'object' || key.startsWith('_') || key.includes('id')) return null;
                    return (
                      <div key={key} className="flex justify-between py-1.5 px-2">
                        <span className="text-gray-400">{key}:</span>
                        <span className="text-gray-700 font-medium">{String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 bg-white sticky bottom-0 left-0 mt-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-400">Total Commitment</span>
                <span className="text-2xl font-black text-[#1B263B]">${selectedDetails.total_price}</span>
              </div>
              <button 
                onClick={() => setSelectedDetails(null)}
                className="w-full py-3 border-2 border-[#1B263B] text-[#1B263B] font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}