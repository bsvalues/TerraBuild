
import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function EditableMatrixView({ matrix = [] }) {
  const [data, setData] = useState(matrix);
  const [adjustments, setAdjustments] = useState([]);
  const [rerunStatus, setRerunStatus] = useState("");

  const handleChange = (index, value) => {
    const newData = [...data];
    newData[index].base_cost = parseFloat(value) || 0;
    setData(newData);
  };

  const reRunAgents = async () => {
    setRerunStatus("Running agents...");
    const res = await fetch(`${API_BASE}/api/re_run_agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: "session_matrix", data })
    });
    const result = await res.json();
    setAdjustments(result.adjustedValues);
    setRerunStatus(result.insight || "Agents re-run complete.");
  };

  return (
    <div className="bg-white p-4 rounded shadow space-y-3">
      <h3 className="text-xl font-semibold">📋 Editable Matrix</h3>
      <table className="w-full text-sm border mt-2">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">ID</th>
            <th className="p-2">Type</th>
            <th className="p-2">Base Cost ($)</th>
            <th className="p-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id} className="border-t">
              <td className="p-2">{row.id}</td>
              <td className="p-2">{row.building_type}</td>
              <td className="p-2">
                <input
                  type="number"
                  className="border p-1 w-full"
                  value={row.base_cost}
                  onChange={(e) => handleChange(idx, e.target.value)}
                />
              </td>
              <td className="p-2">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={reRunAgents}
      >
        🔄 Re-Run Agents
      </button>
      {rerunStatus && <p className="text-sm text-green-700 mt-2">{rerunStatus}</p>}

      {adjustments.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-sm">📈 Adjusted Values</h4>
          <ul className="text-xs mt-1 text-gray-700 list-disc ml-5">
            {adjustments.map((adj) => (
              <li key={adj.id}>
                ID {adj.id}: {adj.old_value} → {adj.new_value} ({adj.change_percent}%)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
