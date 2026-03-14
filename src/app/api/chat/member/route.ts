import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const MEMBER_SYSTEM_PROMPT_BASE = `You are the TSEDK personal assistant for a registered member. 
You have access ONLY to this member's own data (provided below in JSON). 
You may help with: checking their payment status, upcoming due dates for Aserat/Selet/Gbir, how to use the app, and general TSEDK questions. 
You may NOT answer questions about other members, financial totals, admin reports, or anything outside this member's own data. If asked something out of scope, respond politely: 'I can only help with your personal TSEDK account. For church-wide information, please contact the treasurer.' 

You must respond in the same language the user writes in. Supported languages: Amharic (Ge'ez script), Afan Oromo (Latin script), English. Never mix languages. If the language is unclear, default to English. Keep responses concise.`;

async function getUserMemberData(supabase: any, userId: string) {
  try {
    // Fetch AseratBekurat records (donations with type='aserat')
    const { data: aseratRecords } = await supabase
      .from("donations")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "aserat")
      .order("created_at", { ascending: false });

    // Fetch Selet records
    const { data: seletRecords } = await supabase
      .from("selets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Fetch Gbir records (donations with type='gbir')
    const { data: gbirRecords } = await supabase
      .from("donations")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "gbir")
      .order("created_at", { ascending: false });

    // Fetch recent donations (all types, limited to last 10)
    const { data: recentDonations } = await supabase
      .from("donations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      aseratBekurat: aseratRecords || [],
      selet: seletRecords || [],
      gbir: gbirRecords || [],
      recentDonations: recentDonations || [],
    };
  } catch (error) {
    console.error("Error fetching member data:", error);
    return {
      aseratBekurat: [],
      selet: [],
      gbir: [],
      recentDonations: [],
    };
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

    // Check if user has 'member' role
    const userRole = await getUserRole(supabase, user.id);
    if (userRole !== "member") {
      return NextResponse.json(
        { error: "Only members can access this endpoint" },
        { status: 403 },
      );
    }

    // Fetch user's data
    const userData = await getUserMemberData(supabase, user.id);

    // Build system prompt with user data
    const systemPromptWithData = `${MEMBER_SYSTEM_PROMPT_BASE}\n\nMember Data:\n${JSON.stringify(
      userData,
      null,
      2,
    )}`;

    const sessionId = currentSessionId || crypto.randomUUID();

    // Fetch conversation history for this session
    const { data: history } = await supabase
      .from("chat_history")
      .select("role, content")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const conversationHistory = (history || []).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add current user message
    conversationHistory.push({ role: "user", content: message });

    // Prepare messages for Gemini API
    const contents = conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const geminiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 },
      );
    }

    const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPromptWithData }],
          },
          contents,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Gemini API error:", errorData || response.statusText);

      if (response.status === 429) {
        return NextResponse.json(
          {
            error:
              "Quota exceeded for Gemini API. Please check your Google Cloud quota/billing or try again later.",
            details: errorData,
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "Failed to get response from AI", details: errorData },
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

    // Generate session title from first message
    const sessionTitle =
      conversationHistory.length === 1 ? message.substring(0, 40) : undefined;

    // Save to chat history
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
