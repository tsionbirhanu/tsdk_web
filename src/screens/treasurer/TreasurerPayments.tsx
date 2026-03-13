"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Clock, Image, Upload, X, Eye } from "lucide-react";
import { toast } from "sonner";

const TreasurerPayments = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchDonations = async () => {
    setLoading(true);
    let query = supabase.from("donations").select("*, campaigns(title)").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setDonations(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDonations(); }, [filter]);

  const handleVerify = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase.from("donations").update({
      status,
      verified_by: user?.id,
      verified_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Payment ${status}`);
    fetchDonations();
  };

  const handleReceiptUpload = async (donationId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setUploading(donationId);
    const ext = file.name.split(".").pop();
    const filePath = `${donationId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase.from("donations").update({
      receipt_url: urlData.publicUrl,
    }).eq("id", donationId);

    if (updateError) {
      toast.error("Failed to save receipt URL");
    } else {
      toast.success("Receipt uploaded successfully");
      fetchDonations();
    }
    setUploading(null);
  };

  const getReceiptUrl = (d: any) => d.receipt_url;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Payment Verification</h1>
        <p className="text-sm text-muted-foreground">Review receipts and verify member payments</p>
      </div>

      <div className="flex gap-2">
        {["pending", "verified", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Receipt Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)} className="absolute -top-3 -right-3 p-2 rounded-full bg-card border border-border text-foreground z-10">
              <X className="w-4 h-4" />
            </button>
            <img src={previewUrl} alt="Payment receipt" className="w-full rounded-xl border border-border shadow-lg" />
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Member</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Type</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Receipt</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Date</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : donations.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No payments found</td></tr>
            ) : (
              donations.map((d) => {
                const receiptUrl = getReceiptUrl(d);
                return (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{d.notes || "Member"}</p>
                      <p className="text-[10px] text-muted-foreground">{(d.campaigns as any)?.title || d.type}</p>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary">{d.type}</span></td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{Number(d.amount).toLocaleString()} ETB</td>
                    <td className="px-6 py-4">
                      {receiptUrl ? (
                        <button
                          onClick={() => setPreviewUrl(receiptUrl)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Receipt
                        </button>
                      ) : (
                        <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80 transition-colors cursor-pointer">
                          {uploading === d.id ? (
                            <div className="animate-spin w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          {uploading === d.id ? "Uploading..." : "Upload"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleReceiptUpload(d.id, file);
                            }}
                            disabled={uploading === d.id}
                          />
                        </label>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        d.status === "verified" ? "bg-success/15 text-success" :
                        d.status === "rejected" ? "bg-destructive/15 text-destructive" :
                        "bg-primary/15 text-primary"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {d.status === "pending" && (
                        <div className="flex gap-1">
                          <button onClick={() => handleVerify(d.id, "verified")} className="p-1.5 rounded hover:bg-success/10 text-success" title="Verify">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleVerify(d.id, "rejected")} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TreasurerPayments;

