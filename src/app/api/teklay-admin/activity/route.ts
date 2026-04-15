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

    if (profileError || profile?.role !== "teklay_bete_khnet") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: activities, error: activitiesError } = await supabase
      .from("activity_log")
      .select(
        `
        id,
        action,
        created_at,
        actor_id,
        target_id,
        target_type,
        metadata,
        profiles!actor_id(name)
      `,
      )
      .in("target_type", ["hagere_registration", "teklay_registration"])
      .order("created_at", { ascending: false })
      .limit(10);

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
        actor: a.profiles?.name || "Unknown",
        metadata: a.metadata,
      })),
    );
  } catch (error: any) {
    console.error("Error fetching activity:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
