
import React from 'react';

export default function InsightSummaryCard() {
  const summary = {
    agent: "ExplainerAgent",
    flagged: 4,
    topDriver: "Living Area",
    avgDeviation: 9203,
    time: "3 minutes ago"
  };

  return (
    <div className="bg-yellow-100 p-4 rounded shadow border">
      <h3 className="text-md font-semibold mb-2">📣 Insight Summary</h3>
      <p><strong>Agent:</strong> {summary.agent}</p>
      <p><strong>Records Flagged:</strong> {summary.flagged}</p>
      <p><strong>Top Driver:</strong> {summary.topDriver}</p>
      <p><strong>Avg Deviation:</strong> ${summary.avgDeviation}</p>
      <p className="text-sm text-gray-600">{summary.time}</p>
    </div>
  );
}
