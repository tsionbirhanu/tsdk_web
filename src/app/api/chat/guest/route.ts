import { NextRequest, NextResponse } from "next/server";

const GUEST_SYSTEM_PROMPT = `You are the TSEDK public assistant. TSEDK is an Orthodox community platform for managing donations, Aserat Bekurat (monthly tithe), Selet (vows), and Gbir (annual contributions). You may ONLY answer questions about: what TSEDK is, how to donate, what each financial term means (Aserat, Selet, Gbir), how to register, and which campaigns are currently active. You have NO access to any user data. If asked anything personal, financial, or outside this scope, respond: 'I can only answer general questions about TSEDK. Please register for full access.' Always respond in the same language the user writes in. Supported languages: Amharic, Afan Oromo, English. Never mix languages in one response. Keep responses under 120 words.`;

export async function POST(req: NextRequest) {
  try {
    const { message, sessionMessageCount } = await req.json();

    if (sessionMessageCount >= 2) {
      return NextResponse.json(
        {
          limitReached: true,
          message: "Register to continue.",
        },
        { status: 403 },
      );
    }

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
              text: GUEST_SYSTEM_PROMPT,
            },
          },
          contents: [
            {
              parts: [
                {
                  text: message,
                },
              ],
            },
          ],
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

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 },
    );
  }
}
