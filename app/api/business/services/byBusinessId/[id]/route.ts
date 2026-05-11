import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Service from "@/models/Service";
import { NextResponse } from "next/server";

export async function GET(request: Request,
  { params }: { params: { businessId: string } }){
    try{
        await dbConnect();
        const {businessId}=params;

    const payment = await Service.findOne({business_id: businessId});
     return NextResponse.json(
              {
                message: "Service retrieved successfully",
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