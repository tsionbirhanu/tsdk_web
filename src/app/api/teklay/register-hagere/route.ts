// POST /api/teklay/register-hagere
// Teklay registers a Hagere Sebket

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

    // Verify user is Teklay
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const isTeklay = await verifyUserRole(
      supabase,
      user.id,
      "teklay_bete_khnet",
    );
    if (!isTeklay) {
      return errorResponse("Only Teklay can register Hagere", 403);
    }

    // Get Teklay profile
    const teklayProfile = await getUserProfile(supabase, user.id);
    if (!teklayProfile) {
      return errorResponse("Teklay profile not found");
    }

    // Parse form data
    const formData = await parseMultipartFormData(req);

    const email = formData.get("email") as string;
    const fullName = formData.get("full_name") as string;
    const phone = formData.get("phone") as string;
    const regionName = formData.get("region_name") as string;
    const idFrontFile = formData.get("id_front_file") as File;
    const idBackFile = formData.get("id_back_file") as File;
    const selfieFile = formData.get("selfie_file") as File;
    const approvalLetterFile = formData.get("approval_letter_file") as File;

    // Validate required fields
    if (
      !email ||
      !fullName ||
      !phone ||
      !regionName ||
      !idFrontFile ||
      !idBackFile ||
      !selfieFile ||
      !approvalLetterFile
    ) {
      return errorResponse("Missing required fields");
    }

    // Check if email exists
    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return errorResponse("Email already exists");
    }

    // Upload documents
    const idFrontUrl = await uploadFileToStorage({
      file: idFrontFile,
      userId: "",
      folder: "hagere",
      fileType: "id_front",
    });

    const idBackUrl = await uploadFileToStorage({
      file: idBackFile,
      userId: "",
      folder: "hagere",
      fileType: "id_back",
    });

    const selfieUrl = await uploadFileToStorage({
      file: selfieFile,
      userId: "",
      folder: "hagere",
      fileType: "selfie",
    });

    const approvalLetterUrl = await uploadFileToStorage({
      file: approvalLetterFile,
      userId: "",
      folder: "hagere",
      fileType: "approval_letter",
    });

    if (!idFrontUrl || !idBackUrl || !selfieUrl || !approvalLetterUrl) {
      return errorResponse("Failed to upload documents");
    }

    // Create auth user
    const tempPassword = Math.random().toString(36).slice(-12);
    const { data: newAuthUser, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false,
      });

    if (createError || !newAuthUser.user) {
      return errorResponse("Failed to create user");
    }

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: newAuthUser.user.id,
        full_name: fullName,
        email,
        phone,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        approval_letter_url: approvalLetterUrl,
        approval_status: "pending",
      })
      .select()
      .single();

    if (profileError || !profile) {
      await supabase.auth.admin.deleteUser(newAuthUser.user.id);
      return errorResponse("Failed to create profile");
    }

    // Create hagere registration entry
    const { data: hagereReg, error: regError } = await supabase
      .from("hagere_registrations")
      .insert({
        user_id: newAuthUser.user.id,
        region_name: regionName,
        phone,
        national_id_front_url: idFrontUrl,
        national_id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        approval_letter_url: approvalLetterUrl,
        status: "pending",
        parent_teklay_id: teklayProfile.id,
      })
      .select()
      .single();

    if (regError || !hagereReg) {
      return errorResponse("Failed to create registration");
    }

    // Log approval history
    await logApprovalHistory(
      supabase,
      "hagere",
      hagereReg.id,
      null,
      "submitted",
    );

    // Assign hagere_sebket role
    await supabase.from("user_roles").insert({
      user_id: newAuthUser.user.id,
      role: "hagere_sebket",
    });

    // Send notification emails
    await sendNotificationEmail(
      email,
      "Hagere Sebket Registration Submitted",
      "hagere_registered",
      {
        name: fullName,
        region: regionName,
        tempPassword,
      },
    );

    return successResponse({
      success: true,
      hagere_id: newAuthUser.user.id,
      message: "Hagere registration created successfully",
    });
  } catch (error) {
    console.error("Register Hagere error:", error);
    return errorResponse("Internal server error", 500);
  }
}
