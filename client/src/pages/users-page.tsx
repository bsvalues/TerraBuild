import React, { useEffect } from "react";
import { APP_NAME } from "@/data/constants";
import UserManagement from "@/components/dashboard/UserManagement";

export default function UsersPage() {
  useEffect(() => {
    document.title = `User Management | ${APP_NAME}`;
  }, []);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">User Management</h1>
          <p className="text-slate-400">
            Manage user accounts, roles, and permissions
          </p>
        </div>
      </div>
      <UserManagement />
    </div>
  );
}