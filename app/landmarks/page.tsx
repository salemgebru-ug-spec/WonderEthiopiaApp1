"use client";

import React, { useState, useRef, useEffect } from "react";
import { ImagePlus, X, ScanSearch } from "lucide-react";
import {Camera,CameraResultType,CameraSource} from '@capacitor/camera'
import { Camera as CameraIcon } from "lucide-react";

export default function Landmarks() {
  const [image, setImage] = useState<string | null>(null);
const [identification, setIdentification] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
const [isLoading,setIsLoading]=useState<Boolean>(false);

  const submitImage = async (file: File) => {
  try {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/landmarks/recognize", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setIdentification(data[0]);
  } catch (error) {
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setImage(URL.createObjectURL(file));
  await submitImage(file);
};

 const [showWebcam, setShowWebcam] = useState(false);
const videoRef = useRef<HTMLVideoElement>(null);
const streamRef = useRef<MediaStream | null>(null);

const startWebcam = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;
    setShowWebcam(true); // mount the video element first
  } catch {
    cameraInputRef.current?.click();
  }
};

// Set srcObject AFTER video element is mounted
useEffect(() => {
  if (showWebcam && videoRef.current && streamRef.current) {
    videoRef.current.srcObject = streamRef.current;
  }
}, [showWebcam]);

const captureFromWebcam = () => {
  const video = videoRef.current;
  if (!video || video.readyState < 2) return; // not ready yet

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext("2d")?.drawImage(video, 0, 0);

  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
    setImage(URL.createObjectURL(blob));
    stopWebcam();
    await submitImage(file);
  }, "image/jpeg");
};

const stopWebcam = () => {
  streamRef.current?.getTracks().forEach((t) => t.stop());
  streamRef.current = null;
  setShowWebcam(false);
};
  
  const addNewToGallery = async () => {
  const isNative = (window as any)?.Capacitor?.isNativePlatform?.();
  const isMobileBrowser = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isNative) {
    // Native Capacitor app — use Capacitor Camera plugin
    try {
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100,
      });
      if (capturedPhoto.webPath) {
        const response = await fetch(capturedPhoto.webPath);
        const blob = await response.blob();
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        setImage(capturedPhoto.webPath);
        await submitImage(file);
      }
    } catch (error) {
      console.error("Camera failed", error);
    }
  } else if (isMobileBrowser) {
    // Mobile browser — capture="environment" opens native camera directly
    cameraInputRef.current?.click();
  } else {
    // Desktop browser — show webcam UI
    await startWebcam();
  }
};

const cameraInputRef = useRef<HTMLInputElement>(null);

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIdentification(null)
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Identify Landmark</h1>
        <p className="text-sm text-gray-500">Capture or upload a photo to discover Ethiopia's wonders</p>
      </div>

      {/* Image Display Area */}
      <div className="relative aspect-square w-full mb-8 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
  {showWebcam ? (
    <>
      <video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  onLoadedMetadata={(e) => (e.target as HTMLVideoElement).play()}
  className="w-full h-full object-cover"
/>
      <div className="absolute bottom-4 flex gap-3">
        <button
          onClick={captureFromWebcam}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-semibold shadow-lg"
        >
          Capture
        </button>
        <button
          onClick={stopWebcam}
          className="px-6 py-3 bg-black/50 text-white rounded-2xl font-semibold"
        >
          Cancel
        </button>
      </div>
    </>
  ) : image ? (
    <>
      <img src={image} alt="Preview" className="w-full h-full object-cover" />
      <button onClick={removeImage} className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black">
        <X size={20} />
      </button>
    </>
  ) : (
    <div className="flex flex-col items-center text-gray-400">
      <ScanSearch size={64} strokeWidth={1} />
      <p className="mt-2 text-sm">No image selected</p>
    </div>
  )}
</div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={ addNewToGallery}
          className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-2xl font-semibold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
        >
          <CameraIcon size={20} />
          Take Picture
        </button>
        <input
  type="file"
  accept="image/*"
  capture="environment"
  ref={cameraInputRef}
  onChange={handleFileChange}
  className="hidden"
/>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold active:scale-95 transition-transform"
        >
          <ImagePlus size={20} />
          Upload from Gallery
        </button>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {isLoading && (
        <button className="mt-6 w-full py-3 bg-green-50 text-green-700 rounded-xl font-medium border border-green-100 animate-pulse">
          Analyzing Landmark...
        </button>
      )}

{identification && (
  /* Added bg-white and text-black explicitly with !important logic via class */
  <div className="landmark-card border border-gray-200 rounded-lg p-6 shadow-sm bg-white text-black max-w-2xl mx-auto my-4">
    {/* Title - Explicitly Dark */}
    <h2 className="text-2xl font-bold mb-4 text-gray-900 border-b border-gray-100 pb-2">
      {identification.name}
    </h2>
    
    <div className="space-y-6">
      {/* Description Section */}
      <section>
        <label className="font-bold text-xs uppercase tracking-widest text-gray-500 block mb-1">
          Description
        </label>
        <p className="text-gray-800 leading-relaxed">
          {identification.description}
        </p>
      </section>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 py-4 border-t border-b border-gray-100">
        <div>
          <span className="font-bold text-gray-600 text-sm">Location:</span>
          <p className="text-gray-900">{identification.city}, {identification.region}</p>
        </div>
        <div>
          <span className="font-bold text-gray-600 text-sm">Established:</span>
          <p className="text-gray-900">{identification.date_of_establishment}</p>
        </div>
        <div>
          <span className="font-bold text-gray-600 text-sm">Entry Fee:</span>
          <p className="text-gray-900">{identification.visitor_info?.fee || "N/A"}</p>
        </div>
        <div>
          <span className="font-bold text-gray-600 text-sm">Opening Hours:</span>
          <p className="text-gray-900">{identification.visitor_info?.opening_hours || "N/A"}</p>
        </div>
      </div>

      {/* Highlight Box - Explicit colors to prevent "wash out" */}
      <section className="p-4 bg-orange-100 border-l-4 border-orange-500 rounded-r">
        <label className="font-black block text-orange-900 text-sm mb-1 uppercase">
          Historical Significance
        </label>
        <p className="text-orange-950 text-sm italic leading-snug font-medium">
          {identification.significance}
        </p>
      </section>
    </div>
  </div>
)}

    </div>
  );
}