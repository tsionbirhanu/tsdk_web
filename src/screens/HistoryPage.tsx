"use client";

import { useI18n } from "@/lib/i18n";
import { ArrowDownToLine, BookOpen, CheckCircle, Church, CreditCard, Filter, Heart, RefreshCw, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { memberApiFetch } from "@/lib/member-api";

type FilterType = "all" | "offerings" | "aserat" | "selet" | "gbir";

type HistoryRecord = {
  id: string;
  amount: number;
  campaign_id: string | null;
  created_at: string;
  notes: string | null;
  receipt_url: string | null;
  selet_id: string | null;
  status: string;
  type: string;
  tx_ref: string | null;
  verified_at: string | null;
  is_anonymous: boolean;
};

type HistoryResponse = {
  member: {
    id: string;
    fullName: string;
    email: string | null;
  };
  summary: {
    totalAmount: number;
    verifiedAmount: number;
    totalCount: number;
    verifiedCount: number;
    byType: {
      offerings: number;
      aserat: number;
      selet: number;
      gbir: number;
    };
  };
  donations: HistoryRecord[];
};

const HistoryPage = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data, refetch, isLoading, isFetching, error } = useQuery({
    queryKey: ["history", user?.id],
    queryFn: async () => memberApiFetch<HistoryResponse>("/api/member/history"),
    enabled: !!user,
  });

  const donations = data?.donations || [];
  const summary = data?.summary;

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: t("history.all") || "All" },
    { key: "offerings", label: t("history.donations") || "Offerings" },
    { key: "aserat", label: t("history.tithes") || "Aserat" },
    { key: "selet", label: t("history.vows") || "Vows" },
    { key: "gbir", label: t("history.gbir") || "Gbir" },
  ];

  const filtered = useMemo(() => {
    if (filter === "all") return donations;

    if (filter === "offerings") {
      return donations.filter((donation) => !["aserat", "selet", "gbir"].includes(donation.type));
    }

    return donations.filter((donation) => donation.type === filter);
  }, [donations, filter]);

  const total = filtered.reduce((sum, donation) => sum + Number(donation.amount || 0), 0);
  const verifiedTotal = filtered
    .filter((donation) => donation.status === "verified")
    .reduce((sum, donation) => sum + Number(donation.amount || 0), 0);

  const getIcon = (type: string) => {
    if (type === "aserat") return BookOpen;
    if (type === "selet") return Church;
    if (type === "gbir") return CreditCard;
    return Heart;
  };

  const getLabel = (type: string) => {
    if (type === "aserat") return lang === "am" ? "ደወል" : "Aserat";
    if (type === "selet") return lang === "am" ? "ጸሎት" : "Vow";
    if (type === "gbir") return lang === "am" ? "ግብር" : "Gbir";
    return lang === "am" ? "ስጦታ" : "Offering";
  };

  const exportCsv = () => {
    if (!filtered.length) return;

    const header = ["Type", "Amount", "Status", "Date", "Notes", "Reference"];
    const rows = filtered.map((donation) => [
      getLabel(donation.type),
      String(donation.amount),
      donation.status,
      new Date(donation.created_at).toISOString(),
      donation.notes || "",
      donation.tx_ref || "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `donation-history-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2d1b0e] pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <div className="mb-8 flex flex-col gap-3 border-b border-[#e8e0d5] pb-6">
          <p className="text-sm italic text-[#8a6b55]">{lang === "am" ? "የሥጦታ ታሪክ" : "Stewardship Archive"}</p>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl text-[#2d1b0e]">
                {t("history.title") || "Donation History"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#7a5c44]">
                {lang === "am"
                  ? "ለእርስዎ የተረጋገጡ እና የሚጠብቁ ክፍያዎች በሙሉ የሚታዩ የታሪክ መዝገብ።"
                  : "A live record of your offerings, tithes, vows, and Gbir contributions pulled directly from the backend."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-full border border-[#d9c6b5] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#6d4d36] transition-colors hover:bg-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {lang === "am" ? "አዘምን" : "Refresh"}
              </button>
              <button
                onClick={exportCsv}
                disabled={!filtered.length}
                className="inline-flex items-center gap-2 rounded-full border border-[#d9c6b5] bg-[#efe7dd] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#6d4d36] transition-colors hover:bg-[#e6dbcd] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                {lang === "am" ? "CSV ያውርዱ" : "Export CSV"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative overflow-hidden rounded-3xl border border-[#efe1d4] bg-[#f4eee7] p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#b07a4b]">
              {lang === "am" ? "ጠቅላላ ስጦታ" : "Total Given"}
            </p>
            <p className="mt-3 font-heading text-4xl md:text-5xl text-[#2d1b0e]">
              {total.toLocaleString()} ETB
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#7a5c44]">
              {lang === "am"
                ? "ይህ መዝገብ ለአሁኑ ተመሳሳይ ምድብ የተገኙ ግብይቶችን ያሳያል።"
                : "This archive reflects only live records returned by the backend for your account."}
            </p>
            <div className="mt-6 flex items-center gap-3 text-sm text-[#7a5c44]">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5">
                <ShieldAlert className="h-4 w-4 text-[#8a6b55]" />
                {filtered.length} {lang === "am" ? "መዝገቦች" : "records"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5">
                <CheckCircle className="h-4 w-4 text-[#2f855a]" />
                {verifiedTotal.toLocaleString()} ETB verified
              </span>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-8 rounded-full bg-[radial-gradient(circle,rgba(176,122,75,0.12),transparent_68%)]" />
          </div>

          <div className="rounded-3xl border border-[#c9a37f] bg-[#99673e] p-6 text-white shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#f4d4b2]">
              {lang === "am" ? "የተረጋገጡ መዝገቦች" : "Verified Records"}
            </p>
            <p className="mt-4 text-4xl font-heading">{summary?.verifiedCount ?? 0}</p>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm leading-relaxed text-[#fff4e9]">
              {lang === "am"
                ? "ሁሉም የተረጋገጡ ክፍያዎች በመዝገብ ላይ ይገኛሉ።"
                : "Verified payments stay in the archive with the date and reference captured from the backend."}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm transition-colors ${
                  filter === f.key
                    ? "border-[#99673e] text-[#99673e]"
                    : "border-transparent text-[#8f7a68] hover:text-[#5f4633]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#8f7a68]">
            <Filter className="h-4 w-4" />
            {lang === "am" ? "የተቀመጠ ማጣሪያ" : "Live filter"}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="rounded-3xl border border-dashed border-[#e0d1c3] bg-white/60 p-10 text-center text-sm text-[#8a6b55]">
              {lang === "am" ? "ታሪኩ በመጫን ላይ ነው..." : "Loading your live archive..."}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-dashed border-[#d8b6b6] bg-[#fff6f5] p-10 text-center text-sm text-[#9b4d4d]">
              {lang === "am" ? "መዝገቡን መጫን አልቻልንም።" : "We could not load the archive."}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#e0d1c3] bg-white/60 p-10 text-center">
              <p className="text-sm text-[#7a5c44]">
                {lang === "am" ? "እስካሁን መዝገብ የለም" : "No archive records yet"}
              </p>
              <p className="mt-2 text-xs text-[#a48e7a]">
                {lang === "am"
                  ? "ስጦታ ሲከፈል እዚህ ይታያል።"
                  : "Your verified records will appear here once payments are saved in the backend."}
              </p>
            </div>
          ) : (
            filtered.map((tx) => {
              const Icon = getIcon(tx.type);
              const typeLabel = getLabel(tx.type);
              const yearLabel = new Date(tx.created_at).getFullYear();
              const note = tx.notes && tx.notes !== `${typeLabel} ${yearLabel}` ? tx.notes : null;

              return (
                <div key={tx.id} className="rounded-3xl border border-[#efe1d4] bg-white/85 p-4 shadow-sm transition-colors hover:bg-white">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f1e4d7] text-[#99673e]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-heading text-lg text-[#2d1b0e]">{typeLabel}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#a48e7a]">
                            {new Date(tx.created_at).toLocaleDateString(lang === "am" ? "am-ET" : "en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                            {tx.tx_ref ? ` · ${tx.tx_ref}` : ""}
                          </p>
                        </div>
                        <div className="text-left lg:text-right">
                          <p className="font-heading text-2xl text-[#2d1b0e]">{Number(tx.amount).toLocaleString()} ETB</p>
                          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] bg-[#f7f0e7] text-[#8a6b55]">
                            {tx.status === "verified" ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 text-[#2f855a]" />
                                {lang === "am" ? "ታይቷል" : "Verified"}
                              </>
                            ) : tx.status === "rejected" ? (
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
                      {note && <p className="mt-3 text-sm leading-relaxed text-[#7a5c44]">{note}</p>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 flex justify-center">
              <button
                onClick={() => refetch()}
            className="rounded-full border border-[#d9c6b5] bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#6d4d36] transition-colors hover:bg-[#f4ede4]"
          >
            {isFetching ? (lang === "am" ? "በመስቀል ላይ..." : "Refreshing...") : lang === "am" ? "ተጨማሪ መዝገቦች" : "Load more archive records"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;