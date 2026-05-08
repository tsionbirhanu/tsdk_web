import { createHash, createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
  }

  const testId = 5956547555;
  const testData = {
    id: testId,
    first_name: "Test",
    username: "test_user",
    auth_date: Math.floor(Date.now() / 1000),
  };

  const dataCheckString = Object.keys(testData)
    .sort()
    .map((key) => `${key}=${testData[key]}`)
    .join("\n");

  const secretKey = createHash("sha256").update(token).digest();
  const hash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return NextResponse.json({
    ...testData,
    hash,
  });
}
