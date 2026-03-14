"use client";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, CreditCard, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const COLORS = ["hsl(38,75%,50%)", "hsl(0,60%,40%)", "hsl(140,50%,38%)", "hsl(30,15%,55%)"];

const TreasurerDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, rejected: 0 });
  const [pendingDonations, setPending] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("donations").select("*, profiles!donations_user_id_fkey(full_name)");
      if (!data) return;

      const total = data.reduce((s, d) => s + Number(d.amount), 0);
      const verified = data.filter((d) => d.status === "verified").reduce((s, d) => s + Number(d.amount), 0);
      const pending = data.filter((d) => d.status === "pending").reduce((s, d) => s + Number(d.amount), 0);
      const rejected = data.filter((d) => d.status === "rejected").reduce((s, d) => s + Number(d.amount), 0);
      setStats({ total, verified, pending, rejected });

      setPending(data.filter((d) => d.status === "pending").slice(0, 5));
    };
    fetch();
  }, []);

  const statusData = [
    { name: "Verified", value: stats.verified },
    { name: "Pending", value: stats.pending },
    { name: "Rejected", value: stats.rejected },
  ].filter((d) => d.value > 0);

  const quickLinks = [
    { label: "Verify Payments", icon: CheckCircle, path: "/treasurer/payments" },
    { label: "All Transactions", icon: Clock, path: "/treasurer/transactions" },
    { label: "Financial Reports", icon: TrendingUp, path: "/treasurer/reports" },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Treasurer Dashboard</h1>
        <p className="text-sm text-muted-foreground">Financial overview and management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Collection", value: stats.total, icon: Wallet, color: "text-primary" },
          { label: "Verified", value: stats.verified, icon: CheckCircle, color: "text-success" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-primary" },
          { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-heading font-bold text-foreground">{s.value.toLocaleString()} ETB</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Pending Payments */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">Pending Verifications</h3>
              <button onClick={() => router.push("/treasurer/payments")} className="text-xs text-primary hover:underline">View All</button>
            </div>
            <div className="divide-y divide-border">
              {pendingDonations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No pending payments</p>
              ) : (
                pendingDonations.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{(d.profiles as any)?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{d.type} â€¢ {new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="font-semibold text-primary">{Number(d.amount).toLocaleString()} ETB</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Chart */}
          {statusData.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-heading font-semibold text-foreground mb-4">Payment Status</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name }) => name}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick Links */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {quickLinks.map((l) => (
                <button key={l.path} onClick={() => router.push(l.path)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left">
                  <l.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasurerDashboard;





