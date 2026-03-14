import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const CHAPA_CHECKOUT_URL = "https://api.chapa.co/v1/transaction/initialize";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const body = await req.json();
    const { type, amount, first_name, last_name, email, selet_id, return_url } = body;

    if (!type || !amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (!["aserat", "selet", "gbir"].includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tx_ref = `${type}_${user.id}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // create donation record so we can reconcile later
    const { error: insErr } = await supabase.from("donations").insert({
      user_id: user.id,
      amount: Number(amount),
      type,
      status: "initiated",
      tx_ref,
      selet_id: selet_id || null,
    });
    if (insErr) {
      console.error("Failed creating donation record", insErr);
      return NextResponse.json({ error: insErr }, { status: 500 });
    }

    const secret = process.env.CHAPA_SECRET_KEY;
    if (!secret) {
      console.error("CHAPA_SECRET_KEY not set");
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    const callback_url = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/payment/verify?tx_ref=${encodeURIComponent(tx_ref)}`;
    const payload = {
      amount: String(amount),
      currency: "ETB",
      email: email || user.email,
      first_name: first_name || user.user_metadata?.first_name || user.user_metadata?.full_name || "",
      last_name: last_name || user.user_metadata?.last_name || "",
      tx_ref,
      callback_url,
      return_url: return_url || `${process.env.NEXT_PUBLIC_BASE_URL || ""}/`,
    };

    const resp = await axios.post(CHAPA_CHECKOUT_URL, payload, {
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      timeout: 15000,
    });

    const data = resp.data;
    const checkout_url = data?.data?.checkout_url || data?.checkout_url;
    if (!checkout_url) {
      console.error("Chapa response missing checkout_url", data);
      return NextResponse.json({ error: "Payment provider did not return checkout URL", raw: data }, { status: 502 });
    }

    return NextResponse.json({ ok: true, checkout_url, tx_ref });
  } catch (err: any) {
    console.error("initiate payment error:", err?.response?.data ?? err.message ?? err);
    return NextResponse.json({ error: err?.response?.data ?? err.message ?? "Internal error" }, { status: 500 });
  }
}
