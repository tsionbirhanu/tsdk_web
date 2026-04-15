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

    const { data: teklays, error: teklaysError } = await supabase
      .from("teklay_registrations")
      .select(
        `
        id,
        name,
        email,
        phone,
        leader_name,
        region,
        status,
        created_at,
        documents
      `,
      )
      .order("created_at", { ascending: false });

    if (teklaysError) throw teklaysError;

    return NextResponse.json(
      teklays.map((t: any) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        leaderName: t.leader_name,
        region: t.region,
        status: t.status,
        registeredDate: t.created_at,
        documents: t.documents || {},
      })),
    );
  } catch (error: any) {
    console.error("Error fetching Teklays:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
