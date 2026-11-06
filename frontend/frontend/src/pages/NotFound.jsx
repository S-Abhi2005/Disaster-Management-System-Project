import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { getRolePath } from '../utils/helpers';

const NotFound = () => {
  const { isAuthenticated, user } = useAuthStore();
  const dashboardPath = isAuthenticated && user ? getRolePath(user.role) : '/login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative" style={{ background: '#060d1a' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.08), transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center text-center px-6 animate-fade-in-up">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-xl shadow-indigo-500/20" style={{ marginBottom: '2rem' }}>
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>

        {/* 404 */}
        <div className="text-8xl font-black font-display gradient-text leading-none" style={{ marginBottom: '1rem' }}>
          404
        </div>

        <h1 className="text-2xl font-bold text-white font-display" style={{ marginBottom: '0.75rem' }}>
          Page Not Found
        </h1>
        <p className="text-slate-500 max-w-sm leading-relaxed" style={{ marginBottom: '2.5rem' }}>
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to safety.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center" style={{ gap: '0.75rem' }}>
          <Link to={dashboardPath} className="btn btn-primary">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <button onClick={() => window.history.back()} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Bottom decoration */}
        <div className="mt-16 text-xs text-slate-700">
          DisasterShield · Emergency Response Platform
        </div>
      </div>
    </div>
  );
};

export default NotFound;
