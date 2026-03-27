import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, due_date } = body;
    if (!type || !due_date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (!["aserat", "selet", "gbir"].includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Upsert deadline for this user and type
    const { data, error } = await supabase
      .from("user_deadlines")
      .upsert({ user_id: user.id, type, due_date }, { onConflict: "user_id,type" });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("deadline POST error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase.from("user_deadlines").select("type,due_date").eq("user_id", user.id);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("deadline GET error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
