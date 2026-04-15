// POST /api/admin/register-teklay
// System Admin registers a Teklay Bete Khnet

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

    // Verify user is System Admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const isAdmin = await verifyUserRole(supabase, user.id, "admin");
    if (!isAdmin) {
      return errorResponse("Only System Admin can register Teklay", 403);
    }

    // Parse form data
    const formData = await parseMultipartFormData(req);

    const email = formData.get("email") as string;
    const fullName = formData.get("full_name") as string;
    const phone = formData.get("phone") as string;
    const idFrontFile = formData.get("id_front_file") as File;
    const idBackFile = formData.get("id_back_file") as File;
    const selfieFile = formData.get("selfie_file") as File;

    // Validate required fields
    if (
      !email ||
      !fullName ||
      !phone ||
      !idFrontFile ||
      !idBackFile ||
      !selfieFile
    ) {
      return errorResponse("Missing required fields");
    }

    // Check if email exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return errorResponse("Email already exists");
    }

    // Upload documents
    const idFrontUrl = await uploadFileToStorage({
      file: idFrontFile,
      userId: "",
      folder: "teklay",
      fileType: "id_front",
    });

    const idBackUrl = await uploadFileToStorage({
      file: idBackFile,
      userId: "",
      folder: "teklay",
      fileType: "id_back",
    });

    const selfieUrl = await uploadFileToStorage({
      file: selfieFile,
      userId: "",
      folder: "teklay",
      fileType: "selfie",
    });

    if (!idFrontUrl || !idBackUrl || !selfieUrl) {
      return errorResponse("Failed to upload documents");
    }

    // Create auth user with temporary password
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
        approval_status: "pending",
      })
      .select()
      .single();

    if (profileError || !profile) {
      // Cleanup: delete the created auth user
      await supabase.auth.admin.deleteUser(newAuthUser.user.id);
      return errorResponse("Failed to create profile");
    }

    // Create teklay registration entry
    const { data: tekLayReg, error: regError } = await supabase
      .from("teklay_registrations")
      .insert({
        user_id: newAuthUser.user.id,
        national_id_front_url: idFrontUrl,
        national_id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        status: "pending",
      })
      .select()
      .single();

    if (regError || !tekLayReg) {
      return errorResponse("Failed to create registration");
    }

    // Log approval history
    await logApprovalHistory(
      supabase,
      "teklay",
      tekLayReg.id,
      null,
      "submitted",
    );

    // Assign teklay_bete_khnet role
    await supabase.from("user_roles").insert({
      user_id: newAuthUser.user.id,
      role: "teklay_bete_khnet",
    });

    // Send notification emails
    await sendNotificationEmail(
      email,
      "Teklay Bete Khnet Registration Submitted",
      "teklay_registered",
      {
        name: fullName,
        tempPassword,
      },
    );

    return successResponse({
      success: true,
      teklay_id: newAuthUser.user.id,
      message: "Teklay registration created successfully",
    });
  } catch (error) {
    console.error("Register Teklay error:", error);
    return errorResponse("Internal server error", 500);
  }
}
