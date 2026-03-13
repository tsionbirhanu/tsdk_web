"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import {
  Heart,
  BookOpen,
  Church,
  TrendingUp,
  ArrowRight,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import heroBg from "@/assets/church-banner.jpg";
import patternBg from "@/assets/pattern-bg.jpg";

const Dashboard = () => {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: donations = [] } = useQuery({
    queryKey: ["my-donations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("donations")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("id, title, goal_amount, raised_amount, status, created_at, updated_at");
      return data || [];
    },
  });

  // Derive a "real" status for each campaign based on raised vs goal and DB status
  const campaignsWithStatus = (campaigns as any[]).map((c) => {
    const goal = Number(c.goal_amount || 0);
    const raised = Number(c.raised_amount || 0);
    let realStatus = c.status || "active";

    if (goal > 0 && raised >= goal) {
      realStatus = "funded";
    }

    if (c.status && (c.status === "closed" || c.status === "archived")) {
      realStatus = c.status;
    }

    return { ...c, realStatus };
  });

  const { data: selets = [] } = useQuery({
    queryKey: ["my-selets", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("selets")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active");
      return data || [];
    },
    enabled: !!user,
  });

  const totalDonated = donations
    .filter((d: any) => d.status === "verified")
    .reduce((s: number, d: any) => s + Number(d.amount), 0);
  const totalAserat = donations
    .filter((d: any) => d.type === "aserat" && d.status === "verified")
    .reduce((s: number, d: any) => s + Number(d.amount), 0);

  const stats = [
    {
      label: t("dash.totalDonated"),
      value: totalDonated.toLocaleString(),
      icon: Heart,
      accent: "text-primary",
    },
    {
      label: t("dash.campaigns"),
      value: String(campaignsWithStatus.filter((c: any) => c.realStatus === "active").length),
      icon: TrendingUp,
      accent: "text-accent",
    },
    {
      label: t("dash.aserat"),
      value: totalAserat.toLocaleString(),
      icon: BookOpen,
      accent: "text-success",
    },
    {
      label: t("dash.selet"),
      value: String(selets.length),
      icon: Church,
      accent: "text-primary",
    },
  ];

  const quickActions = [
    { label: t("nav.donate"), icon: Heart, path: "/donate" },
    { label: t("nav.aserat"), icon: BookOpen, path: "/aserat" },
    { label: t("nav.selet"), icon: Church, path: "/selet" },
    { label: t("nav.gbir"), icon: CreditCard, path: "/gbir" },
  ];

  const recentDonations = donations.slice(0, 5);

  return (
    <div className="animate-fade-in">
      <div className="relative h-64 overflow-hidden">
        <Image src={heroBg} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-overlay-dark" />
        <div className="relative z-10 flex flex-col justify-end h-full p-8">
          <p className="text-sm text-primary/80 font-ethiopic">
            {t("dash.welcome")}
          </p>
          <h2 className="text-3xl font-heading font-bold text-foreground mt-1">
            {profile?.full_name || user?.email?.split("@")[0] || "Member"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t("dash.memberSince")}{" "}
            {profile?.member_since || new Date().getFullYear()}
          </p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-xl p-6 gold-glow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className={`w-5 h-5 ${stat.accent}`} />
                </div>
                <span className="text-sm text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">
                {stat.value}{" "}
                <span className="text-sm font-sans font-normal text-muted-foreground">
                  {t("common.birr")}
                </span>
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
                {t("dash.quickActions")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.path}
                    onClick={() => router.push(action.path)}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl glass-card hover:border-primary/50 transition-all group">
                    <div className="relative overflow-hidden p-4 rounded-xl border border-primary/20 bg-secondary group-hover:border-primary/50 transition-all">
                      <Image
                        src={patternBg}
                        alt=""
                        fill
                        className="object-cover opacity-20"
                      />
                      <action.icon className="relative w-6 h-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading font-semibold text-foreground">
                  {t("dash.recentActivity")}
                </h3>
                <button
                  onClick={() => router.push("/history")}
                  className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                  {t("common.viewAll")} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="glass-card rounded-xl divide-y divide-border">
                {recentDonations.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No activity yet. Make your first donation!
                  </div>
                ) : (
                  recentDonations.map((d: any) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                      <div>
                        <p className="font-medium text-foreground">
                          {d.type} {d.notes ? `- ${d.notes}` : ""}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(d.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-primary">
                          -{Number(d.amount).toLocaleString()}{" "}
                          {t("common.birr")}
                        </span>
                        <p
                          className={`text-xs ${d.status === "verified" ? "text-success" : d.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`}>
                          {d.status}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-6">
                <h3 className="text-lg font-heading font-semibold text-foreground">
                  {t("dash.campaigns")}
                </h3>
                <button
                  onClick={() => router.push("/campaigns")}
                  className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                  {t("common.viewAll")} <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="glass-card rounded-xl p-4 space-y-3">
                {(campaignsWithStatus || []).slice(0, 5).map((c: any) => {
                  const statusLabel = c.realStatus === "funded" || c.realStatus === "complete" || c.realStatus === "closed" || c.realStatus === "archived"
                    ? "Complete"
                    : c.realStatus === "paused"
                      ? "Paused"
                      : "Active";

                  const disableDonate = statusLabel !== "Active";

                  return (
                    <div key={c.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{c.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {Number(c.raised_amount).toLocaleString()} / {Number(c.goal_amount).toLocaleString()} {t("common.birr")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded ${statusLabel === "Active" ? "bg-primary/10 text-primary" : statusLabel === "Paused" ? "bg-muted/20 text-muted-foreground" : "bg-success/10 text-success"}`}>
                          {statusLabel}
                        </span>
                        <button
                          onClick={() => router.push(`/campaigns/${c.id}`)}
                          disabled={disableDonate}
                          className={`px-3 py-1 rounded text-sm ${disableDonate ? "bg-muted/20 text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                          {disableDonate ? t("dash.noMoreDonate") || "No more donate" : t("nav.donate")}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {(campaignsWithStatus || []).length === 0 && (
                  <div className="text-sm text-muted-foreground text-center p-4">No campaigns available</div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
              {t("dash.reminders")}
            </h3>
            <div className="space-y-3">
              {selets.map((s: any) => (
                <div
                  key={s.id}
                  className="glass-card rounded-xl p-4 flex items-start gap-4">
                  <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                  <span className="text-sm text-foreground leading-relaxed">
                    {s.title}: {Number(s.paid_amount).toLocaleString()}/
                    {Number(s.total_amount).toLocaleString()} {t("common.birr")}
                  </span>
                </div>
              ))}
              {selets.length === 0 && (
                <div className="glass-card rounded-xl p-4 text-sm text-muted-foreground text-center">
                  No active commitments
                </div>
              )}
            </div>

            <div className="mt-6 glass-card rounded-xl p-6 gold-glow">
              <h4 className="font-heading font-semibold text-foreground mb-4">
                This Month
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Given
                  </span>
                  <span className="font-semibold text-foreground">
                    {totalDonated.toLocaleString()} {t("common.birr")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-semibold text-foreground">
                    {
                      donations.filter((d: any) => d.status === "pending")
                        .length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
