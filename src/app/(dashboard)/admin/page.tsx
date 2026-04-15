"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ApprovalTable } from "@/components/dashboard/ApprovalTable";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DocumentPreviewModal } from "@/components/dashboard/DocumentPreviewModal";
import { ApprovalActionModal } from "@/components/dashboard/ApprovalActionModal";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import {
  Globe,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeklayRegistration {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredDate: string;
  status: "pending" | "approved" | "rejected";
  leaderName: string;
  region: string;
  documents: {
    letterOfInstitution?: string;
    regionalApprovalCertificate?: string;
  };
  rejectionReason?: string;
}

export default function SystemAdminDashboard() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTeklay, setSelectedTeklay] =
    useState<TeklayRegistration | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [showApprovalAction, setShowApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [documentType, setDocumentType] = useState<
    "letterOfInstitution" | "regionalApprovalCertificate"
  >("letterOfInstitution");

  // Check authorization
  useEffect(() => {
    if (!loading && !["admin", "system_admin"].includes(profile?.role || "")) {
      router.push("/");
    }
  }, [loading, profile?.role, router]);

  // Fetch system-wide stats
  const { data: systemStats = {} } = useQuery({
    queryKey: ["system-admin-stats", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return {};

      const response = await fetch("/api/admin/system-stats", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch system stats");
      }

      return response.json();
    },
    enabled: !!session?.access_token,
  });

  // Fetch Teklay needing approval
  const { data: teklays = [], isLoading: teklaysLoading } = useQuery({
    queryKey: ["system-admin-teklays", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const response = await fetch("/api/admin/teklays", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Teklays");
      }

      return response.json();
    },
    enabled: !!session?.access_token,
  });

  // Fetch activity timeline
  const { data: activities = [] } = useQuery({
    queryKey: ["system-admin-activity", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const response = await fetch("/api/admin/activity", {
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

  // Calculate stats
  const stats = {
    totalTeklays: teklays.length,
    pendingTeklays: teklays.filter(
      (t: TeklayRegistration) => t.status === "pending",
    ).length,
    approvedTeklays: teklays.filter(
      (t: TeklayRegistration) => t.status === "approved",
    ).length,
    rejectedTeklays: teklays.filter(
      (t: TeklayRegistration) => t.status === "rejected",
    ).length,
    totalMembers: systemStats.totalMembers || 0,
    totalChurches: systemStats.totalChurches || 0,
  };

  // Approve Teklay mutation
  const approveMutation = useMutation({
    mutationFn: async (teklayId: string) => {
      const response = await fetch(`/api/admin/teklays/${teklayId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to approve Teklay");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-admin-teklays"] });
      queryClient.invalidateQueries({ queryKey: ["system-admin-activity"] });
      queryClient.invalidateQueries({ queryKey: ["system-admin-stats"] });
      toast({
        title: "Success",
        description: "Teklay approved successfully",
      });
      setShowApprovalAction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve Teklay",
        variant: "destructive",
      });
    },
  });

  // Reject Teklay mutation
  const rejectMutation = useMutation({
    mutationFn: async ({
      teklayId,
      reason,
    }: {
      teklayId: string;
      reason: string;
    }) => {
      const response = await fetch(`/api/admin/teklays/${teklayId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject Teklay");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-admin-teklays"] });
      queryClient.invalidateQueries({ queryKey: ["system-admin-activity"] });
      queryClient.invalidateQueries({ queryKey: ["system-admin-stats"] });
      toast({
        title: "Success",
        description: "Teklay rejected",
      });
      setShowApprovalAction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject Teklay",
        variant: "destructive",
      });
    },
  });

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">
            System Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage regional administrators and system-wide operations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <StatsCard
            icon={Globe}
            label="Total Regions"
            value={stats.totalTeklays}
            color="blue"
          />
          <StatsCard
            icon={Clock}
            label="Pending"
            value={stats.pendingTeklays}
            color="yellow"
            trend={stats.pendingTeklays > 0 ? "up" : "down"}
          />
          <StatsCard
            icon={CheckCircle2}
            label="Approved"
            value={stats.approvedTeklays}
            color="green"
          />
          <StatsCard
            icon={XCircle}
            label="Rejected"
            value={stats.rejectedTeklays}
            color="red"
          />
          <StatsCard
            icon={Building2}
            label="Total Churches"
            value={stats.totalChurches}
            color="purple"
          />
          <StatsCard
            icon={Users}
            label="Total Members"
            value={stats.totalMembers}
            color="indigo"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Teklays Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Regional Administrations
              </h2>
              {teklays.length === 0 ? (
                <EmptyState
                  icon={Globe}
                  title="No Regions"
                  description="No regional registrations to review yet"
                />
              ) : (
                <ApprovalTable
                  items={teklays}
                  columns={[
                    { key: "name", label: "Region" },
                    { key: "leaderName", label: "Leader" },
                    { key: "email", label: "Email" },
                    { key: "region", label: "Area" },
                    {
                      key: "registeredDate",
                      label: "Registered",
                      render: (value) => new Date(value).toLocaleDateString(),
                    },
                  ]}
                  isLoading={teklaysLoading}
                  onView={(teklay) => {
                    setSelectedTeklay(teklay);
                    setShowDocumentPreview(true);
                  }}
                  onApprove={(teklay) => {
                    setSelectedTeklay(teklay);
                    setShowApprovalAction("approve");
                  }}
                  onReject={(teklay) => {
                    setSelectedTeklay(teklay);
                    setShowApprovalAction("reject");
                  }}
                  emptyMessage="All regions have been reviewed"
                />
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Recent Activity
            </h2>
            <ActivityTimeline events={activities} isLoading={false} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedTeklay && (
        <>
          <DocumentPreviewModal
            isOpen={showDocumentPreview}
            onClose={() => {
              setShowDocumentPreview(false);
              setSelectedTeklay(null);
            }}
            documents={selectedTeklay.documents}
            memberName={selectedTeklay.name}
            currentDocument={documentType as any}
            onDocumentChange={setDocumentType as any}
          />

          <ApprovalActionModal
            isOpen={showApprovalAction !== null}
            actionType={showApprovalAction}
            memberName={selectedTeklay.name}
            isLoading={approveMutation.isPending || rejectMutation.isPending}
            onClose={() => {
              setShowApprovalAction(null);
              setSelectedTeklay(null);
            }}
            onConfirm={async (reason) => {
              if (showApprovalAction === "approve") {
                await approveMutation.mutateAsync(selectedTeklay.id);
              } else if (showApprovalAction === "reject" && reason) {
                await rejectMutation.mutateAsync({
                  teklayId: selectedTeklay.id,
                  reason,
                });
              }
            }}
          />
        </>
      )}
    </div>
  );
}
