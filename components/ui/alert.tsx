import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border-l-4 p-4 shadow-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-neutral-50 border-l-neutral-400 text-neutral-900",
        success:
          "bg-green-50 border-l-green-500 text-green-900 [&>svg]:text-green-600",
        warning:
          "bg-orange-50 border-l-orange-500 text-orange-900 [&>svg]:text-orange-600",
        error:
          "bg-red-50 border-l-red-500 text-red-900 [&>svg]:text-red-600",
        info:
          "bg-blue-50 border-l-blue-500 text-blue-900 [&>svg]:text-blue-600",
        destructive:
          "bg-red-50 border-l-red-500 text-red-900 [&>svg]:text-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-sans font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-body [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
