import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import AppNotification from "@/models/Notification";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Support both tx_ref and trx_ref from different branch versions
    const txRef = searchParams.get("tx_ref") || searchParams.get("trx_ref");

    if (!txRef) {
      return NextResponse.json({ error: "No transaction reference provided" }, { status: 400 });
    }

    await dbConnect();

    // Verify with Chapa API
    // Using CHAPA_SECRET_KEY as it's the primary one in .env.local
    const chapaSecret = process.env.CHAPA_SECRET_KEY || process.env.CHAPA_KEY;
    
    const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${chapaSecret}`,
      },
    });

    const data = await response.json();

    // Support both Chapa response formats seen in the two branches
    if (data.status === "success" && (data.data?.status === "success" || data.status === "success")) {
      
      // 1. Update the booking if it exists (Logic from main)
      const booking = await Booking.findOneAndUpdate(
        { txRef },
        { 
          paymentStatus: "paid",
          status: "confirmed" // Auto-confirm if paid
        },
        { new: true }
      ).populate("userId", "name");

      // 2. Update the payment record if it exists (Logic from salem-branch)
      const updatedPayment = await Payment.findOneAndUpdate(
        { transaction_id: txRef }, 
        { status: "COMPLETED" },
        { new: true }
      );

      if (!booking && !updatedPayment) {
        return NextResponse.json({ error: "No record found for this transaction" }, { status: 404 });
      }

      // 3. Notify Business Owner if booking exists
      if (booking) {
        await AppNotification.create({
          recipientRole: "business_owner",
          title: "New Paid Reservation",
          message: `A new reservation has been confirmed and paid by ${booking.userId?.name || "a traveler"}.`,
          type: "booking_new",
          relatedId: booking._id,
        });
      }

      return NextResponse.json({ 
        message: "Payment verified successfully", 
        status: "success",
        booking,
        payment: updatedPayment
      });
    } else {
      return NextResponse.json({ 
        error: "Payment verification failed", 
        details: data.message 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 });
  }
}
