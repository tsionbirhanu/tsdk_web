"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState as useStateDialog } from "react";

interface MemberRegistration {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  church_id: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  id_front_url: string;
  id_back_url: string;
  selfie_url: string;
  rejection_reason?: string;
}

export function MemberApprovalTable() {
  const { t } = useI18n();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [selectedMember, setSelectedMember] =
    useStateDialog<MemberRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch member approvals
  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ["member-approvals", page, statusFilter],
    queryFn: async () => {
      const statusParam = statusFilter === "all" ? "pending" : statusFilter;
      const response = await fetch(
        `/api/church-admin/member-approvals?limit=10&offset=${(page - 1) * 10}&status=${statusParam}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch approvals");
      return response.json();
    },
    enabled: !!session?.access_token,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await fetch(
        `/api/church-admin/member-approvals/${registrationId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approved_by: user?.id,
          }),
        },
      );

      if (!response.ok) throw new Error("Approval failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-approvals"] });
      toast.success("Member approved successfully");
      setSelectedMember(null);
    },
    onError: () => {
      toast.error("Failed to approve member");
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await fetch(
        `/api/church-admin/member-approvals/${registrationId}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: rejectReason,
            approved_by: user?.id,
          }),
        },
      );

      if (!response.ok) throw new Error("Rejection failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-approvals"] });
      toast.success("Member application rejected");
      setSelectedMember(null);
      setRejectReason("");
    },
    onError: () => {
      toast.error("Failed to reject member");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const registrations = approvalsData?.registrations || [];
  const total = approvalsData?.total || 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {["pending", "approved", "rejected", "all"].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => {
              setStatusFilter(status as any);
              setPage(1);
            }}
            className="capitalize">
            {status}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Phone</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Submitted</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No registrations found
                </td>
              </tr>
            ) : (
              registrations.map((member: MemberRegistration) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{member.full_name}</td>
                  <td className="px-4 py-3 text-sm">{member.email}</td>
                  <td className="px-4 py-3 text-sm">{member.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        member.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : member.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(member.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMember(member)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {member.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveMutation.mutate(member.id)}
                          disabled={approveMutation.isPending}>
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setSelectedMember(member)}
                          disabled={rejectMutation.isPending}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-600">
          Page {page} of {totalPages} ({total} total)
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Document viewer and action modal */}
      {selectedMember && (
        <DocumentViewerModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onApprove={() => approveMutation.mutate(selectedMember.id)}
          onReject={(reason) => {
            setRejectReason(reason);
            rejectMutation.mutate(selectedMember.id);
          }}
          approving={approveMutation.isPending}
          rejecting={rejectMutation.isPending}
          showRejectForm={selectedMember.status === "pending"}
        />
      )}
    </div>
  );
}

function DocumentViewerModal({
  member,
  onClose,
  onApprove,
  onReject,
  approving,
  rejecting,
  showRejectForm,
}: {
  member: MemberRegistration;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  approving: boolean;
  rejecting: boolean;
  showRejectForm: boolean;
}) {
  const [rejectReason, setRejectReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{member.full_name}</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Member Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold">{member.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-semibold">{member.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold capitalize">{member.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="font-semibold">
                {new Date(member.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="font-semibold">Documents</h3>

            {member.id_front_url && (
              <div>
                <p className="text-sm text-gray-600 mb-2">ID Front</p>
                <img
                  src={member.id_front_url}
                  alt="ID Front"
                  className="max-w-full h-auto border rounded-lg"
                />
              </div>
            )}

            {member.id_back_url && (
              <div>
                <p className="text-sm text-gray-600 mb-2">ID Back</p>
                <img
                  src={member.id_back_url}
                  alt="ID Back"
                  className="max-w-full h-auto border rounded-lg"
                />
              </div>
            )}

            {member.selfie_url && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Selfie</p>
                <img
                  src={member.selfie_url}
                  alt="Selfie"
                  className="max-w-full h-auto border rounded-lg"
                />
              </div>
            )}
          </div>

          {member.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-900">
                Previous Rejection Reason
              </p>
              <p className="text-red-800">{member.rejection_reason}</p>
            </div>
          )}

          {/* Actions */}
          {showRejectForm && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Rejection Reason (if rejecting)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this application is being rejected..."
                  className="w-full border rounded-lg p-3 text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={onApprove}
                  disabled={approving || rejecting}
                  className="flex-1 bg-green-600 hover:bg-green-700">
                  {approving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve"
                  )}
                </Button>
                <Button
                  onClick={() => onReject(rejectReason)}
                  disabled={rejecting || !rejectReason.trim()}
                  variant="destructive"
                  className="flex-1">
                  {rejecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    "Reject"
                  )}
                </Button>
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}

          {!showRejectForm && (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
