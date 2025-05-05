// App.tsx
import React from 'react';
import { Route, Switch } from 'wouter';
import BentonValuationDashboard from './pages/BentonValuationDashboard';
import { JURISDICTION } from './config';

export default function App() {
  return (
    <div className="app">
      <Switch>
        <Route path="/" component={BentonValuationDashboard} />
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-500">404 - Page Not Found</h1>
              <p className="mt-4 text-xl">{JURISDICTION} Valuation System</p>
              <a href="/" className="mt-6 inline-block bg-blue-500 text-white px-4 py-2 rounded-md">
                Return to Dashboard
              </a>
            </div>
          </div>
        </Route>
      </Switch>
    </div>
  );
}