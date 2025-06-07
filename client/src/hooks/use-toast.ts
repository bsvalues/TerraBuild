// Direct implementation for toast functionality
import { toast as sonnerToast } from "sonner";

export const toast = sonnerToast;

export function useToast() {
  return {
    toast: sonnerToast,
  };
}