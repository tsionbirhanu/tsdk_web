// Utility functions for hierarchical registration system

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const createServiceClient = () =>
  createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// File upload helpers
export interface UploadFileOptions {
  file: File;
  userId: string;
  folder: string;
  fileType: "id_front" | "id_back" | "selfie" | "approval_letter";
}

export async function uploadFileToStorage(
  options: UploadFileOptions,
): Promise<string | null> {
  try {
    const supabase = createServiceClient();

    // File validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (options.file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    if (!allowedTypes.includes(options.file.type)) {
      throw new Error("Invalid file type. Only JPG, PNG, and PDF allowed");
    }

    // Create storage path
    const fileExtension = options.file.name.split(".").pop();
    const storagePath = `${options.folder}/${options.userId}/${Date.now()}-${options.fileType}.${fileExtension}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from("registrations")
      .upload(storagePath, options.file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("registrations")
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("File upload error:", error);
    return null;
  }
}

// Authentication verification
export async function verifyUserRole(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  requiredRole: string,
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", requiredRole)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// Get user profile
export async function getUserProfile(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
) {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    return data;
  } catch {
    return null;
  }
}

// Create approval history entry
export async function logApprovalHistory(
  supabase: ReturnType<typeof createServiceClient>,
  registrationType: "teklay" | "hagere" | "church" | "member",
  registrationId: string,
  approverId: string | null,
  action: "submitted" | "approved" | "rejected" | "resubmitted",
  reason?: string,
) {
  try {
    await supabase.from("approval_history").insert({
      registration_type: registrationType,
      registration_id: registrationId,
      approver_id: approverId,
      action,
      reason,
    });
  } catch (error) {
    console.error("Failed to log approval history:", error);
  }
}

// Send notification email (stub - implement with your email service)
export async function sendNotificationEmail(
  recipientEmail: string,
  subject: string,
  templateType:
    | "teklay_registered"
    | "teklay_approved"
    | "teklay_rejected"
    | "hagere_registered"
    | "hagere_approved"
    | "hagere_rejected"
    | "church_registered"
    | "church_approved"
    | "church_rejected"
    | "member_registered"
    | "member_approved"
    | "member_rejected"
    | "member_resubmitted",
  data: Record<string, any>,
): Promise<boolean> {
  try {
    // TODO: Implement email sending with your email service (SendGrid, Resend, etc.)
    console.log(
      `Email sent: ${recipientEmail} - ${templateType} - ${subject}`,
      data,
    );
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

// Parse FormData to extract files
export async function parseMultipartFormData(
  request: Request,
): Promise<Map<string, File | string>> {
  const formData = await request.formData();
  const result = new Map<string, File | string>();

  for (const [key, value] of formData.entries()) {
    result.set(key, value);
  }

  return result;
}

// Error response helper
export function errorResponse(
  message: string,
  status: number = 400,
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// Success response helper
export function successResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
