"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PaymentCard from "@/components/PaymentCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import donateBg from "@/assets/donate-bg.jpg";
type Category = "All" | "Education" | "Health" | "Building";

type Campaign = {
  id: string;
  title: string;
  raised: number;
  goal: number;
  status: "Active" | "Paused" | "Completed";
  category: Category;
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function pct(raised: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

function normalizeCategory(category?: string | null): Category {
  const value = (category || "").toLowerCase();
  if (value === "education") return "Education";
  if (value === "health") return "Health";
  return "Building";
}

function DonationModal({
  campaign,
  onClose,
}: {
  campaign: Campaign;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#5b2d0f] px-5 py-4">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#c8956e]">
              Donating to
            </p>
            <p className="max-w-[420px] text-sm font-semibold text-[#fdf3e3]">{campaign.title}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg text-[#fdf3e3]"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <PaymentCard campaignId={campaign.id} defaultAmount={campaign.goal > 0 ? Math.min(campaign.goal, 100) : 100} />
        </div>
      </div>
    </div>
  );
}

function CampaignCard({
  campaign,
  onViewDetails,
}: {
  campaign: Campaign;
  onViewDetails: (campaignId: string) => void;
}) {
  const progress = pct(campaign.raised, campaign.goal);
  const isActive = campaign.status === "Active";

  return (
    <div className="mb-3 rounded-xl border border-[#eadfd2] bg-[#fbf7f1] p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="max-w-[70%] text-[15px] font-semibold leading-6 text-[#3d1a00]">{campaign.title}</p>
        <span
          className={`mt-0.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
            isActive
              ? "bg-[#e8f5e9] text-[#2e7d32]"
              : campaign.status === "Paused"
                ? "bg-[#f5f0e8] text-[#8a7060]"
                : "bg-[#edf3ff] text-[#3559a6]"
          }`}
        >
          {campaign.status}
        </span>
      </div>

      <div className="mb-1 h-1.5 overflow-hidden rounded bg-[#e0d0c0]">
        <div className="h-full rounded bg-[#c8956e]" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs font-medium text-[#c8956e]">{fmt(campaign.raised)} Raised</p>
        <p className="text-xs text-[#8a7060]">{fmt(campaign.goal)} Goal</p>

        <div className="ml-auto flex items-center gap-3">
          <button
            className="rounded-md border border-[#7a4a24] bg-[#7a4a24] px-3 py-1.5 text-xs font-semibold text-white shadow-sm glow-breathe transition-transform duration-200 hover:scale-105 active:scale-95 hover:bg-[#6a3f1f]"
            onClick={() => onViewDetails(campaign.id)}
          >
            View Details
          </button>
          {!isActive && (
            <span className="text-[11px] italic text-[#8a7060]">Donations paused</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DonatePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [modalCampaign, setModalCampaign] = useState<Campaign | null>(null);

  const categories: Category[] = ["All", "Education", "Health", "Building"];

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, title, goal_amount, raised_amount, status, category")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => {
        const goal = Number(row.goal_amount || 0);
        const raised = Number(row.raised_amount || 0);
        const statusFromDb = (row.status || "").toLowerCase();

        let status: Campaign["status"] = "Active";
        if (statusFromDb === "paused") status = "Paused";
        else if (goal > 0 && raised >= goal) status = "Completed";

        return {
          id: row.id,
          title: row.title || "Untitled campaign",
          raised,
          goal,
          status,
          category: normalizeCategory(row.category),
        } satisfies Campaign;
      });
    },
  });

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchCat = activeCategory === "All" || c.category === activeCategory;
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [campaigns, activeCategory, search]);

  return (
    <div className="min-h-screen bg-[#faf6f0]">
      <div className="relative overflow-hidden px-6 pb-9 pt-12">
        <Image src={donateBg} alt="Campaigns" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2d1000]/72 to-[#5c2a00]/62" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <h1 className="mb-1 text-3xl font-bold text-[#fdf3e3]">Campaigns</h1>
          <p className="text-sm text-[#c8956e]">Support your Orthodox community — give freely, give faithfully.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="relative mb-4">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="#8a7060"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" />
          </svg>
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#e4d5c6] bg-white/95 px-4 py-3 pl-10 text-sm text-[#3d1a00] outline-none"
          />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium ${
                activeCategory === cat
                  ? "border-[#7a4a24] bg-[#7a4a24] text-[#fff7ec]"
                  : "border-[#e4d5c6] bg-white/95 text-[#7a5c44]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-[#8a7060]">Loading campaigns...</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#8a7060]">No campaigns found.</p>
        ) : (
          filtered.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onViewDetails={(campaignId) => router.push(`/donate/${campaignId}`)}
            />
          ))
        )}
      </div>

      <button
        onClick={() => {
          const firstActive = campaigns.find((c) => c.status === "Active") || campaigns[0];
          if (firstActive) setModalCampaign(firstActive);
        }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#7a4a24] shadow-[0_4px_20px_rgba(122,74,36,0.35)]"
        title="Quick Donate"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#f5d8a0" strokeWidth="2" strokeLinecap="round">
          <path d="M11 4v14M4 11h14" />
        </svg>
      </button>

      {modalCampaign && <DonationModal campaign={modalCampaign} onClose={() => setModalCampaign(null)} />}
    </div>
  );
}







