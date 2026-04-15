import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (
      profileError ||
      !["admin", "system_admin"].includes(profile?.role || "")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get total members
    const { count: totalMembers } = await supabase
      .from("member_registrations")
      .select("*", { count: "exact", head: true });

    // Get total churches
    const { count: totalChurches } = await supabase
      .from("church_registrations")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      totalMembers: totalMembers || 0,
      totalChurches: totalChurches || 0,
    });
  } catch (error: any) {
    console.error("Error fetching system stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
