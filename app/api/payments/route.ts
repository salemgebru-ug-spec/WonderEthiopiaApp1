import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

// Define a clear interface for your user
interface ChapaUser {
    email: string;
    name: string;
    
}

export async function initializePayment(
    paymentData: { amount: number; currency: string },
    user: any, 
    txRef: string 
) {
    const paymentKey = process.env.CHAPA_KEY;
    
    const payload = {
        amount: paymentData.amount,
        currency: paymentData.currency,
        email: user.email,
        first_name: user.first_name || user.name || "Customer",
        last_name: user.last_name || "User",
        tx_ref: txRef,
        customization: {
    title: "Payment",
    description: "Booking payment"
    },
    meta: {},
        callback_url: "https://webhook.site/077164d6-29cb-40df-ba29-8a00e59a7e60",
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?trx_ref=${txRef}`,
        
    };

    // LOG 1: See what you are sending to Chapa
    console.log("🚀 SENDING TO CHAPA:", JSON.stringify(payload, null, 2));

    const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${paymentKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    // LOG 2: See exactly what Chapa replied
    console.log("📥 CHAPA RESPONSE:", JSON.stringify(result, null, 2));

    return result; 
}

// Changed 'request: Request' to a specific data object
export async function registerPayment(data: { user_id: string; amount: number; currency: string }) {
    try {
        await dbConnect();
        const { user_id, amount, currency } = data;

        const user = await User.findById(user_id);
        if (!user) throw new Error("User not found in Database");

        const txRef = `tx-${Date.now()}`;

        const chapaResponse = await initializePayment({ amount, currency }, user, txRef);

        if (chapaResponse.status !== "success") {
            // Include the actual Chapa error message in the throw
            const errorMsg = chapaResponse.message || "Chapa rejected the transaction";
            console.error("❌ Chapa Validation Error:", errorMsg);
            throw new Error(errorMsg); 
        }

        const newPayment = await Payment.create({
            transaction_id: txRef,
            amount: amount,
            status: "PENDING",
            method: "CHAPA",
            user_id: user._id,
            check_out_url: chapaResponse.data.checkout_url
        });

        return newPayment; 

    } catch (error: any) {
        // This ensures the error shows up clearly in your VS Code Terminal
        console.error("‼️ Final registerPayment Error:", error.message);
        throw error; 
    }
}

export async function listPayments(){
    try{
        await dbConnect();

    const allPayments=await Payment.find();
     return NextResponse.json(
              {
                message: "Payments retrieved successfully",
                data: allPayments
              },
              { status: 200 });
   
    }catch(error:any){
        const status = error.status || 500;


        return NextResponse.json(
            {
                success: false,
                message: error.message || "Something went wrong",
            },
            { status: status || 500 } 
        );
    }
    
}

export async function GET() {
    return listPayments();
}

