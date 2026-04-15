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
      .select("teklay_id, role")
      .eq("id", session.user.id)
      .single();

    if (profileError || profile?.role !== "teklay_bete_khnet") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: hageres, error: hageresError } = await supabase
      .from("hagere_registrations")
      .select(
        `
        id,
        name,
        email,
        phone,
        leader_name,
        district,
        status,
        created_at,
        documents
      `,
      )
      .eq("teklay_id", profile.teklay_id)
      .order("created_at", { ascending: false });

    if (hageresError) throw hageresError;

    return NextResponse.json(
      hageres.map((h: any) => ({
        id: h.id,
        name: h.name,
        email: h.email,
        phone: h.phone,
        leaderName: h.leader_name,
        district: h.district,
        status: h.status,
        registeredDate: h.created_at,
        documents: h.documents || {},
      })),
    );
  } catch (error: any) {
    console.error("Error fetching Hageres:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
