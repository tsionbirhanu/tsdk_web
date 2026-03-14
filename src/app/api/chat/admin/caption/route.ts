import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function buildCaptionSystemPrompt(
  platform: string,
  tone: string,
  language: string,
  campaignDetails: any,
): string {
  const platformGuidelines: Record<string, string> = {
    telegram: "For Telegram: up to 280 characters, may include emojis.",
    tiktok: "For TikTok: punchy, 1-2 sentences, hook first.",
    facebook: "For Facebook: up to 400 characters, warm community tone.",
  };

  const languageNote: Record<string, string> = {
    amharic: "Amharic uses Ge'ez script.",
    afan_oromo: "Afan Oromo uses Latin script.",
    english: "English uses standard English.",
  };

  return `You are a social media caption writer for an Orthodox church fundraising platform. Generate a single caption for the platform and tone specified. Write ONLY in the language specified. ${languageNote[language] || ""} ${platformGuidelines[platform] || ""} 

Campaign Details:
Title: ${campaignDetails.title || campaignDetails.name || "N/A"}
Description: ${campaignDetails.description || "N/A"}
Goal Amount: ${campaignDetails.goal_amount || campaignDetails.goalAmount || 0}
Current Amount: ${campaignDetails.raised_amount || campaignDetails.current_amount || campaignDetails.currentAmount || 0}

Output ONLY the caption text — no explanation, no quotation marks, no preamble.`;
}

export async function POST(req: NextRequest) {
  try {
    const { campaign_id, platform, tone, language } = await req.json();
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!campaign_id || !platform || !tone || !language) {
      return NextResponse.json(
        {
          error: "Missing required fields: campaign_id, platform, tone, language",
        },
        { status: 400 },
      );
    }

    // Validate campaign_id format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(campaign_id)) {
      console.error("Invalid campaign_id format:", campaign_id);
      return NextResponse.json(
        { error: "Invalid campaign ID format" },
        { status: 400 },
      );
    }

    // Validate platform
    if (!["telegram", "tiktok", "facebook"].includes(platform)) {
      return NextResponse.json(
        { error: "Platform must be one of: telegram, tiktok, facebook" },
        { status: 400 },
      );
    }

    // Validate tone
    if (!["formal", "emotional", "urgent"].includes(tone)) {
      return NextResponse.json(
        { error: "Tone must be one of: formal, emotional, urgent" },
        { status: 400 },
      );
    }

    // Validate language
    if (!["amharic", "afan_oromo", "english"].includes(language)) {
      return NextResponse.json(
        { error: "Language must be one of: amharic, afan_oromo, english" },
        { status: 400 },
      );
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

    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (userRole?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch campaign details
    console.log("Fetching campaign with ID:", campaign_id);
    const { data: campaigns, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, title, description, goal_amount, raised_amount, created_at, updated_at")
      .eq("id", campaign_id);

    if (campaignError) {
      console.error("Campaign fetch error:", campaignError);
      return NextResponse.json(
        { error: `Failed to fetch campaign: ${campaignError.message}` },
        { status: 500 },
      );
    }

    if (!campaigns || campaigns.length === 0) {
      console.error("Campaign not found. ID:", campaign_id);
      // Try to list all campaigns to help debug
      const { data: allCampaigns } = await supabase
        .from("campaigns")
        .select("id, title")
        .limit(5);
      console.log("Available campaigns (first 5):", allCampaigns);
      return NextResponse.json(
        { error: `Campaign not found with ID: ${campaign_id}` },
        { status: 404 },
      );
    }

    const campaign = campaigns[0];
    console.log("Campaign found:", campaign.id, campaign.title);

    // Build system prompt
    const systemPrompt = buildCaptionSystemPrompt(
      platform,
      tone,
      language,
      campaign,
    );

    console.log("System prompt length:", systemPrompt.length);
    console.log("Platform:", platform, "Tone:", tone, "Language:", language);

    const geminiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;
    if (!geminiKey) {
      console.error("Gemini API key not found in environment variables");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 },
      );
    }

    const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          parts: [
            {
              text: `Generate a ${tone} caption for ${platform} in ${language}.`,
            },
          ],
        },
      ],
    };

    console.log("Calling Gemini API:", apiUrl.replace(geminiKey, "***"));
    console.log("Request body preview:", JSON.stringify(requestBody).substring(0, 200));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error("Gemini API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return NextResponse.json(
        {
          error: errorData.error?.message || errorData.message || `Gemini API error: ${response.status} ${response.statusText}`
        },
        { status: 500 },
      );
    }

    const data = await response.json();
    console.log("Gemini API response:", JSON.stringify(data).substring(0, 500));

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0] ||
      !data.candidates[0].content.parts[0].text
    ) {
      console.error("Unexpected API response format:", JSON.stringify(data));
      return NextResponse.json(
        { error: "Invalid response format from AI. Please check server logs." },
        { status: 500 },
      );
    }

    let caption = data.candidates[0].content.parts[0].text.trim();
    // Remove quotation marks if present
    caption = caption.replace(/^["']|["']$/g, "");

    // Save to AI_Captions table
    const { error: insertError } = await supabase.from("ai_captions").insert({
      campaign_id: campaign_id,
      language: language,
      platform: platform,
      tone: tone,
      generated_text: caption,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error saving caption:", insertError);
      // Still return the caption even if save fails
    }

    return NextResponse.json({ caption, saved: true });
  } catch (error: any) {
    console.error("Error generating caption:", error);
    const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to generate caption: ${errorMessage}` },
      { status: 500 },
    );
  }
}
