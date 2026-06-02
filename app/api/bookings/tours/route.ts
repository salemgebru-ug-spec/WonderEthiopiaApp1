import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { registerPayment } from "../../payments/route";
import TourBooking from "@/models/TourBooking";
import Service from "@/models/Service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        await dbConnect(); 
        
        const body = await request.json();
        
        const { number_of_people, user_id, tour_id, total_price, currency } = body;
        console.log(body);
        // 1. Validation
        if (!number_of_people || !user_id || !tour_id || !total_price) {
            return NextResponse.json({ error: "All fields are required",data:body }, { status: 400 });
        }

        const existingBooking = await TourBooking.findOne({
  user_id,
  tour_id,
  status: { $nin: ["cancelled", "rejected"] }, // allow rebooking if previously cancelled
});

if (existingBooking) {
  return NextResponse.json(
    { error: "You already have an active booking for this tour." },
    { status: 400 }
  );
}


        // 1.5 Capacity Check
       const service = await Service.findById(tour_id);
if (!service) {
    return NextResponse.json({ error: "Tour service not found" }, { status: 404 });
}
if (service.availability?.isAvailable === false) {
    return NextResponse.json({ error: "This tour is currently unavailable." }, { status: 400 });
}

// 3. Capacity check
const maxCapacity = service.availability?.quantity || service.metadata?.capacity || service.metadata?.maxOccupancy || service.metadata?.eventCapacity || 0;
if (maxCapacity > 0) {
    const existingBookings = await TourBooking.find({ tour_id });
    const totalBooked = existingBookings.reduce((sum, b) => sum + (b.number_of_people || 0), 0);
    if (totalBooked + number_of_people > maxCapacity) {
        return NextResponse.json({ error: `Capacity exceeded. Only ${Math.max(0, maxCapacity - totalBooked)} spots available.` }, { status: 400 });
    }
}

// 4. Payment FIRST
let payment;
try {
    payment = await registerPayment({ user_id, amount: total_price, currency: currency || "ETB" });
} catch (paymentError: any) {
    console.error("Payment registration failed:", paymentError);
    return NextResponse.json({ 
        success: false, 
        message: "Failed to initialize payment gateway.",
        error: typeof paymentError === 'object' ? JSON.stringify(paymentError) : paymentError.message
    }, { status: 502 });
}

// 5. Payment succeeded — NOW decrement
const updatedTour = await Service.findOneAndUpdate(
    { _id: tour_id, "availability.quantity": { $gt: 0 } },
    { $inc: { "availability.quantity": -number_of_people } }, // decrement by actual guest count
    { new: true }
);
if (!updatedTour) {
    throw new Error("Tour inventory update failed. Tour might be out of stock.");
}
        // 3. Extract ID safely
        // Ensure you check if payment exists before accessing ._id
        const payment_id = payment?._id || payment?.id; 

        if (!payment_id) {
            console.log("Payment ID missing from gateway response");
            return NextResponse.json({ error: "Payment initiation failed" }, { status: 400 });
        }

        // 4. Create Booking
        const newBooking = await TourBooking.create({
            user_id,
            tour_id,
            number_of_people,
            payment_id,
            total_price
        });

        return NextResponse.json({
            message: "Booking registered successfully",
            data: newBooking,
            payment_url: payment.toObject ? payment.toObject().check_out_url : payment.check_out_url // Useful if your payment gateway provides a link
        }, { status: 201 });

    } catch (error: any) {
        console.error("🔥 Server Terminal Error:", error); 
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}

export async function GET() {
    try {
     const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await TourBooking.find({ user_id: session.user.id }).lean();
        return NextResponse.json(
      {
        message: "Bookings retrieved successfully",
        data: result
      },
      { status: 200 }
    );
        
    } catch (error: any) {
        const status = error.status || 500;


        return NextResponse.json(
            {
                success: false,
                message: error.message || "Something went wrong",
            },
            { status: status } 
        );
    }
}
