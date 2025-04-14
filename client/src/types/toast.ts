import * as React from "react";

export type ToastProps = {
  id: string;
  className?: string;
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type ToastActionElement = React.ReactElement<any>;