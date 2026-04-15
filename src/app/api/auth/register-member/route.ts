// POST /api/auth/register-member (PUBLIC - NO AUTH REQUIRED)
// Public self-registration for members

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

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Parse form data
    const formData = await parseMultipartFormData(req);

    const email = formData.get("email") as string;
    const fullName = formData.get("full_name") as string;
    const password = formData.get("password") as string;
    const phone = formData.get("phone") as string;
    const churchId = formData.get("church_id") as string;
    const idFrontFile = formData.get("id_front_file") as File;
    const idBackFile = formData.get("id_back_file") as File;
    const selfieFile = formData.get("selfie_file") as File;

    // Validate required fields
    if (
      !email ||
      !fullName ||
      !password ||
      !phone ||
      !churchId ||
      !idFrontFile ||
      !idBackFile ||
      !selfieFile
    ) {
      return errorResponse("Missing required fields");
    }

    // Validate password strength (at least 8 chars, 1 uppercase, 1 number, 1 special char)
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /\W/.test(password);
    if (password.length < 8 || !hasUppercase || !hasNumber || !hasSpecialChar) {
      return errorResponse(
        "Password must be at least 8 characters with uppercase, number, and special character",
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse("Invalid email format");
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return errorResponse("Email already registered");
    }

    // Verify church exists and is approved
    const { data: church, error: churchError } = await supabase
      .from("churches")
      .select("id, admin_user_id, church_name")
      .eq("id", churchId)
      .eq("approval_status", "approved")
      .single();

    if (churchError || !church) {
      return errorResponse("Invalid or inactive church");
    }

    // Get the church admin's profile ID (not user_id)
    const { data: churchAdminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", church.admin_user_id)
      .single();

    if (profileError || !churchAdminProfile) {
      return errorResponse("Church admin profile not found");
    }

    // Upload documents
    let idFrontUrl = null,
      idBackUrl = null,
      selfieUrl = null;

    try {
      // Upload with temporary user ID (will be updated after user creation)
      const tempUserId = "temp-" + Date.now();

      idFrontUrl = await uploadFileToStorage({
        file: idFrontFile,
        userId: tempUserId,
        folder: "members",
        fileType: "id_front",
      });

      idBackUrl = await uploadFileToStorage({
        file: idBackFile,
        userId: tempUserId,
        folder: "members",
        fileType: "id_back",
      });

      selfieUrl = await uploadFileToStorage({
        file: selfieFile,
        userId: tempUserId,
        folder: "members",
        fileType: "selfie",
      });

      if (!idFrontUrl || !idBackUrl || !selfieUrl) {
        return errorResponse("Failed to upload documents");
      }
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      return errorResponse("Failed to upload documents");
    }

    // Create auth user
    const { data: newAuthUser, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirmed: false,
      });

    if (createError || !newAuthUser.user) {
      return errorResponse("Failed to create user account");
    }

    // Update user profile (created automatically by trigger)
    const { data: profile, error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        approval_status: "pending",
        church_id: churchId,
      })
      .eq("user_id", newAuthUser.user.id)
      .select()
      .single();

    if (updateProfileError || !profile) {
      // Cleanup: delete the created auth user
      await supabase.auth.admin.deleteUser(newAuthUser.user.id);
      return errorResponse("Failed to create profile");
    }

    // Create member registration entry
    const { data: memberReg, error: regError } = await supabase
      .from("member_registrations")
      .insert({
        user_id: newAuthUser.user.id,
        church_id: churchId,
        national_id_front_url: idFrontUrl,
        national_id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        status: "pending",
        parent_church_admin_id: churchAdminProfile.id,
      })
      .select()
      .single();

    if (regError || !memberReg) {
      console.error("Member registration error:", regError);
      return errorResponse("Failed to create registration");
    }

    // Log approval history
    await logApprovalHistory(
      supabase,
      "member",
      memberReg.id,
      null,
      "submitted",
    );

    // Assign member role
    await supabase.from("user_roles").insert({
      user_id: newAuthUser.user.id,
      role: "member",
    });

    // Get church admin email for notification
    const { data: churchAdmin } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", church.admin_user_id)
      .single();

    // Send notification to church admin
    if (churchAdmin?.email) {
      await sendNotificationEmail(
        churchAdmin.email,
        "New Member Registration Awaiting Approval",
        "member_registered",
        {
          memberName: fullName,
          churchName: church.church_name,
          churchId,
        },
      );
    }

    // Send confirmation to member
    await sendNotificationEmail(
      email,
      "Registration Submitted - Awaiting Church Approval",
      "member_registered",
      {
        name: fullName,
        churchName: church.church_name,
      },
    );

    return successResponse(
      {
        success: true,
        message: "Registration successful. Awaiting church approval.",
        user_id: newAuthUser.user.id,
        status: "pending_approval",
      },
      201,
    );
  } catch (error) {
    console.error("Register member error:", error);
    return errorResponse("Internal server error", 500);
  }
}
