"use client";

import React from "react";
import axios from "axios";

type Props = {
  amount: number;
  email: string;
  firstName: string;
  lastName: string;
  currency?: string;
  callbackUrl?: string;
  returnUrl?: string;
  children?: React.ReactNode;
};

export default function PaymentButton({
  amount,
  email,
  firstName,
  lastName,
  currency = "ETB",
  callbackUrl,
  returnUrl,
  children,
}: Props) {
  const [loading, setLoading] = React.useState(false);

  const handlePay = async () => {
    try {
      setLoading(true);
      const tx_ref = `tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      const res = await axios.post("/api/payment/create-checkout", {
        amount,
        currency,
        email,
        first_name: firstName,
        last_name: lastName,
        tx_ref,
        callback_url: callbackUrl,
        return_url: returnUrl,
      });

      const checkout_url = res.data?.checkout_url || res.data?.data?.checkout_url;
      if (!checkout_url) throw new Error("No checkout URL returned");

      // Redirect to Chapa checkout
      window.location.assign(checkout_url);
    } catch (err: any) {
      console.error("Payment init error:", err?.response?.data ?? err.message ?? err);
      alert(err?.response?.data?.error || err?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className={`px-4 py-2 rounded ${loading ? "opacity-60 cursor-wait" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
      {loading ? "Processing…" : children || `Pay ${amount}`}
    </button>
  );
}
