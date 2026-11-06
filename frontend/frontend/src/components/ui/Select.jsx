import React, { forwardRef } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const Select = forwardRef(({
  label,
  error,
  hint,
  required,
  children,
  className = '',
  containerClassName = '',
  placeholder,
  ...props
}, ref) => {
  return (
    <div className={clsx('space-y-1.5', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={clsx(
            'input-base pr-9 cursor-pointer',
            error && 'input-error',
            className,
          )}
          style={{ appearance: 'none', WebkitAppearance: 'none' }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-slate-600">{hint}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
