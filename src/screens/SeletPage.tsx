"use client";

import { useI18n } from "@/lib/i18n";
import { useState, useMemo, useEffect } from "react";
import { Loader2, CheckCircle, Search, Calendar, Wallet, Calculator, Building2, Smartphone, ArrowRight, BookOpen, PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { verifyPayment, VerificationMethod } from "@/lib/payment-verification";

const SeletPage = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const [method, setMethod] = useState<VerificationMethod>("cbe");
  const [reference, setReference] = useState("");
  const [suffix, setSuffix] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedSeletId, setExpandedSeletId] = useState<string | null>(null);

  const { data: selets = [], refetch } = useQuery({
    queryKey: ["selets", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("selets")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const handleCreate = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (!title || !totalAmount) { toast.error("Please fill in title and amount"); return; }
    
    setCreating(true);
    try {
      const { error } = await supabase.from("selets").insert({
        user_id: user.id,
        title,
        total_amount: Number(totalAmount),
        installments: 12,
        status: "active",
      });
      if (error) throw error;
      toast.success("Vow created successfully!");
      setTitle("");
      setTotalAmount("");
      setDueDate("");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create vow");
    } finally {
      setCreating(false);
    }
  };

  const handleVerify = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (method === "image" && !selectedFile) { toast.error("Please select a receipt image"); return; }
    if (method !== "image" && !reference) { toast.error("Please enter transaction reference"); return; }
    if (method === "cbe" && !suffix) { toast.error("Please enter account suffix"); return; }

    setSubmitting(true);
    try {
      // Create donation entry for this Selet payment
      const { data: donation, error: insertErr } = await supabase.from("donations").insert({
        user_id: user.id,
        amount: 0, // Amount will be tracked on the selet, not here
        type: "selet",
        status: "pending",
        notes: method === 'image' ? '(Receipt Image)' : `Ref: ${reference}`,
      }).select().single();
      
      if (insertErr) throw insertErr;

      // Verify payment
      const payload: any = method === "image" ? { file: selectedFile } : { reference, suffix: method === "cbe" ? suffix : undefined };
      await verifyPayment(method, payload);
      
      // Update donation status to verified after successful verification
      const { error: updateErr } = await supabase
        .from("donations")
        .update({ status: "verified" })
        .eq("id", donation.id);
      
      if (updateErr) throw updateErr;
      
      toast.success("Payment verified successfully!");
      setReference("");
      setSuffix("");
      setSelectedFile(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#e8f5e9] text-[#2e7d32]"><span className="w-1.5 h-1.5 rounded-full bg-[#2e7d32]"></span>Completed</span>;
    if (status === 'cancelled') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#ffebee] text-[#c62828]"><span className="w-1.5 h-1.5 rounded-full bg-[#c62828]"></span>Cancelled</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#fdf8e6] text-[#b58b29]"><span className="w-1.5 h-1.5 rounded-full bg-[#b58b29]"></span>Active</span>;
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2d1b0e] font-sans pb-24">
      
      {/* Header / Title Area */}
      <div className="max-w-6xl w-full mx-auto px-4 md:px-8 xl:px-0 pt-6 md:pt-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <h1 className="text-4xl md:text-5xl font-heading text-[#2d1b0e]">Selet (Vows)</h1>
        <div className="relative max-w-sm w-full">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a7b5c]" />
           <input 
             type="text" 
             placeholder="Search vows..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-[#f4f2ef] border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:border-[#e8e0d5] focus:ring-0 outline-none transition-colors placeholder:text-[#b8a594]"
           />
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto px-4 md:px-8 xl:px-0">
        
        {/* Intro Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#ab8634] mb-3">SACRED PROMISES</p>
                <h2 className="text-4xl md:text-5xl font-heading leading-tight mb-6">Honor Your Spiritual<br/>Commitments</h2>
                <p className="text-[#5c4a3d] leading-relaxed max-w-2xl text-[15px]">
                  A vow (Selet) is a solemn promise made to God, the church, or the poor. Track, manage, and fulfill your spiritual pledges with ease and reverence.
                </p>
            </div>
            <div className="lg:col-span-1 border-l-[3px] border-[#ab8634] bg-[#f4f2ef] rounded-r-2xl p-6 md:p-8 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-8">
                   <div className="w-8 h-8 flex items-center justify-center">
                     <BookOpen className="w-5 h-5 text-[#ab8634]" />
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c]">ACTIVE VOWS</span>
                </div>
                <div>
                   <p className="text-[11px] font-medium text-[#7a5c44] mb-1">Total Pledged</p>
                   <p className="text-2xl font-heading text-[#2d1b0e]">
                     Br. {selets.reduce((acc: number, val: any) => acc + Number(val.total_amount || 0), 0).toLocaleString()}
                   </p>
                </div>
            </div>
        </div>

        {/* Create Vow Section */}
        <div className="bg-[#fcfaf7] rounded-3xl p-6 md:p-10 border border-[#f0ebe1] shadow-sm mb-16">
            <div className="flex items-center gap-3 mb-8">
               <PlusCircle className="w-6 h-6 text-[#8c6239]" />
               <h3 className="text-2xl font-heading text-[#2d1b0e]">Create New Vow</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
               <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">VOW TITLE</label>
                  <input 
                     type="text"
                     placeholder="e.g., St. Gabriel Annual Pledge"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     className="w-full bg-white border border-[#e8e0d5] rounded-xl px-5 py-3.5 text-sm text-[#2d1b0e] focus:outline-none focus:border-[#c8a149] transition-colors placeholder:text-[#b8a594] shadow-sm"
                  />
               </div>
               <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">TOTAL AMOUNT (ETB)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#7a5c44]">Br.</span>
                    <input 
                       type="number"
                       placeholder="0.00"
                       value={totalAmount}
                       onChange={(e) => setTotalAmount(e.target.value)}
                       className="w-full bg-white border border-[#e8e0d5] rounded-xl pl-12 pr-4 py-3.5 text-sm text-[#2d1b0e] focus:outline-none focus:border-[#c8a149] transition-colors shadow-sm"
                    />
                  </div>
               </div>
               <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">START DATE</label>
                  <input 
                     type="date"
                     value={dueDate}
                     onChange={(e) => setDueDate(e.target.value)}
                     className="w-full bg-white border border-[#e8e0d5] rounded-xl px-5 py-3.5 text-sm text-[#2d1b0e] focus:outline-none focus:border-[#c8a149] transition-colors shadow-sm"
                  />
               </div>
            </div>
            <div className="flex justify-end">
               <button 
                 onClick={handleCreate}
                 disabled={creating || !title || !totalAmount}
                 className="bg-[#8c6239] text-white rounded-xl px-8 py-3.5 font-bold text-xs uppercase tracking-widest transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 flex items-center justify-center gap-2 shadow-md w-full md:w-auto"
               >
                 {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                 {creating ? "Creating..." : "Set Sacred Vow"}
               </button>
            </div>
        </div>

        {/* Verification Section */}
        <div className="bg-[#fcfaf7] rounded-3xl p-6 md:p-10 border border-[#f0ebe1] shadow-sm mb-16">
            <h3 className="text-2xl font-heading text-[#2d1b0e] mb-2">Verify Vow Fulfillment</h3>
            <p className="text-sm text-[#7a5c44] mb-8">Submit payment verification for a specific vow installment.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
               <div>
                  <div className="grid grid-cols-3 gap-3 mb-8">
                     <button
                       onClick={() => setMethod('telebirr')}
                       className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                         method === 'telebirr' ? 'bg-[#f4ebe1] border-[#c8a149] shadow-sm' : 'bg-white border-[#f0ebe1] hover:bg-[#fcfaf7]'
                       }`}
                     >
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${method === 'telebirr' ? 'bg-[#c8a149] text-white' : 'bg-[#f4f2ef] text-[#7a5c44]'}`}>
                         <Smartphone className="w-5 h-5" />
                       </div>
                       <span className={`text-[10px] font-bold uppercase tracking-widest ${method === 'telebirr' ? 'text-[#2d1b0e]' : 'text-[#9a7b5c]'}`}>Telebirr</span>
                     </button>
                     <button
                       onClick={() => setMethod('cbe')}
                       className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                         method === 'cbe' ? 'bg-[#f4ebe1] border-[#c8a149] shadow-sm' : 'bg-white border-[#f0ebe1] hover:bg-[#fcfaf7]'
                       }`}
                     >
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${method === 'cbe' ? 'bg-[#c8a149] text-white' : 'bg-[#f4f2ef] text-[#7a5c44]'}`}>
                         <Building2 className="w-5 h-5" />
                       </div>
                       <span className={`text-[10px] font-bold uppercase tracking-widest ${method === 'cbe' ? 'text-[#2d1b0e]' : 'text-[#9a7b5c]'}`}>CBE Birr</span>
                     </button>
                     <button
                       onClick={() => setMethod('image')}
                       className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                         method === 'image' ? 'bg-[#f4ebe1] border-[#c8a149] shadow-sm' : 'bg-white border-[#f0ebe1] hover:bg-[#fcfaf7]'
                       }`}
                     >
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${method === 'image' ? 'bg-[#c8a149] text-white' : 'bg-[#f4f2ef] text-[#7a5c44]'}`}>
                         <Wallet className="w-5 h-5" />
                       </div>
                       <span className={`text-[10px] font-bold uppercase tracking-widest ${method === 'image' ? 'text-[#2d1b0e]' : 'text-[#9a7b5c]'}`}>Receipt Image</span>
                     </button>
                  </div>

                  {method === "image" ? (
                    <div className="mb-8">
                       <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">UPLOAD RECEIPT (Required)</label>
                       <input 
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="w-full bg-white border border-[#e8e0d5] rounded-xl px-5 py-4 text-sm text-[#5c4a3d] focus:outline-none focus:border-[#c8a149] shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#f4ebe1] file:text-[#8c6239] hover:file:bg-[#e8decb] cursor-pointer"
                       />
                    </div>
                  ) : (
                    <div className="mb-8 space-y-4">
                       <div>
                         <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">TRANSACTION REFERENCE NUMBER (Required)</label>
                         <input 
                            type="text"
                            placeholder="FT26114P7BYN"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full bg-white border border-[#e8e0d5] rounded-xl px-5 py-4 text-sm text-[#2d1b0e] focus:outline-none focus:border-[#c8a149] transition-colors placeholder:text-[#b8a594] shadow-sm"
                         />
                       </div>
                       {method === "cbe" && (
                         <div>
                           <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">ACCOUNT SUFFIX (Required for CBE)</label>
                           <input 
                              type="text"
                              placeholder="Enter your account suffix"
                              value={suffix}
                              onChange={(e) => setSuffix(e.target.value)}
                              className="w-full bg-white border border-[#e8e0d5] rounded-xl px-5 py-4 text-sm text-[#2d1b0e] focus:outline-none focus:border-[#c8a149] transition-colors placeholder:text-[#b8a594] shadow-sm"
                           />
                         </div>
                       )}
                    </div>
                  )}

                  <button 
                    onClick={handleVerify}
                    disabled={submitting}
                    className="w-full bg-[#8c6239] text-white rounded-xl py-4 font-bold text-xs uppercase tracking-widest transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 flex items-center justify-center gap-2 mb-2 lg:mb-0 shadow-md"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? "Verifying..." : "Submit Verification"} <ArrowRight className="w-4 h-4" />
                  </button>
               </div>

               <div className="flex flex-col justify-center">
                  <h4 className="text-lg font-heading text-[#2d1b0e] mb-6">Fulfillment Benefits</h4>
                  <ul className="space-y-5">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-[#5c4a3d] leading-relaxed">Peace of mind fulfilling promises to the church.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-[#5c4a3d] leading-relaxed">Digital tracking of your ongoing vows and remaining installments.</p>
                    </li>
                  </ul>
               </div>
            </div>
        </div>

        {/* Existing Vows */}
        <div className="mb-16">
           <div className="flex items-end justify-between mb-8 pb-4 border-b border-[#e8e0d5]">
              <h2 className="text-3xl font-heading text-[#2d1b0e]">Your Existing Vows</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selets.length === 0 ? (
                 <div className="md:col-span-2 py-12 text-center border-2 border-dashed border-[#e8e0d5] rounded-3xl bg-[#fcfaf7]">
                    <p className="text-sm font-semibold text-[#7a5c44] mb-1">No Active Vows</p>
                    <p className="text-xs text-[#9a7b5c]">Create a new vow above to begin tracking.</p>
                 </div>
              ) : (
                 selets.map((vow: any) => {
                    const installmentAmount = Math.round(Number(vow.total_amount) / (vow.installments || 12));
                    const paidAmount = Number(vow.paid_amount) || 0;
                    const percent = Number(vow.total_amount) > 0 ? (paidAmount / Number(vow.total_amount)) * 100 : 0;
                    
                    return (
                       <div key={vow.id} className="bg-white rounded-3xl p-6 md:p-8 border border-[#f0ebe1] shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-6">
                             <div>
                                <h4 className="text-xl font-heading text-[#2d1b0e] mb-1">{vow.title}</h4>
                                {getStatusBadge(vow.status)}
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-1">Pledged</p>
                                <p className="text-lg font-medium text-[#c8a149]">Br. {Number(vow.total_amount).toLocaleString()}</p>
                             </div>
                          </div>
                          
                          <div className="mb-6">
                             <div className="flex justify-between text-xs text-[#7a5c44] font-medium mb-2">
                                <span>Paid: Br. {paidAmount.toLocaleString()}</span>
                                <span>{percent.toFixed(0)}%</span>
                             </div>
                             <div className="h-1.5 w-full bg-[#f0ebe1] rounded-full overflow-hidden">
                                <div className="h-full bg-[#8c6239] rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
                             </div>
                          </div>

                          <div className="bg-[#f4f2ef] rounded-xl p-4 flex items-center justify-between border border-[#e8e0d5]">
                             <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-1">Est. Installment</p>
                                <p className="text-sm font-semibold text-[#2d1b0e]">Br. {installmentAmount.toLocaleString()}/mo</p>
                             </div>
                             <button className="text-[10px] font-bold uppercase tracking-widest text-[#8c6239] hover:text-[#5c4a3d] transition-colors py-2 px-4 border border-[#d8c5b2] bg-white rounded-lg">
                                Pay Now
                             </button>
                          </div>
                       </div>
                    );
                 })
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default SeletPage;
