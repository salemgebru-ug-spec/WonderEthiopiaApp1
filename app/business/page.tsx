"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Globe, FileText, Phone, Mail, Upload, CheckCircle2, Loader2, MapPin } from "lucide-react";

export default function BusinessPortalPage() {
  const [formData, setFormData] = useState({
    applicantName: "",
    name: "",
    description: "",
    category: [] as string[],
    region: "",
    city: "",
    address: "",
    permitNumber: "",
    contactPhone: "",
    contactEmail: "",
    industryDetails: {} as Record<string, string>,
    industryFiles: {} as Record<string, File | null>,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        industryFiles: { ...formData.industryFiles, [e.target.name]: e.target.files[0] },
      });
    }
  };
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (val: string) => {
    setFormData((prev) => {
      const current = prev.category;
      if (current.includes(val)) {
        return { ...prev, category: current.filter((c) => c !== val) };
      } else {
        return { ...prev, category: [...current, val] };
      }
    });
  };

  const handleIndustryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      industryDetails: { ...formData.industryDetails, [e.target.name]: e.target.value },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (formData.category.length === 0) {
      setError("Please select at least one business category.");
      setLoading(false);
      return;
    }

    if (formData.contactPhone.replace(/[^0-9]/g, "").length < 9) {
  setError("Phone number must contain at least 9 digits.");
  setLoading(false);
  return;
}

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("applicantName", formData.applicantName);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      
      // Send multiple categories
      formData.category.forEach(cat => {
        formDataToSend.append("category", cat);
      });

      formDataToSend.append("region", formData.region);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("permitNumber", formData.permitNumber);
      formDataToSend.append("contactPhone", formData.contactPhone);
      formDataToSend.append("contactEmail", formData.contactEmail);
      
      formDataToSend.append("industryDetails", JSON.stringify(formData.industryDetails));

      Object.entries(formData.industryFiles).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(`file_${key}`, file);
        }
      });

      const res = await fetch("/api/businesses/apply", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setSuccess(
          "Application submitted! Our Tourism Admin will review your details. You'll receive login credentials via email once approved."
        );
        setFormData({
          applicantName: "",
          name: "",
          description: "",
          category: [],
          region: "",
          city: "",
          address: "",
          permitNumber: "",
          contactPhone: "",
          contactEmail: "",
          industryDetails: {},
          industryFiles: {},
        });
        const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
        fileInputs.forEach(input => { input.value = ''; });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-5 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-2xl text-foreground text-[14px] font-medium placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all duration-300";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-foreground/[0.03]">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-5 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tighter text-primary flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black">W</div>
            BUSINESS PORTAL
          </Link>
          <Link href="/" className="text-sm font-extrabold text-foreground/40 hover:text-primary transition-all flex items-center gap-2 uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Exit Portal
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 max-w-4xl mx-auto px-3 md:px-4 lg:px-5">
        {/* Header Hero */}
        <div className="mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-bold tracking-[0.2em] text-primary uppercase bg-primary/5 rounded-full border border-primary/10">
            Partner Program 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Partner with <span className="text-primary italic">Wonder Ethiopia</span></h1>
          <p className="text-lg text-foreground/50 font-medium leading-relaxed max-w-2xl">
            Join the national platform for certified tourism operators. Reach thousands of international travelers and manage your business presence with ease.
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-elevated rounded-[40px] p-8 md:p-12 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-10">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-500 text-base text-center font-bold">
                {error}
              </div>
            )}
            
            {success ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">Application Received!</h3>
                <p className="text-foreground/50 font-medium max-w-md mx-auto">{success}</p>
                <button 
                  type="button" 
                  onClick={() => setSuccess("")}
                  className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                >
                  Apply for Another Business
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-8">
                  <div className="flex items-center gap-4 text-primary">
                    <Building2 className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Core Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/30 uppercase tracking-widest">Applicant Name</label>
                      <input name="applicantName" type="text" value={formData.applicantName} onChange={handleChange} required className={inputClass} placeholder="Your full name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/30 uppercase tracking-widest">Business Name</label>
                      <input name="name" type="text" value={formData.name} onChange={handleChange} required className={inputClass} placeholder="Legal business title" />
                    </div>
                    <div className="md:col-span-2 space-y-4">
                       <label className="text-sm font-bold text-foreground/30 uppercase tracking-widest block">Choose All Applicable Business Categories</label>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[
                            { value: "hotel", label: "Hotels & Lodging" },
                            { value: "tour_operator", label: "Tour Operator" },
                            { value: "car_rental", label: "Car Rental" },
                            { value: "event_organizer", label: "Event Management" }
                          ].map((cat) => (
                            <div 
                              key={cat.value}
                              onClick={() => handleCategoryChange(cat.value)}
                              className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                                formData.category.includes(cat.value) 
                                  ? "bg-primary/5 border-primary shadow-sm" 
                                  : "bg-foreground/[0.02] border-foreground/[0.05] hover:border-foreground/[0.1]"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                formData.category.includes(cat.value) ? "bg-primary border-primary" : "border-foreground/10"
                              }`}>
                                {formData.category.includes(cat.value) && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`text-base font-bold ${formData.category.includes(cat.value) ? "text-primary" : "text-foreground/60"}`}>
                                {cat.label}
                              </span>
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/30 uppercase tracking-widest">License/Permit ID</label>
                      <input name="permitNumber" type="text" value={formData.permitNumber} onChange={handleChange} required className={inputClass} placeholder="ET-2024-XXXX" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/30 uppercase tracking-widest">Business Overview</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required rows={4} className={inputClass} placeholder="Briefly describe your services and history..." />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4 text-primary">
                    <MapPin className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Global Location</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <select name="region" value={formData.region} onChange={handleChange} required className={inputClass}>
                    <option value="">Select Region</option>
                    {[
                      "Addis Ababa", "Amhara", "Oromia", "Tigray", "Afar",
                      "Sidama", "SNNPR", "Gambela", "Benishangul-Gumuz", "Harari", "Somali",
                    ].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                    <input name="city" type="text" value={formData.city} onChange={handleChange} required className={inputClass} placeholder="City / Town" />
                    <input name="address" type="text" value={formData.address} onChange={handleChange} required className={inputClass} placeholder="Full Address" />
                  </div>
                </div>

                <div className="space-y-8 bg-foreground/[0.01] p-8 md:p-10 rounded-[32px] border border-foreground/[0.03]">
                  <div className="flex items-center gap-4 text-primary">
                    <Upload className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Industry Documents</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8">
                    {/* Specific Industry Fields */}
                    {formData.category.length === 0 && (
                      <p className="text-foreground/40 text-sm font-medium text-center py-4 italic">
                        Select one or more categories above to provide industry-specific details.
                      </p>
                    )}

                    {formData.category.includes("hotel") && (
                      <div className="space-y-6 pt-4 border-t border-foreground/[0.03]">
                        <h4 className="text-sm font-black text-primary uppercase tracking-widest">Hotel Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <select name="stars" onChange={handleIndustryChange} required className={inputClass}>
                            <option value="">Hotel Star Rating</option>
                            <option value="1">1 Star</option><option value="2">2 Stars</option><option value="3">3 Stars</option><option value="4">4 Stars</option><option value="5">5 Stars</option>
                          </select>
                          <input name="website" type="text" placeholder="Official Website" onChange={handleIndustryChange} required className={inputClass} />
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold tracking-widest uppercase text-foreground/30">Upload Hospitality License</label>
                            <input name="hotelLicense" type="file" onChange={handleFileChange} required className={inputClass} accept=".pdf,image/*" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {formData.category.includes("tour_operator") && (
                      <div className="space-y-6 pt-6 border-t border-foreground/[0.03]">
                        <h4 className="text-sm font-black text-primary uppercase tracking-widest">Tour Operator Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input name="languages" type="text" placeholder="Supported Languages" onChange={handleIndustryChange} required className={inputClass} />
                          <input name="specialization" type="text" placeholder="Expedition Focus" onChange={handleIndustryChange} required className={inputClass} />
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold tracking-widest uppercase text-foreground/30">Tour Certificate</label>
                            <input name="tourCert" type="file" onChange={handleFileChange} required className={inputClass} accept=".pdf,image/*" />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.category.includes("car_rental") && (
                       <div className="space-y-6 pt-6 border-t border-foreground/[0.03]">
                        <h4 className="text-sm font-black text-primary uppercase tracking-widest">Car Rental Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input name="fleetSize" type="number" placeholder="Number of Vehicles" min={1} onChange={handleIndustryChange} required className={inputClass} />
                          <input name="vehicleTypes" type="text" placeholder="Vehicle Types (e.g. 4x4, Luxury)" onChange={handleIndustryChange} required className={inputClass} />
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold tracking-widest uppercase text-foreground/30">Transport License</label>
                            <input name="carRentalLicense" type="file" onChange={handleFileChange} required className={inputClass} accept=".pdf,image/*" />
                          </div>
                        </div>
                       </div>
                    )}

                    {formData.category.includes("event_organizer") && (
                       <div className="space-y-6 pt-6 border-t border-foreground/[0.03]">
                        <h4 className="text-sm font-black text-primary uppercase tracking-widest">Event Management Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input name="experienceYears" type="number" step="any" min={0} placeholder="Years of Experience" onChange={handleIndustryChange} required className={inputClass} />
                          <input name="eventType" type="text" placeholder="Main Event Focus" onChange={handleIndustryChange} required className={inputClass} />
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold tracking-widest uppercase text-foreground/30">Event Organizer Certificate</label>
                            <input name="eventCert" type="file" onChange={handleFileChange} required className={inputClass} accept=".pdf,image/*" />
                          </div>
                        </div>
                       </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4 text-primary">
                    <Mail className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Contact Point</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative group">
                       <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                       <input name="contactPhone" type="text" value={formData.contactPhone} 
                         onChange={(e) => {
                          const sanitized = e.target.value.replace(/[^0-9+]/g, "").slice(0, 15);
                          setFormData({ ...formData, contactPhone: sanitized });
                        }}required className="w-full pl-14 pr-5 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-2xl" placeholder="+251 ..." />
                    </div>
                    <div className="relative group">
                       <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                       <input name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} required className="w-full pl-14 pr-5 py-4 bg-foreground/[0.02] border border-foreground/[0.05] rounded-2xl" placeholder="info@business.com" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-primary text-white text-base font-black rounded-3xl hover:bg-primary-hover shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Application...
                    </>
                  ) : (
                    "Submit Official Registration"
                  )}
                </button>
              </>
            )}
          </form>
        </div>

        {/* Footer Help */}
        <div className="mt-16 bg-surface p-10 rounded-[40px] border border-foreground/[0.03] text-center">
          <p className="text-foreground/40 font-medium italic mb-2">Need assistance with your registration?</p>
          <p className="font-bold text-sm">support@wonderethiopia.gov.et</p>
        </div>
      </main>
    </div>
  );
}
