"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import donateBg from "@/assets/donate-bg.jpg";
import { Search, Filter, ArrowRight, PlusCircle } from "lucide-react";

type Category = "All" | "Education" | "Health" | "Building";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  raised: number;
  goal: number;
  status: "Active" | "Paused" | "Completed";
  category: Category;
};

function fmt(n: number): string {
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
    <div className="flex flex-col overflow-hidden rounded-2xl bg-[#f8f5f0] transition-shadow hover:shadow-md h-full">
      <div className="relative h-48 w-full bg-[#e8e0d5]">
        {campaign.image_url ? (
          <img src={campaign.image_url} alt={campaign.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#9a7b5c]">
            No image
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#5c3e1e] shadow-sm">
            {campaign.category}
          </span>
        </div>
        {isActive && (
          <div className="absolute right-3 top-3">
            <span className="flex items-center gap-1 rounded-full bg-[#22c55e] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Active
            </span>
          </div>
        )}
      </div>
      
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-3 font-heading text-xl font-medium text-[#2d1b0e] leading-snug">{campaign.title}</h3>
        <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-[#7a5c44]">
          {campaign.description || "Protecting the 14th-century murals and reinforcing the structural integrity of this historic sanctuary."}
        </p>
        
        <div className="mt-auto">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#9a7b5c]">
            <span>Progress</span>
            <span className="text-[#2d1b0e]">{progress}%</span>
          </div>
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[#e8e0d5]">
            <div className="h-full rounded-full bg-[#966b42]" style={{ width: `${progress}%` }} />
          </div>
          
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9a7b5c]">Raised</p>
              <p className="font-semibold text-[#2d1b0e]">${fmt(campaign.raised)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9a7b5c]">Goal</p>
              <p className="font-semibold text-[#2d1b0e]">${fmt(campaign.goal)}</p>
            </div>
          </div>
          
          <button
            className="w-full rounded-lg bg-[#e8e0d5] py-3 text-sm font-semibold text-[#5c3e1e] transition-colors hover:bg-[#d8c5b2] flex items-center justify-center gap-2"
            onClick={() => onViewDetails(campaign.id)}
          >
            View Details <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DonatePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [modalCampaign, setModalCampaign] = useState<Campaign | null>(null);

  const categories: Category[] = ["All", "Education", "Health", "Building"];

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, title, description, image_url, goal_amount, raised_amount, status, category")
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
          description: row.description,
          image_url: row.image_url,
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
      return matchCat;
    });
  }, [campaigns, activeCategory]);

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-2xl h-[400px] flex flex-col justify-center px-10 md:px-16 lg:px-20 mb-8">
          <Image src={donateBg} alt="Campaign" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block rounded-full bg-[#fceba8] px-4 py-1.5 text-xs font-bold tracking-widest text-[#785b24] uppercase mb-6">
              Sacred Mission
            </span>
            <h1 className="mb-5 text-4xl md:text-5xl lg:text-5xl font-heading text-white leading-tight">
              Preserving the echoes of<br/>eternity, one brick at a time.
            </h1>
            <p className="text-white/90 text-sm md:text-base leading-relaxed max-w-md font-medium">
              Join our collective effort to restore ancient sanctuaries and support the education of the faithful.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  activeCategory === cat
                    ? "bg-[#966b42] text-white"
                    : "bg-[#f4ebe1] text-[#7a5c44] hover:bg-[#e8decb]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
             <button className="flex items-center gap-2 text-sm font-medium text-[#7a5c44]">
               <Filter size={16} />
               Sort by: Newest
             </button>
          </div>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-[#8a7060]">Loading campaigns...</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#8a7060]">No campaigns found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filtered.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onViewDetails={(campaignId) => router.push(`/donate/${campaignId}`)}
              />
            ))}
          </div>
        )}
      </div>

     

      {modalCampaign && <DonationModal campaign={modalCampaign} onClose={() => setModalCampaign(null)} />}
    </div>
  );
}
