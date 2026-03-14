"use client";

import Image from "next/image";
import AppHeader from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Upload, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import crossIcon from "@/assets/cross-icon.jpg";

const GBIR_AMOUNT = 2400;

const GbirPage = () => {
  const { t, lang } = useI18n();
  const { user, session } = useAuth();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Chapa payment form fields
  const [chapaFirstName, setChapaFirstName] = useState("");
  const [chapaLastName, setChapaLastName] = useState("");
  const [chapaEmail, setChapaEmail] = useState("");
  const [showChapaForm, setShowChapaForm] = useState(false);

  const { data: gbirPayments = [], refetch } = useQuery({
    queryKey: ["gbir-history", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("donations").select("*").eq("user_id", user!.id).eq("type", "gbir").order("created_at", { ascending: false });
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

  const currentYear = new Date().getFullYear();
  const paidThisYear = gbirPayments.some((p: any) => new Date(p.created_at).getFullYear() === currentYear && p.status !== "rejected");

  const handlePay = async () => {
    if (!user || !receiptFile) { toast.error(lang === "am" ? "ማስረጃ" : "Upload receipt"); return; }
    setSubmitting(true);
    try {
      const ext = receiptFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("receipts").upload(filePath, receiptFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(filePath);

      const { error } = await supabase.from("donations").insert({
        user_id: user.id, amount: GBIR_AMOUNT, type: "gbir", status: "pending",
        receipt_url: urlData.publicUrl, notes: `Gbir ${currentYear}`,
      });
      if (error) throw error;
      toast.success(lang === "am" ? "ግብር ሰብሚተድ!" : "Gbir submitted!");
      setReceiptFile(null); refetch();
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleChapaGbir = async () => {
    if (!user) { toast.error(lang === "am" ? "ማስተዋወቅ" : "Please sign in"); return; }
    
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
          type: 'gbir', 
          amount: GBIR_AMOUNT,
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

  return (
    <div>
      {/* <AppHeader title={t("gbir.title")} /> */}
      <div className="px-4 py-4 space-y-5 animate-fade-in mt-6">
        <div className="relative rounded-2xl overflow-hidden">
          {/* <Image src={crossIcon} alt="" fill className="object-cover" /> */}
          <div className="absolute inset-0 bg-overlay-dark" />
          <div className="relative z-10 p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t("gbir.status")} â€” {currentYear}</p>
            <p className="text-3xl font-heading font-bold text-gold-gradient">{GBIR_AMOUNT.toLocaleString()} {t("common.birr")}</p>
            {paidThisYear ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-success font-medium">{lang === "am" ? "á‰°áŠ¨ááˆáˆ / á‰ áˆ›áˆ¨áŒ‹áŒˆáŒ¥ áˆ‹á‹­" : "Paid / Awaiting verification"}</span>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">{lang === "am" ? "የክፍያ ዘዴ" : "Payment Method"}</p>
                  
                  {/* Option 1: Screenshot Upload */}
                  <div className="border border-border rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-sm font-medium text-foreground">{lang === "am" ? "የክፍያ ስክሪንሾት ይላኩ" : "Upload Payment Screenshot"}</span>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if(f) setReceiptFile(f); }} />
                    {receiptFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-success" /> {receiptFile.name}
                        <button onClick={() => setReceiptFile(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border/50 rounded-xl px-6 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/40">
                        <Upload className="w-4 h-4" /> {lang === "am" ? "ስክሪንሾት ይላኩ" : "Upload Screenshot"}
                      </button>
                    )}
                    <Button onClick={handlePay} disabled={submitting || !receiptFile}
                      className="w-full bg-primary text-primary-foreground border-0 rounded-xl gold-glow disabled:opacity-40">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {lang === "am" ? "አስገባ" : "Submit with Screenshot"}
                    </Button>
                  </div>

                  {/* Option 2: Chapa Payment */}
                  <div className="border border-border rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-sm font-medium text-foreground">{lang === "am" ? "በChapa በመስመር ላይ ይክፈሉ" : "Pay Online with Chapa"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{lang === "am" ? "በባንክ በመስመር ላይ ወይም ሞባይል ማኔ በመጠቀም ይክፈሉ" : "Pay securely online using bank or mobile money"}</p>
                    
                    {!showChapaForm ? (
                      <Button onClick={() => setShowChapaForm(true)} variant="outline" disabled={paidThisYear}
                        className="w-full rounded-xl">
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
                          <Button onClick={handleChapaGbir} variant="outline" disabled={paidThisYear} className="flex-1 rounded-xl">
                            {lang === "am" ? "ክፈል" : "Pay Now"}
                          </Button>
                          <Button onClick={() => setShowChapaForm(false)} variant="ghost" className="rounded-xl">
                            {lang === "am" ? "ተመለስ" : "Cancel"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-heading font-semibold text-foreground mb-3">{t("aserat.history")}</h3>
          {gbirPayments.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center text-sm text-muted-foreground">No gbir payments yet</div>
          ) : (
            <div className="space-y-2">
              {gbirPayments.map((y: any) => (
                <div key={y.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-heading font-semibold text-foreground">{new Date(y.created_at).getFullYear()}</p>
                    <p className="text-sm text-muted-foreground">{Number(y.amount).toLocaleString()} {t("common.birr")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {y.status === "verified" ? (
                      <><CheckCircle className="w-5 h-5 text-success" /><span className="text-xs text-success font-medium">Paid</span></>
                    ) : y.status === "rejected" ? (
                      <><XCircle className="w-5 h-5 text-destructive" /><span className="text-xs text-destructive font-medium">Rejected</span></>
                    ) : (
                      <><XCircle className="w-5 h-5 text-primary" /><span className="text-xs text-primary font-medium">Pending</span></>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GbirPage;



