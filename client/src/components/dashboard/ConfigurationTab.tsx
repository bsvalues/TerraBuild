import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function ConfigurationTab() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const updateSetting = useMutation({
    mutationFn: ({ key, value }: { key: string, value: string }) => 
      apiRequest("PATCH", `/api/settings/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    }
  });

  const toggleSetting = (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    updateSetting.mutate({ key, value: newValue });
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading configuration...</div>;
  }

  // Helper to get setting value
  const getSetting = (key: string) => {
    const setting = settings?.find((s: any) => s.key === key);
    return setting?.value === "true";
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-neutral-600 mb-4">SaaS Configuration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Environment Variables */}
        <div>
          <h3 className="text-sm font-medium text-neutral-500 mb-3">Environment Variables</h3>
          <div className="bg-neutral-100 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-xs font-medium text-neutral-500 font-mono">NODE_ENV</span>
                  <span className="ml-2 px-1.5 py-0.5 bg-success bg-opacity-10 rounded text-success text-xs">Set</span>
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">Application environment</div>
              </div>
              <div className="text-xs font-mono bg-neutral-200 px-2 py-1 rounded">development</div>
              <button className="ml-2 text-neutral-400 hover:text-neutral-600">
                <i className="ri-edit-line"></i>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-xs font-medium text-neutral-500 font-mono">DATABASE_URL</span>
                  <span className="ml-2 px-1.5 py-0.5 bg-success bg-opacity-10 rounded text-success text-xs">Set</span>
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">Database connection string</div>
              </div>
              <div className="text-xs font-mono bg-neutral-200 px-2 py-1 rounded">••••••••••••</div>
              <button className="ml-2 text-neutral-400 hover:text-neutral-600">
                <i className="ri-edit-line"></i>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-xs font-medium text-neutral-500 font-mono">API_SECRET</span>
                  <span className="ml-2 px-1.5 py-0.5 bg-success bg-opacity-10 rounded text-success text-xs">Set</span>
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">API authentication secret</div>
              </div>
              <div className="text-xs font-mono bg-neutral-200 px-2 py-1 rounded">••••••••••••</div>
              <button className="ml-2 text-neutral-400 hover:text-neutral-600">
                <i className="ri-edit-line"></i>
              </button>
            </div>
            
            <button className="w-full flex items-center justify-center text-primary text-sm border border-dashed border-primary border-opacity-40 rounded-md py-1.5 mt-3 hover:bg-primary hover:bg-opacity-5">
              <i className="ri-add-line mr-1"></i> Add Variable
            </button>
          </div>
        </div>
        
        {/* Application Settings */}
        <div>
          <h3 className="text-sm font-medium text-neutral-500 mb-3">Application Settings</h3>
          <div className="bg-neutral-100 rounded-md p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-neutral-600">SaaS Mode</label>
                <Switch 
                  checked={getSetting("SAAS_MODE")}
                  onCheckedChange={() => toggleSetting("SAAS_MODE", getSetting("SAAS_MODE") ? "true" : "false")}
                />
              </div>
              <div className="text-xs text-neutral-400">Enable multi-tenant SaaS functionality</div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-neutral-600">Development Autologin</label>
                <Switch 
                  checked={getSetting("DEV_AUTOLOGIN")}
                  onCheckedChange={() => toggleSetting("DEV_AUTOLOGIN", getSetting("DEV_AUTOLOGIN") ? "true" : "false")}
                />
              </div>
              <div className="text-xs text-neutral-400">Skip login in development environment</div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-neutral-600">Debug Mode</label>
                <Switch 
                  checked={getSetting("DEBUG_MODE")}
                  onCheckedChange={() => toggleSetting("DEBUG_MODE", getSetting("DEBUG_MODE") ? "true" : "false")}
                />
              </div>
              <div className="text-xs text-neutral-400">Enable detailed logging and debugging</div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-neutral-600">API Rate Limiting</label>
                <Switch 
                  checked={getSetting("API_RATE_LIMITING")}
                  onCheckedChange={() => toggleSetting("API_RATE_LIMITING", getSetting("API_RATE_LIMITING") ? "true" : "false")}
                />
              </div>
              <div className="text-xs text-neutral-400">Limit API requests to prevent abuse</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
