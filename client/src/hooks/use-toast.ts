// Toast functionality with proper state management
import { useState } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, action, variant = "default" }: Omit<Toast, "id">) => {
    const id = (++toastCount).toString();
    const newToast = { id, title, description, action, variant };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
    
    return { id };
  };

  const dismiss = (toastId?: string) => {
    setToasts((prev) => 
      toastId ? prev.filter((t) => t.id !== toastId) : []
    );
  };

  return {
    toast,
    toasts,
    dismiss,
  };
}

export { useToast as toast };