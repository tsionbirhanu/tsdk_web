"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface ApprovalActionModalProps {
  isOpen: boolean;
  action: "approve" | "reject";
  itemName: string;
  onConfirm: (reason?: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ApprovalActionModal({
  isOpen,
  action,
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
}: ApprovalActionModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isApprove = action === "approve";
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(isApprove ? undefined : reason);
    } finally {
      setIsSubmitting(false);
      setReason("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {isApprove ? "Approve Registration" : "Reject Registration"}
          </h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            {isApprove ? (
              <>
                Are you sure you want to{" "}
                <span className="font-semibold">approve</span> the registration
                of{" "}
                <span className="font-semibold text-green-600">{itemName}</span>
                ?
              </>
            ) : (
              <>
                Are you sure you want to{" "}
                <span className="font-semibold">reject</span> the registration
                of{" "}
                <span className="font-semibold text-red-600">{itemName}</span>?
              </>
            )}
          </p>

          {!isApprove && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for rejection (will be visible to applicant)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                rows={4}
              />
              {!reason && (
                <p className="text-xs text-red-600 mt-1">
                  Reason is required for rejection
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting || isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting || isLoading || (!isApprove && !reason.trim())
            }
            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
              isApprove
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}>
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : isApprove ? (
              "Approve"
            ) : (
              "Reject"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
