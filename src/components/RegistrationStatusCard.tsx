"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function RegistrationStatusCard() {
  const { approval_status, profile } = useAuth();
  const router = useRouter();
  const [showResubmitForm, setShowResubmitForm] = useState(false);

  if (approval_status === "approved") {
    return null; // Show nothing if approved
  }

  if (approval_status === "pending") {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
        <div className="flex items-start">
          <Clock className="w-6 h-6 text-blue-600 mr-4 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Registration Pending Approval
            </h3>
            <p className="text-blue-800 mb-4">
              Your registration is currently being reviewed by your church
              administrator. You will receive an email notification once your
              registration is approved.
            </p>
            <div className="bg-blue-100 rounded-md p-3 text-sm text-blue-900">
              <p>
                <strong>Status:</strong> Awaiting church approval
              </p>
              <p className="text-xs text-blue-700 mt-1">
                You can access limited features. Full dashboard access will be
                granted after approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (approval_status === "rejected") {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-red-600 mr-4 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Registration Rejected
            </h3>
            {profile?.rejection_reason && (
              <p className="text-red-800 mb-4">
                <strong>Reason:</strong> {profile.rejection_reason}
              </p>
            )}
            <p className="text-red-800 mb-4">
              Please review the reason above and resubmit your documents with
              corrections.
            </p>
            <Button
              onClick={() => setShowResubmitForm(!showResubmitForm)}
              className="bg-red-600 hover:bg-red-700">
              Resubmit Documents
            </Button>

            {showResubmitForm && (
              <ResubmitForm onSuccess={() => setShowResubmitForm(false)} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function ResubmitForm({ onSuccess }: { onSuccess: () => void }) {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{
    idFront: File | null;
    idBack: File | null;
    selfie: File | null;
  }>({
    idFront: null,
    idBack: null,
    selfie: null,
  });

  if (!profile?.id) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.idFront || !files.idBack || !files.selfie) {
      alert("Please upload all required documents");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("id_front_file", files.idFront);
      formData.append("id_back_file", files.idBack);
      formData.append("selfie_file", files.selfie);

      // Note: This assumes there's a member_registrations table entry ID
      // You may need to adjust this based on your actual data structure
      const response = await fetch(
        `/api/church-admin/member-approvals/${profile.id}/resubmit`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (response.ok) {
        alert("Documents resubmitted successfully!");
        onSuccess();
      } else {
        alert("Failed to resubmit documents");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 bg-white p-4 rounded-lg">
      <div>
        <label className="block text-sm font-medium mb-2">ID Front</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) =>
            setFiles({ ...files, idFront: e.target.files?.[0] || null })
          }
          required
          className="block w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">ID Back</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) =>
            setFiles({ ...files, idBack: e.target.files?.[0] || null })
          }
          required
          className="block w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Selfie</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFiles({ ...files, selfie: e.target.files?.[0] || null })
          }
          required
          className="block w-full"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Submitting..." : "Submit"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
          disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
