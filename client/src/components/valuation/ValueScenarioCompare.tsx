
import React, { useState } from 'react';

const scenarios = {
  baseline: 210000,
  agent_adjusted: 223700,
  rsmeans: 229500,
  permits_only: 215800
};

export default function ValueScenarioCompare() {
  const [selected, setSelected] = useState("baseline");

  return (
    <div className="p-4 bg-white shadow rounded">
      <h3 className="text-lg font-semibold mb-2">🧮 Value Scenario Compare</h3>
      <div className="space-x-2 mb-2">
        {Object.keys(scenarios).map(key => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={`px-3 py-1 rounded ${selected === key ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            {key.replace("_", " ").toUpperCase()}
          </button>
        ))}
      </div>
      <p className="text-xl font-bold">${scenarios[selected].toLocaleString()}</p>
    </div>
  );
}
