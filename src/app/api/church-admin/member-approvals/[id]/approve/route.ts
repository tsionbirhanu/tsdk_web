// PUT /api/church-admin/member-approvals/[id]/approve
// Church Admin approves a member registration

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

    // Verify user is Church Admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data: churchAdminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "church_admin")
      .single();

    if (!churchAdminRole) {
      return errorResponse("Only Church Admin can approve", 403);
    }

    // Get church admin profile
    const adminProfile = await getUserProfile(supabase, user.id);
    if (!adminProfile) {
      return errorResponse("Admin profile not found");
    }

    // Get church for this admin
    const { data: church } = await supabase
      .from("churches")
      .select("id")
      .eq("admin_user_id", user.id)
      .single();

    if (!church) {
      return errorResponse("Church not found");
    }

    // Get member registration
    const { data: memberReg, error: regError } = await supabase
      .from("member_registrations")
      .select("*")
      .eq("id", params.id)
      .eq("church_id", church.id)
      .single();

    if (regError || !memberReg) {
      return errorResponse("Member registration not found");
    }

    // Update member registration status
    const { error: updateError } = await supabase
      .from("member_registrations")
      .update({
        status: "approved",
        approved_by: adminProfile.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) {
      return errorResponse("Failed to approve member");
    }

    // Update profile approval status
    await supabase
      .from("profiles")
      .update({
        approval_status: "approved",
        approver_id: adminProfile.id,
        approved_at: new Date().toISOString(),
      })
      .eq("user_id", memberReg.user_id);

    // Log approval history
    await logApprovalHistory(
      supabase,
      "member",
      memberReg.id,
      adminProfile.id,
      "approved",
    );

    // Get member info
    const { data: userData } = await supabase.auth.admin.getUserById(
      memberReg.user_id,
    );

    if (userData.user?.email) {
      await sendNotificationEmail(
        userData.user.email,
        "Your Registration has been Approved",
        "member_approved",
        {
          name: userData.user.user_metadata?.full_name || "Member",
        },
      );
    }

    return successResponse({
      success: true,
      message: "Member approved successfully",
    });
  } catch (error) {
    console.error("Approve member error:", error);
    return errorResponse("Internal server error", 500);
  }
}
