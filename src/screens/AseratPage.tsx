"use client";

import Image from "next/image";
import AppHeader from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import patternBg from "@/assets/pattern-bg.jpg";

const AseratPage = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [income, setIncome] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <AppHeader title={t("aserat.title")} />
      <div className="px-4 py-4 space-y-5 animate-fade-in">
        <div className="relative glass-card rounded-2xl p-5 space-y-4 overflow-hidden">
          <Image src={patternBg} alt="" fill className="object-cover opacity-10" />
          <div className="relative z-10 space-y-4">
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

            {/* Receipt Upload */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 5*1024*1024) { toast.error("Max 5MB"); return; } setReceiptFile(f); } }} />
            {receiptFile ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border">
                <img src={URL.createObjectURL(receiptFile)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{receiptFile.name}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setReceiptFile(null); if(fileInputRef.current) fileInputRef.current.value=""; }}>{lang === "am" ? "á‰€á‹­áˆ­" : "Change"}</Button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{lang === "am" ? "" : "Upload payment screenshot"}</span>
              </button>
            )}

            <Button onClick={handlePay} disabled={titheAmount === 0 || !receiptFile || submitting}
              className="w-full py-6 text-base font-semibold rounded-xl bg-primary text-primary-foreground border-0 gold-glow disabled:opacity-40">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {submitting ? (lang === "am" ? "በመግባት ላይ­..." : "Submitting...") : t("aserat.pay")}
            </Button>
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



