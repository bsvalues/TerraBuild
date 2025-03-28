import React from "react";
import { Badge } from "@/components/ui/badge";
import { useRepository } from "@/hooks/use-repository";

export default function RepositoryCloneStatus() {
  const { repository, isLoading } = useRepository();
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
        <div className="animate-pulse flex flex-col">
          <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              <div className="h-10 bg-neutral-200 rounded"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              <div className="h-10 bg-neutral-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              <div className="h-6 bg-neutral-200 rounded"></div>
              <div className="h-6 bg-neutral-200 rounded"></div>
              <div className="h-6 bg-neutral-200 rounded"></div>
              <div className="h-6 bg-neutral-200 rounded"></div>
              <div className="h-6 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-600">Repository Clone Status</h2>
        <Badge variant="success">Complete</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Repository Details */}
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Source Repository</h3>
            <div className="flex items-center p-3 bg-neutral-100 rounded-md">
              <i className="ri-github-fill text-neutral-600 mr-2 text-xl"></i>
              <span className="text-sm font-mono text-neutral-600">{repository?.sourceRepo || "bsvalues/BSBuildingCost"}</span>
              <a 
                href="https://github.com/bsvalues/BSBuildingCost" 
                className="ml-auto text-primary hover:underline text-sm" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Your Repository</h3>
            <div className="flex items-center p-3 bg-neutral-100 rounded-md">
              <i className="ri-github-fill text-neutral-600 mr-2 text-xl"></i>
              <span className="text-sm font-mono text-neutral-600">{repository?.targetRepo || "yourteam/BSBuildingCost"}</span>
              <a href="#" className="ml-auto text-primary hover:underline text-sm">View</a>
            </div>
          </div>
        </div>
        
        {/* Clone Steps */}
        <div>
          <h3 className="text-sm font-medium text-neutral-500 mb-2">Clone Process</h3>
          <div className="space-y-2">
            {repository?.steps?.map((step: any, index: number) => (
              <div className="flex items-center" key={index}>
                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center text-white text-xs mr-2">
                  <i className="ri-check-line"></i>
                </div>
                <span className="text-sm text-neutral-600">{step.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
