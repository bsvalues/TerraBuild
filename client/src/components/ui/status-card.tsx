import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusIconProps {
  status: "online" | "warning" | "offline";
  className?: string;
}

function StatusIcon({ status, className }: StatusIconProps) {
  return (
    <span
      className={cn(
        "w-2.5 h-2.5 rounded-full inline-block mr-1.5",
        {
          "bg-success": status === "online",
          "bg-warning": status === "warning",
          "bg-danger": status === "offline",
        },
        className
      )}
    />
  );
}

export interface StatusCardProps {
  title: string;
  status: string;
  statusType?: "success" | "warning" | "danger" | "default";
  value: string | number;
  icon?: React.ReactNode;
  footerText: string;
  className?: string;
}

export function StatusCard({
  title,
  status,
  statusType = "success",
  value,
  icon,
  footerText,
  className,
}: StatusCardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-neutral-200 p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
        <Badge variant={statusType}>{status}</Badge>
      </div>
      <div className="flex items-center">
        <div className="text-2xl font-bold text-neutral-600">{value}</div>
        {icon && <span className="ml-2">{icon}</span>}
      </div>
      <div className="mt-2 text-xs text-neutral-400">{footerText}</div>
    </div>
  );
}

export { StatusIcon };
