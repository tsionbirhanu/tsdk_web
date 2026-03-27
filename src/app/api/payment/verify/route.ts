import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { VerifyResponse } from "@/types/payment";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tx_ref = url.searchParams.get("tx_ref");
    if (!tx_ref)
      return NextResponse.json({ error: "tx_ref required" }, { status: 400 });

    const secret = process.env.CHAPA_SECRET_KEY;
    if (!secret) {
      console.error("CHAPA_SECRET_KEY not set");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 },
      );
    }

    const verifyUrl = `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(tx_ref)}`;
    const resp = await axios.get(verifyUrl, {
      headers: { Authorization: `Bearer ${secret}` },
      timeout: 15000,
    });

    const data: VerifyResponse = resp.data;

    // Attempt to reconcile donation record if tx_ref exists in our DB
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const tx = data?.data?.tx_ref || tx_ref;
      const status = data?.data?.status || data?.status;
      if (tx) {
        // treat Chapa 'success' as verified
        const isSuccess =
          String(status).toLowerCase() === "success" ||
          String(status).toLowerCase() === "successful";
        const updates: any = {
          status: isSuccess ? "verified" : "failed",
          raw_response: data,
        };
        if (isSuccess) updates.verified_at = new Date().toISOString();

        await supabase.from("donations").update(updates).eq("tx_ref", tx);
      }
    } catch (e) {
      console.error("Failed reconciling donation record:", e);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("verify error:", err?.response?.data ?? err.message ?? err);
    return NextResponse.json(
      { error: err?.response?.data ?? err.message ?? "Internal error" },
      { status: 500 },
    );
  }
}
