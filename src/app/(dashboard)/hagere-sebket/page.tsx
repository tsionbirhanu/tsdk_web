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
import { Building2, CheckCircle2, Clock, XCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChurchRegistration {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredDate: string;
  status: "pending" | "approved" | "rejected";
  leaderName: string;
  documents: {
    letterOfIntroduction?: string;
    churchCertificate?: string;
  };
  rejectionReason?: string;
}

export default function HagereAdminDashboard() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedChurch, setSelectedChurch] =
    useState<ChurchRegistration | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [showApprovalAction, setShowApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [showRegisterChurch, setShowRegisterChurch] = useState(false);
  const [documentType, setDocumentType] = useState<
    "letterOfIntroduction" | "churchCertificate"
  >("letterOfIntroduction");

  // Check authorization
  useEffect(() => {
    if (!loading && profile?.role !== "hagere_sebket") {
      router.push("/");
    }
  }, [loading, profile?.role, router]);

  // Fetch churches needing approval
  const { data: churches = [], isLoading: churchesLoading } = useQuery({
    queryKey: ["hagere-admin-churches", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const response = await fetch("/api/hagere-admin/churches", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch churches");
      }

      return response.json();
    },
    enabled: !!session?.access_token,
  });

  // Fetch activity timeline
  const { data: activities = [] } = useQuery({
    queryKey: ["hagere-admin-activity", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const response = await fetch("/api/hagere-admin/activity", {
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
    total: churches.length,
    pending: churches.filter((c: ChurchRegistration) => c.status === "pending")
      .length,
    approved: churches.filter(
      (c: ChurchRegistration) => c.status === "approved",
    ).length,
    rejected: churches.filter(
      (c: ChurchRegistration) => c.status === "rejected",
    ).length,
  };

  // Approve church mutation
  const approveMutation = useMutation({
    mutationFn: async (churchId: string) => {
      const response = await fetch(
        `/api/hagere-admin/churches/${churchId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to approve church");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hagere-admin-churches"] });
      queryClient.invalidateQueries({ queryKey: ["hagere-admin-activity"] });
      toast({
        title: "Success",
        description: "Church approved successfully",
      });
      setShowApprovalAction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve church",
        variant: "destructive",
      });
    },
  });

  // Reject church mutation
  const rejectMutation = useMutation({
    mutationFn: async ({
      churchId,
      reason,
    }: {
      churchId: string;
      reason: string;
    }) => {
      const response = await fetch(
        `/api/hagere-admin/churches/${churchId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to reject church");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hagere-admin-churches"] });
      queryClient.invalidateQueries({ queryKey: ["hagere-admin-activity"] });
      toast({
        title: "Success",
        description: "Church rejected",
      });
      setShowApprovalAction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject church",
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-amber-900 mb-2">
              Hagere Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Approve churches and manage district-level registrations
            </p>
          </div>
          <button
            onClick={() => setShowRegisterChurch(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors">
            <Plus className="w-4 h-4" />
            Register Church
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={Building2}
            label="Total Churches"
            value={stats.total}
            color="blue"
          />
          <StatsCard
            icon={Clock}
            label="Pending Approvals"
            value={stats.pending}
            color="yellow"
            trend={stats.pending > 0 ? "up" : "down"}
          />
          <StatsCard
            icon={CheckCircle2}
            label="Approved"
            value={stats.approved}
            color="green"
          />
          <StatsCard
            icon={XCircle}
            label="Rejected"
            value={stats.rejected}
            color="red"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Churches Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Church Registrations
              </h2>
              {churches.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No Churches"
                  description="No church registrations to review yet"
                  ctaText="Register a Church"
                  onCTA={() => setShowRegisterChurch(true)}
                />
              ) : (
                <ApprovalTable
                  items={churches}
                  columns={[
                    { key: "name", label: "Church Name" },
                    { key: "leaderName", label: "Leader" },
                    { key: "email", label: "Email" },
                    {
                      key: "registeredDate",
                      label: "Registered",
                      render: (value) => new Date(value).toLocaleDateString(),
                    },
                  ]}
                  isLoading={churchesLoading}
                  onView={(church) => {
                    setSelectedChurch(church);
                    setShowDocumentPreview(true);
                  }}
                  onApprove={(church) => {
                    setSelectedChurch(church);
                    setShowApprovalAction("approve");
                  }}
                  onReject={(church) => {
                    setSelectedChurch(church);
                    setShowApprovalAction("reject");
                  }}
                  emptyMessage="All churches have been reviewed"
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
      {selectedChurch && (
        <>
          <DocumentPreviewModal
            isOpen={showDocumentPreview}
            onClose={() => {
              setShowDocumentPreview(false);
              setSelectedChurch(null);
            }}
            documents={selectedChurch.documents}
            memberName={selectedChurch.name}
            currentDocument={documentType as any}
            onDocumentChange={setDocumentType as any}
          />

          <ApprovalActionModal
            isOpen={showApprovalAction !== null}
            actionType={showApprovalAction}
            memberName={selectedChurch.name}
            isLoading={approveMutation.isPending || rejectMutation.isPending}
            onClose={() => {
              setShowApprovalAction(null);
              setSelectedChurch(null);
            }}
            onConfirm={async (reason) => {
              if (showApprovalAction === "approve") {
                await approveMutation.mutateAsync(selectedChurch.id);
              } else if (showApprovalAction === "reject" && reason) {
                await rejectMutation.mutateAsync({
                  churchId: selectedChurch.id,
                  reason,
                });
              }
            }}
          />
        </>
      )}

      {/* Register Church Modal Placeholder */}
      {showRegisterChurch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Register Church</h2>
            <p className="text-gray-600 mb-6">
              Church registration form would go here
            </p>
            <button
              onClick={() => setShowRegisterChurch(false)}
              className="w-full px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
