import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert, LayoutDashboard, FileText, MapPin, Bell,
  User, LogOut, Menu, X, ChevronRight, Users, Package,
  Activity, Clipboard, AlertTriangle, Map, History,
  ChevronDown, ToggleLeft, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { logoutUser } from '../api/authService';
import { NotificationBell } from '../components/NotificationCenter';
import NotificationCenter from '../components/NotificationCenter';
import useNotifications from '../hooks/useNotifications';
import { getProfilePath } from '../utils/helpers';

/* ── Nav config ─────────────────────────────────────────────────────────────── */
const NAV_LINKS = {
  citizen: [
    { to: '/citizen/dashboard',  icon: LayoutDashboard, label: 'Overview' },
    { to: '/citizen/incidents',  icon: FileText,         label: 'My Incidents' },
    { to: '/citizen/report',     icon: AlertTriangle,    label: 'Report Incident' },
    { to: '/citizen/nearby',     icon: MapPin,           label: 'Nearby Map' },
    { to: '/citizen/alerts',     icon: Bell,             label: 'Alerts' },
    { to: '/citizen/profile',    icon: User,             label: 'Profile' },
    
  ],
  volunteer: [
    { to: '/volunteer/dashboard',    icon: LayoutDashboard, label: 'Overview' },
    { to: '/volunteer/available',    icon: Activity,        label: 'Available Incidents' },
    { to: '/volunteer/assignments',  icon: Clipboard,       label: 'My Assignments' },
    { to: '/volunteer/map',          icon: MapPin,           label: 'Map View' },
    { to: '/volunteer/alerts',       icon: Bell,            label: 'Alerts' },
    { to: '/volunteer/profile',      icon: User,            label: 'Profile' },
   
  ],
  admin: [
    { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/incidents',     icon: AlertTriangle,    label: 'Incidents' },
    { to: '/admin/volunteers',    icon: Users,            label: 'Volunteers' },
    { to: '/admin/resources',     icon: Package,          label: 'Resources' },
    { to: '/admin/analytics',     icon: Activity,         label: 'Analytics' },
    { to: '/admin/map',           icon: MapPin,           label: 'Map View' },
   
  ],
};

const ROLE_CONFIG = {
  citizen:   { label: 'Citizen',   gradFrom: '#3b82f6', gradTo: '#1d4ed8', accent: '#60a5fa', badge: 'text-blue-300',   bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)' },
  volunteer: { label: 'Volunteer', gradFrom: '#22c55e', gradTo: '#15803d', accent: '#4ade80', badge: 'text-green-300',  bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)' },
  admin:     { label: 'Admin',     gradFrom: '#a855f7', gradTo: '#7e22ce', accent: '#c084fc', badge: 'text-purple-300', bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.2)' },
};

/* ── Sidebar Component ──────────────────────────────────────────────────────── */
const Sidebar = ({ role, user, config, links, onClose }) => {
  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '??';
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    useAuthStore.getState().logout();
    toast.success('Signed out successfully', { icon: '👋' });
    navigate('/login', { replace: true });
  };

  return (
    <aside className="glass-nav flex flex-col h-full w-full" style={{ padding: '0.5rem' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.05]">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shrink-0"
          style={{ background: `linear-gradient(135deg, ${config.gradFrom}, ${config.gradTo})` }}
        >
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-white font-bold text-sm font-display leading-tight tracking-tight">DisasterShield</div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: config.accent }}>
            {config.label} Portal
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto hide-scrollbar space-y-0.5" style={{ marginTop: '1.5rem' }}>
        <div className="section-label mb-3">Navigation</div>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={isActive ? { color: config.accent } : undefined}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: config.accent }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-white/[0.04]">
        <button
          onClick={handleLogout}
          className="nav-link w-full text-left transition-colors hover:!text-red-400 hover:!bg-red-500/[0.07]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="flex-1">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

/* ── Main Layout ────────────────────────────────────────────────────────────── */
const DashboardLayout = ({ children, role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  const links  = NAV_LINKS[role]  || [];
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.citizen;

  // Simulated real-time notifications
  useNotifications(45000);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Build breadcrumb from path
  const segments = location.pathname.split('/').filter(Boolean).slice(1);
  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '??';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#060d1a' }}>

      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:flex shrink-0 w-64 xl:w-72" style={{ padding: '1rem' }}>
        <Sidebar role={role} user={user} config={config} links={links} onClose={() => {}} />
      </div>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 animate-slide-left" style={{ padding: '1rem' }}>
            <Sidebar role={role} user={user} config={config} links={links} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: '-20%', left: '20%',
            width: '50%', height: '50%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', right: '10%',
            width: '40%', height: '40%',
            background: 'radial-gradient(ellipse, rgba(6,182,212,0.05) 0%, transparent 70%)',
          }} />
        </div>

        {/* ── Top Bar ── */}
        <header 
          className="relative z-40 flex items-center justify-between h-[64px] shrink-0" 
          style={{ 
            paddingLeft: '2rem', 
            paddingRight: '2rem',
            background: 'rgba(6, 13, 26, 0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb */}
            <nav className="hidden lg:flex items-center gap-1.5 text-sm min-w-0">
              <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: config.accent }} />
              <span className="text-slate-500 font-medium">DisasterShield</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span className="font-semibold" style={{ color: config.accent }}>{config.label}</span>
              {segments.map((seg, i) => (
                <React.Fragment key={i}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span className="text-slate-300 capitalize font-medium truncate">
                    {seg.replace(/-/g, ' ')}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right: bell + status + avatar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live badge */}
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: config.bg,
                border: `1px solid ${config.border}`,
                color: config.accent,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </div>

            {/* Notification bell */}
            <NotificationBell />

            {/* Avatar */}
            <Link
              to={getProfilePath(role)}
              className="avatar avatar-sm text-white text-[11px] font-display font-bold hover:opacity-80 transition-opacity"
              style={{
                background: `linear-gradient(135deg, ${config.gradFrom}, ${config.gradTo})`,
                borderRadius: '0.625rem',
                textDecoration: 'none',
              }}
              title="Go to Profile"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* ── Notification Panel ── */}
        <NotificationCenter />

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto relative z-10 p-8 lg:p-10 xl:p-12">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
