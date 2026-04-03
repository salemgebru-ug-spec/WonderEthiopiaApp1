"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, Ticket } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("verifying");
  // Update this line in your SuccessContent component
const trx_ref = searchParams.get("trx_ref") || searchParams.get("tx_ref");
const router=useRouter();

  useEffect(() => {
    console.log("Full URL:", window.location.href);
  console.log("Search Params:", searchParams.toString());
    if (trx_ref) {
      // MANUALLY trigger your verify API route
      verifyPayment(trx_ref);
    } else {
      setStatus("no-ref");
    }
  }, [trx_ref]);

  const verifyPayment = async (ref: string) => {
    try {
      // This calls your /api/bookings/verify/route.ts
      const res = await fetch(`/api/bookings/verify?trx_ref=${ref}`);
      const data = await res.json();

      if (data.status === "success") {
        setStatus("success");
      } else {
        setStatus("failed");
      }
    } catch (error) {
      console.error("Frontend Verify Error:", error);
      setStatus("error");
    }
  };

  return (
    <div className="p-10 text-center">
      {status === "verifying" && <h1>Checking payment with Chapa...</h1>}
      {status === "success" &&
      <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-500">
  {/* Success Icon & Title */}
  <div className="text-center">
    <div className="bg-green-100 p-3 rounded-full inline-block mb-4">
       <CheckCircle className="w-12 h-12 text-green-600" />
    </div>
    <h1 className="text-3xl font-extrabold text-gray-900">Payment Confirmed!</h1>
    <p className="text-gray-500 mt-2">Your booking is officially ready.</p>
  </div>

  {/* Registration Box */}
  <div className="w-full bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center">
    <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Registration ID</span>
    <h3 className="text-lg font-mono font-bold text-blue-700 mt-1">{trx_ref}</h3>
  </div>

  {/* Action Buttons */}
  <div className="w-full space-y-3">
    <button 
      onClick={() => router.push('/mybookings')}
      className="flex items-center justify-center w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md active:scale-95"
    >
      <Ticket className="w-5 h-5" />
      View My Tickets
    </button>
    
    <button 
      onClick={() => router.push('/')}
      className="flex items-center justify-center w-full gap-1 text-gray-500 hover:text-gray-800 text-sm font-medium transition"
    >
      Return Home
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
</div> }
      {status === "failed" && <h1 className="text-red-600">Payment verification failed.</h1>}
      {status === "no-ref" && <h1>No transaction reference found in URL.</h1>}
    </div>
  );
}

// Next.js requires Suspense when using useSearchParams
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}