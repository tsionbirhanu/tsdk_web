"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [generated, setGenerated] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch("/api/campaigns");
        if (!response.ok) throw new Error("Failed to fetch campaigns");
        const data = await response.json();
        setCampaigns(data);
      } catch (e) {
        console.error(e);
      }
    }
    fetchCampaigns();
  }, []);

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
        <Select
          onValueChange={setSelectedCampaign}
          value={selectedCampaign}
          disabled={campaigns.length === 0}>
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
        <Button
          onClick={handleGenerate}
          disabled={!selectedCampaign || isLoading}
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
                <p>{caption}</p>
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
      };
      addMessage(currentConversationId, errorMessage);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleCopyCaption = (caption: string, index: number) => {
    navigator.clipboard.writeText(caption);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#1F1F1F]">
      {/* Form */}
      <div className="p-4 border-b border-[#2F2F2F] space-y-3 bg-[#252525]">
        <div>
          <label className="block text-xs font-semibold text-[#E8E8E8] mb-1">
            Campaign Name
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g., Summer Sale 2026"
            className="w-full px-3 py-2 bg-[#1F1F1F] text-white placeholder-[#888888] rounded-lg border border-[#3F3F3F] focus:outline-none focus:border-[#4F4F4F] text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-[#E8E8E8] mb-1">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 bg-[#1F1F1F] text-white rounded-lg border border-[#3F3F3F] focus:outline-none focus:border-[#4F4F4F] text-sm">
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="playful">Playful</option>
              <option value="urgent">Urgent</option>
              <option value="inspirational">Inspirational</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#E8E8E8] mb-1">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 bg-[#1F1F1F] text-white rounded-lg border border-[#3F3F3F] focus:outline-none focus:border-[#4F4F4F] text-sm">
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter/X</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!campaignName.trim() || generating}
          className="w-full py-2 bg-[#1E40AF] hover:bg-[#1E3EA8] disabled:bg-[#555555] text-white rounded-lg transition-colors text-sm font-semibold">
          {generating ? "Generating..." : "Generate Captions"}
        </button>
      </div>

      {/* Generated Captions */}
      <div className="flex-1 overflow-y-auto p-4">
        {generatedCaptions.length > 0 ? (
          <div className="space-y-3">
            {generatedCaptions.map((caption, index) => (
              <div
                key={index}
                className="p-3 bg-[#2F2F2F] border border-[#3F3F3F] rounded-lg group">
                <p className="text-sm text-[#E8E8E8] mb-2">{caption}</p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopyCaption(caption, index)}
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-[#1F1F1F] hover:bg-[#3F3F3F] text-[#E8E8E8] rounded transition-colors">
                    <Copy size={12} />
                    {copiedIndex === index ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[#888888] py-8">
            <p className="text-sm">
              Enter campaign details and generate captions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
