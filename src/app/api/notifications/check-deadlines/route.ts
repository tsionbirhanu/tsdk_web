import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_THRESHOLD_MS = 30 * DAY_MS;

function formatDateRangeForYear(year: number) {
  const start = new Date(Date.UTC(year, 0, 1)).toISOString();
  const end = new Date(Date.UTC(year + 1, 0, 1)).toISOString();
  return { start, end };
}

async function getUserFromToken(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return { user, supabase };
}

async function hasRecentNotification(
  supabase: any,
  userId: string,
  type: string,
  withinDays = 30,
) {
  const threshold = new Date(Date.now() - withinDays * DAY_MS).toISOString();
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", threshold)
    .limit(1);
  return !!(data && data.length > 0);
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userResult = await getUserFromToken(token);
    if (!userResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, supabase } = userResult;
    const userId = user.id;

    const now = new Date();
    const results: Record<string, boolean> = {
      aseratDue: false,
      gbirDue: false,
      seletDue: false,
    };

    // Aserat due: if no verified aserat payment in the last 30 days
    const { data: aseratPayments } = await supabase
      .from("donations")
      .select("created_at")
      .eq("user_id", userId)
      .eq("type", "aserat")
      .eq("status", "verified")
      .order("created_at", { ascending: false })
      .limit(1);

    const lastAseratDate = aseratPayments?.[0]?.created_at
      ? new Date(aseratPayments[0].created_at)
      : null;

    const aseratIsDue =
      !lastAseratDate || now.getTime() - lastAseratDate.getTime() > DUE_THRESHOLD_MS;
    if (aseratIsDue) {
      const type = "due_aserat";
      const alreadyNotified = await hasRecentNotification(supabase, userId, type);
      if (!alreadyNotified) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "Aserat payment due",
          title_am: "አስራት እድርስ ታሰር",
          body: "No Aserat payment has been verified in the last month. Please submit your tithe to stay up to date.",
          body_am:
            "በስር ወር የተረጋገጠ አስራት ክፍያ የተገኘ አይደለም። እባክዎን እርስዎን እንዲያደርጉ ክፍያውን ያቀርቡ።",
          type,
        });
      }
      results.aseratDue = true;
    }

    // Gbir due: if no verified gbir payment for the current year
    const currentYear = now.getFullYear();
    const { start: yearStart, end: yearEnd } = formatDateRangeForYear(currentYear);

    const { data: gbirPayments } = await supabase
      .from("donations")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "gbir")
      .eq("status", "verified")
      .gte("created_at", yearStart)
      .lt("created_at", yearEnd)
      .limit(1);

    const gbirIsDue = !gbirPayments || gbirPayments.length === 0;
    if (gbirIsDue) {
      const type = "due_gbir";
      const alreadyNotified = await hasRecentNotification(supabase, userId, type);
      if (!alreadyNotified) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: `Gbir payment due for ${currentYear}`,
          title_am: `የ${currentYear} ግብር ክፍያ ይገባል`,
          body: `You have not yet made a verified Gbir payment for ${currentYear}. Please submit your receipt to stay compliant.`,
          body_am: `እስካሁን ድረስ ለ${currentYear} የግብር ክፍያ አልከፈላችሁም። እባኮትን የክፍያ ደረሰኝ ያስገቡ።`,
          type,
        });
      }
      results.gbirDue = true;
    }

    // Selet due: active selets with pending balance and no payment in last 30 days
    const { data: activeSelets } = await supabase
      .from("selets")
      .select("id, created_at, total_amount, paid_amount, status")
      .eq("user_id", userId)
      .eq("status", "active");

    const selet = activeSelets?.[0];
    if (selet && Number(selet.paid_amount) < Number(selet.total_amount)) {
      const { data: seletPayments } = await supabase
        .from("donations")
        .select("created_at")
        .eq("user_id", userId)
        .eq("type", "selet")
        .eq("status", "verified")
        .order("created_at", { ascending: false })
        .limit(1);

      const lastSeletDate = seletPayments?.[0]?.created_at
        ? new Date(seletPayments[0].created_at)
        : new Date(selet.created_at);

      const seletIsDue = now.getTime() - lastSeletDate.getTime() > DUE_THRESHOLD_MS;
      if (seletIsDue) {
        const type = "due_selet";
        const alreadyNotified = await hasRecentNotification(supabase, userId, type);
        if (!alreadyNotified) {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "Selet installment due",
            title_am: "ሰለት ክፍያ ይገባል",
            body: "Your Selet installment is due. Please submit a payment to stay on schedule.",
            body_am: "ሰለት ክፍያዎ ይገባል። እባኮትን ክፍያ ያስገቡ።",
            type,
          });
        }
        results.seletDue = true;
      }
    }

    return NextResponse.json({ ok: true, due: results });
  } catch (error) {
    console.error("check-deadlines error:", error);
    return NextResponse.json({ error: "Failed to check deadlines" }, { status: 500 });
  }
}
