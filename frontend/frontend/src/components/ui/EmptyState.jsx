import React from 'react';
import { clsx } from 'clsx';

/* ── EmptyState ──────────────────────────────────────────────────────────────── */
const EmptyState = ({
  icon: Icon,
  title = 'Nothing here yet',
  description = 'No data to display at the moment.',
  action,
  className = '',
}) => (
  <div className={clsx(
    'flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl',
    'border border-dashed border-white/[0.08]',
    'bg-white/[0.015]',
    className,
  )}>
    {Icon && (
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}
      >
        <Icon className="w-7 h-7 text-slate-500" />
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-300 font-display mb-2">{title}</h3>
    <p className="text-sm text-slate-600 max-w-[280px] leading-relaxed">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/* ── Skeleton loaders ────────────────────────────────────────────────────────── */
export const SkeletonLine = ({ className = '' }) => (
  <div className={clsx('skeleton h-4 rounded', className)} />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={clsx('card space-y-4', className)}>
    <div className="flex items-center justify-between">
      <SkeletonLine className="w-1/3" />
      <div className="skeleton w-10 h-10 rounded-xl" />
    </div>
    <SkeletonLine className="w-1/4 h-7" />
    <SkeletonLine className="w-2/3" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="table-wrapper p-4 space-y-3">
    <SkeletonLine className="w-1/4 mb-4" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 items-center">
        <SkeletonLine className="w-8 h-8 rounded-lg shrink-0" />
        <SkeletonLine className="flex-1" />
        <SkeletonLine className="w-20" />
        <SkeletonLine className="w-16" />
      </div>
    ))}
  </div>
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={clsx('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine
        key={i}
        className={i === lines - 1 ? 'w-2/3' : 'w-full'}
      />
    ))}
  </div>
);

/* ── Inline loading spinner ──────────────────────────────────────────────────── */
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <svg
      className={clsx('animate-spin-slow text-indigo-400', sizes[size] || sizes.md, className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
};

export default EmptyState;
