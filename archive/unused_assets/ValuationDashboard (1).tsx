
import React, { useEffect, useState } from 'react';
import EditableMatrixView from './EditableMatrixView';
import InsightSummaryCard from './InsightSummaryCard';
import ValuationTimelineChart from './ValuationTimelineChart';
import ValueScenarioCompare from './ValueScenarioCompare';
import ExportJustification from './ExportJustification';
import AgentFeed from './AgentFeed';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function ValuationDashboard() {
  const [sessionId, setSessionId] = useState("");
  const [matrixData, setMatrixData] = useState([]);
  const [loading, setLoading] = useState(false);

  const uploadMatrix = async () => {
    setLoading(true);
    const payload = {
      fileName: "demo_matrix_bcwa.xlsx",
      data: [
        { id: 1, building_type: "R3", base_cost: 122.85, description: "Single-wide" },
        { id: 2, building_type: "R3", base_cost: 134.20, description: "Double-wide" },
        { id: 3, building_type: "R2", base_cost: 145.10, description: "Small SFR" }
      ]
    };

    const res = await fetch(\`\${API_BASE}/api/validate_matrix\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    setSessionId(data.session_id);
    setMatrixData(payload.data);
    setLoading(false);
  };

  useEffect(() => {
    uploadMatrix(); // Auto-load demo matrix
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center text-blue-900">
        🏛️ Benton County – Smart Valuation Platform
      </h1>

      {loading ? (
        <p className="text-center text-gray-600 mt-10">Loading matrix and initializing session...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <EditableMatrixView matrix={matrixData} />
              <ValuationTimelineChart />
              <ValueScenarioCompare />
            </div>
            <div className="space-y-4">
              <AgentFeed />
              <InsightSummaryCard />
              <ExportJustification sessionId={sessionId} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
