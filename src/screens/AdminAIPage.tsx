"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { CaptionGenerator } from "@/components/chat/CaptionGenerator";
import { Sparkles, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminAIPage() {
  const { hasRole } = useAuth();

  const isAdmin = hasRole("admin");

  if (!isAdmin) {
    return (
      <div className="h-[calc(100vh-73px)] flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground mb-4">
            Only admins can access the AI Administration Assistant.
          </p>
          <Link href="/admin" className="text-primary hover:underline">
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20 gold-glow">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Admin AI Assistant
                </h1>
                <p className="text-sm text-muted-foreground">
                  Generate social media captions for campaigns
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <CaptionGenerator />
      </div>
    </div>
  );
}
