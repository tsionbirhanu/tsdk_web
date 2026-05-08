export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { broadcastTelegram, escapeTelegramMarkdown } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId } = await req.json();
    if (!campaignId) {
      return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });
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

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleRow?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, title, goal_amount")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
      const campaignUrl = `${baseUrl}/dashboard/donate/${campaign.id}`;
      const notified = await broadcastTelegram(
        supabase,
        `📢 *New Campaign Launched!*\n\n${escapeTelegramMarkdown(campaign.title)}\nGoal: ${Number(campaign.goal_amount).toLocaleString()} ETB\n\nDonate here: ${campaignUrl}`,
      );
      return NextResponse.json({ success: true, notified });
    } catch (telegramError) {
      console.error("Telegram campaign notification failed:", telegramError);
      return NextResponse.json({ success: true, notified: 0 });
    }
  } catch (error) {
    console.error("telegram-notify-campaign error:", error);
    return NextResponse.json(
      { error: "Failed to notify campaign launch" },
      { status: 500 },
    );
  }
}
