// PUT /api/hagere/church-approvals/[id]/approve
// Hagere approves a Church registration

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
      return errorResponse("Only Hagere can approve", 403);
    }

    // Get Hagere profile
    const hagereProfile = await getUserProfile(supabase, user.id);
    if (!hagereProfile) {
      return errorResponse("Hagere profile not found");
    }

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

    // Create actual church record
    const { data: church, error: churchError } = await supabase
      .from("churches")
      .insert({
        church_name: churchReg.church_name,
        location: churchReg.location,
        region: churchReg.region,
        admin_user_id: churchReg.admin_user_id,
        created_by: hagereProfile.id,
        approval_status: "approved",
        approved_by: hagereProfile.id,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (churchError || !church) {
      return errorResponse("Failed to create church record");
    }

    // Update church registration status
    const { error: updateError } = await supabase
      .from("church_registrations")
      .update({
        status: "approved",
        approved_by: hagereProfile.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) {
      return errorResponse("Failed to approve registration");
    }

    // Update admin profile with church_id and approval status
    await supabase
      .from("profiles")
      .update({
        approval_status: "approved",
        approver_id: hagereProfile.id,
        approved_at: new Date().toISOString(),
        church_id: church.id,
      })
      .eq("user_id", churchReg.admin_user_id);

    // Log approval history
    await logApprovalHistory(
      supabase,
      "church",
      churchReg.id,
      hagereProfile.id,
      "approved",
    );

    // Send notification email
    await sendNotificationEmail(
      churchReg.admin_email,
      "Church Registration Approved",
      "church_approved",
      {
        churchName: churchReg.church_name,
        adminName: churchReg.admin_name,
      },
    );

    return successResponse({
      success: true,
      church_id: church.id,
      message: "Church approved successfully",
    });
  } catch (error) {
    console.error("Approve Church error:", error);
    return errorResponse("Internal server error", 500);
  }
}
