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

    // Get member ID
    const { data: member } = await supabase
      .from("member_registrations")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!member) {
      return NextResponse.json([]);
    }

    // Fetch activity for this member
    const { data: activities, error: activitiesError } = await supabase
      .from("activity_log")
      .select(
        `
        id,
        action,
        created_at,
        actor_id,
        metadata,
        profiles!actor_id(name)
      `,
      )
      .eq("target_id", member.id)
      .order("created_at", { ascending: false });

    if (activitiesError) throw activitiesError;

    return NextResponse.json(
      activities.map((a: any) => ({
        id: a.id,
        type: a.action.includes("approved")
          ? "approved"
          : a.action.includes("rejected")
            ? "rejected"
            : "submitted",
        title: a.action.replace(/_/g, " "),
        timestamp: a.created_at,
        actor: a.profiles?.name || "System Admin",
        description: a.metadata?.reason || undefined,
      })),
    );
  } catch (error: any) {
    console.error("Error fetching member activity:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
