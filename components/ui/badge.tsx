import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold font-sans transition-all duration-200 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-500 text-white hover:bg-primary-700 hover:shadow-md",
        secondary:
          "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        destructive:
          "border-transparent bg-error text-white hover:bg-error/90",
        success:
          "border-transparent bg-success text-white hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-white hover:bg-warning/90",
        info:
          "border-transparent bg-info text-white hover:bg-info/90",
        outline: "border-primary-500 text-primary-700 bg-transparent hover:bg-primary-50",
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
