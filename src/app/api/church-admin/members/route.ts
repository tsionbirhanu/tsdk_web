import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile to get church_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("church_id, role")
      .eq("id", session.user.id)
      .single();

    if (profileError || profile?.role !== "church_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch members for this church
    const { data: members, error: membersError } = await supabase
      .from("member_registrations")
      .select(
        `
        id,
        name,
        email,
        phone,
        status,
        created_at,
        documents
      `,
      )
      .eq("church_id", profile.church_id)
      .order("created_at", { ascending: false });

    if (membersError) throw membersError;

    return NextResponse.json(
      members.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        status: m.status,
        submittedDate: m.created_at,
        documents: m.documents || {},
      })),
    );
  } catch (error: any) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
