"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import { MemberApprovalTable } from "@/components/MemberApprovalTable";

export default function MemberApprovalsPage() {
  const { user, loading, roles } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !roles.includes("church_admin"))) {
      router.push("/dashboard");
    }
  }, [user, loading, roles, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!roles.includes("church_admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">
          Access denied. Church Admin privileges required.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Member Approval Management
          </h1>
          <p className="text-gray-600">
            Review and approve/reject member registration applications
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <MemberApprovalTable />
        </div>
      </div>
    </div>
  );
}
