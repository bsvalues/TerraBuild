import { useAutoLogin } from "@/hooks/use-autologin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AutoLogin() {
  const { autoLoginEnabled, authToken, toggleAutoLogin, updateSetting, isLoading } = useAutoLogin();
  const { toast } = useToast();
  const [tokenVisible, setTokenVisible] = useState(false);
  const tokenRef = useRef<HTMLInputElement>(null);

  const copyTokenToClipboard = () => {
    if (tokenRef.current) {
      tokenRef.current.select();
      document.execCommand('copy');
      toast({
        title: "Token copied",
        description: "Auth token copied to clipboard",
      });
    }
  };

  const generateNewToken = () => {
    // Generate a random token
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const tokenLength = 40;
    let result = 'dev_tk_';
    for (let i = 0; i < tokenLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Update the setting
    updateSetting.mutate({
      key: "DEV_AUTH_TOKEN",
      value: result
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Development Auto-Login</CardTitle>
          <Badge variant={autoLoginEnabled ? "success" : "default"}>
            {autoLoginEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <CardDescription>
          Skip the login process during development. Automatically logs in with admin credentials.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="auto-login-toggle" 
            checked={autoLoginEnabled}
            onCheckedChange={toggleAutoLogin}
            disabled={isLoading}
          />
          <Label htmlFor="auto-login-toggle">Auto-login as admin user</Label>
        </div>
        
        <div className="pt-2">
          <Label htmlFor="auth-token">Authentication Token</Label>
          <div className="flex mt-1.5">
            <div className="relative flex-1">
              <Input
                ref={tokenRef}
                id="auth-token"
                type={tokenVisible ? "text" : "password"}
                value={authToken}
                readOnly
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setTokenVisible(!tokenVisible)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                <i className={`ri-${tokenVisible ? "eye-off" : "eye"}-line`}></i>
              </button>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="ml-2"
              onClick={copyTokenToClipboard}
            >
              <i className="ri-clipboard-line"></i>
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" className="w-full" onClick={generateNewToken} disabled={updateSetting.isPending}>
          <Key className="h-4 w-4 mr-2" />
          {updateSetting.isPending ? "Generating..." : "Generate New Token"}
        </Button>
      </CardFooter>
    </Card>
  );
}