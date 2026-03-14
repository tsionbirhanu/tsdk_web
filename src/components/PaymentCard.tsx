"use client";

import React from "react";
import PaymentButton from "@/components/PaymentButton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  campaignId: string;
  defaultAmount?: number;
};

export default function PaymentCard({ campaignId, defaultAmount = 100 }: Props) {
  const { user } = useAuth();
  const [amount, setAmount] = React.useState<number>(defaultAmount);
  const [custom, setCustom] = React.useState<string>("");
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  React.useEffect(() => {
    if (custom) {
      const n = Number(custom || 0);
      if (!Number.isNaN(n) && n > 0) setAmount(n);
    }
  }, [custom]);

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const presets = [100, 500, 1000, 5000];

  // editable contact fields (fall back to profile/user)
  const [emailInput, setEmailInput] = React.useState<string>(user?.email || profile?.email || "");
  const [firstNameInput, setFirstNameInput] = React.useState<string>((profile?.full_name || "").split(" ")[0] || "");
  const [lastNameInput, setLastNameInput] = React.useState<string>((profile?.full_name || "").split(" ").slice(1).join(" ") || "");

  React.useEffect(() => {
    // sync when profile loads
    if (profile) {
      setEmailInput(profile.email || user?.email || "");
      setFirstNameInput((profile.full_name || "").split(" ")[0] || "");
      setLastNameInput((profile.full_name || "").split(" ").slice(1).join(" ") || "");
    }
  }, [profile, user]);

  return (
    <div className="mt-3 p-4 bg-secondary rounded-md border border-border">
      <div className="mb-3">
        <div className="text-sm font-medium text-foreground mb-2">Select Amount</div>
        <div className="grid grid-cols-4 gap-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => { setAmount(p); setCustom(""); }}
              className={`px-3 py-2 rounded-md text-sm ${amount === p ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Custom amount..."
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="mt-3 w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground"
        />
      </div>

      <div className="mb-3">
        <div className="text-sm font-medium text-foreground mb-2">Payment Receipt / Screenshot</div>
        <label className="block border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer bg-card">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          {previewUrl ? (
            <img src={previewUrl} alt="screenshot" className="mx-auto max-h-40 object-contain" />
          ) : (
            <div className="text-sm text-muted-foreground">Tap to upload screenshot</div>
          )}
        </label>
      </div>

      <div className="mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="email"
            placeholder="Email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground"
          />
          <input
            type="text"
            placeholder="First name"
            value={firstNameInput}
            onChange={(e) => setFirstNameInput(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground"
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastNameInput}
            onChange={(e) => setLastNameInput(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Paying for campaign</div>
        <PaymentButton
          amount={amount}
          email={emailInput}
          firstName={firstNameInput}
          lastName={lastNameInput}
          disabled={!emailInput || !firstNameInput || !lastNameInput || Number(amount) <= 0}
        >
          Pay now
        </PaymentButton>
      </div>
    </div>
  );
}
