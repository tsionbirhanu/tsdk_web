"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, Filter } from "lucide-react";

const AdminReports = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("donations").select("*").order("created_at", { ascending: true });
      setDonations(data || []);
    };
    fetch();
  }, []);

  const filtered = filter === "all" ? donations : donations.filter((d) => d.type === filter);
  const totalAmount = filtered.reduce((sum, d) => sum + Number(d.amount), 0);
  const verifiedAmount = filtered.filter((d) => d.status === "verified").reduce((sum, d) => sum + Number(d.amount), 0);
  const pendingAmount = filtered.filter((d) => d.status === "pending").reduce((sum, d) => sum + Number(d.amount), 0);

  // Monthly aggregation
  const monthlyMap = new Map<string, number>();
  filtered.forEach((d) => {
    const month = new Date(d.created_at).toLocaleDateString("en", { year: "numeric", month: "short" });
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(d.amount));
  });
  const monthlyData = Array.from(monthlyMap, ([month, amount]) => ({ month, amount }));

  const typeMap = new Map<string, number>();
  donations.forEach((d) => {
    typeMap.set(d.type, (typeMap.get(d.type) || 0) + Number(d.amount));
  });
  const typeData = Array.from(typeMap, ([type, amount]) => ({ type, amount }));

  const exportCSV = () => {
    const header = "Date,Type,Amount,Status\n";
    const rows = filtered.map((d) => `${d.created_at},${d.type},${d.amount},${d.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donations-report.csv";
    a.click();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Financial reports and analysis</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground">Total Collection</p>
          <p className="text-2xl font-heading font-bold text-foreground mt-1">{totalAmount.toLocaleString()} ETB</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground">Verified</p>
          <p className="text-2xl font-heading font-bold text-success mt-1">{verifiedAmount.toLocaleString()} ETB</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-heading font-bold text-primary mt-1">{pendingAmount.toLocaleString()} ETB</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {["all", "donation", "aserat", "selet", "gbir"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" stroke="hsl(30,15%,55%)" fontSize={11} />
              <YAxis stroke="hsl(30,15%,55%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(30,18%,14%)", border: "1px solid hsl(30,15%,22%)", borderRadius: "8px", color: "hsl(40,30%,92%)" }} />
              <Line type="monotone" dataKey="amount" stroke="hsl(38,75%,50%)" strokeWidth={2} dot={{ fill: "hsl(38,75%,50%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* By Type */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">By Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={typeData}>
              <XAxis dataKey="type" stroke="hsl(30,15%,55%)" fontSize={11} />
              <YAxis stroke="hsl(30,15%,55%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(30,18%,14%)", border: "1px solid hsl(30,15%,22%)", borderRadius: "8px", color: "hsl(40,30%,92%)" }} />
              <Bar dataKey="amount" fill="hsl(38,75%,50%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;

