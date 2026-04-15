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

    // Fetch member registration for current user
    const { data: member, error: memberError } = await supabase
      .from("member_registrations")
      .select(
        `
        id,
        name,
        email,
        phone,
        status,
        created_at,
        approved_at,
        rejection_reason,
        church_id,
        churches(name)
      `,
      )
      .eq("user_id", session.user.id)
      .single();

    if (memberError && memberError.code !== "PGRST116") {
      throw memberError;
    }

    if (!member) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      registrationStatus: member.status,
      registeredDate: member.created_at,
      approvedDate: member.approved_at,
      rejectionReason: member.rejection_reason,
      church: member.churches?.name,
    });
  } catch (error: any) {
    console.error("Error fetching member profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
