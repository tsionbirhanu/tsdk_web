"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log(
      "DashboardLayout: loading =",
      loading,
      "user =",
      !!user,
      "profile.role =",
      profile?.role,
    );

    if (loading) {
      return;
    }

    if (!user) {
      console.log("DashboardLayout: No user, redirecting to auth");
      router.replace("/auth");
      return;
    }

    // If at the root /dashboard, redirect based on role
    if (window.location.pathname === "/dashboard") {
      console.log(
        "DashboardLayout: At /dashboard root, checking role for redirect",
      );
      setIsRedirecting(true);

      if (profile?.role === "system_admin" || profile?.role === "admin") {
        console.log(
          "DashboardLayout: Redirecting system_admin to /dashboard/admin",
        );
        router.replace("/dashboard/admin");
      } else if (profile?.role === "teklay_bete_khnet") {
        console.log(
          "DashboardLayout: Redirecting teklay_bete_khnet to /dashboard/teklay-bete-khnet",
        );
        router.replace("/dashboard/teklay-bete-khnet");
      } else if (profile?.role === "hagere_sebket") {
        console.log(
          "DashboardLayout: Redirecting hagere_sebket to /dashboard/hagere-sebket",
        );
        router.replace("/dashboard/hagere-sebket");
      } else if (profile?.role === "church_admin") {
        console.log(
          "DashboardLayout: Redirecting church_admin to /dashboard/church-admin",
        );
        router.replace("/dashboard/church-admin");
      } else if (profile?.role === "treasurer") {
        console.log(
          "DashboardLayout: Redirecting treasurer to /dashboard/treasurer",
        );
        router.replace("/dashboard/treasurer");
      } else {
        console.log(
          "DashboardLayout: No role match, redirecting to /dashboard/member",
        );
        router.replace("/dashboard/member");
      }
      return;
    }

    // Otherwise allow render for other dashboard pages
    console.log("DashboardLayout: At specific dashboard page, allowing render");
    setIsRedirecting(false);
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isEthiopianTheme =
    profile?.role === "admin" ||
    profile?.role === "treasurer" ||
    profile?.role === "member";

  return (
    <div
      className={`min-h-screen bg-background flex ${isEthiopianTheme ? "ethiopian-theme" : ""}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col ml-60">
        <TopHeader />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
