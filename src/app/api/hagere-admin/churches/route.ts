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
      .select("hagere_id, role")
      .eq("id", session.user.id)
      .single();

    if (profileError || profile?.role !== "hagere_sebket") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: churches, error: churchesError } = await supabase
      .from("church_registrations")
      .select(
        `
        id,
        name,
        email,
        phone,
        leader_name,
        status,
        created_at,
        documents
      `,
      )
      .eq("hagere_id", profile.hagere_id)
      .order("created_at", { ascending: false });

    if (churchesError) throw churchesError;

    return NextResponse.json(
      churches.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        leaderName: c.leader_name,
        status: c.status,
        registeredDate: c.created_at,
        documents: c.documents || {},
      })),
    );
  } catch (error: any) {
    console.error("Error fetching churches:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
