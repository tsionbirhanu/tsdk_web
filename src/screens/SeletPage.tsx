"use client";

import AppHeader from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Upload, Loader2, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const SeletPage = () => {
  const { t, lang } = useI18n();
  const { user, session } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installments] = useState("12");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Chapa payment form fields
  const [chapaFirstName, setChapaFirstName] = useState("");
  const [chapaLastName, setChapaLastName] = useState("");
  const [chapaEmail, setChapaEmail] = useState("");
  const [showChapaForm, setShowChapaForm] = useState(false);

  const { data: selets = [], refetch } = useQuery({
    queryKey: ["selets", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("selets").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
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

  // load user's deadlines for selet
  const [seletDue, setSeletDue] = useState<string | null>(null);
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
        const found = (json.data || []).find((d: any) => d.type === 'selet');
        if (mounted && found) setSeletDue(found.due_date);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const saveSeletDeadline = async (date: string | null) => {
    if (!user) return;
    try {
      const token = session?.access_token;
      await fetch('/api/notifications/deadline', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
        body: JSON.stringify({ type: 'selet', due_date: date }),
      });
      setSeletDue(date);
      toast.success('Deadline saved');
    } catch (err) {
      toast.error('Failed to save deadline');
    }
  };

  const handleCreate = async () => {
    if (!user || !title || !totalAmount) return;
    setCreating(true);
    try {
      const { error } = await supabase.from("selets").insert({
        user_id: user.id, title, total_amount: Number(totalAmount), installments: Number(installments),
      });
      if (error) throw error;
      // if the user provided a due date for this selet, save it as their selet deadline
      if (dueDate) {
        try {
          const token = session?.access_token;
          await fetch('/api/notifications/deadline', {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
            body: JSON.stringify({ type: 'selet', due_date: new Date(dueDate).toISOString() }),
          });
        } catch (e) {
          console.error('Failed saving selet deadline', e);
        }
      }
      toast.success(lang === "am" ? "áˆµáˆˆá‰µ á‰°áˆáŒ¥áˆ¯áˆ!" : "Vow created!");
      setShowCreate(false); setTitle(""); setTotalAmount(""); setDueDate(null); refetch();
    } catch (err: any) { toast.error(err.message); }
    finally { setCreating(false); }
  };

  const handlePayInstallment = async (selet: any) => {
    if (!user || !receiptFile) { toast.error(lang === "am" ? "áˆµáŠ­áˆªáŠ•áˆ¾á‰µ á‹«áˆµáŒˆá‰¡" : "Upload receipt"); return; }
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
      toast.success(lang === "am" ? "áŠ­áá‹« á‰°áˆáŠ³áˆ!" : "Payment submitted!");
      setPayingId(null); setReceiptFile(null); setPayAmount(""); refetch();
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleChapaPay = async (selet: any) => {
    if (!user) { toast.error(lang === "am" ? "እባኮን ይግቡ" : "Please sign in"); return; }
    const amount = Number(payAmount) || (Number(selet.total_amount) / selet.installments);
    if (amount <= 0) return;
    
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
          type: 'selet', 
          amount, 
          selet_id: selet.id,
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
      
      <div className="px-4 py-4 space-y-4 animate-fade-in">
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
              <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'am' ? 'የመጀመሪያ ቀን' : 'Start due date'}</label>
              <input type="text" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)}
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
                  <div className="space-y-4 pt-2 border-t border-border">
                    <input type="number" placeholder={`Amount (default: ${Math.round(Number(vow.total_amount) / vow.installments)})`}
                      value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground" />
                    
                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{lang === "am" ? "የክፍያ ዘዴ" : "Payment Method"}</p>
                      
                      {/* Option 1: Screenshot Upload */}
                      <div className="border border-border rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <span className="text-sm font-medium text-foreground">{lang === "am" ? "የክፍያ ስክሪንሾት ይላኩ" : "Upload Payment Screenshot"}</span>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if(f) setReceiptFile(f); }} />
                        {receiptFile ? (
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <CheckCircle className="w-4 h-4 text-success" /> {receiptFile.name}
                            <Button variant="ghost" size="sm" onClick={() => setReceiptFile(null)}>✕</Button>
                          </div>
                        ) : (
                          <button onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-border rounded-xl p-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/40">
                            <Upload className="w-4 h-4" /> {lang === "am" ? "ስክሪንሾት ይላኩ" : "Upload Screenshot"}
                          </button>
                        )}
                        <Button onClick={() => handlePayInstallment(vow)} disabled={submitting || !receiptFile} className="w-full rounded-lg" size="sm">
                          {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} 
                          {lang === "am" ? "አስገባ" : "Submit with Screenshot"}
                        </Button>
                      </div>

                      {/* Option 2: Chapa Payment */}
                      <div className="border border-border rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <span className="text-sm font-medium text-foreground">{lang === "am" ? "በChapa በመስመር ላይ ይክፈሉ" : "Pay Online with Chapa"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{lang === "am" ? "በባንክ በመስመር ላይ ወይም ሞባይል ማኔ በመጠቀም ይክፈሉ" : "Pay securely online using bank or mobile money"}</p>
                        
                        {!showChapaForm ? (
                          <Button onClick={() => setShowChapaForm(true)} variant="outline" className="w-full rounded-lg" size="sm">
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
                              <Button onClick={() => handleChapaPay(vow)} variant="outline" className="flex-1 rounded-lg" size="sm">
                                {lang === "am" ? "ክፈል" : "Pay Now"}
                              </Button>
                              <Button onClick={() => setShowChapaForm(false)} variant="ghost" size="sm" className="rounded-lg">
                                {lang === "am" ? "ተመለስ" : "Cancel"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => { 
                      setPayingId(null); 
                      setReceiptFile(null); 
                      setPayAmount(""); 
                      setShowChapaForm(false);
                      setChapaFirstName("");
                      setChapaLastName("");
                      setChapaEmail("");
                    }} className="w-full rounded-lg">
                      {t("common.cancel")}
                    </Button>
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

