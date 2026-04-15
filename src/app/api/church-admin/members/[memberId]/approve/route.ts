import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is church admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profileError || profile?.role !== "church_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update member status to approved
    const { error: updateError } = await supabase
      .from("member_registrations")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: session.user.id,
      })
      .eq("id", params.memberId);

    if (updateError) throw updateError;

    // Log activity
    await supabase.from("activity_log").insert({
      actor_id: session.user.id,
      action: "member_approved",
      target_id: params.memberId,
      target_type: "member_registration",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error approving member:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
