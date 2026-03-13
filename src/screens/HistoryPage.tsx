"use client";

import AppHeader from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { Download, Heart, BookOpen, Church } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type FilterType = "all" | "donation" | "aserat" | "selet" | "gbir";

const HistoryPage = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: donations = [] } = useQuery({
    queryKey: ["history", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("donations").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: t("history.all") },
    { key: "donation", label: t("history.donations") },
    { key: "aserat", label: t("history.tithes") },
    { key: "selet", label: t("history.vows") },
  ];

  const filtered = filter === "all" ? donations : donations.filter((d: any) => d.type === filter);
  const total = filtered.reduce((s: number, d: any) => s + Number(d.amount), 0);

  const getIcon = (type: string) => {
    if (type === "aserat") return BookOpen;
    if (type === "selet") return Church;
    return Heart;
  };

  return (
    <div>
      <AppHeader title={t("history.title")} />
      <div className="px-4 py-4 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-heading font-bold text-gold-gradient">{total.toLocaleString()} {t("common.birr")}</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                filter === f.key ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-xl divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">{lang === "am" ? "áˆáŠ•áˆ á‰³áˆªáŠ­ á‹¨áˆˆáˆ" : "No history yet"}</div>
          ) : (
            filtered.map((tx: any) => {
              const Icon = getIcon(tx.type);
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3">
                  <div className="p-2 rounded-lg bg-secondary border border-border">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.type}{tx.notes ? ` - ${tx.notes}` : ""}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-primary">-{Number(tx.amount).toLocaleString()} {t("common.birr")}</span>
                    <p className={`text-[10px] ${tx.status === "verified" ? "text-success" : tx.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`}>{tx.status}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;

