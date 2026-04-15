"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "approved" | "rejected" | "pending" | "submitted";
  title: string;
  description?: string;
  timestamp: Date | string;
  actor?: string;
  metadata?: Record<string, any>;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

export function ActivityTimeline({
  events,
  isLoading = false,
}: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "approved":
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case "rejected":
        return <XCircle className="w-6 h-6 text-red-500" />;
      case "pending":
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case "submitted":
        return <Clock className="w-6 h-6 text-blue-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case "approved":
        return "border-green-500 bg-green-50";
      case "rejected":
        return "border-red-500 bg-red-50";
      case "pending":
        return "border-yellow-500 bg-yellow-50";
      case "submitted":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case "approved":
        return "text-green-900";
      case "rejected":
        return "text-red-900";
      case "pending":
        return "text-yellow-900";
      case "submitted":
        return "text-blue-900";
      default:
        return "text-gray-900";
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const timestamp =
          event.timestamp instanceof Date
            ? event.timestamp
            : new Date(event.timestamp);

        return (
          <div key={event.id} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              {/* Icon */}
              <div className="mb-2">{getIcon(event.type)}</div>
              {/* Vertical line */}
              {!isLast && (
                <div className="w-1 h-12 bg-gradient-to-b from-gray-300 to-gray-200" />
              )}
            </div>

            {/* Content */}
            <div
              className={`flex-1 p-4 rounded-lg border-l-4 ${getColorClass(event.type)} mb-2`}>
              <div className="flex justify-between items-start mb-1">
                <h4 className={`font-semibold ${getTextColor(event.type)}`}>
                  {event.title}
                </h4>
                <span className="text-xs text-gray-600">
                  {formatDistanceToNow(timestamp, { addSuffix: true })}
                </span>
              </div>

              {event.description && (
                <p
                  className={`text-sm ${getTextColor(event.type)} opacity-75 mb-2`}>
                  {event.description}
                </p>
              )}

              {event.actor && (
                <div className="text-xs text-gray-600">
                  By: <span className="font-medium">{event.actor}</span>
                </div>
              )}

              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300 text-xs text-gray-600 space-y-1">
                  {Object.entries(event.metadata).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium capitalize">{key}:</span>{" "}
                      {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
