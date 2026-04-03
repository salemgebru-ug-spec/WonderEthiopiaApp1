import { NextResponse } from "next/server";
import Payment from "@/models/Payment";
import dbConnect from "@/lib/mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trx_ref = searchParams.get("trx_ref");

  if (!trx_ref) return NextResponse.json({ error: "No ref" }, { status: 400 });

  try {
    const chapaSecret = process.env.CHAPA_KEY;
  
    
    // Verify with Chapa API
    const chapaRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${trx_ref}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${chapaSecret}` }
    });

    const chapaData = await chapaRes.json();
    console.log(chapaData)

    if (chapaData.status === "success") {
      await dbConnect();
      
      // CRITICAL: Ensure 'transaction_id' is the field where you stored the tx-177... string
      const updatedPayment = await Payment.findOneAndUpdate(
        { transaction_id: trx_ref }, 
        { status: "COMPLETED" },
        { new: true }
      );

      return NextResponse.json({ status: "success", data: updatedPayment });
    }

    return NextResponse.json({ status: "failed" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}