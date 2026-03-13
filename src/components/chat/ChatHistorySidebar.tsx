"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ChatSession } from "@/context/ChatContext";
import { useChat } from "@/context/ChatContext";

interface ChatHistorySidebarProps {
  isOpen: boolean;
  history: ChatSession[];
  onLoadSession: (sessionId: string) => void;
}

export function ChatHistorySidebar({
  isOpen,
  history,
  onLoadSession,
}: ChatHistorySidebarProps) {
  const { activeSessionId } = useChat();

  return (
    <aside
      className={`absolute inset-y-0 left-0 z-20 flex w-56 flex-col border-r border-[#2F2F2F] bg-[#1B1B1B] transition-transform duration-200 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
      {/* Header */}
      <div className="p-4 border-b border-[#2F2F2F]">
        <h3 className="font-semibold text-white text-sm">Chat History</h3>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center text-[#888888] text-xs">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {history.map((session) => (
              <div key={session.sessionId} className="group">
                <button
                  onClick={() => onLoadSession(session.sessionId)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate ${
                    activeSessionId === session.sessionId
                      ? "bg-[#2F2F2F] text-white"
                      : "text-[#A0A0A0] hover:bg-[#252525]"
                  }`}>
                  <p className="font-medium truncate">{session.title}</p>
                  <p className="text-xs text-[#707070]">
                    {formatDistanceToNow(new Date(session.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
                      ? "bg-[#2F2F2F] text-white"
                      : "text-[#AAAAAA] hover:bg-[#262626] hover:text-[#E8E8E8]"
                  }`}
                  title={conv.title}>
                  {conv.title}
                </button>
                <div className="px-3 py-1 text-xs text-[#666666]">
                  {format(new Date(conv.updatedAt), "MMM d, HH:mm")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete All Button */}
      {conversations.length > 0 && (
        <div className="border-t border-[#2F2F2F] p-3">
          <button
            onClick={() => {
              conversations.forEach((conv) => deleteConversation(conv.id));
            }}
            className="w-full px-3 py-2 text-xs text-[#FF6B6B] hover:bg-[#2F2F2F] rounded-md transition-colors flex items-center justify-center gap-2">
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      )}
    </aside>
  );
}
