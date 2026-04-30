import * as React from 'react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Input } from '@/components/atoms/Input'

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  id?: string
  icon?: React.ReactNode
  rightAdornment?: React.ReactNode
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id, icon, rightAdornment, className, ...props }, ref) => {
    const fieldId = id || React.useId()
    return (
      <div className={cn("space-y-mx-xs w-full", className)}>
        <label htmlFor={fieldId} className="block ml-2">
          <Typography variant="caption" tone="muted">{label}</Typography>
        </label>
        <div className="relative group">
          {icon && (
            <div className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true">
              {icon}
            </div>
          )}
          <Input
            id={fieldId}
            ref={ref}
            {...props}
            className={cn(
              icon && "pl-12",
              rightAdornment && "pr-12",
              error && "border-status-error focus:border-status-error focus:ring-status-error/5"
            )}
          />
          {rightAdornment && (
            <div className="absolute right-mx-sm top-1/2 -translate-y-1/2 flex items-center">
              {rightAdornment}
            </div>
          )}
        </div>
        {error && (
          <p className="text-status-error text-mx-tiny font-black uppercase ml-2 animate-in fade-in slide-in-from-top-1" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }
