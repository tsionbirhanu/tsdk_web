// GET /api/teklay/hagere-approvals
// Teklay views Hagere registration approvals

import { NextRequest } from "next/server";
import {
  createServiceClient,
  getUserProfile,
  errorResponse,
  successResponse,
} from "../../hierarchical-registration/utils";

export async function GET(req: NextRequest) {
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
      return errorResponse("Only Teklay can access this", 403);
    }

    // Get Teklay profile
    const teklayProfile = await getUserProfile(supabase, user.id);
    if (!teklayProfile) {
      return errorResponse("Teklay profile not found");
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get hagere registrations for this Teklay
    const { data: registrations, error: queryError } = await supabase
      .from("hagere_registrations")
      .select(
        `
        id,
        user_id,
        region_name,
        phone,
        national_id_front_url,
        national_id_back_url,
        selfie_url,
        approval_letter_url,
        status,
        submitted_at,
        rejection_reason,
        profiles:user_id(full_name, email, phone)
      `,
      )
      .eq("parent_teklay_id", teklayProfile.id)
      .eq("status", status)
      .range(offset, offset + limit - 1)
      .order("submitted_at", { ascending: false });

    if (queryError) {
      return errorResponse("Failed to fetch registrations");
    }

    // Get total count
    const { count } = await supabase
      .from("hagere_registrations")
      .select("id", { count: "exact", head: true })
      .eq("parent_teklay_id", teklayProfile.id)
      .eq("status", status);

    return successResponse({
      registrations:
        registrations?.map((reg: any) => ({
          id: reg.id,
          user_id: reg.user_id,
          full_name: reg.profiles?.[0]?.full_name || "",
          email: reg.profiles?.[0]?.email || "",
          phone: reg.profiles?.[0]?.phone || "",
          region_name: reg.region_name,
          status: reg.status,
          submitted_at: reg.submitted_at,
          id_front_url: reg.national_id_front_url,
          id_back_url: reg.national_id_back_url,
          selfie_url: reg.selfie_url,
          approval_letter_url: reg.approval_letter_url,
          rejection_reason: reg.rejection_reason,
        })) || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  } catch (error) {
    console.error("Get Hagere approvals error:", error);
    return errorResponse("Internal server error", 500);
  }
}
