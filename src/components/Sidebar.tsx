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
  const { hasRole, signOut, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = hasRole("admin");
  const isTreasurer = hasRole("treasurer");

  const memberNav = [
    { path: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { path: "/donate", icon: Heart, label: t("nav.donate") },
    { path: "/aserat", icon: BookOpen, label: t("nav.aserat") },
    { path: "/selet", icon: Church, label: t("nav.selet") },
    { path: "/gbir", icon: CreditCard, label: t("nav.gbir") },
    { path: "/history", icon: Clock, label: t("nav.history") },
  ];

  const adminNav = [
    { path: "/admin", icon: Shield, label: "Admin Dashboard" },
    { path: "/admin/members", icon: Users, label: "Members" },
    { path: "/admin/campaigns", icon: Heart, label: "Campaigns" },
    { path: "/admin/roles", icon: Shield, label: "Roles" },
    { path: "/admin/reports", icon: BarChart3, label: "Reports" },
    { path: "/admin/church", icon: Building, label: "Church Mgmt" },
    { path: "/admin/events", icon: CalendarDays, label: "Events" },
    {
      path: "/admin/ai",
      icon: MessageCircle,
      label: "AI Assistant",
      badge: "AI",
    },
  ];

  const treasurerNav = [
    { path: "/treasurer", icon: Wallet, label: "Treasurer Dashboard" },
    { path: "/treasurer/campaigns", icon: Heart, label: "Campaigns" },
    { path: "/treasurer/payments", icon: CreditCard, label: "Payments" },
    { path: "/treasurer/transactions", icon: Clock, label: "Transactions" },
    { path: "/treasurer/reports", icon: BarChart3, label: "Reports" },
    {
      path: "/treasurer/ai",
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
            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-gold" : ""}`} />
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
            <p className="text-[10px] text-black">Member Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation - role-based */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {isAdmin && renderNavSection("Administration", adminNav)}
        {isTreasurer && !isAdmin && renderNavSection("Treasury", treasurerNav)}
        {/* {isAdmin && renderNavSection("Treasury", treasurerNav)} */}
        {!isAdmin && !isTreasurer && renderNavSection("Member", memberNav)}
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
          <Bell className={`w-4 h-4 ${pathname === "/notifications" ? "text-gold" : ""}`} />
          <span className="font-medium">{t("nav.notifications")}</span>
        </Link>
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm border-l-4 ${
            pathname === "/profile"
              ? "bg-black/20 text-black border-gold font-semibold"
              : "border-transparent text-black/70 hover:bg-black/10 hover:text-black"
          }`}>
          <User className={`w-4 h-4 ${pathname === "/profile" ? "text-gold" : ""}`} />
          <span className="font-medium">{t("nav.profile")}</span>
        </Link>
        <button
          onClick={async () => {
            await signOut();
            router.push("/auth");
          }}
          className="flex items-center gap-3 px-4 py-2.5 mx-0 rounded-lg transition-all text-sm text-destructive hover:bg-destructive/10 w-full">
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
