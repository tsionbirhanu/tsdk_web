// PUT /api/admin/teklay-approvals/[id]/approve
// System Admin approves a Teklay registration

import { NextRequest } from "next/server";
import {
  createServiceClient,
  logApprovalHistory,
  sendNotificationEmail,
  errorResponse,
  successResponse,
  getUserProfile,
} from "../../hierarchical-registration/utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return errorResponse("Unauthorized", 401);
    }

    const supabase = createServiceClient();

    // Verify user is System Admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return errorResponse("Only System Admin can approve", 403);
    }

    // Get admin profile
    const adminProfile = await getUserProfile(supabase, user.id);
    if (!adminProfile) {
      return errorResponse("Admin profile not found");
    }

    // Get teklay registration
    const { data: tekLayReg, error: regError } = await supabase
      .from("teklay_registrations")
      .select("*")
      .eq("id", params.id)
      .single();

    if (regError || !tekLayReg) {
      return errorResponse("Registration not found");
    }

    // Update registration status
    const { error: updateError } = await supabase
      .from("teklay_registrations")
      .update({
        status: "approved",
        approved_by: adminProfile.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) {
      return errorResponse("Failed to approve registration");
    }

    // Update profile approval status
    await supabase
      .from("profiles")
      .update({
        approval_status: "approved",
        approver_id: adminProfile.id,
        approved_at: new Date().toISOString(),
      })
      .eq("user_id", tekLayReg.user_id);

    // Log approval history
    await logApprovalHistory(
      supabase,
      "teklay",
      tekLayReg.id,
      adminProfile.id,
      "approved",
    );

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(
      tekLayReg.user_id,
    );

    if (userData.user?.email) {
      await sendNotificationEmail(
        userData.user.email,
        "Teklay Registration Approved",
        "teklay_approved",
        {
          name: userData.user.user_metadata?.full_name || "Teklay",
        },
      );
    }

    return successResponse({
      success: true,
      message: "Teklay approved successfully",
    });
  } catch (error) {
    console.error("Approve Teklay error:", error);
    return errorResponse("Internal server error", 500);
  }
}
