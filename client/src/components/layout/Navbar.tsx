import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";

export function Navbar() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex h-16 items-center px-4 border-b bg-background">
      <div className="flex-1">
        <Link href="/" className="font-semibold text-xl">
          TerraBuild
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm">
          <User className="h-4 w-4 mr-2" />
          TerraFusion User
        </Button>
      </div>
    </div>
  );
}