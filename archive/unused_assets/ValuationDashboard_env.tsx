
// ValuationDashboard.tsx (with env config)
import React from 'react';
import { JURISDICTION } from './config';
import EditableMatrixView from './EditableMatrixView';
import InsightSummaryCard from './InsightSummaryCard';
import ValuationTimelineChart from './ValuationTimelineChart';
import ValueScenarioCompare from './ValueScenarioCompare';
import ExportJustification from './ExportJustification';
import AgentFeed from './AgentFeed';

export default function ValuationDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center text-blue-900">
        🏛️ {JURISDICTION} – Smart Valuation Platform
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <EditableMatrixView />
          <ValuationTimelineChart />
          <ValueScenarioCompare />
        </div>
        <div className="space-y-4">
          <AgentFeed />
          <InsightSummaryCard />
          <ExportJustification />
        </div>
      </div>
    </div>
  );
}
