import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertSettingSchema, Setting } from "../../../shared/schema";
import { useToast } from "./use-toast";
import { z } from "zod";

interface AutoLoginData {
  autoLoginEnabled: boolean;
  authToken: string;
}

const updateSettingSchema = insertSettingSchema;
type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

export function useAutoLogin() {
  const { toast } = useToast();

  // Fetch all settings
  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  // Extract auto-login settings
  const autoLoginEnabled = settings?.find(
    (s) => s.key === "DEV_AUTO_LOGIN_ENABLED"
  )?.value === "true";
  
  const authToken = settings?.find(
    (s) => s.key === "DEV_AUTH_TOKEN"
  )?.value || "";

  // Toggle auto-login
  const toggleAutoLogin = async (checked?: boolean) => {
    const newValue = checked !== undefined ? checked : !autoLoginEnabled;
    
    try {
      await apiRequest(`/api/settings/DEV_AUTO_LOGIN_ENABLED`, {
        method: "PATCH",
        body: JSON.stringify({ value: newValue.toString() }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      
      toast({
        title: newValue ? "Auto-login enabled" : "Auto-login disabled",
        description: newValue 
          ? "You will be automatically logged in during development."
          : "You will need to log in manually during development."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle auto-login setting.",
        variant: "destructive"
      });
    }
  };

  // Update a setting
  const updateSetting = useMutation({
    mutationFn: async (input: UpdateSettingInput) => {
      const res = await apiRequest(`/api/settings/${input.key}`, {
        method: "PATCH",
        body: JSON.stringify({ value: input.value }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Setting updated",
        description: "The setting has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update setting.",
        variant: "destructive",
      });
    },
  });

  return {
    autoLoginEnabled,
    authToken,
    toggleAutoLogin,
    updateSetting,
    isLoading,
  };
}