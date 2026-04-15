// POST /api/hagere/register-church
// Hagere registers a Church

import { NextRequest } from "next/server";
import {
  createServiceClient,
  uploadFileToStorage,
  verifyUserRole,
  getUserProfile,
  logApprovalHistory,
  sendNotificationEmail,
  parseMultipartFormData,
  errorResponse,
  successResponse,
} from "../../hierarchical-registration/utils";

export async function POST(req: NextRequest) {
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

    const isHagere = await verifyUserRole(supabase, user.id, "hagere_sebket");
    if (!isHagere) {
      return errorResponse("Only Hagere can register churches", 403);
    }

    // Get Hagere profile
    const hagereProfile = await getUserProfile(supabase, user.id);
    if (!hagereProfile) {
      return errorResponse("Hagere profile not found");
    }

    // Parse form data
    const formData = await parseMultipartFormData(req);

    const churchName = formData.get("church_name") as string;
    const location = formData.get("location") as string;
    const region = (formData.get("region") as string) || hagereProfile.phone; // Default to region if not provided
    const adminEmail = formData.get("admin_email") as string;
    const adminFullName = formData.get("admin_full_name") as string;
    const adminPhone = formData.get("admin_phone") as string;
    const idFrontFile = formData.get("id_front_file") as File;
    const idBackFile = formData.get("id_back_file") as File;
    const selfieFile = formData.get("selfie_file") as File;
    const approvalLetterFile = formData.get("approval_letter_file") as File;

    // Validate required fields
    if (
      !churchName ||
      !location ||
      !region ||
      !adminEmail ||
      !adminFullName ||
      !adminPhone ||
      !idFrontFile ||
      !idBackFile ||
      !selfieFile ||
      !approvalLetterFile
    ) {
      return errorResponse("Missing required fields");
    }

    // Check if admin email exists
    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", adminEmail)
      .single();

    if (existingEmail) {
      return errorResponse("Admin email already exists");
    }

    // Upload documents
    const idFrontUrl = await uploadFileToStorage({
      file: idFrontFile,
      userId: "",
      folder: "church",
      fileType: "id_front",
    });

    const idBackUrl = await uploadFileToStorage({
      file: idBackFile,
      userId: "",
      folder: "church",
      fileType: "id_back",
    });

    const selfieUrl = await uploadFileToStorage({
      file: selfieFile,
      userId: "",
      folder: "church",
      fileType: "selfie",
    });

    const approvalLetterUrl = await uploadFileToStorage({
      file: approvalLetterFile,
      userId: "",
      folder: "church",
      fileType: "approval_letter",
    });

    if (!idFrontUrl || !idBackUrl || !selfieUrl || !approvalLetterUrl) {
      return errorResponse("Failed to upload documents");
    }

    // Create auth user for church admin
    const tempPassword = Math.random().toString(36).slice(-12);
    const { data: newAuthUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: tempPassword,
        email_confirm: false,
      });

    if (createError || !newAuthUser.user) {
      return errorResponse("Failed to create admin user");
    }

    // Create profile for church admin
    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: newAuthUser.user.id,
        full_name: adminFullName,
        email: adminEmail,
        phone: adminPhone,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        approval_letter_url: approvalLetterUrl,
        approval_status: "pending",
      })
      .select()
      .single();

    if (profileError || !adminProfile) {
      await supabase.auth.admin.deleteUser(newAuthUser.user.id);
      return errorResponse("Failed to create admin profile");
    }

    // Create church registration entry
    const { data: churchReg, error: regError } = await supabase
      .from("church_registrations")
      .insert({
        church_name: churchName,
        location,
        region,
        admin_user_id: newAuthUser.user.id,
        admin_name: adminFullName,
        admin_email: adminEmail,
        admin_phone: adminPhone,
        national_id_front_url: idFrontUrl,
        national_id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        approval_letter_url: approvalLetterUrl,
        status: "pending",
        parent_hagere_id: hagereProfile.id,
      })
      .select()
      .single();

    if (regError || !churchReg) {
      return errorResponse("Failed to create church registration");
    }

    // Log approval history
    await logApprovalHistory(
      supabase,
      "church",
      churchReg.id,
      null,
      "submitted",
    );

    // Assign church_admin role to admin user
    await supabase.from("user_roles").insert({
      user_id: newAuthUser.user.id,
      role: "church_admin",
    });

    // Send notification emails
    await sendNotificationEmail(
      adminEmail,
      "Church Registration Submitted",
      "church_registered",
      {
        churchName,
        adminName: adminFullName,
        tempPassword,
      },
    );

    return successResponse({
      success: true,
      church_id: churchReg.id,
      admin_user_id: newAuthUser.user.id,
      message: "Church registration created successfully",
    });
  } catch (error) {
    console.error("Register Church error:", error);
    return errorResponse("Internal server error", 500);
  }
}
