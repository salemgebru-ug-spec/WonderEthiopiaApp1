"use client";

import { ChevronRight, Edit, MapPin, Plus, Star, Trash, Image as ImageIcon, X, Upload, Calendar, Landmark as LandmarkIcon, Clock, DollarSign, Award } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Landmark {
  _id: string;
  name: string;
  description: string;
  region: string;
  city: string;
  gallery: string[];
  date_of_establishment: string;
  significance: string;
  unesco_status: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  visitor_info: {
    fee: string;
    opening_hours: string;
  };
}

export default function LandmarkInventory() {
  const [loading, setLoading] = useState(true);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [landmarkToDelete, setLandmarkToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    region: "",
    city: "",
    latitude: "",
    longitude: "",
    unesco_status: "None",
    significance: "",
    date_of_establishment: "",
    fee: "",
    opening_hours: "",
  });

  const handleTriggerDelete = (id: string) => {
    setLandmarkToDelete(id);
    setIsDeleteModalOpen(true);
  };
  
  const resetFormState = () => {
    setIsModalOpen(false);
    setModalMode("create");
    setEditingId(null);
    setUploadedImages([]);
    setFormData({
      name: "",
      description: "",
      region: "",
      city: "",
      latitude: "",
      longitude: "",
      unesco_status: "None",
      significance: "",
      date_of_establishment: "",
      fee: "",
      opening_hours: "",
    });
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setUploadedImages([]);
    setFormData({
      name: "",
      description: "",
      region: "",
      city: "",
      latitude: "",
      longitude: "",
      unesco_status: "None",
      significance: "",
      date_of_establishment: "",
      fee: "",
      opening_hours: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (landmark: Landmark) => {
    setModalMode("edit");
    setEditingId(landmark._id);
    setUploadedImages(landmark.gallery || []);
    setFormData({
      name: landmark.name || "",
      description: landmark.description || "",
      region: landmark.region || "",
      city: landmark.city || "",
      latitude: landmark.coordinates?.latitude?.toString() || "",
      longitude: landmark.coordinates?.longitude?.toString() || "",
      unesco_status: landmark.unesco_status || "None",
      significance: landmark.significance || "",
      date_of_establishment: landmark.date_of_establishment || "",
      fee: landmark.visitor_info?.fee || "",
      opening_hours: landmark.visitor_info?.opening_hours || "",
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    async function fetchLandmarks() {
      try {
        setLoading(true);
        const res = await fetch(`/api/landmarks`);
        const data = await res.json();
        setLandmarks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch landmarks:", error);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchLandmarks();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") resetFormState();
    };
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setUploadedImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleConfirmDelete = async () => {
    if (!landmarkToDelete) return;
    
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/landmarks/${landmarkToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setLandmarks((prev) => prev.filter((item) => item._id !== landmarkToDelete));
        setIsDeleteModalOpen(false);
       
      }
    } catch (error) {
      console.error("Error deleting landmark:", error);
    } finally {
      setIsDeleting(false);
      setLandmarkToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name,
        description: formData.description,
        region: formData.region,
        city: formData.city,
        gallery: uploadedImages,
        date_of_establishment: formData.date_of_establishment,
        significance: formData.significance,
        unesco_status: formData.unesco_status,
        coordinates: {
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0
        },
        visitor_info: {
          fee: formData.fee,
          opening_hours: formData.opening_hours
        }
      };

      const url = modalMode === "edit" ? `/api/landmarks/${editingId}` : "/api/landmarks";
      const method = modalMode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedLandmark = await res.json();
        
        if (modalMode === "edit") {
          setLandmarks((prev) => prev.map((item) => (item._id === editingId ? savedLandmark : item)));
        } else {
          setLandmarks((prev) => [savedLandmark, ...prev]);
        }
        
        resetFormState();
      }
    } catch (error) {
      console.error("Error submitting landmark data entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-foreground/5 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Landmarks</h1>
          <p className="text-sm font-medium text-foreground/70 mt-1">
            Manage your historical collections, heritage inventory and regional listings
          </p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 bg-primary text-background hover:bg-foreground/90 transition-all px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Landmark
        </button>
      </div>

      {/* Grid Container */}
      <div className="glass-elevated rounded-[32px] p-6 md:p-8 shadow-2xl border border-foreground/[0.03] bg-background/50 backdrop-blur-md">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-surface/50 rounded-[40px] p-4 border border-foreground/[0.02] animate-pulse">
                <div className="h-72 bg-foreground/5 rounded-[32px] mb-6" />
                <div className="space-y-3 px-4">
                  <div className="h-6 bg-foreground/10 rounded-md w-2/3" />
                  <div className="h-4 bg-foreground/5 rounded-md w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : landmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4 text-foreground/30">
              <LandmarkIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No landmarks found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {landmarks.map((landmark) => (
              <div key={landmark._id} className="group bg-surface rounded-[40px] p-4 overflow-hidden shadow-xl border border-foreground/[0.03] flex flex-col justify-between transition-all hover:shadow-2xl">
                <div>
                  {/* Image Frame Containing Actions */}
                  <div className="relative h-72 rounded-[32px] overflow-hidden mb-6 bg-foreground/5">
                    {landmark.gallery && landmark.gallery[0] ? (
                      <img src={landmark.gallery[0]} alt={landmark.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/30">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    
                    {landmark.unesco_status && landmark.unesco_status !== "None" && (
                      <div className="absolute top-4 left-4 bg-amber-500 text-black backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {landmark.unesco_status}
                      </div>
                    )}

                    {/* Edit and Delete Buttons Overlay Block */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => handleOpenEditModal(landmark)}
                        title="Edit Landmark"
                        className="w-9 h-9 rounded-full bg-background/90 backdrop-blur-md text-foreground hover:bg-background flex items-center justify-center shadow-md border border-foreground/5 active:scale-95 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleTriggerDelete(landmark._id)}
                        title="Delete Landmark"
                        className="w-9 h-9 rounded-full bg-background/90 backdrop-blur-md text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center shadow-md border border-foreground/5 active:scale-95 transition-all"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="px-3">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-foreground line-clamp-1">{landmark.name}</h3>
                    </div>
                    {landmark.date_of_establishment && (
                      <span className="inline-flex items-center gap-1 text-xs text-foreground/40 mb-3">
                        <Calendar className="w-3 h-3" /> Established: {landmark.date_of_establishment}
                      </span>
                    )}
                    <p className="text-sm text-foreground/60 mb-4 line-clamp-2">{landmark.description}</p>
                  </div>
                </div>

                <div className="px-3 pb-2 flex items-center justify-between pt-3 border-t border-foreground/[0.04]">
                  <span className="text-[11px] font-bold text-foreground/50 flex items-center gap-1.5 uppercase tracking-wider max-w-[70%] truncate">
                    <MapPin className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
                    <span className="truncate">{landmark.city}, {landmark.region}</span>
                  </span>
                  <button onClick={() => handleOpenEditModal(landmark)} className="w-11 h-11 rounded-full bg-primary text-background flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEWPORT SCROLLABLE FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-md flex items-start justify-center p-4 md:p-10">
          <div className="absolute inset-0" onClick={resetFormState} />
          
          <div className="relative bg-background w-full max-w-2xl rounded-[32px] shadow-2xl border border-foreground/5 p-6 md:p-8 z-10 my-auto transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-foreground/5 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {modalMode === "edit" ? "Edit Landmark" : "Add New Landmark"}
                </h2>
                <p className="text-xs text-foreground/50 mt-0.5">
                  Configure structural metadata values, entry requirements and historical logs
                </p>
              </div>
              <button onClick={resetFormState} className="p-2 rounded-full hover:bg-foreground/5 text-foreground/50 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Image Upload Row */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground/70">Gallery Images *</label>
                <div className="grid grid-cols-1 gap-4">
                  <label className="border-2 border-dashed border-foreground/10 hover:border-primary/40 bg-foreground/[0.01] hover:bg-primary/[0.01] transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer group">
                    <Upload className="w-6 h-6 text-foreground/30 group-hover:text-primary" />
                    <span className="text-sm font-medium text-foreground/70">Click to upload architectural image files</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                  </label>

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 p-3 bg-foreground/[0.02] border border-foreground/5 rounded-2xl">
                      {uploadedImages.map((base64Str, idx) => (
                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-foreground/5">
                          <img src={base64Str} className="w-full h-full object-cover" alt="Gallery Preview" />
                          <button type="button" onClick={() => removeUploadedImage(idx)} className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-500 rounded-full text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Core Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Landmark Name *</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Rock-Hewn Churches" className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">UNESCO Status</label>
                  <select name="unesco_status" value={formData.unesco_status} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground focus:outline-none focus:border-primary">
                    <option value="None">None / Inherent Heritage</option>
                    <option value="Inscribed">Inscribed (Official Landmark)</option>
                    <option value="Tentative">Tentative List</option>
                  </select>
                </div>
              </div>

              {/* Geographic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">City *</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Region *</label>
                  <input required type="text" name="region" value={formData.region} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground focus:outline-none focus:border-primary" />
                </div>
              </div>

              {/* Establishment & Coordinates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Date / Century established</label>
                  <input type="text" name="date_of_establishment" value={formData.date_of_establishment} onChange={handleInputChange} placeholder="e.g., 12th Century" className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Latitude</label>
                  <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Longitude</label>
                  <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground focus:outline-none focus:border-primary" />
                </div>
              </div>

              {/* Visitor Configuration Sub-objects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Entry Ticket Fee</label>
                  <input type="text" name="fee" value={formData.fee} onChange={handleInputChange} placeholder="e.g., 200 ETB / Free" className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1"><Clock className="w-3 h-3"/> Opening Hours</label>
                  <input type="text" name="opening_hours" value={formData.opening_hours} onChange={handleInputChange} placeholder="e.g., 8:00 AM - 6:00 PM" className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground focus:outline-none focus:border-primary" />
                </div>
              </div>

              {/* Description Narration */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70">Brief Overview / Description *</label>
                <textarea required rows={2} name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 resize-none text-foreground focus:outline-none focus:border-primary" />
              </div>

              {/* Significance Log */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70">Historical & Cultural Significance</label>
                <textarea rows={2} name="significance" value={formData.significance} onChange={handleInputChange} placeholder="Explain why this historic asset is critical..." className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 resize-none text-foreground focus:outline-none focus:border-primary" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-foreground/5 mt-6">
                <button type="button" onClick={resetFormState} className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-foreground/5 text-foreground/70 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || uploadedImages.length === 0} className="px-5 py-2.5 bg-primary text-background hover:bg-foreground/90 disabled:opacity-50 font-semibold text-sm rounded-xl transition-all shadow-md">
                  {isSubmitting ? "Saving..." : modalMode === "edit" ? "Update Landmark" : "Save Landmark"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RE-INITIALIZED CUSTOM DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => { if (!isDeleting) setIsDeleteModalOpen(false); }} />
          
          <div className="relative bg-background w-full max-w-md rounded-[28px] shadow-2xl border border-foreground/5 p-6 z-10 transform transition-all animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash className="w-5 h-5" />
            </div>
            
            <h3 className="text-lg font-bold tracking-tight text-foreground">Delete Landmark?</h3>
            <p className="text-sm text-foreground/50 mt-2 px-2">
              Are you absolutely sure you want to remove this historical location from your inventory? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-foreground/5">
              <button 
                type="button" 
                disabled={isDeleting}
                onClick={() => { setIsDeleteModalOpen(false); setLandmarkToDelete(null); }} 
                className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-foreground/5 text-foreground/70 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete} 
                className="px-5 py-2.5 bg-primary text-white hover:bg-red-400 font-semibold text-sm rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-red-600/10"
              >
                {isDeleting ? "Deleting..." : "Delete Listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}