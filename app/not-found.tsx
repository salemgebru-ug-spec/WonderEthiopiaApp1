import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 font-sans">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 text-center max-w-md animate-fade-in">
        <div className="w-20 h-20 bg-primary/[0.05] text-primary rounded-[28px] flex items-center justify-center mx-auto mb-10 shadow-inner">
          <Globe className="w-10 h-10" />
        </div>
        
        <div className="text-[120px] font-black gradient-text mb-6 tracking-tighter leading-none">404</div>
        
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-4">
          Discovery Interrupted
        </h1>
        
        <p className="text-[15px] text-foreground/40 leading-relaxed mb-12 font-medium italic">
          The path you seek is uncharted or no longer exists in our cultural registry.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white text-[14px] font-black rounded-full hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all duration-300 group active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to Hub
        </Link>
      </div>
    </div>
  );
}
