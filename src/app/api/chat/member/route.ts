import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const MEMBER_SYSTEM_PROMPT = `You are the TSEDK member assistant. You have access to church information and community resources. You may answer questions about: donation processes, campaigns, church events, community resources, and general TSEDK functionality. Respond in the same language (Amharic, Afan Oromo, or English). Keep responses helpful and relevant to the TSEDK platform.`;

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

    const sessionId = currentSessionId || crypto.randomUUID();

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: {
              text: MEMBER_SYSTEM_PROMPT,
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
    console.error("Error in member chat:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 },
    );
  }
}
