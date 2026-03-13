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
    {
      path: "/ai-chat",
      icon: MessageCircle,
      label: t("nav.aiChat"),
      badge: "AI",
    },
  ];

  const adminNav = [
    { path: "/admin", icon: Shield, label: "Admin Dashboard" },
    { path: "/admin/members", icon: Users, label: "Members" },
    { path: "/admin/campaigns", icon: Heart, label: "Campaigns" },
    { path: "/admin/roles", icon: Shield, label: "Roles" },
    { path: "/admin/reports", icon: BarChart3, label: "Reports" },
    { path: "/admin/church", icon: Building, label: "Church Mgmt" },
    { path: "/admin/events", icon: CalendarDays, label: "Events" },
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
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-4 mb-2">
        {title}
      </p>
      {items.map((item) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all text-sm ${
              isActive
                ? "bg-primary text-primary-foreground gold-glow"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium truncate">{item.label}</span>
            {"badge" in item && item.badge && (
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-card border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-border">
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
            <h1 className="font-heading font-bold text-foreground">Tsedk</h1>
            <p className="text-[10px] text-muted-foreground">Member Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation - role-based */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {isAdmin && renderNavSection("Administration", adminNav)}
        {isTreasurer && !isAdmin && renderNavSection("Treasury", treasurerNav)}
        {isAdmin && renderNavSection("Treasury", treasurerNav)}
        {!isAdmin && !isTreasurer && renderNavSection("Member", memberNav)}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-1">
        <Link
          href="/notifications"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
            pathname === "/notifications"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}>
          <Bell className="w-4 h-4" />
          <span className="font-medium">{t("nav.notifications")}</span>
        </Link>
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
            pathname === "/profile"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}>
          <User className="w-4 h-4" />
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
