// GET /api/hagere/church-approvals
// Hagere views Church registration approvals

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
      return errorResponse("Only Hagere can access this", 403);
    }

    // Get Hagere profile
    const hagereProfile = await getUserProfile(supabase, user.id);
    if (!hagereProfile) {
      return errorResponse("Hagere profile not found");
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get church registrations for this Hagere
    const { data: registrations, error: queryError } = await supabase
      .from("church_registrations")
      .select(
        `
        id,
        church_name,
        location,
        region,
        admin_user_id,
        admin_name,
        admin_email,
        admin_phone,
        national_id_front_url,
        national_id_back_url,
        selfie_url,
        approval_letter_url,
        status,
        submitted_at,
        rejection_reason
      `,
      )
      .eq("parent_hagere_id", hagereProfile.id)
      .eq("status", status)
      .range(offset, offset + limit - 1)
      .order("submitted_at", { ascending: false });

    if (queryError) {
      return errorResponse("Failed to fetch registrations");
    }

    // Get total count
    const { count } = await supabase
      .from("church_registrations")
      .select("id", { count: "exact", head: true })
      .eq("parent_hagere_id", hagereProfile.id)
      .eq("status", status);

    return successResponse({
      registrations:
        registrations?.map((reg: any) => ({
          id: reg.id,
          church_name: reg.church_name,
          location: reg.location,
          region: reg.region,
          admin_name: reg.admin_name,
          admin_email: reg.admin_email,
          admin_phone: reg.admin_phone,
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
    console.error("Get Church approvals error:", error);
    return errorResponse("Internal server error", 500);
  }
}
