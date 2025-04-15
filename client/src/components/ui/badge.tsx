import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary bg-opacity-10 text-primary",
        success: "bg-success bg-opacity-10 text-success",
        warning: "bg-warning bg-opacity-10 text-warning",
        danger: "bg-danger bg-opacity-10 text-danger",
        destructive: "bg-destructive bg-opacity-10 text-destructive",
        outline: "border border-primary text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
