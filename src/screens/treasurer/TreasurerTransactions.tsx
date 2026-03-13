"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Filter } from "lucide-react";

const TreasurerTransactions = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from("donations").select("*, profiles!donations_user_id_fkey(full_name)").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("type", filter);
      const { data } = await query;
      setDonations(data || []);
      setLoading(false);
    };
    fetch();
  }, [filter]);

  const totalAmount = donations.reduce((s, d) => s + Number(d.amount), 0);

  const exportCSV = () => {
    const header = "Date,Member,Type,Amount,Status\n";
    const rows = donations.map((d) => `${d.created_at},${(d.profiles as any)?.full_name || ""},${d.type},${d.amount},${d.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">All Transactions</h1>
          <p className="text-sm text-muted-foreground">{donations.length} transactions â€¢ {totalAmount.toLocaleString()} ETB total</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {["all", "donation", "aserat", "selet", "gbir"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Date</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Member</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Type</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : donations.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No transactions</td></tr>
            ) : (
              donations.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{(d.profiles as any)?.full_name || "Unknown"}</td>
                  <td className="px-6 py-4"><span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary">{d.type}</span></td>
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">{Number(d.amount).toLocaleString()} ETB</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      d.status === "verified" ? "bg-success/15 text-success" :
                      d.status === "rejected" ? "bg-destructive/15 text-destructive" :
                      "bg-primary/15 text-primary"
                    }`}>{d.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TreasurerTransactions;

