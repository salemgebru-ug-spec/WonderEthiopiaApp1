"use client";

import { useEffect } from "react";

export default function CapacitorLoader() {
  useEffect(() => {
    // Dynamically import and define elements only in the browser
    const loadPwaElements = async () => {
      const { defineCustomElements } = await import("@ionic/pwa-elements/loader");
      if (typeof window !== "undefined") {
        defineCustomElements(window);
      }
    };
    
    loadPwaElements();
  }, []);

  return null; // This component doesn't render anything
}