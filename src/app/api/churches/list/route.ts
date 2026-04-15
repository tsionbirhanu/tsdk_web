// GET /api/churches/list (PUBLIC - NO AUTH REQUIRED)
// Public list of approved churches for member registration

import { NextRequest } from "next/server";
import {
  createServiceClient,
  errorResponse,
  successResponse,
} from "../../hierarchical-registration/utils";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Parse query params
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("churches")
      .select("id, church_name, location, region, admin_user_id")
      .eq("approval_status", "approved")
      .eq("status", "active");

    // Apply filters
    if (region) {
      query = query.eq("region", region);
    }

    if (search) {
      query = query.or(
        `church_name.ilike.%${search}%,location.ilike.%${search}%`,
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order("church_name");

    const { data: churches, error: queryError } = await query;

    if (queryError) {
      return errorResponse("Failed to fetch churches");
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("churches")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "approved")
      .eq("status", "active");

    if (region) {
      countQuery = countQuery.eq("region", region);
    }

    if (search) {
      countQuery = countQuery.or(
        `church_name.ilike.%${search}%,location.ilike.%${search}%`,
      );
    }

    const { count } = await countQuery;

    return successResponse({
      churches:
        churches?.map((church: any) => ({
          id: church.id,
          name: church.church_name,
          location: church.location,
          region: church.region,
        })) || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  } catch (error) {
    console.error("Get churches list error:", error);
    return errorResponse("Internal server error", 500);
  }
}
