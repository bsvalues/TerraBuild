import React, { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { APP_NAME } from "@/data/constants";
import UserManagement from "@/components/dashboard/UserManagement";

export default function UsersPage() {
  useEffect(() => {
    document.title = `User Management | ${APP_NAME}`;
  }, []);
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>
        <UserManagement />
      </div>
    </DashboardLayout>
  );
}