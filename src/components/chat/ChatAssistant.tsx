"use client";

import React from "react";
import { FloatingChatButton } from "./FloatingChatButton";
import { FloatingChatPanel } from "./FloatingChatPanel";

/**
 * Main Chat Assistant Component
 * Contains floating button and chat panel
 * Should be rendered in the layout or providers
 */
export function ChatAssistant() {
  return (
    <>
      <FloatingChatButton />
      <FloatingChatPanel />
    </>
  );
}
