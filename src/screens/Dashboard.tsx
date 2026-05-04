"use client";

import AppHeader from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, BookOpen, Church, TrendingUp, ArrowRight, CheckCircle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: donations = [] } = useQuery({
    queryKey: ["donations", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("donations").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("*").eq("status", "active").limit(4);
      return data || [];
    },
  });

  const { data: selets = [] } = useQuery({
    queryKey: ["selets", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("selets").select("*").eq("user_id", user!.id).limit(3);
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

  const totalVows = selets.length;
  const activeCampaigns = campaigns.length;
  const recentDonations = donations.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#e8e0d5]">
      <AppHeader title={lang === "am" ? "ውቁ" : "Dashboard"} showControls={true} />

      <div className="px-4 py-6 space-y-6 max-w-6xl mx-auto animate-fade-in">
        {profile && (
          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold text-foreground">
                  {lang === "am" ? "ሰላም" : "Welcome back"}, {profile.full_name}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {lang === "am" ? "አባላት" : "Member since"}{" "}
                  {new Date(profile.created_at).toLocaleDateString(lang === "am" ? "am-ET" : "en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-rose-500/10">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                {lang === "am" ? "ጠቅላላ ሰጥቷል" : "Total Given"}
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalDonated.toLocaleString()}</p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                {lang === "am" ? "ደወል" : "Aserat"}
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalAserat.toLocaleString()}</p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Church className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                {lang === "am" ? "ጸሎቶች" : "Vows"}
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalVows}</p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                {lang === "am" ? "ቅስቃሴ" : "Campaigns"}
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeCampaigns}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() => router.push("/donate")}
            className="py-6 rounded-xl bg-primary text-primary-foreground font-semibold border-0 gold-glow"
          >
            <Heart className="w-4 h-4 mr-2" />
            {lang === "am" ? "ጊዜ ይሰጡ" : "Donate"}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <Button
            onClick={() => router.push("/aserat")}
            className="py-6 rounded-xl bg-secondary/80 text-foreground font-semibold border border-border/40"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {lang === "am" ? "አሰሚ ስጦታ" : "Aserat"}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <Button
            onClick={() => router.push("/selet")}
            className="py-6 rounded-xl bg-secondary/80 text-foreground font-semibold border border-border/40"
          >
            <Church className="w-4 h-4 mr-2" />
            {lang === "am" ? "ጸሎቶች" : "Vows"}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <Button
            onClick={() => router.push("/gbir")}
            className="py-6 rounded-xl bg-secondary/80 text-foreground font-semibold border border-border/40"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {lang === "am" ? "ግብር" : "Gbir"}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Recent Activity */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-heading font-bold text-foreground">
              {lang === "am" ? "ወሬዎት" : "Recent Activity"}
            </h2>

            {recentDonations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/40 bg-card/30 p-8 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {lang === "am" ? "ገና ምንም ወሬ የሉም" : "No Activity Yet"}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {lang === "am" ? "ወደ ወደ ማስፈር ይጀምሩ" : "Start making contributions to see activity here."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDonations.map((tx: any) => (
                  <div key={tx.id} className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString(lang === "am" ? "am-ET" : "en-US")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{Number(tx.amount).toLocaleString()}</p>
                      <div className="flex items-center gap-1 justify-end">
                        {tx.status === "verified" ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-success" />
                            <span className="text-xs text-success font-semibold">OK</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-xs text-primary font-semibold">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Active Vows */}
          <div className="space-y-4">
            <h2 className="text-lg font-heading font-bold text-foreground">
              {lang === "am" ? "ንቁ ጸሎቶች" : "Active Vows"}
            </h2>

            {selets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/40 bg-card/30 p-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {lang === "am" ? "ከሥጋ ዲሮ" : "No Vows"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selets.slice(0, 3).map((vow: any) => {
                  const percent = Number(vow.total_amount) > 0 ? ((Number(vow.paid_amount) || 0) / Number(vow.total_amount)) * 100 : 0;
                  return (
                    <div key={vow.id} className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4">
                      <p className="font-semibold text-foreground text-sm truncate">{vow.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Number(vow.paid_amount || 0).toLocaleString()} / {Number(vow.total_amount).toLocaleString()} ETB
                      </p>
                      <Progress value={percent} className="h-1.5 mt-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-bold text-foreground">
            {lang === "am" ? "ንቁ ቅስቃሴ" : "Active Campaigns"}
          </h2>

          {campaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/40 bg-card/30 p-8 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {lang === "am" ? "ንቁ ቅስቃሴ የሉም" : "No Active Campaigns"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campaigns.map((campaign: any) => {
                const percent = Number(campaign.goal) > 0 ? (Number(campaign.raised) / Number(campaign.goal)) * 100 : 0;
                return (
                  <div
                    key={campaign.id}
                    onClick={() => router.push(`/donate/${campaign.id}`)}
                    className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-5 hover:bg-card/70 transition-colors cursor-pointer"
                  >
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2">{campaign.title}</h3>
                    <p className="text-xs text-muted-foreground mt-2">{campaign.description?.slice(0, 60)}...</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {Number(campaign.raised).toLocaleString()} / {Number(campaign.goal).toLocaleString()} ETB
                        </p>
                        <span className="text-xs font-bold text-primary">{Math.round(percent)}%</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;