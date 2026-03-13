"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
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
  name: string;
}

export function CaptionGenerator() {
  const { generateCaptions, isLoading, error } = useChat();
  const { session } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [generated, setGenerated] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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
    if (!selectedCampaign || !generateCaptions) return;
    setGenerated([]);
    const result = await generateCaptions(selectedCampaign);
    if (result && result.captions) {
      setGenerated(result.captions);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          onClick={handleGenerate}
          disabled={!selectedCampaign || isLoading || campaignsLoading}
          className="w-full">
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Generate Captions"
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs mt-2 p-2 bg-red-500/10 rounded-md">
          <AlertTriangle size={16} />
          <p>{error}</p>
        </div>
      )}

      {generated.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#2F2F2F] flex-1 overflow-y-auto">
          <h4 className="font-semibold text-white mb-2">Generated Captions:</h4>
          <div className="space-y-3">
            {generated.map((caption, index) => (
              <div
                key={index}
                className="p-3 bg-[#252525] rounded-md text-sm text-gray-200 relative">
                <p className="pr-8 whitespace-pre-wrap break-words">
                  {caption}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 h-7 w-7"
                  onClick={() => handleCopy(caption, index)}>
                  <Copy size={14} />
                </Button>
                {copiedIndex === index && (
                  <span className="absolute bottom-2 right-2 text-xs text-green-400">
                    Copied!
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
