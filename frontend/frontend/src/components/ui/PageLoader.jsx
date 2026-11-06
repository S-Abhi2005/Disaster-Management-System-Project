import React from 'react';
import { ShieldAlert } from 'lucide-react';

const PageLoader = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
    style={{ background: '#060d1a' }}
  >
    {/* Ambient glow */}
    <div className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.1), transparent 70%)',
      }}
    />

    <div className="relative flex flex-col items-center gap-6 animate-fade-in">
      {/* Logo + spinner ring */}
      <div className="relative">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, rgba(99,102,241,0.8) 0%, transparent 70%)',
            animation: 'spin 1.2s linear infinite',
            padding: '3px',
          }}
        >
          <div className="w-full h-full rounded-full" style={{ background: '#060d1a' }} />
        </div>

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center relative z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.1))',
            border: '1px solid rgba(99,102,241,0.2)',
            margin: '4px',
          }}
        >
          <ShieldAlert className="w-7 h-7 text-indigo-400" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <div className="text-white font-bold text-lg font-display tracking-tight">DisasterShield</div>
        <div className="text-slate-500 text-sm mt-1">Loading…</div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-500"
            style={{
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

export default PageLoader;
