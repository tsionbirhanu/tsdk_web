"use client";

import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock3, FileText, Loader2, ShieldAlert, Zap } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { memberApiFetch } from "@/lib/member-api";
import { VerificationMethod, verifyPayment } from "@/lib/payment-verification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const GBIR_AMOUNT = 2400;

type GbirPayment = {
  id: string;
  amount: number;
  created_at: string;
  notes: string | null;
  receipt_url: string | null;
  status: string;
  type: string;
  tx_ref: string | null;
  verified_at: string | null;
};

type GbirResponse = {
  currentYear: number;
  obligationAmount: number;
  payments: GbirPayment[];
  summary: {
    totalAmount: number;
    totalCount: number;
    verifiedCount: number;
    pendingCount: number;
    currentYearPaid: boolean;
    currentYearVerified: boolean;
    currentYearPending: boolean;
    currentYearRejected: boolean;
  };
  currentYearRecord: GbirPayment | null;
};

const GbirPage = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [method, setMethod] = useState<VerificationMethod>("cbe");
  const [reference, setReference] = useState("");
  const [suffix, setSuffix] = useState("");
  const [imageSuffix, setImageSuffix] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["gbir-history", user?.id],
    queryFn: async () => memberApiFetch<GbirResponse>("/api/member/gbir"),
    enabled: !!user,
  });

  const gbirPayments = data?.payments || [];
  const currentYear = data?.currentYear || new Date().getFullYear();
  const summary = data?.summary;

  const currentYearRecord = data?.currentYearRecord || null;
  const paymentState = useMemo(() => {
    if (!currentYearRecord) return { label: lang === "am" ? "ክፍያ ይፈጽሙ" : "Pay Now", tone: "default" as const };
    if (currentYearRecord.status === "verified") return { label: lang === "am" ? "ተረጋግጧል" : "Verified", tone: "success" as const };
    if (currentYearRecord.status === "rejected") return { label: lang === "am" ? "ውድቅ" : "Rejected", tone: "danger" as const };
    return { label: lang === "am" ? "በመጠባበቅ" : "Awaiting Verification", tone: "pending" as const };
  }, [currentYearRecord, lang]);

  const paidThisYear = !!currentYearRecord && currentYearRecord.status !== "rejected";

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] || null);
  };

  const handlePay = async () => {
    if (!user) return;
    setPaying(true);
    try {
      await memberApiFetch<{ success: boolean; donation?: GbirPayment }>("/api/member/gbir", {
        method: "POST",
      });
      toast.success(lang === "am" ? "ግብር ምልክት ተደርጓል!" : "Gbir payment initiated!");
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      if (method === "image") {
        if (!selectedFile) {
          toast.error(lang === "am" ? "የደረሰኝ ምስል ይምረጡ" : "Please select a receipt image");
          return;
        }
      } else if (!reference) {
        toast.error(lang === "am" ? "የማረጋገጫ መለያ ያስገቡ" : "Reference is required");
        return;
      }

      const result = await verifyPayment(method, {
        reference: reference || undefined,
        suffix: method === "image" ? imageSuffix || undefined : suffix || undefined,
        file: selectedFile || undefined,
      });

      toast.success(result.success ? (lang === "am" ? "ማረጋገጫ ተሳክቷል" : "Verification successful") : (lang === "am" ? "ማረጋገጫ አልተሳካም" : "Verification failed"));
      setReference("");
      setSuffix("");
      setImageSuffix("");
      setSelectedFile(null);
    } catch (err: any) {
      toast.error(err?.message || (lang === "am" ? "ማረጋገጫ አልተሳካም" : "Verification failed"));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2d1b0e] pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <div className="mb-8 border-b border-[#e8e0d5] pb-6">
          <p className="text-sm italic text-[#8a6b55]">{lang === "am" ? "ሥነ ምግባር" : "Stewardship"}</p>
          <h1 className="mt-2 font-heading text-4xl md:text-5xl text-[#2d1b0e]">
            {lang === "am" ? "ዓመታዊ ግብር" : "Annual Gbir"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#7a5c44]">
            {lang === "am"
              ? "ክፍያዎትን በሪኮርድ ላይ ያድርጉ እና የታሪክ መዝገብዎትን በቀጥታ ይከታተሉ።"
              : "Track your annual tithe, initiate a new record when needed, and keep verification in one place."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="rounded-3xl border border-[#efe1d4] bg-[#f4eee7] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0dfce] text-[#99673e]">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#b07a4b]">
                  {lang === "am" ? "የአሁኑ ዑደት" : "Current Cycle"}
                </p>
                <h2 className="mt-1 font-heading text-2xl text-[#2d1b0e]">{lang === "am" ? "ዓመት" : "Year"} {currentYear}</h2>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-[#e9d7c8] bg-[#fbf8f3] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#b07a4b]">
                    {lang === "am" ? "ክፍያ መጠን" : "Obligation Amount"}
                  </p>
                  <p className="mt-3 font-heading text-4xl text-[#2d1b0e]">
                    {Number(data?.obligationAmount || GBIR_AMOUNT).toLocaleString()} <span className="text-xl text-[#a16d43]">ETB</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-[#efe2d3] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7a5c44]">
                  {paymentState.label}
                </div>
              </div>

              <p className="mt-5 max-w-md text-sm leading-relaxed text-[#7a5c44]">
                {lang === "am"
                  ? "በአሁኑ ዓመት የተረጋገጠ ወይም በመጠባበቅ ላይ ያለ ክፍያ ካለ እዚህ ይታያል።"
                  : "If there is a verified or pending payment for this year, it appears here from the live backend record."}
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs text-[#7a5c44]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
                  <Clock3 className="h-3.5 w-3.5" />
                  {gbirPayments.length} {lang === "am" ? "መዝገቦች" : "records"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
                  <CheckCircle className="h-3.5 w-3.5 text-[#2f855a]" />
                  {summary?.verifiedCount || 0} verified
                </span>
              </div>

              <Button
                onClick={handlePay}
                disabled={paying || paidThisYear}
                className="mt-7 w-full rounded-2xl bg-[#99673e] py-6 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-none transition-colors hover:bg-[#845836] disabled:opacity-50"
              >
                {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {paidThisYear ? paymentState.label : lang === "am" ? "ክፍያ ያስጀምሩ" : "Pay Now"}
              </Button>
              <p className="mt-3 text-center text-[11px] italic text-[#a48e7a]">
                {lang === "am"
                  ? "ክፍያ ከተጀመረ በኋላ በመዝገብ ውስጥ ይታያል።"
                  : "A new backend record will be created only when no current-year active payment exists."}
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-dashed border-[#e0d1c3] bg-white/60 p-5">
              <h3 className="font-heading text-xl text-[#2d1b0e]">{lang === "am" ? "የክፍያ ታሪክ" : "Payment History"}</h3>
              <div className="mt-4 space-y-2">
                {isLoading ? (
                  <p className="rounded-2xl bg-white/80 p-4 text-sm text-[#8a6b55]">{lang === "am" ? "ታሪኩ በመጫን ላይ ነው..." : "Loading live payment history..."}</p>
                ) : gbirPayments.length === 0 ? (
                  <div className="rounded-2xl bg-white/80 p-4 text-sm text-[#7a5c44]">
                    {lang === "am" ? "ገና ምንም የግብር ክፍያ የለም" : "No Gbir payments yet"}
                  </div>
                ) : (
                  gbirPayments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="rounded-2xl bg-white/90 p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-heading text-lg text-[#2d1b0e]">{new Date(payment.created_at).getFullYear()}</p>
                          <p className="text-sm text-[#7a5c44]">{Number(payment.amount).toLocaleString()} ETB</p>
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] bg-[#f7f0e7] text-[#8a6b55]">
                          {payment.status === "verified" ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 text-[#2f855a]" />
                              {lang === "am" ? "ታይቷል" : "Verified"}
                            </>
                          ) : payment.status === "rejected" ? (
                            <>
                              <ShieldAlert className="h-3.5 w-3.5 text-[#b45309]" />
                              {lang === "am" ? "ውድቅ" : "Rejected"}
                            </>
                          ) : (
                            <>
                              <span className="h-2 w-2 rounded-full bg-[#99673e]" />
                              {lang === "am" ? "በመጠባበቅ" : "Pending"}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#efe1d4] bg-[#fbf8f3] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#e8e0d5] pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#b07a4b]">
                  {lang === "am" ? "ክፍያ ማረጋገጫ" : "Verify Your Payment"}
                </p>
                <h3 className="mt-1 font-heading text-2xl text-[#2d1b0e]">
                  {lang === "am" ? "በመዝገብ ላይ ያድርጉ" : "Submit verification details"}
                </h3>
              </div>
              <div className="rounded-2xl bg-[#efe2d3] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7a5c44]">
                {lang === "am" ? "ቀጥታ ባክኤንድ" : "Live backend"}
              </div>
            </div>

            <Tabs value={method} onValueChange={(value) => setMethod(value as VerificationMethod)} className="mt-6">
              <TabsList className="grid h-auto w-full grid-cols-3 bg-[#efe7dd] p-1">
                <TabsTrigger value="cbe">CBE</TabsTrigger>
                <TabsTrigger value="telebirr">Telebirr</TabsTrigger>
                <TabsTrigger value="image">Image</TabsTrigger>
              </TabsList>

              <TabsContent value="cbe" className="space-y-4 pt-5">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6b55]">Reference Number (Required)</label>
                  <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="FTXXXXXXXXXX" className="h-12 rounded-2xl border-[#e0d1c3] bg-white/90 text-[#2d1b0e] placeholder:text-[#b8a594]" />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6b55]">Suffix (Optional)</label>
                  <Input value={suffix} onChange={(event) => setSuffix(event.target.value)} placeholder="Enter account suffix" className="h-12 rounded-2xl border-[#e0d1c3] bg-white/90 text-[#2d1b0e] placeholder:text-[#b8a594]" />
                </div>
              </TabsContent>

              <TabsContent value="telebirr" className="space-y-4 pt-5">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6b55]">Reference Number</label>
                  <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="TXN-XXXXXX" className="h-12 rounded-2xl border-[#e0d1c3] bg-white/90 text-[#2d1b0e] placeholder:text-[#b8a594]" />
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4 pt-5">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6b55]">Receipt Image (Required)</label>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="block w-full rounded-2xl border border-dashed border-[#e0d1c3] bg-white/90 px-4 py-3 text-sm text-[#7a5c44] file:mr-4 file:rounded-xl file:border-0 file:bg-[#99673e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
                  {selectedFile && <p className="mt-2 text-xs text-[#8a6b55]">{selectedFile.name}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6b55]">Suffix (Optional)</label>
                  <Input value={imageSuffix} onChange={(event) => setImageSuffix(event.target.value)} placeholder="Enter suffix" className="h-12 rounded-2xl border-[#e0d1c3] bg-white/90 text-[#2d1b0e] placeholder:text-[#b8a594]" />
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-5 rounded-2xl border border-[#e8d6c5] bg-[#fff7ef] p-4 text-sm text-[#7a5c44]">
              {lang === "am"
                ? "የማስገባት መረጃዎት ከተሳካ በኋላ ማረጋገጫው ይላካል።"
                : "The verification result comes from the live payment verification API."}
            </div>

            <Button
              onClick={handleVerify}
              disabled={verifying}
              className="mt-6 h-12 w-full rounded-2xl border border-[#99673e] bg-transparent text-sm font-semibold uppercase tracking-[0.2em] text-[#99673e] shadow-none hover:bg-[#f4ede4]"
            >
              {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lang === "am" ? "ክፍያ ያረጋግጡ" : "Verify Payment"}
            </Button>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f4eee7] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b07a4b]">{lang === "am" ? "ጠቅላላ መጠን" : "Total Paid"}</p>
                <p className="mt-2 font-heading text-2xl text-[#2d1b0e]">{Number(summary?.totalAmount || 0).toLocaleString()} ETB</p>
              </div>
              <div className="rounded-2xl bg-[#f4eee7] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b07a4b]">{lang === "am" ? "አሁን የተጠበቀ" : "Pending"}</p>
                <p className="mt-2 font-heading text-2xl text-[#2d1b0e]">{summary?.pendingCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GbirPage;
