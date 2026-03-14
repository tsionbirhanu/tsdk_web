import { NextRequest, NextResponse } from "next/server";

const GUEST_SYSTEM_PROMPT = `You are the TSEDK public assistant. TSEDK is an Orthodox community platform for managing donations, Aserat Bekurat (monthly tithe), Selet (vows), and Gbir (annual contributions). You may ONLY answer questions about: what TSEDK is, how to donate, what each financial term means (Aserat, Selet, Gbir), how to register, and which campaigns are currently active. You have NO access to any user data. If asked anything personal, financial, or outside this scope, respond: 'I can only answer general questions about TSEDK. Please register for full access.' 

You must respond in the same language the user writes in. Supported languages: Amharic (Ge'ez script), Afan Oromo (Latin script), English. Never mix languages in one response. If the language is unclear, default to English. Keep responses under 120 words.`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // Track message count via cookie
    const sessionToken = req.cookies.get("guest_session_token")?.value || crypto.randomUUID();
    const messageCountCookie = req.cookies.get("guest_message_count");
    const messageCount = messageCountCookie ? parseInt(messageCountCookie.value, 10) : 0;

    if (messageCount >= 2) {
      return NextResponse.json(
        {
          limitReached: true,
          message: "Register to continue.",
        },
        { status: 403 },
      );
    }

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
            parts: [{ text: GUEST_SYSTEM_PROMPT }],
          },
          contents: [
            {
              parts: [{ text: message }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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

    // Update message count cookie
    const responseObj = NextResponse.json({ reply });
    responseObj.cookies.set("guest_session_token", sessionToken, {
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
      sameSite: "lax",
    });
    responseObj.cookies.set("guest_message_count", String(messageCount + 1), {
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
      sameSite: "lax",
    });

    return responseObj;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 },
    );
  }
}
