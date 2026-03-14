"use client";

import Image from "next/image";
import AppHeader from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Upload, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import crossIcon from "@/assets/cross-icon.jpg";

const GBIR_AMOUNT = 2400;

const GbirPage = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: gbirPayments = [], refetch } = useQuery({
    queryKey: ["gbir-history", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("donations").select("*").eq("user_id", user!.id).eq("type", "gbir").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

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
              <div className="space-y-3 pt-2">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if(f) setReceiptFile(f); }} />
                {receiptFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-success" /> {receiptFile.name}
                    <button onClick={() => setReceiptFile(null)} className="text-muted-foreground hover:text-foreground">âœ•</button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="mx-auto border-2 border-dashed border-border/50 rounded-xl px-6 py-3 flex items-center gap-2 text-sm text-muted-foreground hover:border-primary/40">
                    <Upload className="w-4 h-4" /> {lang === "am" ? "ማስረጃ" : "Upload receipt"}
                  </button>
                )}
                <Button onClick={handlePay} disabled={submitting || !receiptFile}
                  className="bg-primary text-primary-foreground border-0 rounded-xl gold-glow disabled:opacity-40">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t("gbir.payNow")}
                </Button>
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



