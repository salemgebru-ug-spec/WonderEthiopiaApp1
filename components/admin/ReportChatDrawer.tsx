"use client";

import { X } from "lucide-react";
import ReportChat from "./ReportChat";
import { useEffect } from "react";

interface ReportChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  businessName: string;
  currentRole: string;
  initialDiscussion?: any[];
}

export default function ReportChatDrawer({ isOpen, onClose, reportId, businessName, currentRole, initialDiscussion }: ReportChatDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-[-20px_0_50px_rgba(0,0,0,0.1)] animate-slide-left flex flex-col">
        <div className="px-8 py-6 border-b border-foreground/[0.03] flex items-center justify-between bg-primary/[0.02]">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">{businessName}</h2>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-1">Institutional Report Deliberation</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-foreground/40" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ReportChat 
            reportId={reportId} 
            currentRole={currentRole} 
            initialDiscussion={initialDiscussion}
          />
        </div>
      </div>
    </div>
  );
}
