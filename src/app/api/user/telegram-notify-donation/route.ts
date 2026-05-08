export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { escapeTelegramMarkdown, sendTelegramToUser } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { donationId } = await req.json();
    if (!donationId) {
      return NextResponse.json({ error: "Missing donationId" }, { status: 400 });
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

    if (!["admin", "treasurer"].includes(roleRow?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select("id, amount, type, user_id, campaign_id")
      .eq("id", donationId)
      .single();

    if (donationError || !donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    const { data: member, error: memberError } = await supabase
      .from("profiles")
      .select(
        "full_name, telegram_connected, telegram_chat_id, telegram_username",
      )
      .eq("user_id", donation.user_id)
      .single();

    if (memberError || !member?.telegram_connected || !member.telegram_chat_id) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const { data: campaign } = donation.campaign_id
      ? await supabase
          .from("campaigns")
          .select("title")
          .eq("id", donation.campaign_id)
          .single()
      : { data: null };

    try {
      await sendTelegramToUser(
        member,
        `💝 *Donation Confirmed!*\n\nAmount: ${Number(donation.amount).toLocaleString()} ETB\nCampaign: ${escapeTelegramMarkdown(campaign?.title || donation.type)}\n\nGod Bless You, ${escapeTelegramMarkdown(member.full_name || "Beloved Member")}!`,
      );
    } catch (telegramError) {
      console.error("Telegram donation notification failed:", telegramError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("telegram-notify-donation error:", error);
    return NextResponse.json(
      { error: "Failed to notify donation" },
      { status: 500 },
    );
  }
}
