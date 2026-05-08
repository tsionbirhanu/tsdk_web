import { createHash, createHmac, timingSafeEqual } from "crypto";

type TelegramProfile = {
  telegram_connected?: boolean | null;
  telegram_chat_id?: number | null;
};

type TelegramAuthData = Record<string, string | number | undefined | null> & {
  hash?: string;
};

export async function sendTelegram(
  chatId: number | string,
  message: string,
): Promise<boolean> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("TELEGRAM_BOT_TOKEN is not set");
      throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("Telegram sendMessage failed:", response.status, body);
      throw new Error(`Telegram API error: ${response.status} - ${body}`);
    }

    console.log("Telegram message sent successfully to chat:", chatId);
    return true;
  } catch (error) {
    console.error("Telegram sendMessage error:", error);
    throw error;
  }
}

export function escapeTelegramMarkdown(text: string): string {
  return String(text).replace(/([_*[\]()`])/g, "\\$1");
}

export function verifyTelegramAuth(data: TelegramAuthData): boolean {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !data?.hash) return false;

  const { hash, ...fields } = data;
  const dataCheckString = Object.keys(fields)
    .filter((key) => fields[key] !== undefined && fields[key] !== null)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");

  const secretKey = createHash("sha256").update(token).digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const hashBuffer = Buffer.from(String(hash), "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");
  if (hashBuffer.length !== computedBuffer.length) return false;

  return timingSafeEqual(hashBuffer, computedBuffer);
}

export async function sendTelegramToUser(
  user: TelegramProfile,
  message: string,
): Promise<boolean> {
  if (!user?.telegram_connected || !user?.telegram_chat_id) {
    console.warn("User Telegram not connected or missing chat_id", {
      connected: user?.telegram_connected,
      chatId: user?.telegram_chat_id,
    });
    return false;
  }
  try {
    return await sendTelegram(user.telegram_chat_id, message);
  } catch (error) {
    console.error("Failed to send Telegram to user:", error);
    return false;
  }
}

export async function broadcastTelegram(
  supabase: any,
  message: string,
): Promise<number> {
  const { data: members, error } = await supabase
    .from("profiles")
    .select("telegram_chat_id, telegram_connected")
    .eq("telegram_connected", true)
    .not("telegram_chat_id", "is", null);

  if (error) throw error;

  let successCount = 0;
  for (const member of members || []) {
    if (member.telegram_chat_id) {
      try {
        const sent = await sendTelegram(member.telegram_chat_id, message);
        if (sent) successCount++;
      } catch (error) {
        console.error(`Failed to send broadcast to ${member.telegram_chat_id}:`, error);
      }
    }
  }

  return successCount;
}
