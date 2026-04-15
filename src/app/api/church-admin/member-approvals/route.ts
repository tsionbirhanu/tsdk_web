// GET /api/church-admin/member-approvals
// Church Admin views pending member registrations for their church

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

    // Verify user is Church Admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data: churchAdminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "church_admin")
      .single();

    if (!churchAdminRole) {
      return errorResponse("Only Church Admin can access this", 403);
    }

    // Get church admin profile
    const adminProfile = await getUserProfile(supabase, user.id);
    if (!adminProfile) {
      return errorResponse("Admin profile not found");
    }

    // Get church for this admin
    const { data: church, error: churchError } = await supabase
      .from("churches")
      .select("id")
      .eq("admin_user_id", user.id)
      .single();

    if (churchError || !church) {
      return errorResponse("Church not found");
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get member registrations for this church
    const { data: registrations, error: queryError } = await supabase
      .from("member_registrations")
      .select(
        `
        id,
        user_id,
        church_id,
        national_id_front_url,
        national_id_back_url,
        selfie_url,
        status,
        submitted_at,
        rejection_reason,
        profiles:user_id(full_name, email, phone)
      `,
      )
      .eq("church_id", church.id)
      .eq("status", status)
      .range(offset, offset + limit - 1)
      .order("submitted_at", { ascending: false });

    if (queryError) {
      return errorResponse("Failed to fetch registrations");
    }

    // Get total count
    const { count } = await supabase
      .from("member_registrations")
      .select("id", { count: "exact", head: true })
      .eq("church_id", church.id)
      .eq("status", status);

    return successResponse({
      registrations:
        registrations?.map((reg: any) => ({
          id: reg.id,
          user_id: reg.user_id,
          full_name: reg.profiles?.[0]?.full_name || "",
          email: reg.profiles?.[0]?.email || "",
          phone: reg.profiles?.[0]?.phone || "",
          church_id: reg.church_id,
          status: reg.status,
          submitted_at: reg.submitted_at,
          id_front_url: reg.national_id_front_url,
          id_back_url: reg.national_id_back_url,
          selfie_url: reg.selfie_url,
          rejection_reason: reg.rejection_reason,
        })) || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  } catch (error) {
    console.error("Get member approvals error:", error);
    return errorResponse("Internal server error", 500);
  }
}
