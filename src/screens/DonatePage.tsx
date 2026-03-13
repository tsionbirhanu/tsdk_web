"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { Search, Heart } from "lucide-react";
import React, { useState } from "react";
import PaymentCard from "@/components/PaymentCard";

import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import donateBg from "@/assets/donate-bg.jpg";

const categories = ["all", "education", "health", "building"];

const DonatePage = () => {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, title, title_am, title_om, goal_amount, raised_amount, status, category, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // derive real status: complete if raised >= goal, paused if DB status paused, else active
  const campaignsWithStatus = (campaigns as any[]).map((c) => {
    const goal = Number(c.goal_amount || 0);
    const raised = Number(c.raised_amount || 0);
    let realStatus = c.status || "active";

    if (goal > 0 && raised >= goal) {
      realStatus = "complete";
    }

    if (c.status === "paused") realStatus = "paused";

    return { ...c, realStatus };
  });

  const filtered = campaigns.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.category === filter;
    return matchSearch && matchFilter;
  });

  const categoryLabels: Record<string, string> = {
    all: t("donate.all"), education: t("donate.education"), health: t("donate.health"), building: t("donate.building"),
  };

  const getTitle = (c: typeof campaigns[0]) => {
    if (lang === "am" && c.title_am) return c.title_am;
    if (lang === "om" && c.title_om) return c.title_om;
    return c.title;
  };

  const [showPaymentId, setShowPaymentId] = useState<string | null>(null);

  return (
    <div>
      <AppHeader title={t("donate.title")} />
      <div className="space-y-4 animate-fade-in">
        <div className="relative h-32 overflow-hidden">
          <Image src={donateBg} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-overlay-dark" />
          <div className="relative z-10 flex items-end h-full p-4">
            <h2 className="text-xl font-heading font-bold text-gold-gradient">{t("donate.title")}</h2>
          </div>
        </div>

        <div className="px-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("donate.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  filter === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>

          <div className="space-y-3 pb-2">
            {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Loading campaigns...</p>}
            {!isLoading && filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No campaigns found</p>
            )}
            {filtered.map((campaign) => {
              const c = campaignsWithStatus.find((x: any) => x.id === campaign.id) || campaign;
              const statusLabel = c.realStatus === "complete" ? "Complete" : c.realStatus === "paused" ? "Paused" : "Active";
              const disabled = statusLabel !== "Active";

              return (
                <React.Fragment key={campaign.id}>
                  <div
                    onClick={() => {
                      if (!disabled) router.push(`/donate/${campaign.id}`);
                    }}
                    role="button"
                    tabIndex={0}
                    className={`w-full glass-card rounded-xl p-4 text-left transition-all ${disabled ? "opacity-80 cursor-not-allowed" : "hover:gold-glow active:scale-[0.99]"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-heading font-semibold text-foreground text-sm">{getTitle(campaign)}</h3>
                        {lang !== "en" && <p className="text-xs text-muted-foreground mt-0.5">{campaign.title}</p>}
                        <div className="mt-3">
                          <Progress value={Number(campaign.goal_amount) > 0 ? (Number(campaign.raised_amount) / Number(campaign.goal_amount)) * 100 : 0} className="h-2" />
                          <div className="flex justify-between mt-1.5">
                            <span className="text-xs text-primary font-semibold">
                              {(Number(campaign.raised_amount) / 1000).toFixed(0)}K {t("donate.raised")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(Number(campaign.goal_amount) / 1000).toFixed(0)}K {t("donate.goal")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${statusLabel === "Active" ? "bg-primary/10 text-primary" : statusLabel === "Paused" ? "bg-muted/20 text-muted-foreground" : "bg-success/10 text-success"}`}>
                          {statusLabel}
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!disabled) setShowPaymentId((id) => (id === campaign.id ? null : campaign.id));
                            }}
                            disabled={disabled}
                            className={`px-3 py-1 rounded text-sm ${disabled ? "bg-muted/20 text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                            {disabled ? t("donate.noMoreDonate") || "No more donate" : t("Donate") || "Pay Now"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!disabled) router.push(`/donate/${campaign.id}`);
                            }}
                            className="text-xs text-muted-foreground hover:underline">
                            {t("View Details")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {showPaymentId === campaign.id && (
                    <div className="mt-3">
                      <PaymentCard campaignId={campaign.id} defaultAmount={Number(campaign.goal_amount) > 0 ? Math.min(Number(campaign.goal_amount), 100) : 100} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonatePage;







