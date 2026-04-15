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
import { MapPin, CheckCircle2, Clock, XCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HagereRegistration {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredDate: string;
  status: "pending" | "approved" | "rejected";
  leaderName: string;
  district: string;
  documents: {
    letterOfAuthorization?: string;
    registrationCertificate?: string;
  };
  rejectionReason?: string;
}

export default function TeklayAdminDashboard() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedHagere, setSelectedHagere] =
    useState<HagereRegistration | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [showApprovalAction, setShowApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [showRegisterHagere, setShowRegisterHagere] = useState(false);
  const [documentType, setDocumentType] = useState<
    "letterOfAuthorization" | "registrationCertificate"
  >("letterOfAuthorization");

  // Check authorization
  useEffect(() => {
    if (!loading && profile?.role !== "teklay_bete_khnet") {
      router.push("/");
    }
  }, [loading, profile?.role, router]);

  // Fetch Hagere needing approval
  const { data: hageres = [], isLoading: hageresLoading } = useQuery({
    queryKey: ["teklay-admin-hageres", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const response = await fetch("/api/teklay-admin/hageres", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Hageres");
      }

      return response.json();
    },
    enabled: !!session?.access_token,
  });

  // Fetch activity timeline
  const { data: activities = [] } = useQuery({
    queryKey: ["teklay-admin-activity", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const response = await fetch("/api/teklay-admin/activity", {
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
    total: hageres.length,
    pending: hageres.filter((h: HagereRegistration) => h.status === "pending")
      .length,
    approved: hageres.filter((h: HagereRegistration) => h.status === "approved")
      .length,
    rejected: hageres.filter((h: HagereRegistration) => h.status === "rejected")
      .length,
  };

  // Approve Hagere mutation
  const approveMutation = useMutation({
    mutationFn: async (hagereId: string) => {
      const response = await fetch(
        `/api/teklay-admin/hageres/${hagereId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to approve Hagere");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teklay-admin-hageres"] });
      queryClient.invalidateQueries({ queryKey: ["teklay-admin-activity"] });
      toast({
        title: "Success",
        description: "Hagere approved successfully",
      });
      setShowApprovalAction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve Hagere",
        variant: "destructive",
      });
    },
  });

  // Reject Hagere mutation
  const rejectMutation = useMutation({
    mutationFn: async ({
      hagereId,
      reason,
    }: {
      hagereId: string;
      reason: string;
    }) => {
      const response = await fetch(
        `/api/teklay-admin/hageres/${hagereId}/reject`,
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
        throw new Error("Failed to reject Hagere");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teklay-admin-hageres"] });
      queryClient.invalidateQueries({ queryKey: ["teklay-admin-activity"] });
      toast({
        title: "Success",
        description: "Hagere rejected",
      });
      setShowApprovalAction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject Hagere",
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
              Teklay Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Approve and manage district-level administrators
            </p>
          </div>
          <button
            onClick={() => setShowRegisterHagere(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors">
            <Plus className="w-4 h-4" />
            Register Hagere
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={MapPin}
            label="Total Hageres"
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
          {/* Hageres Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Hagere Registrations
              </h2>
              {hageres.length === 0 ? (
                <EmptyState
                  icon={MapPin}
                  title="No Hageres"
                  description="No district registrations to review yet"
                  ctaText="Register a Hagere"
                  onCTA={() => setShowRegisterHagere(true)}
                />
              ) : (
                <ApprovalTable
                  items={hageres}
                  columns={[
                    { key: "name", label: "Hagere Name" },
                    { key: "leaderName", label: "Leader" },
                    { key: "email", label: "Email" },
                    { key: "district", label: "District" },
                    {
                      key: "registeredDate",
                      label: "Registered",
                      render: (value) => new Date(value).toLocaleDateString(),
                    },
                  ]}
                  isLoading={hageresLoading}
                  onView={(hagere) => {
                    setSelectedHagere(hagere);
                    setShowDocumentPreview(true);
                  }}
                  onApprove={(hagere) => {
                    setSelectedHagere(hagere);
                    setShowApprovalAction("approve");
                  }}
                  onReject={(hagere) => {
                    setSelectedHagere(hagere);
                    setShowApprovalAction("reject");
                  }}
                  emptyMessage="All Hageres have been reviewed"
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
      {selectedHagere && (
        <>
          <DocumentPreviewModal
            isOpen={showDocumentPreview}
            onClose={() => {
              setShowDocumentPreview(false);
              setSelectedHagere(null);
            }}
            documents={selectedHagere.documents}
            memberName={selectedHagere.name}
            currentDocument={documentType as any}
            onDocumentChange={setDocumentType as any}
          />

          <ApprovalActionModal
            isOpen={showApprovalAction !== null}
            actionType={showApprovalAction}
            memberName={selectedHagere.name}
            isLoading={approveMutation.isPending || rejectMutation.isPending}
            onClose={() => {
              setShowApprovalAction(null);
              setSelectedHagere(null);
            }}
            onConfirm={async (reason) => {
              if (showApprovalAction === "approve") {
                await approveMutation.mutateAsync(selectedHagere.id);
              } else if (showApprovalAction === "reject" && reason) {
                await rejectMutation.mutateAsync({
                  hagereId: selectedHagere.id,
                  reason,
                });
              }
            }}
          />
        </>
      )}

      {/* Register Hagere Modal Placeholder */}
      {showRegisterHagere && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Register Hagere</h2>
            <p className="text-gray-600 mb-6">
              Hagere registration form would go here
            </p>
            <button
              onClick={() => setShowRegisterHagere(false)}
              className="w-full px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
