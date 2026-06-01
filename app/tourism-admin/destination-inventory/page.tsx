"use client";

import { ChevronRight, Edit, MapPin, Plus, Star, Trash, Image as ImageIcon, X, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Destination {
  _id: string;
  name: string;
  description: string;
  region: string;
  city: string;
  images: string[];
  rating: number;
  category: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const CATEGORY_GROUPS = [
  {
    group: "Cultural & Urban",
    options: [
      { label: "Cultural", value: "culture" },
      { label: "Cultural/Religious", value: "culture" },
      { label: "Urban", value: "culture" },
      { label: "City", value: "culture" }
    ]
  },
  {
    group: "Nature",
    options: [
      { label: "Natural", value: "nature" },
      { label: "Nature", value: "nature" },
      { label: "National Park", value: "nature" },
      { label: "Park", value: "nature" },
      { label: "Landscape", value: "nature" }
    ]
  },
  {
    group: "Adventure",
    options: [
      { label: "Adventure", value: "adventure" },
      { label: "Trekking", value: "adventure" },
      { label: "Hiking", value: "adventure" },
      { label: "Sport", value: "adventure" }
    ]
  },
  {
    group: "Religious",
    options: [
      { label: "Religious", value: "religious" },
      { label: "Spiritual", value: "religious" },
      { label: "Pilgrimage", value: "religious" }
    ]
  },
  {
    group: "Coffee",
    options: [
      { label: "Coffee", value: "coffee" },
      { label: "Coffee Farm", value: "coffee" },
      { label: "Plantation", value: "coffee" }
    ]
  },
  {
    group: "Modern & Historical",
    options: [
      { label: "Modern", value: "modern" },
      { label: "Contemporary", value: "modern" },
      { label: "Archaeological", value: "modern" },
      { label: "Historical", value: "modern" }
    ]
  }
];

export default function DestinationInventory() {
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track existing links or newly selected local files sid
  const [uploadedImages, setUploadedImages] = useState<(string | File)[]>([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [destinationToDelete, setDestinationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTriggerDelete = (id: string) => {
    setDestinationToDelete(id);
    setIsDeleteModalOpen(true);
  };
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    region: "",
    city: "",
    latitude: "",
    longitude: "",
    category: "" 
  });

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
      category: ""
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
      category: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (destination: Destination) => {
    setModalMode("edit");
    setEditingId(destination._id);
    setUploadedImages(destination.images || []);
    setFormData({
      name: destination.name || "",
      description: destination.description || "",
      region: destination.region || "",
      city: destination.city || "",
      latitude: destination.coordinates?.latitude?.toString() || "",
      longitude: destination.coordinates?.longitude?.toString() || "",
      category: destination.category || ""
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    async function fetchDestinations() {
      try {
        setLoading(true);
        const res = await fetch(`/api/destinations`);
        const data = await res.json();
        setDestinations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch destinations:", error);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchDestinations();
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

  // UPDATED: Simply drop raw File assets directly into state (No more Base64 conversion overhead)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setUploadedImages((prev) => [...prev, ...newFiles]);
  };

  const removeUploadedImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleConfirmDelete = async () => {
    if (!destinationToDelete) return;
    
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/destinations/${destinationToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setDestinations((prev) => prev.filter((dest) => dest._id !== destinationToDelete));
        setIsDeleteModalOpen(false);
        setDestinationToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting destination:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // UPDATED: Process raw images directly to Cloudinary prior to saving the MongoDB text structure
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const finalCloudUrls: string[] = [];
      
      // Pulling direct environment configs injected inside Next.js
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your_cloud_name";
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your_preset";

      for (const item of uploadedImages) {
        if (typeof item === "string") {
          // If it's already a string, it's an existing cloud image from an edit cycle
          finalCloudUrls.push(item);
        } else {
          // If it's a raw File object, stream it out directly onto Cloudinary storage pools
          const data = new FormData();
          data.append("file", item);
          data.append("upload_preset", uploadPreset);

          const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: data
          });

          if (!cloudRes.ok) throw new Error("Cloudinary file transmission failure");

          const cloudData = await cloudRes.json();
          finalCloudUrls.push(cloudData.secure_url);
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        region: formData.region,
        city: formData.city,
        category: formData.category, 
        images: finalCloudUrls, // Pass clean, lightweight strings only
        coordinates: {
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0
        }
      };

      const url = modalMode === "edit" ? `/api/destinations/${editingId}` : "/api/destinations";
      const method = modalMode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedDest = await res.json();
        
        if (modalMode === "edit") {
          setDestinations((prev) => prev.map((item) => (item._id === editingId ? savedDest : item)));
        } else {
          setDestinations((prev) => [savedDest, ...prev]);
        }
        
        resetFormState();
      }
    } catch (error) {
      console.error("Error submitting destination data entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-foreground/5 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Destinations</h1>
          <p className="text-sm font-semibold text-primary mt-1">
            Manage your collection inventory and listings
          </p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 bg-primary text-background hover:bg-foreground/90 transition-all px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-black/5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Destination
        </button>
      </div>

      {/* Grid Container */}
      <div className="glass-elevated rounded-[32px] p-6 md:p-8 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] bg-background/50 backdrop-blur-md">
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
        ) : destinations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4 text-foreground/30">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No destinations found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <div key={dest._id} className="group bg-surface rounded-[40px] p-4 overflow-hidden shadow-xl border border-foreground/[0.03] flex flex-col justify-between">
                <div>
                  {/* Image Frame Containing Actions */}
                  <div className="relative h-72 rounded-[32px] overflow-hidden mb-6 bg-foreground/5">
                    {dest.images && dest.images[0] ? (
                      <img src={dest.images[0]} alt={dest.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/30"><ImageIcon className="w-12 h-12" /></div>
                    )}
                    
                    {dest.category && (
                      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm border border-foreground/5">
                        {dest.category}
                      </div>
                    )}

                    {/* Edit and Delete Buttons Overlay Block */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => handleOpenEditModal(dest)}
                        title="Edit Destination"
                        className="w-9 h-9 rounded-full bg-background/90 backdrop-blur-md text-foreground hover:bg-background flex items-center justify-center shadow-md border border-foreground/5 active:scale-95 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleTriggerDelete(dest._id)}
                        title="Delete Destination"
                        className="w-9 h-9 rounded-full bg-background/90 backdrop-blur-md text-destructive hover:bg-destructive hover:text-white flex items-center justify-center shadow-md border border-foreground/5 active:scale-95 transition-all"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="px-3">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-foreground line-clamp-1">{dest.name}</h3>
                      <div className="flex items-center gap-1 text-[12px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full shrink-0">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {dest.rating ? dest.rating.toFixed(1) : "5.0"}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/60 mb-6 line-clamp-2">{dest.description}</p>
                  </div>
                </div>

                <div className="px-3 pb-2 flex items-center justify-between pt-2 border-t border-foreground/[0.02]">
                  <span className="text-[11px] font-bold text-foreground/40 flex items-center gap-2 uppercase tracking-wider max-w-[70%] truncate">
                    <MapPin className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
                    <span className="truncate">{dest.city}, {dest.region}</span>
                  </span>
                  <Link href={`/tourism-admin/destination-inventory/${dest._id}`} className="w-11 h-11 rounded-full bg-primary text-background flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEWPORT SCROLLABLE MODAL WRAPPER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-md flex items-start justify-center p-4 md:p-10">
          <div className="absolute inset-0" onClick={resetFormState} />
          
          {/* Modal Container Card */}
          <div className="relative bg-background w-full max-w-2xl rounded-[32px] shadow-2xl border border-foreground/5 p-6 md:p-8 z-10 my-auto transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-foreground/5 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {modalMode === "edit" ? "Edit Destination" : "Add New Destination"}
                </h2>
                <p className="text-xs text-foreground/50 mt-0.5">
                  {modalMode === "edit" ? "Modify your destination images and metadata values" : "Upload local pictures and configure destination metadata"}
                </p>
              </div>
              <button onClick={resetFormState} className="p-2 rounded-full hover:bg-foreground/5 text-foreground/50 hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Upload Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground/70">Gallery Images *</label>
                <div className="grid grid-cols-1 gap-4">
                  <label className="border-2 border-dashed border-foreground/10 hover:border-primary/40 bg-foreground/[0.01] hover:bg-primary/[0.01] transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer group">
                    <Upload className="w-6 h-6 text-foreground/30 group-hover:text-primary" />
                    <span className="text-sm font-medium text-foreground/70">Click to upload image file assets</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                  </label>

                  {/* Upload Image Previews (Correctly generates local blob object URLs for local File views) */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 p-3 bg-foreground/[0.02] border border-foreground/5 rounded-2xl">
                      {uploadedImages.map((imgItem, idx) => {
                        const sourceUrl = typeof imgItem === "string" ? imgItem : URL.createObjectURL(imgItem);
                        return (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-foreground/5">
                            <img src={sourceUrl} className="w-full h-full object-cover" alt="Upload Preview" />
                            <button type="button" onClick={() => removeUploadedImage(idx)} className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-destructive rounded-full text-white"><X className="w-3 h-3" /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Destination Name *</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Lalibela" className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Category Segment *</label>
                  <select
                    required
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-sm rounded-xl bg-background border border-foreground/10 focus:border-primary outline-none transition-all text-foreground"
                  >
                    <option value="" disabled>Select structural vibe segment</option>
                    {CATEGORY_GROUPS.map((group) => (
                      <optgroup key={group.group} label={group.group} className="text-foreground/50 font-semibold bg-background">
                        {group.options.map((opt, optIdx) => (
                          <option key={`${opt.value}-${optIdx}`} value={opt.value} className="text-foreground bg-background">
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70">Region *</label>
              <select
                required
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-sm rounded-xl bg-background border border-foreground/10 focus:border-primary outline-none transition-all text-foreground"
              >
                <option value="">Select Region</option>
                {["Addis Ababa","Amhara","Oromia","Tigray","Afar","Sidama","SNNPR","Gambela","Benishangul-Gumuz","Harari","Somali"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/70">Latitude</label>
                    <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/70">Longitude</label>
                    <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 text-foreground" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70">Description Narrative *</label>
                <textarea required rows={3} name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-xl bg-foreground/[0.02] border border-foreground/10 resize-none text-foreground" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-foreground/5 mt-6">
                <button type="button" onClick={resetFormState} className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-foreground/5 text-foreground/70">Cancel</button>
                <button type="submit" disabled={isSubmitting || uploadedImages.length === 0} className="px-5 py-2.5 bg-primary text-background hover:bg-foreground/90 disabled:opacity-50 font-semibold text-sm rounded-xl transition-all">
                  {isSubmitting ? "Saving..." : modalMode === "edit" ? "Update Destination" : "Save Destination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => { if (!isDeleting) setIsDeleteModalOpen(false); }} />
          
          <div className="relative bg-background w-full max-w-md rounded-[28px] shadow-2xl border border-foreground/5 p-6 z-10 transform transition-all animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Trash className="w-5 h-5" />
            </div>
            
            <h3 className="text-lg font-bold tracking-tight text-foreground">Delete Destination?</h3>
            <p className="text-sm text-foreground/50 mt-2 px-2">
              Are you absolutely sure you want to remove this location from your inventory? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-foreground/5">
              <button 
                type="button" 
                disabled={isDeleting}
                onClick={() => { setIsDeleteModalOpen(false); setDestinationToDelete(null); }} 
                className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-foreground/5 text-foreground/70 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete} 
                className="px-5 py-2.5 bg-primary text-white hover:bg-red-700 font-semibold text-sm rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-red-600/10"
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
