import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const TREASURER_SYSTEM_PROMPT = `You are the TSEDK financial assistant for the church treasurer. You have access to the church's full financial summary data (provided below). You may answer questions about: donation totals, campaign progress, Aserat overdue lists, Gbir compliance, Selet due dates, and member payment summaries. You may NOT modify any data. You may NOT generate social media captions. If asked to do something outside financial reporting, respond: 'That is outside my scope as the treasurer assistant.' Respond in the same language the user writes in (Amharic, Afan Oromo, English). Format financial data clearly with numbers. Keep responses factual.`;

async function getTreasurerDataContext(supabase: any) {
  // In a real app, these would be more complex aggregate queries
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("name, goal_amount, current_amount");
  const { data: aserat } = await supabase
    .from("aserat_bekurat")
    .select("user_id, status, month");
  const { data: gbir } = await supabase.from("gbir").select("user_id, status, year");
  const { data: selet } = await supabase
    .from("selets")
    .select("user_id, due_date, status");

  return { campaigns, aserat, gbir, selet };
}

export async function POST(req: NextRequest) {
  const { message, sessionId: currentSessionId } = await req.json();
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  const sessionId = currentSessionId || uuidv4();
  const treasurerDataContext = await getTreasurerDataContext(supabase);
  const systemPromptWithData = `${TREASURER_SYSTEM_PROMPT}\n\nFinancial Data:\n${JSON.stringify(
    treasurerDataContext,
    null,
    2
  )}`;

  const { data: history } = await supabase
    .from("chat_history")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  const conversationHistory = history || [];
  conversationHistory.push({ role: "user", content: message });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        system: systemPromptWithData,
        messages: conversationHistory,
      }),
    });

    const data = await response.json();
    const reply = data.content[0].text;

    const sessionTitle =
      conversationHistory.length === 1
        ? message.substring(0, 40)
        : undefined;

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
    console.error("Error in treasurer chat:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
