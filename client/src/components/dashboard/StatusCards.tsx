import React from "react";
import { StatusCard, StatusIcon } from "@/components/ui/status-card";
import { Check, GitCommit } from "lucide-react";

export default function StatusCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatusCard
        title="Application Status"
        status="Online"
        value="Healthy"
        icon={<Check className="text-success" />}
        footerText="Last checked: 5 minutes ago"
      />

      <StatusCard
        title="API Status"
        status="All Systems Go"
        value="26"
        footerText="Endpoints Monitored"
        icon={
          <div className="text-xs text-neutral-500 ml-2">
            <span><StatusIcon status="online" /> 24 Online</span>
            <span className="ml-2"><StatusIcon status="warning" /> 2 Degraded</span>
          </div>
        }
      />

      <StatusCard
        title="Build Status"
        status="Passing"
        value="#243"
        icon={<GitCommit className="text-success" />}
        footerText="Deployed 2 hours ago"
      />
    </div>
  );
}
