// "use client";

// import { Bell, Search } from "lucide-react";
// import { useI18n, Language } from "@/lib/i18n";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/hooks/useAuth";

// const langLabels: Record<Language, string> = {
//   en: "English",
//   am: "አማርኛ",
//   om: "Oromiffa",
// };

// export default function TopHeader() {
//   const { lang, setLang, t } = useI18n();
//   const router = useRouter();
//   const { user, roles } = useAuth();
//   const langs: Language[] = ["en", "am", "om"];

//   const displayName =
//     user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
//   const initials = displayName.slice(0, 2).toUpperCase();
//   const roleLabel = roles.includes("admin")
//     ? "Admin"
//     : roles.includes("treasurer")
//       ? "Treasurer"
//       : "Member";

//   return (
//     <header className="sticky top-0 z-40 bg-white backdrop-blur-md border-b border-border">
//       <div className="flex items-center justify-between px-6 py-3">
//         {!roles.includes("admin") && (
//           <div className="flex-1 max-w-sm">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//               <input
//                 type="text"
//                 placeholder={t("common.search")}
//                 className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
//               />
//             </div>
//           </div>
//         )}
//         <div className="flex items-center gap-3">
//           <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-medium">
//             {roleLabel}
//           </span>
//           <select
//             value={lang}
//             onChange={(e) => setLang(e.target.value as Language)}
//             className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none">
//             {langs.map((l) => (
//               <option key={l} value={l}>
//                 {langLabels[l]}
//               </option>
//             ))}
//           </select>
//           <button
//             onClick={() => router.push("/notifications")}
//             className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
//             <Bell className="w-4 h-4 text-foreground" />
//             <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
//           </button>
//           <button
//             onClick={() => router.push("/profile")}
//             className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors">
//             <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
//               <span className="text-xs font-semibold text-primary">
//                 {initials}
//               </span>
//             </div>
//             <span className="text-sm font-medium text-foreground hidden lg:block">
//               {displayName}
//             </span>
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// }


"use client";

import { Bell, Search } from "lucide-react";
import { useI18n, Language } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const langLabels: Record<Language, string> = {
  en: "English",
  am: "አማርኛ",
  om: "Oromiffa",
};

export default function TopHeader() {
  const { lang, setLang, t } = useI18n();
  const router = useRouter();
  const { user, roles } = useAuth();
  const langs: Language[] = ["en", "am", "om"];

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = roles.includes("admin")
    ? "Admin"
    : roles.includes("treasurer")
    ? "Treasurer"
    : "Member";

  // Dynamic greeting based on the time of day
  const currentHour = new Date().getHours();
  let greeting = "Hello";
  if (currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour < 18) {
    greeting = "Good Afternoon";
  } else {
    greeting = "Good Evening";
  }

  return (
    <header className="sticky top-0 z-40 bg-white backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Greeting Section - on the left side */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            {greeting}, {displayName}
          </h1>
        </div>

        {/* Right side - Search, Language Selector, Notifications, Profile */}
        <div className="flex items-center gap-3">
          {/* Search bar (only for non-admins) */}
          {!roles.includes("admin") && (
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("common.search")}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          )}

          {/* Role badge */}
          <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-medium">
            {roleLabel}
          </span>

          {/* Language selector */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none"
          >
            {langs.map((l) => (
              <option key={l} value={l}>
                {langLabels[l]}
              </option>
            ))}
          </select>

          {/* Notifications */}
          <button
            onClick={() => router.push("/notifications")}
            className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Bell className="w-4 h-4 text-foreground" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
          </button>

          {/* Profile */}
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">{initials}</span>
            </div>
            <span className="text-sm font-medium text-foreground hidden lg:block">
              {displayName}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}