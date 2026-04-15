import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { hagereId: string } },
) {
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

    if (profileError || profile?.role !== "teklay_bete_khnet") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("hagere_registrations")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: session.user.id,
      })
      .eq("id", params.hagereId);

    if (updateError) throw updateError;

    await supabase.from("activity_log").insert({
      actor_id: session.user.id,
      action: "hagere_approved",
      target_id: params.hagereId,
      target_type: "hagere_registration",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error approving Hagere:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
