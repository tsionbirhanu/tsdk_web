import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_CAPTION_SYSTEM_PROMPT = `You are a social media manager for a church organization called TSEDK. Your task is to generate 3 exciting, engaging, and shareable social media captions for a fundraising campaign. The campaign details are provided below.

Guidelines:
- The captions should be in Amharic.
- Each caption must include relevant hashtags (e.g., #TSEDK, #EthiopianChurch, #Fundraising, #Community).
- Each caption must have a clear call-to-action, encouraging people to donate.
- The tone should be inspiring, hopeful, and community-focused.
- You must generate exactly 3 distinct options.
- Present the output as a JSON object with a single key "captions" which is an array of 3 strings.
- Do not add any other text, greetings, or explanations. Just the JSON.

Example Output:
{
  "captions": [
    "Caption 1...",
    "Caption 2...",
    "Caption 3..."
  ]
}`;

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json();
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  if (!campaignId) {
    return NextResponse.json(
      { error: "Campaign ID is required" },
      { status: 400 }
    );
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  const campaignDetails = `Campaign Details:\n${JSON.stringify(
    campaign,
    null,
    2
  )}`;

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
        system: ADMIN_CAPTION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: campaignDetails }],
      }),
    });

    const data = await response.json();
    const rawContent = data.content[0].text;

    // Attempt to parse the JSON from the response
    const captionsJson = JSON.parse(rawContent);

    // Save the generated captions to the database
    await supabase.from("ai_captions").insert({
      campaign_id: campaignId,
      generated_captions: captionsJson.captions,
      created_by: user.id,
    });

    return NextResponse.json(captionsJson);
  } catch (error) {
    console.error("Error generating captions:", error);
    return NextResponse.json(
      { error: "Failed to generate captions" },
      { status: 500 }
    );
  }
}
