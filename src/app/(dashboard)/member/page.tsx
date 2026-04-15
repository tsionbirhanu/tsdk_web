"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { CheckCircle2, Clock, XCircle, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MemberProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationStatus: "pending" | "approved" | "rejected";
  registeredDate: string;
  approvedDate?: string;
  rejectionReason?: string;
  church?: string;
}

export default function MemberDashboard() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const { toast } = useToast();

  // Check authorization
  useEffect(() => {
    if (
      !loading &&
      profile?.role &&
      [
        "admin",
        "system_admin",
        "teklay_bete_khnet",
        "hagere_sebket",
        "church_admin",
        "treasurer",
      ].includes(profile.role)
    ) {
      router.push("/");
    }
  }, [loading, profile?.role, router]);

  // Fetch member profile
  const { data: memberProfile = null, isLoading: profileLoading } = useQuery({
    queryKey: ["member-profile", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return null;

      const response = await fetch("/api/member/profile", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch profile");
      }

      return response.json();
    },
    enabled: !!session?.access_token,
  });

  // Fetch member activity
  const { data: activities = [] } = useQuery({
    queryKey: ["member-activity", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const response = await fetch("/api/member/activity", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activity");
      }

      return response.json();
    },
    enabled: !!session?.access_token,
  });

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!memberProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-amber-900 mb-8">
            Member Dashboard
          </h1>
          <EmptyState
            icon={User}
            title="No Profile Found"
            description="You haven't registered as a member yet"
            ctaText="Register Now"
            onCTA={() => router.push("/auth?mode=register")}
          />
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>Pending Approval</span>
          </div>
        );
      case "approved":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>Approved</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg">
            <XCircle className="w-4 h-4" />
            <span>Rejected</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusStats = () => {
    const baseStats = {
      status: memberProfile.registrationStatus,
    };

    if (memberProfile.registrationStatus === "pending") {
      return { ...baseStats, detail: "Your application is being reviewed" };
    } else if (memberProfile.registrationStatus === "approved") {
      return {
        ...baseStats,
        detail: `Approved on ${new Date(memberProfile.approvedDate).toLocaleDateString()}`,
      };
    } else if (memberProfile.registrationStatus === "rejected") {
      return {
        ...baseStats,
        detail:
          memberProfile.rejectionReason || "Your application was rejected",
      };
    }
  };

  const statusInfo = getStatusStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">
            My Dashboard
          </h1>
          <p className="text-amber-800">
            Welcome, {memberProfile.name}. Track your registration status and
            participate in church activities.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Profile & Status (2 columns) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-md border-l-4 border-amber-700 p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-amber-900 mb-1">
                    Registration Status
                  </h2>
                  <p className="text-amber-700">{memberProfile.email}</p>
                </div>
                {getStatusBadge(memberProfile.registrationStatus)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t-2 border-amber-100">
                <div>
                  <p className="text-sm text-amber-700 font-semibold mb-1">
                    Phone
                  </p>
                  <p className="text-lg font-bold text-amber-900">
                    {memberProfile.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-amber-700 font-semibold mb-1">
                    Church
                  </p>
                  <p className="text-lg font-bold text-amber-900">
                    {memberProfile.church || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-amber-700 font-semibold mb-1">
                    Registered Date
                  </p>
                  <p className="text-lg font-bold text-amber-900">
                    {new Date(
                      memberProfile.registeredDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {statusInfo?.detail && (
                <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-700 rounded-lg">
                  <p className="text-amber-900 font-semibold">
                    {statusInfo.detail}
                  </p>
                </div>
              )}

              {memberProfile.registrationStatus === "rejected" && (
                <button
                  onClick={() => router.push("/auth?mode=resubmit")}
                  className="mt-6 px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-semibold">
                  Resubmit Application
                </button>
              )}
            </div>

            {/* Dashboard Stats */}
            {memberProfile.registrationStatus === "approved" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                  icon={CheckCircle2}
                  label="Status"
                  value="Active"
                  color="green"
                />
                <StatsCard
                  icon={FileText}
                  label="Documents"
                  value="Complete"
                  color="green"
                />
                <StatsCard
                  icon={User}
                  label="Role"
                  value="Member"
                  color="blue"
                />
              </div>
            )}

            {/* Activity Timeline */}
            {activities.length > 0 && (
              <div className="bg-white rounded-xl shadow-md border-l-4 border-amber-700 p-6">
                <h2 className="text-xl font-bold text-amber-900 mb-4">
                  Recent Activity
                </h2>
                <ActivityTimeline events={activities} isLoading={false} />
              </div>
            )}
          </div>

          {/* Right Sidebar: Quick Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-md border-l-4 border-amber-700 p-6">
              <h3 className="text-lg font-bold text-amber-900 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700">Status</p>
                  <p className="text-lg font-bold text-amber-900 capitalize">
                    {memberProfile.registrationStatus}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700">Documents</p>
                  <p className="text-lg font-bold text-amber-900">3/3</p>
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-amber-700 text-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-3">Need Help?</h3>
              <p className="text-sm mb-4 opacity-90">
                Contact your church administrator for assistance with your
                registration.
              </p>
              <button className="w-full px-4 py-2 bg-white text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-semibold text-sm">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
