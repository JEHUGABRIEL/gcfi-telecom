import React from 'react';
import { cn } from '@/shared/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  isTextArea?: boolean;
}

const Input = React.forwardRef<HTMLInputElement & HTMLTextAreaElement, InputProps>(
  ({ label, error, isTextArea, className, ...props }, ref) => {
    const Component = isTextArea ? 'textarea' : 'input';
    
    return (
      <div className="w-full space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <Component
          ref={ref as any}
          className={cn(
            "w-full px-4 py-3 rounded-xl border transition-all outline-none",
            "bg-white dark:bg-slate-800 text-slate-900 dark:text-white",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            error 
              ? "border-red-500 focus:ring-2 focus:ring-blue-500/20" 
              : "border-slate-200 dark:border-slate-700 focus:border-[#C1272D] focus:ring-2 focus:ring-[#C1272D]/10",
            isTextArea && "min-h-[120px] resize-none",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-red-500 mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
