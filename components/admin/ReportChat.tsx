"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, User, Shield, Clock } from "lucide-react";
import { pusherClient } from "@/lib/pusher-client";

interface Message {
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

export default function ReportChat({ reportId, currentRole, initialDiscussion }: { reportId: string, currentRole: string, initialDiscussion?: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialDiscussion || []);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync with initialDiscussion if it changes in parent
  useEffect(() => {
    if (initialDiscussion) {
      setMessages(initialDiscussion);
    }
  }, [initialDiscussion]);

  const fetchDiscussion = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setMessages(data.report?.discussion || []);
    } catch (e) {
      console.error("Chat fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!reportId) return;
    // Always fetch latest on mount to be safe, unless we just got it
    if (!initialDiscussion || initialDiscussion.length === 0) {
      fetchDiscussion();
    }

    // Subscribe to Pusher channel
    let channel: any;
    try {
      if (process.env.NEXT_PUBLIC_PUSHER_KEY) {
        channel = pusherClient.subscribe(`admin-reports-${reportId}`);
        channel.bind("discussion-update", (data: any) => {
          if (data.discussion) {
            setMessages(data.discussion);
          }
        });
      }
    } catch (pushErr) {
      console.error("Pusher subscription error:", pushErr);
    }

    // Short-polling fallback
    const interval = setInterval(fetchDiscussion, 4000);

    return () => {
      if (channel) {
        try {
          pusherClient.unsubscribe(`admin-reports-${reportId}`);
        } catch (e) {}
      }
      clearInterval(interval);
    };
  }, [reportId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const msgContent = newMessage.trim();
    setNewMessage("");
    setSending(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgContent }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.report?.discussion) {
          setMessages(data.report.discussion);
        }
      } else {
        // Restore if failed
        setNewMessage(msgContent);
      }
    } catch (e) {
      console.error("Chat send error:", e);
      setNewMessage(msgContent);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-foreground/10 animate-pulse">
            <Clock className="w-8 h-8" />
            <span className="text-[9px] font-black uppercase tracking-widest">Syncing Thread...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-foreground/10 py-12">
            <MessageSquare className="w-12 h-12" />
            <p className="text-sm font-bold italic text-center max-w-[200px]">No institutional notes yet. Start the deliberation.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderRole === currentRole;
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                <div className={`flex items-center gap-2 mb-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-[9px] font-black uppercase tracking-widest text-foreground/30">{msg.senderName}</span>
                  <div className="w-1 h-1 rounded-full bg-foreground/10" />
                  <span className="text-[9px] font-bold text-foreground/20">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                
                <div className={`px-5 py-3 rounded-[24px] text-base font-medium leading-relaxed shadow-sm transition-all hover:shadow-md ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white border border-foreground/[0.03] text-foreground/70 rounded-tl-none'
                }`}>
                  {msg.message}
                </div>
                
                {!isMe && (
                   <span className="text-[8px] font-black uppercase tracking-widest text-primary/40 mt-2 px-2 py-0.5 bg-primary/5 rounded-full border border-primary/10">
                      {msg.senderRole.replace("_", " ")}
                   </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-foreground/[0.03] shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="flex gap-4 items-center bg-foreground/[0.02] p-1.5 rounded-[24px] border border-foreground/[0.05]">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Institutional note..."
            className="flex-1 px-5 py-3 bg-transparent text-base font-medium focus:outline-none placeholder-foreground/20"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 bg-primary text-white rounded-[18px] flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
