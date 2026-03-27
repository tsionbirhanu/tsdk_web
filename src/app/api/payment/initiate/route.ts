import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const CHAPA_CHECKOUT_URL = "https://api.chapa.co/v1/transaction/initialize";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const body = await req.json();
    const { type, amount, first_name, last_name, email, selet_id, return_url } =
      body;

    if (!type || !amount)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (!["aserat", "selet", "gbir"].includes(type))
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    // Validate required Chapa fields
    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        {
          error:
            "Missing required payment fields: first_name, last_name, email",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Generate a shorter tx_ref (max 50 chars for Chapa)
    // Format: type(6) + user_id_first8(8) + timestamp_last10(10) + random4(4) = ~28 chars
    const userShort = user.id.substring(0, 8).replace(/-/g, "");
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    let tx_ref = `${type}_${userShort}_${timestamp}_${random}`;

    // Ensure it doesn't exceed 50 characters
    if (tx_ref.length > 50) {
      // Fallback: use even shorter format
      const shortType = type.substring(0, 3); // ase, sel, gbi
      const tx_ref_short = `${shortType}${userShort}${timestamp}${random}`;
      if (tx_ref_short.length <= 50) {
        tx_ref = tx_ref_short;
      } else {
        // Last resort: use minimal format
        const minimalHash =
          user.id.split("-")[0] +
          Date.now().toString().slice(-8) +
          Math.floor(Math.random() * 9999);
        tx_ref = `${shortType}_${minimalHash}`.substring(0, 50);
      }
    }

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
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 },
      );
    }

    const callback_url = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/payment/verify?tx_ref=${encodeURIComponent(tx_ref)}`;
    const payload = {
      amount: String(amount),
      currency: "ETB",
      email: email, // Use provided email (already validated)
      first_name: first_name, // Use provided first_name (already validated)
      last_name: last_name, // Use provided last_name (already validated)
      tx_ref,
      callback_url,
      return_url: return_url || `${process.env.NEXT_PUBLIC_BASE_URL || ""}/`,
    };

    const resp = await axios.post(CHAPA_CHECKOUT_URL, payload, {
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    const data = resp.data;
    const checkout_url = data?.data?.checkout_url || data?.checkout_url;
    if (!checkout_url) {
      console.error("Chapa response missing checkout_url", data);
      return NextResponse.json(
        { error: "Payment provider did not return checkout URL", raw: data },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, checkout_url, tx_ref });
  } catch (err: any) {
    console.error(
      "initiate payment error:",
      err?.response?.data ?? err.message ?? err,
    );
    return NextResponse.json(
      { error: err?.response?.data ?? err.message ?? "Internal error" },
      { status: 500 },
    );
  }
}
