export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { sendTelegram, verifyTelegramAuth } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, chatId, username, hash, ...telegramData } = body ?? {};

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

    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!verifyTelegramAuth({ ...telegramData, hash })) {
      return NextResponse.json({ error: "Invalid Telegram auth" }, { status: 401 });
    }

    const telegramChatId = Number(chatId ?? telegramData.id);
    if (!Number.isFinite(telegramChatId)) {
      return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        telegram_chat_id: telegramChatId,
        telegram_username: username || telegramData.username || null,
        telegram_connected: true,
      })
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    try {
      await sendTelegram(
        telegramChatId,
        "✅ *Welcome to Tsedk Notifications!*\n\nYou will now receive updates about your donations, campaigns and reminders directly here.\n\nGod Bless You!",
      );
    } catch (telegramError) {
      console.error("Telegram welcome message failed:", telegramError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("telegram-connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect Telegram" },
      { status: 500 },
    );
  }
}
