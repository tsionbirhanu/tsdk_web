import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { teklayId: string } },
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

    if (
      profileError ||
      !["admin", "system_admin"].includes(profile?.role || "")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("teklay_registrations")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: session.user.id,
      })
      .eq("id", params.teklayId);

    if (updateError) throw updateError;

    await supabase.from("activity_log").insert({
      actor_id: session.user.id,
      action: "teklay_approved",
      target_id: params.teklayId,
      target_type: "teklay_registration",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error approving Teklay:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
