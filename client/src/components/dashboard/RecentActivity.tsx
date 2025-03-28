import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <h3 className="text-sm font-medium text-neutral-500 mb-3">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-start">
              <div className="w-8 h-8 rounded-full bg-neutral-200 mr-3 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/4 mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Function to format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return "recently";
    }
  };

  // Function to get the color class based on iconColor
  const getColorClass = (color: string) => {
    switch (color) {
      case "primary": return "text-primary";
      case "success": return "text-success";
      case "warning": return "text-warning";
      case "danger": return "text-danger";
      default: return "text-primary";
    }
  };

  // Function to get the background color class based on iconColor
  const getBgColorClass = (color: string) => {
    switch (color) {
      case "primary": return "bg-primary bg-opacity-10";
      case "success": return "bg-success bg-opacity-10";
      case "warning": return "bg-warning bg-opacity-10";
      case "danger": return "bg-danger bg-opacity-10";
      default: return "bg-primary bg-opacity-10";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
      <h3 className="text-sm font-medium text-neutral-500 mb-3">Recent Activity</h3>
      <div className="space-y-3">
        {activities?.slice(0, 3).map((activity: any) => (
          <div className="flex items-start" key={activity.id}>
            <div className={`w-8 h-8 rounded-full ${getBgColorClass(activity.iconColor)} flex items-center justify-center ${getColorClass(activity.iconColor)} mr-3 flex-shrink-0`}>
              <i className={activity.icon}></i>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-600">{activity.action}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{formatTimestamp(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
