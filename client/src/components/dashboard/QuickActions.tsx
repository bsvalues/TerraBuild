import { QUICK_ACTIONS } from "@/data/constants";
import { useToast } from "@/hooks/use-toast";
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, FileSpreadsheet, Settings, PieChart } from "lucide-react";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" className="flex flex-col h-20 items-center justify-center">
            <Calculator className="h-5 w-5 mb-1" />
            <span className="text-xs">New Calculation</span>
          </Button>
          <Button variant="outline" className="flex flex-col h-20 items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 mb-1" />
            <span className="text-xs">Import Data</span>
          </Button>
          <Button variant="outline" className="flex flex-col h-20 items-center justify-center">
            <PieChart className="h-5 w-5 mb-1" />
            <span className="text-xs">View Reports</span>
          </Button>
          <Button variant="outline" className="flex flex-col h-20 items-center justify-center">
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}