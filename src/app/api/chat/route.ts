import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are a helpful assistant for an Ethiopian Orthodox Church community platform called TSEDQ (ቄጅ / צדק).
You help members with questions about:
- Church services, liturgical calendar, and Ethiopian Orthodox traditions
- Donations (ምጽዋት) — campaigns, emergency relief, special collections
- Aserat (አሰረጥ) — monthly tithe management and giving history
- Selet (ሥለት) — prayer vows and spiritual commitments with instalment plans
- Gbir (ግብር) — church feast contributions and annual celebrations
- Prayer requests and spiritual guidance
- Church events and Ethiopian holidays (Ethiopian calendar: ዘጠኝ ዋና በዓላት etc.)

Respond warmly and respectfully. Support English, Amharic (አማርኛ), and Afaan Oromoo — match the language the user writes in.
Use biblical references when appropriate. Keep responses concise and helpful.`;

type GeminiMessage = { role: "user" | "model"; parts: { text: string }[] };

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY;

    // Primary path: Google Gemini API directly
    if (geminiKey) {
      const contents: GeminiMessage[] = (
        messages as { role: string; content: string }[]
      )
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiKey,
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          }),
        },
      );

      if (!geminiRes.ok) {
        if (geminiRes.status === 429) {
          return new Response(
            JSON.stringify({
              error: "Rate limit exceeded. Please wait a moment.",
            }),
            { status: 429, headers: { "Content-Type": "application/json" } },
          );
        }
        const errText = await geminiRes.text();
        return new Response(
          JSON.stringify({ error: "AI service error", details: errText }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      }

      // Transform Gemini SSE stream → OpenAI-compatible SSE (what the client parser expects)
      const { readable, writable } = new TransformStream({
        transform(chunk: Uint8Array, controller) {
          const text = new TextDecoder().decode(chunk);
          for (const line of text.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content: string | undefined =
                parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) {
                const sse = `data: ${JSON.stringify({
                  choices: [{ delta: { content } }],
                })}\n\n`;
                controller.enqueue(new TextEncoder().encode(sse));
              }
            } catch {
              // skip malformed chunks
            }
          }
        },
        flush(controller) {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        },
      });

      geminiRes.body!.pipeTo(writable);

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Fallback path: Supabase edge function proxy
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return new Response(
        JSON.stringify({
          error:
            "AI not configured. Set GEMINI_API_KEY in .env.local to enable the AI assistant.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const upstream = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (upstream.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }
    if (upstream.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
        { status: 402, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") || "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
