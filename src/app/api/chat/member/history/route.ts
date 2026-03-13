import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Get the authorization token from the request
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create Supabase client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Verify the token and get user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("chat_history")
    .select("session_id, session_title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate sessions and format response
  const sessionMap = new Map();
  data.forEach((s: any) => {
    if (!sessionMap.has(s.session_id)) {
      sessionMap.set(s.session_id, {
        sessionId: s.session_id,
        title: s.session_title || "Untitled Chat",
        createdAt: s.created_at,
      });
    }
  });

  const sessions = Array.from(sessionMap.values());
  return NextResponse.json(sessions || []);
}
