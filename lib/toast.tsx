import React from "react";
import { toast, ToastOptions } from "react-toastify";

type ToastType = "success" | "error" | "info" | "warn";

export function getToastContent(title: string, message: string, type: ToastType = "info") {
  const colorMap = {
    success: "text-emerald-500",
    error: "text-rose-500",
    info: "text-primary",
    warn: "text-amber-500",
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-white italic">
        {message}
      </span>
    </div>
  );
}

export function showToast(title: string, message: string, type: ToastType = "info") {
  const content = getToastContent(title, message, type);
  
  const options: ToastOptions = {
    position: "bottom-right",
    autoClose: 8000,
  };

  switch (type) {
    case "success": return toast.success(content, options);
    case "error": return toast.error(content, options);
    case "warn": return toast.warn(content, options);
    case "info":
    default: return toast.info(content, options);
  }
}
