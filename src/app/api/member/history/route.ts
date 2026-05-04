import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function summarizeDonations(donations: Array<Record<string, any>>) {
  const knownTypes = new Set(["aserat", "selet", "gbir"]);

  const summary = {
    totalAmount: 0,
    verifiedAmount: 0,
    totalCount: donations.length,
    verifiedCount: 0,
    byType: {
      offerings: 0,
      aserat: 0,
      selet: 0,
      gbir: 0,
    },
  };

  for (const donation of donations) {
    const amount = Number(donation.amount || 0);
    summary.totalAmount += amount;

    if (donation.status === "verified") {
      summary.verifiedAmount += amount;
      summary.verifiedCount += 1;
    }

    if (donation.type === "aserat") summary.byType.aserat += amount;
    else if (donation.type === "selet") summary.byType.selet += amount;
    else if (donation.type === "gbir") summary.byType.gbir += amount;
    else if (donation.campaign_id || !knownTypes.has(donation.type)) summary.byType.offerings += amount;
  }

  return summary;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const [{ data: profile }, { data: donations }] = await Promise.all([
      supabase.from("profiles").select("full_name, email, user_id").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("donations")
        .select("id, amount, campaign_id, created_at, notes, receipt_url, selet_id, status, type, tx_ref, verified_at, is_anonymous")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const records = donations || [];

    return NextResponse.json({
      member: {
        id: user.id,
        fullName: profile?.full_name || user.user_metadata?.full_name || "Member",
        email: profile?.email || user.email || null,
      },
      summary: summarizeDonations(records),
      donations: records,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
