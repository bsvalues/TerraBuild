
// AgentFeed.tsx
import React from 'react';

const logs = [
  {
    agent: "RegressorAgent",
    message: "Regression model trained on 3,214 records. R² = 0.87",
    time: "2 mins ago"
  },
  {
    agent: "ExplainerAgent",
    message: "Living area is the top predictor in R3 homes (42% impact)",
    time: "Just now"
  },
  {
    agent: "MutatorAgent",
    message: "Removing 'condition' drops accuracy by 0.13",
    time: "Just now"
  }
];

export default function AgentFeed() {
  return (
    <div className="p-4 bg-gray-100 max-w-md rounded shadow">
      <h2 className="font-semibold text-lg mb-2">🧠 Agent Insight Feed</h2>
      <ul className="space-y-2">
        {logs.map((log, idx) => (
          <li key={idx} className="bg-white p-2 rounded border">
            <div className="text-sm text-gray-800"><strong>{log.agent}</strong>: {log.message}</div>
            <div className="text-xs text-gray-500">{log.time}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
