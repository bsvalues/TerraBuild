// ValuationDashboard.tsx (with env config)
import React from 'react';
import { JURISDICTION } from '../config';

// Import placeholder components - these would be created in implementation
const EditableMatrixView = () => <div className="placeholder">Editable Matrix View</div>;
const InsightSummaryCard = () => <div className="placeholder">Insight Summary Card</div>;
const ValuationTimelineChart = () => <div className="placeholder">Valuation Timeline Chart</div>;
const ValueScenarioCompare = () => <div className="placeholder">Value Scenario Compare</div>;
const ExportJustification = () => <div className="placeholder">Export Justification</div>;
const AgentFeed = () => <div className="placeholder">Agent Feed</div>;

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