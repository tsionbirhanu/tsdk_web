// POST /api/church-admin/member-approvals/[id]/resubmit
// Member resubmits documents after rejection

import { NextRequest } from "next/server";
import {
  createServiceClient,
  uploadFileToStorage,
  logApprovalHistory,
  sendNotificationEmail,
  parseMultipartFormData,
  errorResponse,
  successResponse,
} from "../../hierarchical-registration/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return errorResponse("Unauthorized", 401);
    }

    const supabase = createServiceClient();

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Get member registration
    const { data: memberReg, error: regError } = await supabase
      .from("member_registrations")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .eq("status", "rejected")
      .single();

    if (regError || !memberReg) {
      return errorResponse(
        "Registration not found or not eligible for resubmission",
      );
    }

    // Parse form data
    const formData = await parseMultipartFormData(req);

    const idFrontFile = formData.get("id_front_file") as File;
    const idBackFile = formData.get("id_back_file") as File;
    const selfieFile = formData.get("selfie_file") as File;

    // Validate required files
    if (!idFrontFile || !idBackFile || !selfieFile) {
      return errorResponse("All document files are required");
    }

    // Upload new documents
    const idFrontUrl = await uploadFileToStorage({
      file: idFrontFile,
      userId: user.id,
      folder: "members",
      fileType: "id_front",
    });

    const idBackUrl = await uploadFileToStorage({
      file: idBackFile,
      userId: user.id,
      folder: "members",
      fileType: "id_back",
    });

    const selfieUrl = await uploadFileToStorage({
      file: selfieFile,
      userId: user.id,
      folder: "members",
      fileType: "selfie",
    });

    if (!idFrontUrl || !idBackUrl || !selfieUrl) {
      return errorResponse("Failed to upload documents");
    }

    // Update member registration with new documents
    const { error: updateError } = await supabase
      .from("member_registrations")
      .update({
        national_id_front_url: idFrontUrl,
        national_id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        status: "pending",
        rejection_reason: null,
      })
      .eq("id", params.id);

    if (updateError) {
      return errorResponse("Failed to update registration");
    }

    // Update profile
    await supabase
      .from("profiles")
      .update({
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        approval_status: "pending",
        rejection_reason: null,
      })
      .eq("user_id", user.id);

    // Log approval history
    await logApprovalHistory(
      supabase,
      "member",
      memberReg.id,
      null,
      "resubmitted",
    );

    // Get church admin email
    const { data: church } = await supabase
      .from("churches")
      .select("admin_user_id")
      .eq("id", memberReg.church_id)
      .single();

    if (church) {
      const { data: churchAdmin } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", church.admin_user_id)
        .single();

      if (churchAdmin?.email) {
        await sendNotificationEmail(
          churchAdmin.email,
          "Member Resubmitted Documents for Review",
          "member_resubmitted",
          {
            memberName: memberReg.user_id,
          },
        );
      }
    }

    // Get user email for confirmation
    const { data: userData } = await supabase.auth.admin.getUserById(user.id);

    if (userData.user?.email) {
      await sendNotificationEmail(
        userData.user.email,
        "Documents Resubmitted for Review",
        "member_resubmitted",
        {
          name: userData.user.user_metadata?.full_name || "Member",
        },
      );
    }

    return successResponse({
      success: true,
      message: "Documents resubmitted for approval",
    });
  } catch (error) {
    console.error("Resubmit documents error:", error);
    return errorResponse("Internal server error", 500);
  }
}
