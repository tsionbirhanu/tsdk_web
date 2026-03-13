"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { roles, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !roles.includes("admin")) {
      router.replace("/");
    }
  }, [roles, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!roles.includes("admin")) return null;

  return <>{children}</>;
}
