import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

const ACCENT_COLORS = {
  primary: { from: '#6366f1', to: '#4f46e5', glow: 'rgba(99,102,241,0.15)', text: '#a5b4fc', bg: 'rgba(99,102,241,0.1)' },
  success: { from: '#22c55e', to: '#16a34a', glow: 'rgba(34,197,94,0.15)',  text: '#4ade80', bg: 'rgba(34,197,94,0.1)' },
  warning: { from: '#eab308', to: '#ca8a04', glow: 'rgba(234,179,8,0.15)', text: '#facc15', bg: 'rgba(234,179,8,0.1)' },
  danger:  { from: '#f43f5e', to: '#e11d48', glow: 'rgba(244,63,94,0.15)', text: '#f87171', bg: 'rgba(244,63,94,0.1)' },
  info:    { from: '#06b6d4', to: '#0891b2', glow: 'rgba(6,182,212,0.15)', text: '#22d3ee', bg: 'rgba(6,182,212,0.1)' },
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,       // number, positive = up, negative = down
  trendLabel,
  accent = 'primary',
  loading = false,
  className = '',
  link,
}) => {
  const colors = ACCENT_COLORS[accent] || ACCENT_COLORS.primary;

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? '#4ade80' : trend < 0 ? '#f87171' : '#64748b';

  if (loading) {
    return (
      <div className={clsx('stat-card', className)}>
        <div className="skeleton h-4 w-1/2 mb-4 rounded" />
        <div className="skeleton h-8 w-1/3 mb-2 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    );
  }

  const CardContent = (
    <>
      {/* Glow on hover */}
      <div
        className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 30% 30%, ${colors.glow}, transparent 70%)` }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4 relative">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">{title}</p>
          <div className="text-3xl font-bold font-display text-white leading-none">{value}</div>
        </div>
        {Icon && (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${colors.from}22, ${colors.to}11)`,
              border: `1px solid ${colors.from}33`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: colors.text }} />
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />
              <span className="text-xs font-semibold" style={{ color: trendColor }}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
          {(subtitle || trendLabel) && (
            <p className="text-xs text-slate-500">
              {trendLabel || subtitle}
            </p>
          )}
        </div>
        {link && (
          <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Accent bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-[inherit] opacity-40 group-hover:opacity-70 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${colors.from}, ${colors.to}, transparent)` }}
      />
    </>
  );

  return link ? (
    <Link to={link} className={clsx('stat-card group', className, 'hover:scale-[1.02] transition-transform')} style={{ cursor: 'pointer !important' }}>
      {CardContent}
    </Link>
  ) : (
    <div className={clsx('stat-card group', className)}>
      {CardContent}
    </div>
  );
};

export default StatCard;
