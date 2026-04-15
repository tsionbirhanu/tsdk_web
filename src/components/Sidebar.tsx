"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Heart,
  Clock,
  User,
  MessageCircle,
  BookOpen,
  Church,
  CreditCard,
  Bell,
  Shield,
  Wallet,
  Users,
  BarChart3,
  Building,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import crossIcon from "@/assets/cross-icon.jpg";

export default function Sidebar() {
  const { t } = useI18n();
  const { hasRole, signOut, user, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Check for new role system
  const isSystemAdmin = hasRole("system_admin") || hasRole("admin");
  const isTeklayAdmin = hasRole("teklay_bete_khnet");
  const isHagereAdmin = hasRole("hagere_sebket");
  const isChurchAdmin = hasRole("church_admin");
  const isTreasurer = hasRole("treasurer");
  const isAnyAdmin =
    isSystemAdmin ||
    isTeklayAdmin ||
    isHagereAdmin ||
    isChurchAdmin ||
    isTreasurer;

  const memberNav = [
    { path: "/dashboard/member", icon: LayoutDashboard, label: "My Dashboard" },
    { path: "/donate", icon: Heart, label: t("nav.donate") },
    { path: "/aserat", icon: BookOpen, label: t("nav.aserat") },
    { path: "/selet", icon: Church, label: t("nav.selet") },
    { path: "/gbir", icon: CreditCard, label: t("nav.gbir") },
    { path: "/history", icon: Clock, label: t("nav.history") },
  ];

  const systemAdminNav = [
    { path: "/dashboard/admin", icon: Shield, label: "System Admin Dashboard" },
    { path: "/dashboard/admin/campaigns", icon: Heart, label: "Campaigns" },
    { path: "/dashboard/admin/reports", icon: BarChart3, label: "Reports" },
    {
      path: "/dashboard/admin/ai",
      icon: MessageCircle,
      label: "AI Assistant",
      badge: "AI",
    },
  ];

  const teklayAdminNav = [
    {
      path: "/dashboard/teklay-bete-khnet",
      icon: Shield,
      label: "Teklay Admin Dashboard",
    },
    {
      path: "/dashboard/teklay-bete-khnet/hageres",
      icon: Building,
      label: "Hagere Registrations",
    },
    {
      path: "/dashboard/teklay-bete-khnet/ai",
      icon: MessageCircle,
      label: "AI Assistant",
      badge: "AI",
    },
  ];

  const hagereAdminNav = [
    {
      path: "/dashboard/hagere-sebket",
      icon: Building,
      label: "Hagere Admin Dashboard",
    },
    {
      path: "/dashboard/hagere-sebket/churches",
      icon: Church,
      label: "Church Registrations",
    },
    {
      path: "/dashboard/hagere-sebket/ai",
      icon: MessageCircle,
      label: "AI Assistant",
      badge: "AI",
    },
  ];

  const churchAdminNav = [
    {
      path: "/dashboard/church-admin",
      icon: Church,
      label: "Church Admin Dashboard",
    },
    {
      path: "/dashboard/church-admin/members",
      icon: Users,
      label: "Member Approvals",
    },
    {
      path: "/dashboard/church-admin/ai",
      icon: MessageCircle,
      label: "AI Assistant",
      badge: "AI",
    },
  ];

  const treasurerNav = [
    {
      path: "/dashboard/treasurer",
      icon: Wallet,
      label: "Treasurer Dashboard",
    },
    { path: "/dashboard/treasurer/campaigns", icon: Heart, label: "Campaigns" },
    {
      path: "/dashboard/treasurer/payments",
      icon: CreditCard,
      label: "Payments",
    },
    { path: "/dashboard/treasurer/reports", icon: BarChart3, label: "Reports" },
    {
      path: "/dashboard/treasurer/ai",
      icon: MessageCircle,
      label: "AI Finance",
      badge: "AI",
    },
  ];

  const renderNavSection = (title: string, items: typeof memberNav) => (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-wider text-black font-semibold px-4 mb-2">
        {title}
      </p>
      {items.map((item) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all text-sm border-l-4 ${
              isActive
                ? "bg-black/20 text-white border-gold font-semibold"
                : "border-transparent text-black hover:bg-black/10 hover:text-white"
            }`}>
            <Icon
              className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-gold" : ""}`}
            />
            <span className="font-medium truncate">{item.label}</span>
            {"badge" in item && item.badge && (
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold">
                {item.badge as string}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#E0C7b7] border-r border-primary/20 flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden gold-glow">
            <Image
              src={crossIcon}
              alt="Church"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-heading font-bold text-black">Tsedk</h1>
            <p className="text-[10px] text-black">
              {isSystemAdmin && "System Admin"}
              {isTeklayAdmin && "Teklay Admin"}
              {isHagereAdmin && "Hagere Admin"}
              {isChurchAdmin && "Church Admin"}
              {isTreasurer && !isAnyAdmin && "Treasurer"}
              {!isAnyAdmin && "Member Portal"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - role-based */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {isSystemAdmin && renderNavSection("Administration", systemAdminNav)}
        {isTeklayAdmin &&
          !isSystemAdmin &&
          renderNavSection("Teklay Admin", teklayAdminNav)}
        {isHagereAdmin &&
          !isSystemAdmin &&
          !isTeklayAdmin &&
          renderNavSection("Hagere Admin", hagereAdminNav)}
        {isChurchAdmin &&
          !isSystemAdmin &&
          !isTeklayAdmin &&
          !isHagereAdmin &&
          renderNavSection("Church Admin", churchAdminNav)}
        {isTreasurer &&
          !isSystemAdmin &&
          !isTeklayAdmin &&
          !isHagereAdmin &&
          !isChurchAdmin &&
          renderNavSection("Treasury", treasurerNav)}
        {!isAnyAdmin && renderNavSection("Member", memberNav)}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <Link
          href="/notifications"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm border-l-4 ${
            pathname === "/notifications"
              ? "bg-black/20 text-black border-gold font-semibold"
              : "border-transparent text-black/70 hover:bg-black/10 hover:text-black"
          }`}>
          <Bell
            className={`w-4 h-4 ${pathname === "/notifications" ? "text-gold" : ""}`}
          />
          <span className="font-medium">{t("nav.notifications")}</span>
        </Link>
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm border-l-4 ${
            pathname === "/profile"
              ? "bg-black/20 text-black border-gold font-semibold"
              : "border-transparent text-black/70 hover:bg-black/10 hover:text-black"
          }`}>
          <User
            className={`w-4 h-4 ${pathname === "/profile" ? "text-gold" : ""}`}
          />
          <span className="font-medium">{t("nav.profile")}</span>
        </Link>
        <button
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className="flex items-center gap-3 px-4 py-2.5 mx-0 rounded-lg transition-all text-sm text-destructive hover:bg-destructive/10 w-full">
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
