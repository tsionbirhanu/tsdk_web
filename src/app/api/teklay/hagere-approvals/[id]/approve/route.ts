// PUT /api/teklay/hagere-approvals/[id]/approve
// Teklay approves a Hagere registration

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

    // Verify user is Teklay
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data: teklayRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "teklay_bete_khnet")
      .single();

    if (!teklayRole) {
      return errorResponse("Only Teklay can approve", 403);
    }

    // Get Teklay profile
    const teklayProfile = await getUserProfile(supabase, user.id);
    if (!teklayProfile) {
      return errorResponse("Teklay profile not found");
    }

    // Get hagere registration
    const { data: hagereReg, error: regError } = await supabase
      .from("hagere_registrations")
      .select("*")
      .eq("id", params.id)
      .eq("parent_teklay_id", teklayProfile.id)
      .single();

    if (regError || !hagereReg) {
      return errorResponse("Registration not found");
    }

    // Update registration status
    const { error: updateError } = await supabase
      .from("hagere_registrations")
      .update({
        status: "approved",
        approved_by: teklayProfile.id,
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
        approver_id: teklayProfile.id,
        approved_at: new Date().toISOString(),
      })
      .eq("user_id", hagereReg.user_id);

    // Log approval history
    await logApprovalHistory(
      supabase,
      "hagere",
      hagereReg.id,
      teklayProfile.id,
      "approved",
    );

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(
      hagereReg.user_id,
    );

    if (userData.user?.email) {
      await sendNotificationEmail(
        userData.user.email,
        "Hagere Registration Approved",
        "hagere_approved",
        {
          name: userData.user.user_metadata?.full_name || "Hagere",
          region: hagereReg.region_name,
        },
      );
    }

    return successResponse({
      success: true,
      message: "Hagere approved successfully",
    });
  } catch (error) {
    console.error("Approve Hagere error:", error);
    return errorResponse("Internal server error", 500);
  }
}
