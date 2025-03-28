import React, { useState } from "react";
import { useApiEndpoints } from "@/hooks/use-api-endpoints";
import { Badge } from "@/components/ui/badge";
import { StatusIcon } from "@/components/ui/status-card";
import { API_METHODS, STATUS_TYPES, STATUS_VARIANTS } from "@/data/constants";

export default function ApiManager() {
  const { apiEndpoints, isLoading } = useApiEndpoints();
  const [searchQuery, setSearchQuery] = useState("");

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET": return "default";
      case "POST": return "success";
      case "PUT": case "PATCH": return "warning";
      case "DELETE": return "danger";
      default: return "default";
    }
  };

  const filteredEndpoints = apiEndpoints?.filter(endpoint => 
    endpoint.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden mt-6">
        <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">API Endpoints</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-10 bg-neutral-200 rounded mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-neutral-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-neutral-600 mb-4">API Manager Preview</h2>
      
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">API Endpoints</h3>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search endpoints..."
                className="text-xs bg-neutral-100 border border-neutral-200 rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <i className="ri-search-line text-neutral-400"></i>
              </div>
            </div>
            <button className="text-xs bg-primary text-white rounded-md px-3 py-1.5 hover:bg-primary-dark">
              <i className="ri-add-line mr-1"></i> New Endpoint
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Endpoint</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Method</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Auth</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-100">
              {filteredEndpoints?.map((endpoint) => (
                <tr key={endpoint.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-neutral-600">{endpoint.path}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <Badge variant={getMethodBadgeColor(endpoint.method)}>{endpoint.method}</Badge>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <StatusIcon status={endpoint.status as any} />
                      <span className={`text-xs ${endpoint.status === 'degraded' ? 'text-warning' : 'text-neutral-600'}`}>
                        {endpoint.status === 'online' ? 'Online' : endpoint.status === 'degraded' ? 'Degraded' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-xs text-neutral-600">
                    {endpoint.requiresAuth ? 'Required' : 'Optional'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-xs text-neutral-400">
                    <div className="flex space-x-2">
                      <button className="hover:text-primary"><i className="ri-edit-line"></i></button>
                      <button className="hover:text-primary"><i className="ri-file-list-line"></i></button>
                      <button className="hover:text-danger"><i className="ri-delete-bin-line"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-3 flex items-center justify-between border-t border-neutral-200 bg-neutral-50">
          <div className="text-xs text-neutral-500">
            Showing {filteredEndpoints?.length} of {apiEndpoints?.length} endpoints
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-xs text-neutral-500 px-2 py-1 border border-neutral-200 rounded hover:bg-neutral-100 disabled:opacity-50" disabled>
              <i className="ri-arrow-left-s-line"></i>
            </button>
            <button className="text-xs text-white px-2 py-1 bg-primary rounded">1</button>
            <button className="text-xs text-neutral-500 px-2 py-1 border border-neutral-200 rounded hover:bg-neutral-100">
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
