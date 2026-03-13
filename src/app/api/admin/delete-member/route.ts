import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure the requester is an admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (userRole?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const profileId = body?.profileId as string | undefined;
    if (!profileId) {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    // Fetch profile to get linked auth user id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // If linked auth user exists, delete from auth
    if (profile.user_id) {
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(profile.user_id);
      if (deleteAuthError) {
        console.error("Error deleting auth user:", deleteAuthError);
        return NextResponse.json({ error: deleteAuthError.message || "Failed to delete auth user" }, { status: 500 });
      }
    }

    // Remove profile row
    const { error: deleteProfileError } = await supabase.from("profiles").delete().eq("id", profileId);
    if (deleteProfileError) {
      console.error("Error deleting profile:", deleteProfileError);
      return NextResponse.json({ error: deleteProfileError.message || "Failed to delete profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete-member API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
