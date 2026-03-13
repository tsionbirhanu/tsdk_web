"use client";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Heart, CreditCard, TrendingUp, BarChart3, Church, AlertTriangle } from "lucide-react";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(38,75%,50%)", "hsl(0,60%,40%)", "hsl(140,50%,38%)", "hsl(30,15%,55%)"];

const AdminDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState({ members: 0, campaigns: 0, donations: 0, totalAmount: 0 });
  const [recentDonations, setRecentDonations] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, campaignsRes, donationsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("campaigns").select("id", { count: "exact", head: true }),
        supabase.from("donations").select("amount"),
      ]);

      const totalAmount = donationsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      setStats({
        members: profilesRes.count || 0,
        campaigns: campaignsRes.count || 0,
        donations: donationsRes.data?.length || 0,
        totalAmount,
      });

      const { data: recent } = await supabase
        .from("donations")
        .select("*, profiles!donations_user_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentDonations(recent || []);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Members", value: stats.members, icon: Users, color: "text-primary" },
    { label: "Active Campaigns", value: stats.campaigns, icon: Heart, color: "text-accent" },
    { label: "Total Donations", value: stats.donations, icon: CreditCard, color: "text-success" },
    { label: "Total Amount (ETB)", value: stats.totalAmount.toLocaleString(), icon: TrendingUp, color: "text-primary" },
  ];

  const monthlyData = [
    { month: "Sep", amount: 12000 }, { month: "Oct", amount: 15000 },
    { month: "Nov", amount: 11000 }, { month: "Dec", amount: 18000 },
    { month: "Jan", amount: 14000 }, { month: "Feb", amount: 16500 },
  ];

  const categoryData = [
    { name: "Donations", value: 45 }, { name: "Aserat", value: 30 },
    { name: "Selet", value: 15 }, { name: "Gbir", value: 10 },
  ];

  const quickLinks = [
    { label: "Manage Members", icon: Users, path: "/admin/members" },
    { label: "Manage Campaigns", icon: Heart, path: "/admin/campaigns" },
    { label: "Assign Roles", icon: BarChart3, path: "/admin/roles" },
    { label: "Church Events", icon: Church, path: "/admin/events" },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of church operations and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bar Chart */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Monthly Collection</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" stroke="hsl(30,15%,55%)" fontSize={12} />
                <YAxis stroke="hsl(30,15%,55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(30,18%,14%)", border: "1px solid hsl(30,15%,22%)", borderRadius: "8px", color: "hsl(40,30%,92%)" }}
                />
                <Bar dataKey="amount" fill="hsl(38,75%,50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Donations */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Recent Donations</h3>
            <div className="divide-y divide-border">
              {recentDonations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No donations yet</p>
              ) : (
                recentDonations.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {(d.profiles as any)?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">{d.type} â€¢ {d.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{Number(d.amount).toLocaleString()} ETB</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pie Chart */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Collection by Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Links */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                >
                  <link.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{link.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Alerts</h3>
            <div className="space-y-3">
              {/* <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10">
                <AlertTriangle className="w-4 h-4 text-accent mt-0.5" />
                <p className="text-xs text-foreground">3 pending payment verifications</p>
              </div> */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10">
                <AlertTriangle className="w-4 h-4 text-primary mt-0.5" />
                <p className="text-xs text-foreground">5 members with overdue aserat</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;





