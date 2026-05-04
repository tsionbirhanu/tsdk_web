"use client";

import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, Share2, Bookmark, MapPin, Users, Building, Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { verifyPayment, VerificationMethod } from "@/lib/payment-verification";
import { Input } from "@/components/ui/input";
import crossIcon from "@/assets/cross-icon.jpg";

const CampaignDetail = () => {
  const { t, lang } = useI18n();
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [method, setMethod] = useState<VerificationMethod>("cbe");
  const [reference, setReference] = useState("");
  const [suffix, setSuffix] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center text-[#9a7b5c]">Loading campaign details...</div>
    );
  
  if (!campaign)
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center text-[#9a7b5c]">
        Campaign not found
      </div>
    );

  const percent = Number(campaign.goal_amount) > 0
    ? (Number(campaign.raised_amount) / Number(campaign.goal_amount)) * 100
    : 0;
    
  const title = lang === "am" && campaign.title_am
    ? campaign.title_am
    : lang === "om" && campaign.title_om
      ? campaign.title_om
      : campaign.title;
      
  const description = lang === "am" && campaign.description_am
    ? campaign.description_am
    : lang === "om" && campaign.description_om
      ? campaign.description_om
      : (campaign.description || "No description provided for this campaign yet.");

  const handleVerify = async () => {
    setLoading(true);
    try {
      if (method === "image" && !selectedFile) {
        toast.error("Please select a receipt image");
        return;
      }
      if (method === "cbe" && !selectedPdf) {
        toast.error("Please select a CBE PDF receipt");
        return;
      }
      if (method === "telebirr" && !reference) {
        toast.error("Reference is required");
        return;
      }
      
      const payload: any = method === "image"
        ? { file: selectedFile, suffix: suffix || undefined }
        : method === "cbe"
          ? { file: selectedPdf, reference, suffix: suffix || undefined }
          : { reference, suffix: suffix || undefined };
      await verifyPayment(method, payload);
      toast.success("Verification successful!");
      setReference("");
      setSuffix("");
      setAmount("");
      setSelectedFile(null);
      setSelectedPdf(null);
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2d1b0e] pb-24 font-sans">
      <div className="mx-auto max-w-6xl px-4 pt-6 md:pt-10">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
           <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#9a7b5c] flex-wrap">
             <span className="hover:text-[#2d1b0e] cursor-pointer transition-colors" onClick={() => router.push('/dashboard')}>DASHBOARD</span>
             <span className="text-[#d8c5b2]">›</span>
             <span className="hover:text-[#2d1b0e] cursor-pointer transition-colors" onClick={() => router.push('/donate')}>DONATE</span>
             <span className="text-[#d8c5b2]">›</span>
             <span className="text-[#c8a149] truncate max-w-[200px] sm:max-w-xs">{title}</span>
           </div>
           
        
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-[56px] font-heading text-[#2d1b0e] mb-10 pb-2">
          Campaign Details
        </h1>
                         <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">CBE PDF RECEIPT (Required)</label>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Left Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Banner Image */}
                         <p className="mt-2 text-[10px] text-[#9a7b5c]">Upload the bank PDF receipt for CBE verification.</p>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] md:aspect-[16/9] bg-[#e8e0d5] shadow-sm group">
               <img src={campaign.image_url || crossIcon.src} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332]/90 via-[#1a2332]/30 to-transparent" />
               <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                   <span className="inline-block bg-[#ab8634] text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full mb-5 shadow-sm">
                      {campaign.category === 'Building' ? 'Urgent Restoration' : campaign.category}
                   </span>
                   <h2 className="text-3xl md:text-4xl lg:text-[40px] font-heading font-medium leading-tight text-white drop-shadow-md max-w-2xl">
                      {title}
                   </h2>
               </div>
            </div>

            {/* Content Body */}
            <div className="bg-[#fcfaf7] rounded-3xl p-6 md:p-12 border border-[#f0ebe1] shadow-sm">
               <h3 className="text-2xl md:text-3xl font-heading text-[#ab8634] mb-8">The Sacred Call</h3>
               
               <div className="space-y-5 text-[15px] md:text-[17px] leading-relaxed text-[#5c4a3d]">
                  {description.split('\n').map((line, i) => (
                       <p key={i}>{line}</p>
                  ))}
               </div>

               {/* Informational Grid */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0ebe1] flex flex-col items-start justify-center transition-shadow hover:shadow-md">
                       <Building className="w-6 h-6 text-[#ab8634] mb-4" />
                       <p className="text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-1">Heritage Site</p>
                       <p className="text-xl font-heading text-[#2d1b0e]">14th Century</p>
                   </div>
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0ebe1] flex flex-col items-start justify-center transition-shadow hover:shadow-md">
                       <MapPin className="w-6 h-6 text-[#ab8634] mb-4" />
                       <p className="text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-1">Location</p>
                       <p className="text-xl font-heading text-[#2d1b0e]">Northern Highlands</p>
                   </div>
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0ebe1] flex flex-col items-start justify-center transition-shadow hover:shadow-md">
                       <Users className="w-6 h-6 text-[#ab8634] mb-4" />
                       <p className="text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-1">Supporters</p>
                       <p className="text-xl font-heading text-[#2d1b0e]">1,248 souls</p>
                   </div>
               </div>
            </div>
          </div>

          {/* Right Sidebar Form & Metrics */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-3xl p-7 md:p-9 border border-[#f0ebe1] shadow-sm sticky top-8">
                 
                 {/* Funding Metrics */}
                 <p className="text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">Total Raised</p>
                 <div className="flex items-baseline gap-2 mb-2">
                     <span className="text-2xl font-heading text-[#ab8634]">ETB</span>
                     <span className="text-4xl md:text-[44px] font-heading font-medium text-[#2d1b0e] tracking-tight">{Number(campaign.raised_amount).toLocaleString()}</span>
                 </div>
                 
                 <div className="flex justify-end mb-3">
                     <span className="text-sm font-bold text-[#2d1b0e]">{percent.toFixed(0)}% Complete</span>
                 </div>
                 
                 <div className="h-2 w-full bg-[#f0ebe1] rounded-full overflow-hidden mb-4">
                     <div className="h-full bg-[#c8a149] rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
                 </div>
                 
                 <div className="flex items-center justify-between text-xs text-[#9a7b5c] font-medium mb-10">
                     <span>Goal: ETB {Number(campaign.goal_amount).toLocaleString()}</span>
                     <span>Remaining: 18 Days</span>
                 </div>

                 <hr className="border-[#f0ebe1] mb-8" />

                 {/* Donation Form */}
                 <h4 className="text-xl font-heading text-[#2d1b0e] mb-6">Verify Your Donation</h4>
                 
                 <div className="grid grid-cols-3 gap-2 bg-[#f4f2ef] p-1.5 rounded-xl mb-6">
                    <button 
                      onClick={() => setMethod('cbe')} 
                      className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${method === 'cbe' ? 'bg-white text-[#2d1b0e] shadow-sm' : 'text-[#9a7b5c] hover:text-[#5c4a3d]'}`}>
                      CBE
                    </button>
                    <button 
                      onClick={() => setMethod('telebirr')} 
                      className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${method === 'telebirr' ? 'bg-white text-[#2d1b0e] shadow-sm' : 'text-[#9a7b5c] hover:text-[#5c4a3d]'}`}>
                      Telebirr
                    </button>
                    <button 
                      onClick={() => setMethod('image')} 
                      className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${method === 'image' ? 'bg-white text-[#2d1b0e] shadow-sm' : 'text-[#9a7b5c] hover:text-[#5c4a3d]'}`}>
                      Image
                    </button>
                 </div>

                 <div className="space-y-4 mb-8">
                     {method === "cbe" ? (
                       <div>
                         <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">CBE PDF RECEIPT</label>
                         <input 
                           type="file" 
                           accept="application/pdf"
                           onChange={(e) => setSelectedPdf(e.target.files?.[0] || null)}
                           className="w-full bg-[#f8f5f0] border border-[#e8e0d5] rounded-xl px-4 py-3 text-sm text-[#5c4a3d] focus:outline-none focus:border-[#c8a149] transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-[#e8e0d5] file:text-[#5c4a3d] cursor-pointer"
                         />
                       </div>
                     ) : null}

                     {method === "image" ? (
                       <div>
                         <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">RECEIPT IMAGE</label>
                         <input 
                           type="file" 
                           accept="image/*"
                           onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                           className="w-full bg-[#f8f5f0] border border-[#e8e0d5] rounded-xl px-4 py-3 text-sm text-[#5c4a3d] focus:outline-none focus:border-[#c8a149] transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-[#e8e0d5] file:text-[#5c4a3d] cursor-pointer"
                         />
                       </div>
                     ) : (
                       <div>
                         <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">REFERENCE NUMBER (Required)</label>
                         <input 
                           type="text" 
                           placeholder="TXN-98234823"
                           value={reference}
                           onChange={(e) => setReference(e.target.value)}
                           className="w-full bg-[#f8f5f0] border border-[#e8e0d5] rounded-xl px-4 py-3.5 text-sm text-[#2d1b0e] focus:outline-none focus:border-[#c8a149] transition-colors placeholder:text-[#b8a594]"
                         />
                       </div>
                     )}

                     <div>
                         <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">DONATION AMOUNT (ETB)</label>
                         <input 
                           type="number" 
                           placeholder="5,000"
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full bg-[#f8f5f0] border border-[#e8e0d5] rounded-xl px-4 py-3.5 text-sm text-[#2d1b0e] focus:outline-none focus:border-[#c8a149] transition-colors placeholder:text-[#b8a594]"
                         />
                     </div>

                     <div>
                           <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">ACCOUNT SUFFIX (Optional)</label>
                         <Input 
                           value={suffix}
                           onChange={(e) => setSuffix(e.target.value)}
                           placeholder="Enter account suffix"
                           className="h-12 rounded-xl border border-[#e8e0d5] bg-[#f8f5f0] px-4 text-sm text-[#2d1b0e] placeholder:text-[#b8a594] focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#c8a149]"
                         />
                     </div>
                 </div>

                 <button 
                   onClick={handleVerify}
                   disabled={loading}
                   className="w-full bg-gradient-to-r from-[#b58b29] to-[#ceaa53] text-white rounded-xl py-4 font-bold text-xs uppercase tracking-widest shadow-[0_8px_20px_-6px_rgba(181,139,41,0.5)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mb-6"
                 >
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                   {loading ? "Verifying..." : "Submit Verification"}
                 </button>

                 <p className="text-center text-[10px] leading-relaxed text-[#9a7b5c] px-4 mb-8">
                   Verification usually takes 12-24 hours. You will receive a digital blessing certificate once confirmed.
                 </p>

                 <div className="flex items-center justify-center gap-8 border-t border-[#f0ebe1] pt-6">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied to clipboard!");
                      }}
                      className="flex items-center gap-2 text-xs font-semibold text-[#5c4a3d] hover:text-[#b58b29] transition-colors"
                    >
                      <Share2 className="w-4 h-4" /> Share Campaign
                    </button>
                    <div className="w-px h-4 bg-[#e8e0d5]"></div>
                   
                 </div>

             </div>

             {/* Faithful Witnesses (Recent Donors mockup) */}
             <div className="mt-10 px-2 lg:px-4">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-6">Faithful Witnesses</h4>
                 <div className="space-y-4">
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-full bg-[#e6cbb4] flex-shrink-0" />
                       <div>
                          <p className="text-sm font-semibold text-[#2d1b0e]">Anonymous Giver</p>
                          <p className="text-[10px] text-[#9a7b5c] mt-0.5">Donated ETB 25,000 • 2h ago</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-full bg-[#fbd46d] flex-shrink-0" />
                       <div>
                          <p className="text-sm font-semibold text-[#2d1b0e]">Deacon Samuel T.</p>
                          <p className="text-[10px] text-[#9a7b5c] mt-0.5">Donated ETB 5,000 • 5h ago</p>
                       </div>
                    </div>
                 </div>
             </div>
          </div>
        </div>

        {/* Other Sacred Needs Section */}
       
      </div>
    </div>
  );
};

export default CampaignDetail;
