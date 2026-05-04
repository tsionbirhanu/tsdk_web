import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GBIR_AMOUNT = 2400;

async function getAuthenticatedUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const currentYear = new Date().getFullYear();

    const { data: donations } = await supabase
      .from("donations")
      .select("id, amount, created_at, notes, status, type, tx_ref, verified_at, receipt_url")
      .eq("user_id", user.id)
      .eq("type", "gbir")
      .order("created_at", { ascending: false });

    const records = donations || [];
    const currentYearRecords = records.filter((record: any) => new Date(record.created_at).getFullYear() === currentYear);
    const currentYearVerified = currentYearRecords.find((record: any) => record.status === "verified") || null;
    const currentYearPending = currentYearRecords.find((record: any) => record.status === "pending") || null;
    const currentYearRejected = currentYearRecords.find((record: any) => record.status === "rejected") || null;

    return NextResponse.json({
      currentYear,
      obligationAmount: GBIR_AMOUNT,
      payments: records,
      summary: {
        totalAmount: records.reduce((sum: number, record: any) => sum + Number(record.amount || 0), 0),
        totalCount: records.length,
        verifiedCount: records.filter((record: any) => record.status === "verified").length,
        pendingCount: records.filter((record: any) => record.status === "pending").length,
        currentYearPaid: !!currentYearVerified || !!currentYearPending,
        currentYearVerified: !!currentYearVerified,
        currentYearPending: !!currentYearPending,
        currentYearRejected: !!currentYearRejected,
      },
      currentYearRecord: currentYearVerified || currentYearPending || currentYearRejected || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Gbir payments";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const currentYear = new Date().getFullYear();

    const { data: existingPayments } = await supabase
      .from("donations")
      .select("id, status, created_at")
      .eq("user_id", user.id)
      .eq("type", "gbir")
      .gte("created_at", `${currentYear}-01-01T00:00:00.000Z`)
      .lt("created_at", `${currentYear + 1}-01-01T00:00:00.000Z`)
      .order("created_at", { ascending: false });

    const activeRecord = (existingPayments || []).find((record: any) => record.status !== "rejected");
    if (activeRecord) {
      return NextResponse.json({
        success: true,
        existing: true,
        donation: activeRecord,
      });
    }

    const { data, error } = await supabase
      .from("donations")
      .insert({
        user_id: user.id,
        amount: GBIR_AMOUNT,
        type: "gbir",
        status: "pending",
        notes: `Gbir ${currentYear}`,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, donation: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Gbir record";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
