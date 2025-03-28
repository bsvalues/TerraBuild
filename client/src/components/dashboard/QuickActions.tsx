import React from "react";
import { QUICK_ACTIONS } from "@/data/constants";
import { useToast } from "@/hooks/use-toast";

export default function QuickActions() {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: "Action initiated",
      description: `The ${action} action has been started.`,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
      <h3 className="text-sm font-medium text-neutral-500 mb-3">Quick Actions</h3>
      <div className="space-y-2">
        {QUICK_ACTIONS.map((action, index) => (
          <button 
            key={index}
            className="w-full flex items-center justify-between bg-neutral-100 rounded-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-200"
            onClick={() => handleAction(action.action)}
          >
            <span className="flex items-center">
              <i className={`${action.icon} mr-2 text-primary`}></i>
              {action.name}
            </span>
            <i className="ri-arrow-right-s-line text-neutral-400"></i>
          </button>
        ))}
      </div>
    </div>
  );
}
