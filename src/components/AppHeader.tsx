"use client";

import { Bell } from "lucide-react";
import { useI18n, Language } from "@/lib/i18n";
import { useRouter } from "next/navigation";

const langLabels: Record<Language, string> = {
  en: "EN",
  am: "አማ",
  om: "OM",
};

export default function AppHeader({ title }: { title?: string }) {
  const { lang, setLang, t } = useI18n();
  const router = useRouter();
  const langs: Language[] = ["en", "am", "om"];

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-primary/10">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <h1 className="text-lg font-heading font-bold text-foreground truncate">
          {title || t("nav.dashboard")}
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-primary/30 overflow-hidden text-xs">
            {langs.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 font-medium transition-colors ${
                  lang === l
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}>
                {langLabels[l]}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push("/notifications")}
            className="relative p-2 rounded-full hover:bg-secondary transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
