import React, { useState } from "react";
import { TEST_USERS, EXPIRATION_OPTIONS } from "@/data/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutoLogin from "./AutoLogin";

export default function DevelopmentTools() {
  const [selectedUser, setSelectedUser] = useState("Admin User");
  const [expiration, setExpiration] = useState("4h");

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-600 mb-4">Development Tools</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AutoLogin />
        
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-600">Test User Configuration</h3>
            <button className="text-xs bg-primary text-white rounded-md px-3 py-1.5 hover:bg-primary-dark">
              Save Configuration
            </button>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <Label className="block text-xs font-medium text-neutral-600 mb-1">
                Default Test User
              </Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded px-3 py-2 text-sm text-neutral-600">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_USERS.map(user => (
                    <SelectItem key={user.id} value={user.name}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-neutral-400">
                This user will be automatically logged in during development
              </p>
            </div>
            
            <div>
              <Label className="block text-xs font-medium text-neutral-600 mb-1">
                Session Expiration
              </Label>
              <Select value={expiration} onValueChange={setExpiration}>
                <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded px-3 py-2 text-sm text-neutral-600">
                  <SelectValue placeholder="Select an expiration time" />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-neutral-400">
                Time before automatic session expiration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
