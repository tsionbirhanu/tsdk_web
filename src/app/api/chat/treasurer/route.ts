import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const TREASURER_SYSTEM_PROMPT = `You are the TSEDK financial assistant for the church treasurer. You have access to the church's full financial summary data (provided below). You may answer questions about: donation totals, campaign progress, Aserat overdue lists, Gbir compliance, Selet due dates, and member payment summaries. You may NOT modify any data. You may NOT generate social media captions. If asked to do something outside financial reporting, respond: 'That is outside my scope as the treasurer assistant.' Respond in the same language the user writes in (Amharic, Afan Oromo, English). Format financial data clearly with numbers. Keep responses factual.`;

async function getTreasurerDataContext(supabase: any) {
  try {
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("name, goal_amount, current_amount");
    const { data: aserat } = await supabase
      .from("aserat_bekurat")
      .select("user_id, status, month");
    const { data: gbir } = await supabase
      .from("gbir")
      .select("user_id, status, year");
    const { data: selet } = await supabase
      .from("selets")
      .select("user_id, due_date, status");

    return {
      campaigns: campaigns || [],
      aserat: aserat || [],
      gbir: gbir || [],
      selet: selet || [],
    };
  } catch (error) {
    console.error("Error fetching treasurer data:", error);
    return { campaigns: [], aserat: [], gbir: [], selet: [] };
  }
}

async function getUserRole(
  supabase: any,
  userId: string,
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    return data?.role || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId: currentSessionId } = await req.json();
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

    const userRole = await getUserRole(supabase, user.id);
    if (userRole !== "treasurer") {
      return NextResponse.json(
        { error: "Only treasurers can access this endpoint" },
        { status: 403 },
      );
    }

    const sessionId = currentSessionId || crypto.randomUUID();
    const treasurerDataContext = await getTreasurerDataContext(supabase);
    const systemPromptWithData = `${TREASURER_SYSTEM_PROMPT}\n\nFinancial Data:\n${JSON.stringify(
      treasurerDataContext,
      null,
      2,
    )}`;

    const { data: history } = await supabase
      .from("chat_history")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const conversationHistory = history || [];
    conversationHistory.push({ role: "user", content: message });

    const contents = conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: {
              text: systemPromptWithData,
            },
          },
          contents,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: 500 },
      );
    }

    const data = await response.json();
    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0] ||
      !data.candidates[0].content.parts[0].text
    ) {
      console.error("Unexpected API response format:", data);
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 },
      );
    }
    const reply = data.candidates[0].content.parts[0].text;

    const sessionTitle =
      conversationHistory.length === 1 ? message.substring(0, 40) : undefined;

    await supabase.from("chat_history").insert([
      {
        user_id: user.id,
        session_id: sessionId,
        role: "user",
        content: message,
        session_title: sessionTitle,
      },
      {
        user_id: user.id,
        session_id: sessionId,
        role: "assistant",
        content: reply,
      },
    ]);

    return NextResponse.json({ reply, sessionId });
  } catch (error) {
    console.error("Error in POST /api/chat/treasurer:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
