/**
 * TerraBuild AI Swarm - Dashboard Page
 * 
 * This page displays the AI Swarm dashboard and provides access to all swarm features.
 */

import React from 'react';
import { SwarmDashboard } from '@/components/swarm/SwarmDashboard';

export default function SwarmPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">TerraBuild AI Swarm</h1>
        <p className="text-gray-500">
          Advanced infrastructure cost assessment using AI agent swarm technology
        </p>
      </div>
      
      <SwarmDashboard />
      
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">About AI Swarm Technology</h2>
        <p className="mb-4">
          The TerraBuild AI Swarm uses a network of specialized artificial intelligence agents
          that work together to analyze, optimize, and validate infrastructure cost assessments.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Key Features</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Factor optimization with FactorTuner</li>
              <li>Quality control with BenchmarkGuard</li>
              <li>Pattern recognition with CurveTrainer</li>
              <li>Scenario modeling with ScenarioAgent</li>
              <li>Documentation support with BOEArguer</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Benefits</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Increased assessment accuracy</li>
              <li>Advanced pattern detection</li>
              <li>Automated quality control</li>
              <li>Scenario and sensitivity analysis</li>
              <li>Robust documentation generation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}