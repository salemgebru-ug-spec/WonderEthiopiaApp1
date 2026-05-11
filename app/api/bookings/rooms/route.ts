import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { registerPayment } from "../../payments/route";
import RoomBooking from "@/models/RoomBooking";

export async function POST(request: Request) {
    try {
        await dbConnect(); 
        
        const body = await request.json();
        const { check_in_date, check_out_date,number_of_guests, user_id, room_id, total_price, currency } = body;
        console.log(body);
        // 1. Validation
        if (!check_in_date || !check_out_date || !user_id || !room_id || !total_price) {
            return NextResponse.json({ error: "All fields are required",data:body }, { status: 400 });
        }

        // 2. Initiate Payment
        let payment;
        try {
            payment = await registerPayment({
                user_id: user_id,
                amount: total_price,
                currency: currency || "ETB"
            });
            
            console.log("Payment registered:", payment);
        } catch (paymentError: any) {
    console.error("Payment registration failed:", paymentError);
    
    return NextResponse.json({ 
        success: false, 
        message: "Failed to initialize payment gateway.",
        // If it's an object, stringify it so you can read it in the browser
        error: typeof paymentError === 'object' ? JSON.stringify(paymentError) : paymentError.message
    }, { status: 502 });
}

        // 3. Extract ID safely
        // Ensure you check if payment exists before accessing ._id
        const payment_id = payment?._id || payment?.id; 

        if (!payment_id) {
            console.log("Payment ID missing from gateway response");
            return NextResponse.json({ error: "Payment initiation failed" }, { status: 400 });
        }

        // 4. Create Booking
        const newBooking = await RoomBooking.create({
            user_id,
            room_id,
            number_of_guests,
            payment_id,
            check_in_date: new Date(check_in_date),
            check_out_date: new Date(check_out_date),
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
        const result = await RoomBooking.find().lean();
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