// PUT /api/hagere/church-approvals/[id]/reject
// Hagere rejects a Church registration

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

    // Verify user is Hagere
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data: hagereRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "hagere_sebket")
      .single();

    if (!hagereRole) {
      return errorResponse("Only Hagere can reject", 403);
    }

    // Get Hagere profile
    const hagereProfile = await getUserProfile(supabase, user.id);
    if (!hagereProfile) {
      return errorResponse("Hagere profile not found");
    }

    // Parse request body
    const body = await req.json();
    const reason = body.reason || "Documents do not meet requirements";

    // Get church registration
    const { data: churchReg, error: regError } = await supabase
      .from("church_registrations")
      .select("*")
      .eq("id", params.id)
      .eq("parent_hagere_id", hagereProfile.id)
      .single();

    if (regError || !churchReg) {
      return errorResponse("Church registration not found");
    }

    // Update church registration status
    const { error: updateError } = await supabase
      .from("church_registrations")
      .update({
        status: "rejected",
        rejection_reason: reason,
        approved_by: hagereProfile.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) {
      return errorResponse("Failed to reject registration");
    }

    // Update admin profile with rejection status
    await supabase
      .from("profiles")
      .update({
        approval_status: "rejected",
        rejection_reason: reason,
        approver_id: hagereProfile.id,
      })
      .eq("user_id", churchReg.admin_user_id);

    // Log approval history
    await logApprovalHistory(
      supabase,
      "church",
      churchReg.id,
      hagereProfile.id,
      "rejected",
      reason,
    );

    // Send notification email
    await sendNotificationEmail(
      churchReg.admin_email,
      "Church Registration Rejected",
      "church_rejected",
      {
        churchName: churchReg.church_name,
        adminName: churchReg.admin_name,
        reason,
      },
    );

    return successResponse({
      success: true,
      message: "Church registration rejected successfully",
    });
  } catch (error) {
    console.error("Reject Church error:", error);
    return errorResponse("Internal server error", 500);
  }
}
