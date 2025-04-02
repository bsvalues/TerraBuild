import React from "react";
import { Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  /**
   * DEVELOPMENT MODE: Authentication completely disabled
   * 
   * All routes are rendered without any authentication checks.
   * Users are automatically logged in as admin in both client and server.
   */
  return <Route path={path} component={Component} />;
}