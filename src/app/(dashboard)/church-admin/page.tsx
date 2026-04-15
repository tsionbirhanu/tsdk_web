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
import { Users, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  submittedDate: string;
  status: "pending" | "approved" | "rejected";
  documents: {
    idFront?: string;
    idBack?: string;
    selfie?: string;
  };
  rejectionReason?: string;
}

export default function ChurchAdminDashboard() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [showApprovalAction, setShowApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [documentType, setDocumentType] = useState<
    "idFront" | "idBack" | "selfie"
  >("idFront");

  // Check authorization
  useEffect(() => {
    if (!loading && profile?.role !== "church_admin") {
      router.push("/");
    }
  }, [loading, profile?.role, router]);

  // Fetch pending members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["church-admin-members", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const response = await fetch("/api/church-admin/members", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }

      return response.json();
    },
    enabled: !!session?.access_token,
  });

  // Fetch activity timeline
  const { data: activities = [] } = useQuery({
    queryKey: ["church-admin-activity", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const response = await fetch("/api/church-admin/activity", {
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
    total: members.length,
    pending: members.filter((m: Member) => m.status === "pending").length,
    approved: members.filter((m: Member) => m.status === "approved").length,
    rejected: members.filter((m: Member) => m.status === "rejected").length,
  };

  // Approve member mutation
  const approveMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(
        `/api/church-admin/members/${memberId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to approve member");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["church-admin-members"] });
      queryClient.invalidateQueries({ queryKey: ["church-admin-activity"] });
      toast({
        title: "Success",
        description: "Member approved successfully",
      });
      setShowApprovalAction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve member",
        variant: "destructive",
      });
    },
  });

  // Reject member mutation
  const rejectMutation = useMutation({
    mutationFn: async ({
      memberId,
      reason,
    }: {
      memberId: string;
      reason: string;
    }) => {
      const response = await fetch(
        `/api/church-admin/members/${memberId}/reject`,
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
        throw new Error("Failed to reject member");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["church-admin-members"] });
      queryClient.invalidateQueries({ queryKey: ["church-admin-activity"] });
      toast({
        title: "Success",
        description: "Member rejected",
      });
      setShowApprovalAction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject member",
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
            Church Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage and approve member registrations for your church
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={Users}
            label="Total Members"
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
          {/* Members Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Member Approvals
              </h2>
              {members.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Members"
                  description="No member registrations to review yet"
                />
              ) : (
                <ApprovalTable
                  items={members}
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "email", label: "Email" },
                    { key: "phone", label: "Phone" },
                    {
                      key: "submittedDate",
                      label: "Submitted",
                      render: (value) => new Date(value).toLocaleDateString(),
                    },
                  ]}
                  isLoading={membersLoading}
                  onView={(member) => {
                    setSelectedMember(member);
                    setShowDocumentPreview(true);
                  }}
                  onApprove={(member) => {
                    setSelectedMember(member);
                    setShowApprovalAction("approve");
                  }}
                  onReject={(member) => {
                    setSelectedMember(member);
                    setShowApprovalAction("reject");
                  }}
                  emptyMessage="All members have been reviewed"
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
      {selectedMember && (
        <>
          <DocumentPreviewModal
            isOpen={showDocumentPreview}
            onClose={() => {
              setShowDocumentPreview(false);
              setSelectedMember(null);
            }}
            documents={selectedMember.documents}
            memberName={selectedMember.name}
            currentDocument={documentType}
            onDocumentChange={setDocumentType}
          />

          <ApprovalActionModal
            isOpen={showApprovalAction !== null}
            actionType={showApprovalAction}
            memberName={selectedMember.name}
            isLoading={approveMutation.isPending || rejectMutation.isPending}
            onClose={() => {
              setShowApprovalAction(null);
              setSelectedMember(null);
            }}
            onConfirm={async (reason) => {
              if (showApprovalAction === "approve") {
                await approveMutation.mutateAsync(selectedMember.id);
              } else if (showApprovalAction === "reject" && reason) {
                await rejectMutation.mutateAsync({
                  memberId: selectedMember.id,
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
