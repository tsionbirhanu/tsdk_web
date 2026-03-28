"use client";

import Image from "next/image";
import AppHeader from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import patternBg from "@/assets/pattern-bg.jpg";

const AseratPage = () => {
  const { t, lang } = useI18n();
  const { user, session } = useAuth();
  const [income, setIncome] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Chapa payment form fields
  const [chapaFirstName, setChapaFirstName] = useState("");
  const [chapaLastName, setChapaLastName] = useState("");
  const [chapaEmail, setChapaEmail] = useState("");
  const [showChapaForm, setShowChapaForm] = useState(false);

  const titheAmount = useMemo(() => {
    const val = parseFloat(income);
    return isNaN(val) ? 0 : Math.round(val * 0.1);
  }, [income]);

  const { data: history = [], refetch } = useQuery({
    queryKey: ["aserat-history", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("donations").select("*").eq("user_id", user!.id).eq("type", "aserat").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user profile for Chapa payment
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Initialize Chapa form fields with user data
  useEffect(() => {
    if (profile && user) {
      const nameParts = (profile.full_name || "").split(" ");
      setChapaFirstName(nameParts[0] || "");
      setChapaLastName(nameParts.slice(1).join(" ") || "");
      setChapaEmail(user.email || profile.email || "");
    }
  }, [profile, user]);

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
  }, [user]);

  const saveAseratDeadline = async (date: string | null) => {
    if (!user) return;
    try {
      const token = session?.access_token;
      await fetch('/api/notifications/deadline', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
        body: JSON.stringify({ type: 'aserat', due_date: date }),
      });
      setAseratDue(date);
      toast.success('Deadline saved');
    } catch (err) {
      toast.error('Failed to save deadline');
    }
  };

  const handlePay = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (titheAmount <= 0) return;
    if (!receiptFile) { toast.error(lang === "am" ? "እባኮን የክፊያ ደረሰኝ ያስገቡ" : "Please upload payment receipt"); return; }

    setSubmitting(true);
    try {
      const ext = receiptFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("receipts").upload(filePath, receiptFile);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(filePath);

      const { error } = await supabase.from("donations").insert({
        user_id: user.id,
        amount: titheAmount,
        type: "aserat",
        status: "pending",
        receipt_url: urlData.publicUrl,
        notes: `Monthly income: ${income} ETB`,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success(lang === "am" ? "አስራት ገብቷል!" : "Aserat submitted!");
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChapaAserat = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (titheAmount <= 0) return;
    
    // Validate required fields
    if (!chapaFirstName || !chapaLastName || !chapaEmail) {
      toast.error(lang === "am" ? "እባኮን ሁሉንም መረጃዎች ይሙሉ" : "Please fill in all required fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(chapaEmail)) {
      toast.error(lang === "am" ? "የትክክለኛ ኢሜይል አድራሻ ያስገቡ" : "Please enter a valid email address");
      return;
    }

    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        body: JSON.stringify({ 
          type: 'aserat', 
          amount: titheAmount,
          first_name: chapaFirstName,
          last_name: chapaLastName,
          email: chapaEmail,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || json?.error || 'Failed initiating payment');
      }
      const json = await res.json();
      if (json.checkout_url) {
        window.location.href = json.checkout_url;
      } else {
        toast.error('No checkout URL');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Payment failed');
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setIncome("");
    setReceiptFile(null);
  };

  if (submitted) {
    return (
      <div>
        <AppHeader title={t("aserat.title")} />
        <div className="flex flex-col items-center justify-center h-[50vh] animate-fade-in px-4">
          <div className="p-4 rounded-full bg-primary/20 mb-4"><CheckCircle className="w-12 h-12 text-primary" /></div>
          <h2 className="text-xl font-heading font-bold text-foreground mb-2">{lang === "am" ? "አስራት ገብቷል!" : "Aserat Submitted!"}</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">{lang === "am" ? "የማሳወቂያ መልክት ይደርሶታል" : "You'll be notified once verified."}</p>
          <Button onClick={resetForm} className="rounded-xl">{lang === "am" ? "ለላ ለመክፈል" : "Pay Another"}</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
     
      <div className="px-4 py-4 space-y-5 animate-fade-in">
        <div className="relative glass-card rounded-2xl p-5 space-y-4 overflow-hidden">
         
          <div className="relative z-10 space-y-4">
              <div className="flex gap-2 items-center">
                <input type="text" value={aseratDue ? new Date(aseratDue).toISOString().slice(0,10) : ""}
                  onChange={(e) => saveAseratDeadline(e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
              </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block font-heading">{t("aserat.income")}</label>
              <div className="relative">
                <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{t("common.birr")}</span>
              </div>
            </div>

            <div className="bg-primary/15 border border-primary/30 rounded-xl p-4 text-center gold-glow">
              <p className="text-xs text-muted-foreground">{t("aserat.amount")}</p>
              <p className="text-3xl font-heading font-bold text-primary mt-1">{titheAmount.toLocaleString()} <span className="text-base font-sans">{t("common.birr")}</span></p>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{lang === "am" ? "የክፍያ ዘዴ" : "Payment Method"}</p>
              
              {/* Option 1: Screenshot Upload */}
              <div className="border border-border rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm font-medium text-foreground">{lang === "am" ? "የክፍያ ስክሪንሾት ይላኩ" : "Upload Payment Screenshot"}</span>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 5*1024*1024) { toast.error("Max 5MB"); return; } setReceiptFile(f); } }} />
                {receiptFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border">
                    <img src={URL.createObjectURL(receiptFile)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{receiptFile.name}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setReceiptFile(null); if(fileInputRef.current) fileInputRef.current.value=""; }}>{lang === "am" ? "ቀይር" : "Change"}</Button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{lang === "am" ? "ስክሪንሾት ይላኩ" : "Upload payment screenshot"}</span>
                  </button>
                )}
                <Button onClick={handlePay} disabled={titheAmount === 0 || !receiptFile || submitting}
                  className="w-full py-3 text-base font-semibold rounded-xl bg-primary text-primary-foreground border-0 gold-glow disabled:opacity-40">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {submitting ? (lang === "am" ? "በመግባት ላይ..." : "Submitting...") : (lang === "am" ? "አስገባ" : "Submit with Screenshot")}
                </Button>
              </div>

              {/* Option 2: Chapa Payment */}
              <div className="border border-border rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm font-medium text-foreground">{lang === "am" ? "በChapa በመስመር ላይ ይክፈሉ" : "Pay Online with Chapa"}</span>
                </div>
                <p className="text-xs text-muted-foreground">{lang === "am" ? "በባንክ በመስመር ላይ ወይም ሞባይል ማኔ በመጠቀም ይክፈሉ" : "Pay securely online using bank or mobile money"}</p>
                
                {!showChapaForm ? (
                  <Button onClick={() => setShowChapaForm(true)} variant="outline" className="w-full rounded-xl py-3" disabled={titheAmount === 0 || submitting}>
                    {lang === "am" ? "በChapa ክፈል" : "Pay with Chapa"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={lang === "am" ? "የመጀመሪያ ስም" : "First Name"}
                      value={chapaFirstName}
                      onChange={(e) => setChapaFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
                      required
                    />
                    <input
                      type="text"
                      placeholder={lang === "am" ? "የአባት ስም" : "Last Name"}
                      value={chapaLastName}
                      onChange={(e) => setChapaLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
                      required
                    />
                    <input
                      type="email"
                      placeholder={lang === "am" ? "ኢሜይል" : "Email"}
                      value={chapaEmail}
                      onChange={(e) => setChapaEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
                      required
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleChapaAserat} variant="outline" className="flex-1 rounded-xl py-3" disabled={titheAmount === 0 || submitting}>
                        {lang === "am" ? "ክፈል" : "Pay Now"}
                      </Button>
                      <Button onClick={() => setShowChapaForm(false)} variant="ghost" className="rounded-xl py-3">
                        {lang === "am" ? "ተመለስ" : "Cancel"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-heading font-semibold text-foreground mb-3">{t("aserat.history")}</h3>
          {history.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center text-sm text-muted-foreground">No aserat payments yet</div>
          ) : (
            <div className="glass-card rounded-xl divide-y divide-border">
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{Number(h.amount).toLocaleString()} {t("common.birr")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    h.status === "verified" ? "bg-success/15 text-success" : h.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
                  }`}>{h.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AseratPage;



