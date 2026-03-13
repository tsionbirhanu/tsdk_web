import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import type { VerifyResponse } from "@/types/payment";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tx_ref = url.searchParams.get("tx_ref");
    if (!tx_ref) return NextResponse.json({ error: "tx_ref required" }, { status: 400 });

    const secret = process.env.CHAPA_SECRET_KEY;
    if (!secret) {
      console.error("CHAPA_SECRET_KEY not set");
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    const verifyUrl = `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(tx_ref)}`;
    const resp = await axios.get(verifyUrl, {
      headers: { Authorization: `Bearer ${secret}` },
      timeout: 15000,
    });

    const data: VerifyResponse = resp.data;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("verify error:", err?.response?.data ?? err.message ?? err);
    return NextResponse.json({ error: err?.response?.data ?? err.message ?? "Internal error" }, { status: 500 });
  }
}
