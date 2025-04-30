import React from 'react';
import MainLayout from "@/components/layout/MainLayout";
import InfrastructureLifecycleStoryTeller from "@/components/storyteller/InfrastructureLifecycleStoryTeller";

export default function InfrastructureLifecyclePage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-[#243E4D]">Infrastructure Lifecycle Storyteller</h1>
          <p className="text-gray-600 mt-1">
            Visualize the complete lifecycle of infrastructure assets from planning through end-of-life
          </p>
        </header>
        
        <InfrastructureLifecycleStoryTeller />
      </div>
    </MainLayout>
  );
}