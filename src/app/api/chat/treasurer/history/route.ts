import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Add role check for treasurer
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (userRole?.role !== "treasurer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // This query is simplified. A real implementation might need to be more
    // complex to handle permissions across the entire church.
    const { data, error } = await supabase
      .from("chat_history")
      .select("session_id, session_title, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Deduplicate sessions, keeping the most recent title
    const sessions = data.reduce((acc: any, current: any) => {
      if (!acc[current.session_id]) {
        acc[current.session_id] = {
          sessionId: current.session_id,
          title: current.session_title || "Untitled Chat",
          createdAt: current.created_at,
        };
      }
      return acc;
    }, {});

    return NextResponse.json(Object.values(sessions));
  } catch (error) {
    console.error("Error fetching treasurer history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
