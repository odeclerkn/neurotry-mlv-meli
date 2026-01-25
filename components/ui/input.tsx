import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border-2 border-neutral-200 bg-bg-secondary px-4 py-2 text-sm font-body text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:bg-white hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
