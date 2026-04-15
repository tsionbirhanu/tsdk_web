import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { churchId: string } },
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

    if (profileError || profile?.role !== "hagere_sebket") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reason } = await request.json();

    const { error: updateError } = await supabase
      .from("church_registrations")
      .update({
        status: "rejected",
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
        rejected_by: session.user.id,
      })
      .eq("id", params.churchId);

    if (updateError) throw updateError;

    await supabase.from("activity_log").insert({
      actor_id: session.user.id,
      action: "church_rejected",
      target_id: params.churchId,
      target_type: "church_registration",
      metadata: { reason },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error rejecting church:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
