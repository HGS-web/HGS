import * as React from "react"

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={`w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 aria-[invalid=true]:border-red-400 ${className ?? ""}`}
      {...props}
    />
  )
)
Select.displayName = "Select"
