import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

/**
 * Dashboard loading skeleton
 * Displays a placeholder UI while dashboard data is loading
 */
const DashboardSkeleton = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-6 w-20 ml-4" />
        </div>
        <div>
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="mb-8">
        <Skeleton className="h-10 w-96 mb-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex border-b pb-2">
              <Skeleton className="h-6 w-28 mr-8" />
              <Skeleton className="h-6 w-20 mr-8" />
              <Skeleton className="h-6 w-16 mr-8" />
              <Skeleton className="h-6 w-16 mr-8" />
              <Skeleton className="h-6 w-24" />
            </div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex">
                <Skeleton className="h-6 w-28 mr-8" />
                <Skeleton className="h-6 w-20 mr-8" />
                <Skeleton className="h-6 w-16 mr-8" />
                <Skeleton className="h-6 w-16 mr-8" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSkeleton;