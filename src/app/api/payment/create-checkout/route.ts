import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import type { CreateCheckoutRequest, CreateCheckoutResponse } from "@/types/payment";

const CHAPA_CHECKOUT_URL = "https://api.chapa.co/v1/transaction/initialize";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateCheckoutRequest;

    const amount = body.amount;
    const currency = body.currency || "ETB";
    const email = body.email;
    const first_name = body.first_name;
    const last_name = body.last_name;
    const tx_ref = body.tx_ref || `tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const callback_url = body.callback_url || `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/payment/verify?tx_ref=${tx_ref}`;
    const return_url = body.return_url || `${process.env.NEXT_PUBLIC_BASE_URL || ""}/`;

    if (!amount || !email || !first_name || !last_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payload = {
      amount: String(amount),
      currency,
      email,
      first_name,
      last_name,
      tx_ref,
      callback_url,
      return_url,
    };

    const secret = process.env.CHAPA_SECRET_KEY;
    if (!secret) {
      console.error("CHAPA_SECRET_KEY not set");
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    const resp = await axios.post(CHAPA_CHECKOUT_URL, payload, {
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    // Chapa typically returns { status, message, data: { checkout_url, ... } }
    const data = resp.data;
    const checkout_url = data?.data?.checkout_url || data?.checkout_url;

    if (!checkout_url) {
      console.error("Chapa response missing checkout_url", data);
      return NextResponse.json({ error: "Payment provider did not return checkout URL", raw: data }, { status: 502 });
    }

    const result: CreateCheckoutResponse = { checkout_url, raw: data };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("create-checkout error:", err?.response?.data ?? err.message ?? err);
    return NextResponse.json({ error: err?.response?.data ?? err.message ?? "Internal error" }, { status: 500 });
  }
}
