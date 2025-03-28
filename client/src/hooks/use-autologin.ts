import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export function useAutoLogin() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/auth/autologin"],
  });

  const updateSetting = useMutation({
    mutationFn: ({ key, value }: { key: string, value: string }) => 
      apiRequest("PATCH", `/api/settings/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/autologin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    }
  });

  const toggleAutoLogin = (enabled: boolean) => {
    updateSetting.mutate({ key: "DEV_AUTOLOGIN", value: enabled.toString() });
  };

  return {
    autoLoginEnabled: data?.enabled || false,
    authToken: data?.token || "",
    isLoading,
    toggleAutoLogin,
    updateSetting
  };
}
