import React from 'react';
import { clsx } from 'clsx';

const VARIANTS = {
  primary:  'badge-primary',
  success:  'badge-success',
  warning:  'badge-warning',
  danger:   'badge-danger',
  info:     'badge-info',
  neutral:  'badge-neutral',
};

const STATUS_MAP = {
  // Incident status
  pending:     'warning',
  active:      'info',
  resolved:    'success',
  closed:      'neutral',
  critical:    'danger',
  // Volunteer status
  available:   'success',
  assigned:    'primary',
  unavailable: 'neutral',
  // Resource
  available:      'success',
  partially_used: 'info',
  in_use:         'warning',
  maintenance:    'danger',
  // General
  true:        'success',
  false:       'neutral',
};

const DOT_COLORS = {
  primary: '#818cf8',
  success: '#4ade80',
  warning: '#facc15',
  danger:  '#f87171',
  info:    '#22d3ee',
  neutral: '#94a3b8',
};

const Badge = ({ variant, status, children, dot = false, className = '' }) => {
  // If status is provided, auto-determine variant
  const resolvedVariant = variant || STATUS_MAP[String(status)?.toLowerCase()] || 'neutral';
  const cls = VARIANTS[resolvedVariant] || VARIANTS.neutral;

  return (
    <span className={clsx('badge', cls, className)}>
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: DOT_COLORS[resolvedVariant] }}
        />
      )}
      {children}
    </span>
  );
};

// Convenience wrappers
Badge.Status = ({ value, ...props }) => {
  const labels = {
    pending: 'Pending', active: 'Active', resolved: 'Resolved', closed: 'Closed',
    critical: 'Critical', available: 'Available', assigned: 'Assigned',
    unavailable: 'Unavailable', in_use: 'In Use', partially_used: 'Partially Used', maintenance: 'Maintenance',
  };
  return (
    <Badge status={value} dot {...props}>
      {labels[value] || value}
    </Badge>
  );
};

export default Badge;
