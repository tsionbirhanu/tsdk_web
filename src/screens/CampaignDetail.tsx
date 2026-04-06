"use client";

import AppHeader from "@/components/AppHeader";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { Progress } from "@/components/ui/progress";
import {
  Heart,
  ArrowLeft,
  Package,
  Upload,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import crossIcon from "@/assets/cross-icon.jpg";

const amounts = [100, 500, 1000, 5000];

const CampaignDetail = () => {
  const { t, lang } = useI18n();
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, session } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const finalAmount = selectedAmount || Number(customAmount) || 0;

  const handleDonate = async () => {
    if (!user) {
      toast.error("Please sign in to donate");
      return;
    }
    if (finalAmount <= 0) {
      toast.error("Please select an amount");
      return;
    }
    if (!receiptFile) {
      toast.error(
        lang === "am"
          ? "áŠ¥á‰£áŠ­á‹Ž á‹¨áŠ­áá‹« áˆ›áˆ¨áŒ‹áŒˆáŒ« áˆµáŠ­áˆªáŠ•áˆ¾á‰µ á‹«áˆµáŒˆá‰¡"
          : "Please upload payment receipt/screenshot",
      );
      return;
    }

    setSubmitting(true);
    try {
      // Upload receipt image
      const ext = receiptFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("receipts")
        .upload(filePath, receiptFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);

      // Create donation record
      const donorNote = isAnonymous
        ? "Donor: Anonymous"
        : `Donor: ${displayName.trim() || "Name not provided"}`;

      const { error: donateErr } = await supabase.from("donations").insert({
        user_id: user.id,
        campaign_id: id,
        amount: finalAmount,
        type: "donation",
        status: "pending",
        is_anonymous: isAnonymous,
        receipt_url: urlData.publicUrl,
        notes: `Campaign: ${campaign?.title} | ${donorNote}`,
      });
      if (donateErr) throw donateErr;

      setSubmitted(true);
      toast.success(
        lang === "am"
          ? "áˆáŒˆáˆ³á‹Ž á‰°áˆáŠ³áˆ! áˆ›áˆ¨áŒ‹áŒˆáŒ« á‹­áŒ á‰¥á‰á¢"
          : "Donation submitted! Awaiting verification.",
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit donation";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChapaDonate = async () => {
    if (!user) {
      toast.error("Please sign in to donate");
      return;
    }
    if (finalAmount <= 0) {
      toast.error("Please select an amount");
      return;
    }

    const fullName =
      displayName.trim() ||
      (typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : "") ||
      user?.email?.split("@")[0] ||
      "Donor";
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ") || "User";

    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        body: JSON.stringify({
          type: 'donation',
          amount: finalAmount,
          campaign_id: id,
          email: user?.email,
          first_name: firstName,
          last_name: lastName,
          is_anonymous: isAnonymous,
          donor_name: isAnonymous ? null : displayName.trim() || fullName,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || json?.error || 'Failed initiating payment');
      }
      const json = await res.json();
      if (json.checkout_url) {
        window.location.href = json.checkout_url;
      } else {
        toast.error('No checkout URL');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Payment failed');
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  if (!campaign)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Campaign not found
      </div>
    );

  const percent =
    Number(campaign.goal_amount) > 0
      ? (Number(campaign.raised_amount) / Number(campaign.goal_amount)) * 100
      : 0;
  const title =
    lang === "am" && campaign.title_am
      ? campaign.title_am
      : lang === "om" && campaign.title_om
        ? campaign.title_om
        : campaign.title;
  const description =
    lang === "am" && campaign.description_am
      ? campaign.description_am
      : lang === "om" && campaign.description_om
        ? campaign.description_om
        : campaign.description;

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in px-4 bg-[#faf6f0] text-[#3b2411]">
        <div className="p-4 rounded-full bg-primary/20 mb-4">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-xl font-heading font-bold text-foreground mb-2">
          {lang === "am" ? "áˆáŒˆáˆ³á‹Ž á‰°áˆáŠ³áˆ!" : "Donation Submitted!"}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {lang === "am"
            ? "á‹¨áŠ­áá‹« áˆ›áˆ¨áŒ‹áŒˆáŒ«á‹Ž áˆˆáŒˆáŠ•á‹˜á‰¥ á‹«á‹¥ á‰°áˆáŠ³áˆá¢ áˆ²áˆ¨áŒ‹áŒˆáŒ¥ áˆ›áˆ³á‹ˆá‰‚á‹« á‹­á‹°áˆ­áˆµá‹Žá‰³áˆá¢"
            : "Your payment receipt has been sent to the treasurer. You'll be notified once verified."}
        </p>
        <Button onClick={() => router.push("/donate")} className="rounded-xl">
          {lang === "am"
            ? "á‹ˆá‹° á‹˜áˆ˜á‰»á‹Žá‰½ á‹­áˆ˜áˆˆáˆ±"
            : "Back to Campaigns"}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#3b2411]">
      <div className="sticky top-0 z-40 border-b border-[#d8c1aa] bg-[#ecddce]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="rounded-full p-1 hover:bg-[#f3e3cf]">
            <ArrowLeft className="w-5 h-5 text-[#3b2411]" />
          </button>
          <h1 className="truncate text-lg font-heading font-bold text-[#3b2411]">
            {campaign.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-4 animate-fade-in">
        <div className="relative h-40 overflow-hidden rounded-2xl">
          <img
            src={campaign.image_url || crossIcon.src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/24 to-black/38" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-lg font-heading font-bold text-[#fdf3e3] drop-shadow-md">
              {title}
            </h2>
          </div>
        </div>

        <div className="rounded-xl border border-[#eadfd2] bg-white/85 p-4 space-y-3 shadow-sm backdrop-blur-sm">
          <Progress value={percent} className="h-3" />
          <div className="flex justify-between">
            <div>
              <p className="text-lg font-heading font-bold text-primary">
                {Number(campaign.raised_amount).toLocaleString()}{" "}
                {t("common.birr")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("donate.raised")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-heading font-bold text-primary" >
                {Number(campaign.goal_amount).toLocaleString()}{" "}
                {t("common.birr")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("donate.goal")}
              </p>
            </div>
          </div>
        </div>

        {description && (
          <div>
            <h3 className="mb-2 font-heading font-semibold text-[#3b2411]">
              {lang === "am" ? "áˆµáˆˆ á‹˜áˆ˜á‰»á‹" : "About"}
            </h3>
            <p className="text-sm leading-relaxed text-[#4b2e18]/80">
              {description}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-[#3b2411]">
            {lang === "am" ? "áˆ˜áŒ áŠ• á‹­áˆáˆ¨áŒ¡" : "Select Amount"}
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {amounts.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setSelectedAmount(amt);
                  setCustomAmount("");
                }}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  selectedAmount === amt
                    ? "bg-[#7a4a24] text-white border-[#7a4a24] shadow-md"
                    : "bg-white/95 text-[#3b2411] border-[#e4d5c6] hover:border-[#8b5829]/30"
                }`}>
                {amt}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder={
              lang === "am" ? "áˆŒáˆ‹ áˆ˜áŒ áŠ•..." : "Custom amount..."
            }
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            className="w-full rounded-xl border border-[#e4d5c6] bg-white/95 px-4 py-2.5 text-sm text-[#3b2411] placeholder:text-[#8a7060] focus:outline-none focus:ring-2 focus:ring-[#8b5829]/25"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-[#eadfd2] bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-semibold text-[#3b2411]">
                {lang === "am" ? "የስም ግልፅነት" : "Donor Visibility"}
              </h3>
              <p className="text-xs text-[#8a7060]">
                {lang === "am"
                  ? "ስምዎን ማሳየት ወይም በስውር መስጠት ይችላሉ"
                  : "Donate publicly or keep your name hidden"}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isAnonymous}
              onClick={() => setIsAnonymous((prev) => !prev)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                isAnonymous ? "bg-[#7a4a24]" : "bg-[#d8c1aa]"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                  isAnonymous ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <p className="text-xs font-medium text-[#7a5c44]">
            {isAnonymous
              ? lang === "am"
                ? "በስውር ይሰጣሉ"
                : "Anonymous"
              : lang === "am"
                ? "ስም ይታያል"
                : "Public name"}
          </p>

          {!isAnonymous && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={lang === "am" ? "ስም (አማራጭ)" : "Your name (optional)"}
              className="w-full rounded-xl border border-[#e4d5c6] bg-white px-4 py-2.5 text-sm text-[#3b2411] placeholder:text-[#8a7060] focus:outline-none focus:ring-2 focus:ring-[#8b5829]/25"
            />
          )}
        </div>

        {/* Receipt Upload */}
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-[#3b2411]">
            {lang === "am"
              ? "á‹¨áŠ­áá‹« áˆ›áˆ¨áŒ‹áŒˆáŒ« áˆµáŠ­áˆªáŠ•áˆ¾á‰µ"
              : "Payment Receipt / Screenshot"}
          </h3>
          <p className="text-xs text-[#8a7060]">
            {lang === "am"
              ? "áŠ­áá‹«á‹áŠ• áŠ¨áˆáŒ¸áˆ™ á‰ áŠ‹áˆ‹ á‹¨áŠ­áá‹« áˆ›áˆ¨áŒ‹áŒˆáŒ« áˆµáŠ­áˆªáŠ•áˆ¾á‰µ á‹«áˆµáŒˆá‰¡"
              : "After making your payment, upload a screenshot of your payment confirmation"}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 5 * 1024 * 1024) {
                  toast.error("File must be under 5MB");
                  return;
                }
                setReceiptFile(file);
              }
            }}
          />

          {receiptFile ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#eadfd2] bg-white/90 p-3 shadow-sm">
              <img
                src={URL.createObjectURL(receiptFile)}
                alt="Receipt preview"
                className="w-16 h-16 rounded-lg object-cover border border-[#eadfd2]"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-[#3b2411]">
                  {receiptFile.name}
                </p>
                <p className="text-xs text-[#8a7060]">
                  {(receiptFile.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReceiptFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="rounded-lg text-xs">
                {lang === "am" ? "á‰€á‹­áˆ­" : "Change"}
              </Button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-[#e4d5c6] p-6 flex flex-col items-center gap-2 bg-white/80 transition-colors hover:border-[#8b5829]/30">
              <Upload className="w-8 h-8 text-[#8a7060]" />
              <span className="text-sm text-[#8a7060]">
                {lang === "am"
                  ? "áˆµáŠ­áˆªáŠ•áˆ¾á‰µ áˆˆáˆ˜áˆµá‰€áˆ á‹­áŒ«áŠ‘"
                  : "Tap to upload screenshot"}
              </span>
            </button>
          )}
        </div>

        <div className="space-y-2 pb-4">
          <Button onClick={handleChapaDonate} disabled={finalAmount <= 0 || submitting}
            className="w-full rounded-xl border-0 bg-[#7a4a24] py-6 text-base font-semibold text-white shadow-md disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
            {lang === "am" ? "በChapa ክፈል" : "Pay with Chapa"} {finalAmount > 0 ? ` - ${finalAmount.toLocaleString()} ${t("common.birr")}` : ""}
          </Button>

          <Button
            onClick={handleDonate}
            disabled={submitting || finalAmount <= 0 || !receiptFile}
            variant="outline"
            className="w-full rounded-xl border-[#e4d5c6] bg-white/90 py-4 text-base font-semibold text-[#3b2411]">
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Heart className="w-4 h-4 mr-2" />
            )}
            {submitting
              ? lang === "am"
                ? "á‰ áˆ˜áˆ‹áŠ­ áˆ‹á‹­..."
                : "Submitting..."
              : `${t("donate.donateNow")} ${finalAmount > 0 ? `- ${finalAmount.toLocaleString()} ${t("common.birr")}` : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
