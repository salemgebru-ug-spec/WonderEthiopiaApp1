"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, User, Shield, Clock } from "lucide-react";
import { pusherClient } from "@/lib/pusher-client";

interface Message {
  _id: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

export default function BusinessChat({ businessId, currentRole }: { businessId: string, currentRole: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!businessId || businessId === "null" || businessId === "undefined") return;
    try {
      const res = await fetch(`/api/businesses/${businessId}/messages`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      console.error("Chat fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!businessId) return;
    fetchMessages();

    // Subscribe to Pusher channel (Primary Real-time)
    let channel: any;
    try {
      if (process.env.NEXT_PUBLIC_PUSHER_KEY) {
        channel = pusherClient.subscribe(`business-chat-${businessId}`);
        channel.bind("new-message", (message: Message) => {
          setMessages((prev) => {
            if (prev.find(m => m._id === message._id)) return prev;
            return [...prev, message];
          });
        });
      }
    } catch (pushErr) {
      console.error("Pusher subscription error:", pushErr);
    }

    // Short-polling fallback (Robustness)
    const interval = setInterval(fetchMessages, 3000);

    return () => {
      if (channel) {
        try {
          pusherClient.unsubscribe(`business-chat-${businessId}`);
        } catch (e) {}
      }
      clearInterval(interval);
    };
  }, [businessId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        setNewMessage("");
      }
    } catch (e) {
      console.error("Chat send error:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-foreground/10 animate-pulse">
            <Clock className="w-8 h-8" />
            <span className="text-[9px] font-black uppercase tracking-widest">Loading History...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-foreground/10 py-12">
            <MessageSquare className="w-12 h-12" />
            <p className="text-sm font-bold italic text-center max-w-[200px]">No internal messages yet. Start the conversation with the other office.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === currentRole;
            return (
              <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                <div className={`flex items-center gap-2 mb-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-[9px] font-black uppercase tracking-widest text-foreground/30">{msg.senderName}</span>
                  <div className="w-1 h-1 rounded-full bg-foreground/10" />
                  <span className="text-[9px] font-bold text-foreground/20">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                
                <div className={`px-6 py-4 rounded-[24px] text-[14px] font-medium leading-relaxed shadow-sm transition-all hover:shadow-md ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white border border-foreground/[0.03] text-foreground/70 rounded-tl-none'
                }`}>
                  {msg.content}
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

      <form onSubmit={handleSendMessage} className="p-8 bg-white border-t border-foreground/[0.03] shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="flex gap-4 items-center bg-foreground/[0.02] p-2 rounded-[28px] border border-foreground/[0.05]">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 px-6 py-4 bg-transparent text-base font-medium focus:outline-none placeholder-foreground/20"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 bg-primary text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
