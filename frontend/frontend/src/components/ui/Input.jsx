import React, { forwardRef } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

/* ── Base Input ──────────────────────────────────────────────────────────────── */
const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  className = '',
  containerClassName = '',
  required,
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
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none flex-shrink-0">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'input-base',
            leftIcon && 'pl-12',
            rightElement && 'pr-10',
            error && 'input-error',
            className,
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            {rightElement}
          </div>
        )}
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

Input.displayName = 'Input';

/* ── Password Input ──────────────────────────────────────────────────────────── */
export const PasswordInput = forwardRef(({ label, error, hint, leftIcon, ...props }, ref) => {
  const [show, setShow] = useState(false);

  return (
    <Input
      ref={ref}
      label={label}
      error={error}
      hint={hint}
      leftIcon={leftIcon}
      type={show ? 'text' : 'password'}
      rightElement={
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

/* ── Textarea ────────────────────────────────────────────────────────────────── */
export const Textarea = forwardRef(({ label, error, hint, required, className = '', containerClassName = '', ...props }, ref) => (
  <div className={clsx('space-y-1.5', containerClassName)}>
    {label && (
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
    )}
    <textarea
      ref={ref}
      className={clsx('input-base resize-none', error && 'input-error', className)}
      {...props}
    />
    {error && (
      <p className="flex items-center gap-1.5 text-xs text-red-400">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        {error}
      </p>
    )}
    {hint && !error && <p className="text-xs text-slate-600">{hint}</p>}
  </div>
));

Textarea.displayName = 'Textarea';

export default Input;
