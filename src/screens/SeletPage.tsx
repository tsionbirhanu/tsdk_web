"use client";

import AppHeader from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Upload, Loader2, CheckCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const SeletPage = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installments, setInstallments] = useState("12");
  const [creating, setCreating] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: selets = [], refetch } = useQuery({
    queryKey: ["selets", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("selets").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const handleCreate = async () => {
    if (!user || !title || !totalAmount) return;
    setCreating(true);
    try {
      const { error } = await supabase.from("selets").insert({
        user_id: user.id, title, total_amount: Number(totalAmount), installments: Number(installments),
      });
      if (error) throw error;
      toast.success(lang === "am" ? "áˆµáˆˆá‰µ á‰°áˆáŒ¥áˆ¯áˆ!" : "Vow created!");
      setShowCreate(false); setTitle(""); setTotalAmount(""); refetch();
    } catch (err: any) { toast.error(err.message); }
    finally { setCreating(false); }
  };

  const handlePayInstallment = async (selet: any) => {
    if (!user || !receiptFile) { toast.error(lang === "am" ? "ማስረጃ" : "Upload receipt"); return; }
    const amount = Number(payAmount) || (Number(selet.total_amount) / selet.installments);
    if (amount <= 0) return;

    setSubmitting(true);
    try {
      const ext = receiptFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("receipts").upload(filePath, receiptFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(filePath);

      const { error } = await supabase.from("donations").insert({
        user_id: user.id, amount, type: "selet", status: "pending",
        receipt_url: urlData.publicUrl, notes: `Selet: ${selet.title}`,
        selet_id: selet.id,
      });
      if (error) throw error;
      toast.success(lang === "am" ? "ክፊያ" : "Payment submitted!");
      setPayingId(null); setReceiptFile(null); setPayAmount(""); refetch();
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div>
      {/* <AppHeader title={t("selet.title")} /> */}
      <div className="px-4 py-4 space-y-4 animate-fade-in mt-10">
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="w-full py-5 rounded-xl bg-primary text-primary-foreground border-0 gold-glow">
              <Plus className="w-4 h-4 mr-2" /> {t("selet.createVow")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("selet.createVow")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <input placeholder={lang === "am" ? "áˆµáˆˆá‰µ áˆ­á‹•áˆµ" : "Vow title"} value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground" />
              <input type="number" placeholder={lang === "am" ? "áŒ á‰…áˆ‹áˆ‹ áˆ˜áŒ áŠ•" : "Total amount"} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground" />
              <input type="number" placeholder={lang === "am" ? "áŠ­áá‹« á‰¥á‹›á‰µ" : "Number of installments"} value={installments} onChange={(e) => setInstallments(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground" />
              <Button onClick={handleCreate} disabled={creating || !title || !totalAmount} className="w-full rounded-xl">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {lang === "am" ? "ááŒ áˆ­" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {selets.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
            {lang === "am" ? "áˆáŠ•áˆ áˆµáˆˆá‰µ á‹¨áˆˆáˆ" : "No vows yet. Create one above!"}
          </div>
        )}

        <div className="space-y-3">
          {selets.map((vow: any) => {
            const percent = Number(vow.total_amount) > 0 ? (Number(vow.paid_amount) / Number(vow.total_amount)) * 100 : 0;
            const isPaying = payingId === vow.id;
            return (
              <div key={vow.id} className="glass-card rounded-xl p-4 space-y-3">
                <h3 className="font-heading font-semibold text-foreground">{vow.title}</h3>
                <Progress value={percent} className="h-2" />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{Number(vow.paid_amount).toLocaleString()} / {Number(vow.total_amount).toLocaleString()} {t("common.birr")}</span>
                  <select
                    value={vow.status}
                    onChange={async (e) => {
                      const { error } = await supabase.from("selets").update({ status: e.target.value }).eq("id", vow.id);
                      if (error) toast.error(error.message);
                      else {
                        toast.success("Status updated");
                        refetch();
                      }
                    }}
                    className="text-xs px-2 py-1 rounded border border-border bg-secondary text-foreground focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {isPaying ? (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <input type="number" placeholder={`Amount (default: ${Math.round(Number(vow.total_amount) / vow.installments)})`}
                      value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground" />
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if(f) setReceiptFile(f); }} />
                    {receiptFile ? (
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-success" /> {receiptFile.name}
                        <Button variant="ghost" size="sm" onClick={() => setReceiptFile(null)}>âœ•</Button>
                      </div>
                    ) : (
                      <button onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border rounded-xl p-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/40">
                        <Upload className="w-4 h-4" /> {lang === "am" ? "áˆµáŠ­áˆªáŠ•áˆ¾á‰µ" : "Upload receipt"}
                      </button>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={() => handlePayInstallment(vow)} disabled={submitting || !receiptFile} className="flex-1 rounded-lg" size="sm">
                        {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} {lang === "am" ? "áŠ­áˆáˆ" : "Submit"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setPayingId(null); setReceiptFile(null); }} className="rounded-lg">
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => setPayingId(vow.id)}
                      className="rounded-lg text-xs border-primary/30 text-foreground">
                      {t("selet.payInstallment")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeletPage;

