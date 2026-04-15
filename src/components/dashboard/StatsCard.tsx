"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: "up" | "down" | boolean;
  color?: "blue" | "yellow" | "green" | "red" | "purple" | "indigo";
  backgroundColor?: string;
  isLoading?: boolean;
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "blue",
  backgroundColor,
  isLoading = false,
}: StatsCardProps) {
  // Map color to backgroundColor if not explicitly provided
  const bgColorClass =
    backgroundColor ||
    {
      blue: "bg-blue-50",
      yellow: "bg-yellow-50",
      green: "bg-green-50",
      red: "bg-red-50",
      purple: "bg-purple-50",
      indigo: "bg-indigo-50",
    }[color];

  const borderColorClass = {
    blue: "border-blue-200",
    yellow: "border-yellow-200",
    green: "border-green-200",
    red: "border-red-200",
    purple: "border-purple-200",
    indigo: "border-indigo-200",
  }[color];

  const iconColorClass = {
    blue: "text-blue-700",
    yellow: "text-yellow-700",
    green: "text-green-700",
    red: "text-red-700",
    purple: "text-purple-700",
    indigo: "text-indigo-700",
  }[color];

  const textColorClass = {
    blue: "text-blue-900",
    yellow: "text-yellow-900",
    green: "text-green-900",
    red: "text-red-900",
    purple: "text-purple-900",
    indigo: "text-indigo-900",
  }[color];

  return (
    <div
      className={`${bgColorClass} rounded-xl border ${borderColorClass}/30 p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-white/50 flex items-center justify-center">
          <Icon className={`w-6 h-6 ${iconColorClass}`} />
        </div>
        {trend === "up" && (
          <div className="text-sm font-semibold text-green-600">↑ Up</div>
        )}
        {trend === "down" && (
          <div className="text-sm font-semibold text-red-600">↓ Down</div>
        )}
      </div>
      <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
      {isLoading ? (
        <div className="h-8 bg-gray-200 rounded animate-pulse w-20" />
      ) : (
        <p className={`text-3xl font-bold ${textColorClass}`}>{value}</p>
      )}
    </div>
  );
}
