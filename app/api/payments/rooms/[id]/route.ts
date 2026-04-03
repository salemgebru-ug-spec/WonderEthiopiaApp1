import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { NextResponse } from "next/server";

export async function GET(request: Request,
  { params }: { params: { id: string } }){
    try{
        await dbConnect();
        const {id}=params;

    const payment=await Payment.find({ room_id: id });
     return NextResponse.json(
              {
                message: "Payments retrieved successfully",
                data: payment
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