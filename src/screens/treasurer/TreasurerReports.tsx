"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download } from "lucide-react";

const COLORS = ["hsl(38,75%,50%)", "hsl(0,60%,40%)", "hsl(140,50%,38%)", "hsl(30,15%,55%)"];

const TreasurerReports = () => {
  const [donations, setDonations] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("donations").select("*").order("created_at").then(({ data }) => setDonations(data || []));
  }, []);

  const totalAmount = donations.reduce((s, d) => s + Number(d.amount), 0);
  const verifiedAmount = donations.filter((d) => d.status === "verified").reduce((s, d) => s + Number(d.amount), 0);

  // Monthly
  const monthlyMap = new Map<string, number>();
  donations.forEach((d) => {
    const m = new Date(d.created_at).toLocaleDateString("en", { year: "numeric", month: "short" });
    monthlyMap.set(m, (monthlyMap.get(m) || 0) + Number(d.amount));
  });
  const monthlyData = Array.from(monthlyMap, ([month, amount]) => ({ month, amount }));

  // By type
  const typeMap = new Map<string, number>();
  donations.forEach((d) => typeMap.set(d.type, (typeMap.get(d.type) || 0) + Number(d.amount)));
  const typeData = Array.from(typeMap, ([name, value]) => ({ name, value }));

  const exportCSV = () => {
    const header = "Date,Type,Amount,Status\n";
    const rows = donations.map((d) => `${d.created_at},${d.type},${d.amount},${d.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "financial-report.csv"; a.click();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">Detailed financial analysis and reporting</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground">Total Collection</p>
          <p className="text-2xl font-heading font-bold text-foreground">{totalAmount.toLocaleString()} ETB</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground">Verified Amount</p>
          <p className="text-2xl font-heading font-bold text-success">{verifiedAmount.toLocaleString()} ETB</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" stroke="hsl(30,15%,55%)" fontSize={11} />
              <YAxis stroke="hsl(30,15%,55%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(30,18%,14%)", border: "1px solid hsl(30,15%,22%)", borderRadius: "8px", color: "hsl(40,30%,92%)" }} />
              <Line type="monotone" dataKey="amount" stroke="hsl(38,75%,50%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TreasurerReports;

