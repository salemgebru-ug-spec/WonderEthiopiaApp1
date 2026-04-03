import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/mongodb";
import CarBooking from "@/models/CarBooking";
import { registerPayment } from "../../payments/route";


export async function POST(request: Request) {
    try {
        await dbConnect(); // Move this up
        
        const body = await request.json();
        const { pick_up_date, return_date, user_id, car_id, total_price, currency } = body;

        // 1. Validation
        if (!pick_up_date || !return_date || !user_id || !car_id || !total_price) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // 2. Initiate Payment
        const payment = await registerPayment({
    user_id: user_id,
    amount: total_price,
    currency: currency || "ETB"
});

// 3. Extract ID safely
// Since we now return the Mongoose document directly:
const payment_id = payment._id; 

if (!payment_id) {
    console.log("payment initiation failed")
    throw new Error("Payment initiation failed");
}

        // 4. Create Booking
        const newBooking = await CarBooking.create({
            user_id,
            car_id,
            payment_id,
            pick_up_date: new Date(pick_up_date),
            return_date: new Date(return_date),
            total_price
        });

        return NextResponse.json({
            message: "Booking registered successfully",
            data: newBooking,
             payment_url: payment.toObject ? payment.toObject().check_out_url : payment.check_out_url
        }, { status: 201 });

    } catch (error: any) {
        console.error("🔥 Server Terminal Error:", error); 
        
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Internal Server Error",
            // Include stack only if needed for debugging
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const result = await CarBooking.find();
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

