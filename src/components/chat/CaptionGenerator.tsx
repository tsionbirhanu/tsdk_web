"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Copy, AlertTriangle } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  title_am?: string;
  title_om?: string;
  description?: string;
  goal_amount?: number;
  raised_amount?: number;
  status?: string;
}

export function CaptionGenerator() {
  const { session } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [platform, setPlatform] = useState<"telegram" | "tiktok" | "facebook">("telegram");
  const [tone, setTone] = useState<"formal" | "emotional" | "urgent">("formal");
  const [language, setLanguage] = useState<"amharic" | "afan_oromo" | "english">("english");
  const [generated, setGenerated] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<boolean>(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        setCampaignsLoading(true);
        setCampaignError(null);

        const headers: any = { "Content-Type": "application/json" };
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const response = await fetch("/api/campaigns", { headers });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to fetch campaigns");
        }
        const data = await response.json();
        setCampaigns(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error("Campaign fetch error:", e);
        setCampaignError(e.message || "Failed to load campaigns");
        setCampaigns([]);
      } finally {
        setCampaignsLoading(false);
      }
    }

    if (session?.access_token) {
      fetchCampaigns();
    }
  }, [session?.access_token]);

  const handleGenerate = async () => {
    if (!selectedCampaign) {
      setError("Please select a campaign");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerated("");

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const payload = {
        campaign_id: selectedCampaign,
        platform,
        tone,
        language,
      };

      console.log("Sending caption generation request:", payload);

      const response = await fetch("/api/chat/admin/caption", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate caption");
      }

      const result = await response.json();
      if (result.caption) {
        setGenerated(result.caption);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e: any) {
      console.error("Caption generation error:", e);
      setError(e.message || "Failed to generate caption");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generated) {
      navigator.clipboard.writeText(generated);
      setCopiedIndex(true);
      setTimeout(() => setCopiedIndex(false), 2000);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="space-y-4">
        <h3 className="font-semibold text-white">
          Generate Social Media Captions
        </h3>

        {campaignError && (
          <div className="flex items-center gap-2 text-red-500 text-xs p-2 bg-red-500/10 rounded-md">
            <AlertTriangle size={16} />
            <p>{campaignError}</p>
          </div>
        )}

        {campaignsLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-gray-400">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-gray-400">No campaigns available</p>
        ) : (
          <Select onValueChange={setSelectedCampaign} value={selectedCampaign}>
            <SelectTrigger>
              <SelectValue placeholder="Select a campaign..." />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Platform</label>
          <div className="flex gap-2">
            {(["telegram", "tiktok", "facebook"] as const).map((p) => (
              <Button
                key={p}
                type="button"
                variant={platform === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPlatform(p)}
                className="flex-1 capitalize">
                {p}
              </Button>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Tone</label>
          <div className="flex gap-2">
            {(["formal", "emotional", "urgent"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={tone === t ? "default" : "outline"}
                size="sm"
                onClick={() => setTone(t)}
                className="flex-1 capitalize">
                {t}
              </Button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Language</label>
          <div className="flex gap-2">
            {(["amharic", "afan_oromo", "english"] as const).map((l) => (
              <Button
                key={l}
                type="button"
                variant={language === l ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage(l)}
                className="flex-1 capitalize">
                {l === "afan_oromo" ? "Afan Oromo" : l}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!selectedCampaign || isGenerating || campaignsLoading}
          className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin mr-2" />
              Generating...
            </>
          ) : (
            "Generate Caption"
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs mt-2 p-2 bg-red-500/10 rounded-md">
          <AlertTriangle size={16} />
          <p>{error}</p>
        </div>
      )}

      {generated && (
        <div className="mt-4 pt-4 border-t border-[#2F2F2F] flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-white">Generated Caption:</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8">
              <Copy size={14} className="mr-2" />
              {copiedIndex ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="p-3 bg-[#252525] rounded-md text-sm text-gray-200">
            <p className="whitespace-pre-wrap break-words">{generated}</p>
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1">
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
