import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, UserPlus, UserCog } from "lucide-react";
import { CountyNetworkAuth, IntegratedAuthComponent } from "./county-network-auth";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

export function AuthForms() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "county">("signin");

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full max-w-md mx-auto">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="signin" className="flex items-center">
          <UserCog className="mr-2 h-4 w-4" />
          <span>Sign In</span>
        </TabsTrigger>
        <TabsTrigger value="signup" className="flex items-center">
          <UserPlus className="mr-2 h-4 w-4" />
          <span>Sign Up</span>
        </TabsTrigger>
        <TabsTrigger value="county" className="flex items-center">
          <Building className="mr-2 h-4 w-4" />
          <span>County</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="signin">
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("signup")}
              size="sm"
            >
              Don't have an account? Sign up
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="signup">
        <Card>
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>
              Register for a new account to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("signin")}
              size="sm"
            >
              Already have an account? Sign in
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="county">
        <CountyNetworkAuth />
      </TabsContent>
    </Tabs>
  );
}