"use client";

import AppHeader from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { Bell, CreditCard, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const NotificationsPage = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div>
      {/* <AppHeader title={t("nav.notifications")} /> */}
      <div className="px-4 py-4 space-y-2 animate-fade-in">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
        {!isLoading && notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {lang === "am" ? "áˆáŠ•áˆ áˆ›áˆ³á‹ˆá‰‚á‹« á‹¨áˆˆáˆ" : "No notifications yet"}
            </p>
          </div>
        )}
        {notifications.map((n: any) => (
          <div
            key={n.id}
            onClick={() => !n.read && markRead.mutate(n.id)}
            className={`rounded-xl p-4 flex items-start gap-3 transition-colors cursor-pointer ${
              n.read ? "bg-card/40" : "glass-card border-l-4 border-l-primary"
            }`}
          >
            <div className={`p-2 rounded-lg ${n.read ? "bg-secondary" : "bg-primary/15"}`}>
              <CreditCard className={`w-4 h-4 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
                  {lang === "am" && n.title_am ? n.title_am : n.title}
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {lang === "am" && n.body_am ? n.body_am : n.body}
              </p>
            </div>
            {!n.read && <Check className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-1" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;

