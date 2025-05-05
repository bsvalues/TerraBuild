import React from 'react';
import { useLocation } from 'wouter';
import ValuationDashboard from '@/components/valuation/ValuationDashboard';

/**
 * ValuationDashboardPage
 * 
 * This page hosts the comprehensive Valuation Dashboard component which provides
 * a complete interface for working with cost matrices and the XREG explainable AI valuation system.
 * 
 * It extracts matrixId and propertyId from URL parameters if available.
 */
export default function ValuationDashboardPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const matrixId = searchParams.get('matrixId') || undefined;
  const propertyId = searchParams.get('propertyId') || undefined;

  return (
    <div className="container mx-auto py-6">
      <ValuationDashboard matrixId={matrixId} propertyId={propertyId} />
    </div>
  );
}