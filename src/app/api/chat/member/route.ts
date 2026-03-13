import { NextResponse } from "next/server";

const MEMBER_CHAT_SCOPE = [
  "workspace tasks",
  "team updates",
  "FAQs",
  "company policies",
];

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    // Check if the question is in scope
    const lowerMessage = message.toLowerCase();
    const isInScope = MEMBER_CHAT_SCOPE.some((scope) =>
      lowerMessage.includes(scope.toLowerCase()),
    );

    let reply: string;

    if (isInScope) {
      // In a real app, you would call your AI service here
      reply = `Thanks for your question about ${message}. I'm here to help with ${MEMBER_CHAT_SCOPE.join(", ")}. This is where your actual AI integration would respond with relevant information.`;
    } else {
      reply = `I can only help with ${MEMBER_CHAT_SCOPE.join(", ")} topics.`;
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Member chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  }
}
