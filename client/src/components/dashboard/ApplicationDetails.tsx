import React from "react";
import { APP_DETAILS } from "@/data/constants";

export default function ApplicationDetails() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
      <h3 className="text-sm font-medium text-neutral-500 mb-3">Application Details</h3>
      <div className="space-y-2">
        {APP_DETAILS.map((detail, index) => (
          <div className="flex justify-between items-center" key={index}>
            <div className="text-xs text-neutral-500">{detail.label}:</div>
            <div className={`text-xs font-medium ${detail.variant === 'success' ? 'text-success' : 'text-neutral-600'}`}>
              {detail.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
