"use client";

import { useI18n } from "@/lib/i18n";
import { useState, useMemo, useRef, useEffect } from "react";
import { Loader2, CheckCircle, Search, Calendar, Wallet, Calculator, Building2, Smartphone, ArrowRight, ArrowUpRight, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { verifyPayment, VerificationMethod } from "@/lib/payment-verification";

const AseratPage = () => {
  const { t, lang } = useI18n();
  const { user, session } = useAuth();
  
  const [income, setIncome] = useState("");
  const [method, setMethod] = useState<VerificationMethod>("cbe");
  const [reference, setReference] = useState("");
  const [suffix, setSuffix] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const titheAmount = useMemo(() => {
    const val = parseFloat(income);
    return isNaN(val) ? 0 : val * 0.1;
  }, [income]);

  // Due date logic
  const [aseratDue, setAseratDue] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      try {
        const token = session?.access_token;
        const res = await fetch('/api/notifications/deadline', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const json = await res.json();
        const found = (json.data || []).find((d: any) => d.type === 'aserat');
        if (mounted && found) setAseratDue(found.due_date);
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, [user, session]);

  const saveAseratDeadline = async (date: string | null) => {
    setAseratDue(date);
    if (!user) return;
    try {
      const token = session?.access_token;
      await fetch('/api/notifications/deadline', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
        body: JSON.stringify({ type: 'aserat', due_date: date }),
      });
      toast.success('Deadline saved');
    } catch (err) {
      toast.error('Failed to save deadline');
    }
  };

  const { data: history = [], refetch } = useQuery({
    queryKey: ["aserat-history", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("donations")
        .select("*")
        .eq("user_id", user!.id)
        .eq("type", "aserat")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const handleVerify = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (titheAmount <= 0) { toast.error("Please enter a valid amount"); return; }
    if (method === "image" && !selectedFile) { toast.error("Please select a receipt image"); return; }
    if (method !== "image" && !reference) { toast.error("Please enter transaction reference"); return; }
    if (method === "cbe" && !suffix) { toast.error("Please enter account suffix"); return; }

    setSubmitting(true);
    try {
      // For images: verify FIRST, then create (prevents junk records)
      // For CBE/Telebirr: create pending, then verify (allows retry)
      if (method === "image") {
        const payload = { file: selectedFile };
        await verifyPayment(method, payload);
        
        // Only create donation after successful verification
        const { error: insertErr } = await supabase.from("donations").insert({
          user_id: user.id,
          amount: titheAmount,
          type: "aserat",
          status: "verified",
          notes: `Monthly income: ${income} ETB (Receipt Image - Auto Verified)`,
        });
        
        if (insertErr) throw insertErr;
        toast.success("Receipt verified and recorded successfully!");
      } else {
        // CBE/Telebirr: Create pending entry first
        const { data: donation, error: insertErr } = await supabase.from("donations").insert({
          user_id: user.id,
          amount: titheAmount,
          type: "aserat",
          status: "pending",
          notes: `Monthly income: ${income} ETB, Ref: ${reference}`,
        }).select().single();
        
        if (insertErr) throw insertErr;

        // Call verify API
        const payload: any = { reference, suffix: method === "cbe" ? suffix : undefined };
        await verifyPayment(method, payload);
        
        // Update to verified
        const { error: updateErr } = await supabase
          .from("donations")
          .update({ status: "verified" })
          .eq("id", donation.id);
        
        if (updateErr) throw updateErr;
        toast.success("Payment verified successfully!");
      }
      
      setSelectedFile(null);
      setIncome("");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'verified') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#e8f5e9] text-[#2e7d32]"><span className="w-1.5 h-1.5 rounded-full bg-[#2e7d32]"></span>Verified</span>;
    if (status === 'rejected') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#ffebee] text-[#c62828]"><span className="w-1.5 h-1.5 rounded-full bg-[#c62828]"></span>Rejected</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#fdf8e6] text-[#b58b29]"><span className="w-1.5 h-1.5 rounded-full bg-[#b58b29]"></span>Pending</span>;
  };

  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2d1b0e] font-sans pb-24">
      
      {/* Header / Title Area */}
      <div className="max-w-6xl w-full mx-auto px-4 md:px-8 xl:px-0 pt-6 md:pt-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <h1 className="text-4xl md:text-5xl font-heading text-[#2d1b0e]">Aserat (Tithe)</h1>
        <div className="relative max-w-sm w-full">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a7b5c]" />
           <input 
             type="text" 
             placeholder="Search archive..." 
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#ab8634] mb-3">SPIRITUAL COMMITMENT</p>
                <h2 className="text-4xl md:text-5xl font-heading leading-tight mb-6">Supporting the Sacred<br/>Mission</h2>
                <p className="text-[#5c4a3d] leading-relaxed max-w-2xl text-[15px]">
                  The Tithe is more than a contribution; it is an act of faith and gratitude for the blessings received. Your Aserat helps sustain our liturgical traditions and community service.
                </p>
            </div>
            <div className="lg:col-span-1 border-l-[3px] border-[#ab8634] bg-[#f4f2ef] rounded-r-2xl p-6 md:p-8 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-8">
                   <div className="w-8 h-8 flex items-center justify-center">
                     {/* Sparkle icon */}
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ab8634" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.2L3 12l5.8 1.9a2 2 0 0 1 1.2 1.2L12 21l1.9-5.8a2 2 0 0 1 1.2-1.2L21 12l-5.8-1.9a2 2 0 0 1-1.2-1.2L12 3Z"/></svg>
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c]">CURRENT CYCLE</span>
                </div>
                <div>
                   <p className="text-[11px] font-medium text-[#7a5c44] mb-1">Active Period</p>
                   <p className="text-2xl font-heading text-[#2d1b0e]">{currentMonthYear}</p>
                </div>
            </div>
        </div>

        {/* Input Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {/* Box 1 */}
            <div className="bg-[#fcfaf7] rounded-3xl p-6 md:p-8 shadow-sm border border-[#f0ebe1]">
               <div className="flex items-center gap-2 mb-8">
                  <Calendar className="w-5 h-5 text-[#7a5c44]" />
                  <h3 className="text-lg font-heading text-[#2d1b0e]">Monthly Deadline</h3>
               </div>
               <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">SELECT PAYMENT DATE</label>
               <input 
                  type="date"
                  value={aseratDue ? new Date(aseratDue).toISOString().slice(0,10) : ""}
                  onChange={(e) => saveAseratDeadline(e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full bg-[#f4f2ef] rounded-xl px-4 py-3 text-sm text-[#2d1b0e] border border-transparent focus:bg-white focus:border-[#d8c5b2] outline-none"
               />
               <p className="text-[10px] italic text-[#9a7b5c] mt-4 leading-relaxed">
                 Recommendations suggest completing tithe within the first week of receipt.
               </p>
            </div>

            {/* Box 2 */}
            <div className="bg-[#fcfaf7] rounded-3xl p-6 md:p-8 shadow-sm border border-[#f0ebe1]">
               <div className="flex items-center gap-2 mb-8">
                  <Wallet className="w-5 h-5 text-[#7a5c44]" />
                  <h3 className="text-lg font-heading text-[#2d1b0e]">Monthly Income</h3>
               </div>
               <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9a7b5c] mb-2">ENTER AMOUNT (ETB)</label>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#7a5c44]">Br.</span>
                 <input 
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#f4f2ef] rounded-xl pl-12 pr-4 py-3 text-sm text-[#2d1b0e] border border-transparent focus:bg-white focus:border-[#d8c5b2] outline-none"
                 />
               </div>
               <div className="flex items-start gap-2 mt-4">
                 <div className="w-4 h-4 rounded-full bg-[#e8e0d5] flex items-center justify-center flex-shrink-0 mt-0.5">
                   <Info className="w-3 h-3 text-[#7a5c44]" />
                 </div>
                 <p className="text-[10px] text-[#7a5c44] leading-relaxed">
                   Gross income before taxes is encouraged.
                 </p>
               </div>
            </div>

            {/* Box 3 - Dark */}
            <div className="bg-[#8c6239] rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col justify-between">
               <div className="absolute -right-4 -top-4 opacity-10">
                  <Calculator className="w-32 h-32 text-white" />
               </div>
               <div className="relative z-10 flex items-center gap-2 mb-8">
                  <Calculator className="w-5 h-5 text-white/80" />
                  <h3 className="text-lg font-heading text-white">Tithe Amount (10%)</h3>
               </div>
               <div className="relative z-10 mt-auto">
                 <div className="flex items-baseline gap-2 mb-1">
                   <span className="text-xl font-heading text-white/80">Br.</span>
                   <span className="text-4xl md:text-[42px] font-heading font-medium text-white tracking-tight">{titheAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                 </div>
                 <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-6">CALCULATED CONTRIBUTION</p>
                 <p className="text-[10px] italic text-[#f4ebe1]/80 leading-relaxed border-t border-white/10 pt-4">
                   "Bring the whole tithe into the storehouse, that there may be food in my house."
                 </p>
               </div>
            </div>
        </div>

        {/* Verification Section */}
        <div className="bg-[#fcfaf7] rounded-3xl p-6 md:p-10 border border-[#f0ebe1] shadow-sm mb-16">
            <h3 className="text-2xl font-heading text-[#2d1b0e] mb-2">Verify Your Payment</h3>
            <p className="text-sm text-[#7a5c44] mb-8">Connect your bank transaction or mobile transfer to your spiritual record.</p>
            
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

                  <div className="bg-[#fcf7e6] border border-[#f4e8b8] rounded-xl p-4 flex gap-3 mb-8">
                     <div className="w-5 h-5 rounded-full bg-[#d4af37] text-white flex items-center justify-center shrink-0 mt-0.5">
                       <span className="text-xs font-bold">?</span>
                     </div>
                     <p className="text-xs text-[#8c6d1f] leading-relaxed">
                       Please ensure the reference number matches exactly as shown on your receipt to ensure automated verification.
                     </p>
                  </div>

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
                  <h4 className="text-lg font-heading text-[#2d1b0e] mb-6">Verification Benefits</h4>
                  <ul className="space-y-5">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-[#5c4a3d] leading-relaxed">Instant digital receipt generation for your records.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-[#5c4a3d] leading-relaxed">Inclusion in the monthly parish blessing list.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-[#5c4a3d] leading-relaxed">Eligibility for community support programs during times of need.</p>
                    </li>
                  </ul>
               </div>
            </div>
        </div>

        {/* History Section */}
        <div className="mb-16">
           <div className="flex items-end justify-between mb-8 pb-4 border-b border-[#e8e0d5]">
              <h2 className="text-3xl font-heading text-[#2d1b0e]">Your Giving History</h2>
              <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c]">RECENT ASERAT RECORDS</span>
           </div>

           <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[600px]">
                 <thead>
                    <tr>
                       <th className="py-4 px-2 text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c]">Date</th>
                       <th className="py-4 px-2 text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c]">Amount (ETB)</th>
                       <th className="py-4 px-2 text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c]">Reference</th>
                       <th className="py-4 px-2 text-[10px] font-bold uppercase tracking-widest text-[#9a7b5c]">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#f0ebe1]">
                    {history.length === 0 ? (
                       <tr>
                         <td colSpan={4} className="py-8 text-center text-sm text-[#9a7b5c]">No records found.</td>
                       </tr>
                    ) : (
                       history.slice(0, 3).map((item: any) => {
                         const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                         // extract reference from notes if possible, else show ID fragment.
                         let refStr = "TXN-...";
                         if (item.notes && item.notes.includes("Ref: ")) {
                           refStr = item.notes.split("Ref: ")[1] || refStr;
                         } else {
                           refStr = `TXN-${item.id.substring(0,8).toUpperCase()}`;
                         }

                         return (
                           <tr key={item.id} className="hover:bg-[#fcfaf7] transition-colors">
                             <td className="py-5 px-2 text-sm text-[#5c4a3d]">{date}</td>
                             <td className="py-5 px-2 text-sm font-semibold text-[#2d1b0e]">{Number(item.amount).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits: 2})}</td>
                             <td className="py-5 px-2 text-[11px] font-mono text-[#9a7b5c] uppercase">{refStr}</td>
                             <td className="py-5 px-2">{getStatusBadge(item.status)}</td>
                           </tr>
                         )
                       })
                    )}
                 </tbody>
              </table>
           </div>
        </div>

   

      </div>
    </div>
  );
};

export default AseratPage;
