import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Menu, X, ChevronRight, Phone, Mail as MailIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home',         to: '/' },
  { label: 'Features',     to: '/#features' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'Testimonials', to: '/#testimonials' },
  { label: 'Contact',      to: '/#contact' },
];

const AuthLayout = ({ children, title, subtitle }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#03070f', display: 'flex', flexDirection: 'column', position: 'relative', fontFamily: 'var(--font-sans)' }}>

      {/* ── Background ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-12%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-12%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '25%', width: '30vw', height: '30vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,132,252,0.04) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.018, backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        transition: 'all 0.35s ease',
        background: scrolled ? 'rgba(3,7,15,0.95)' : 'rgba(3,7,15,0.7)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.04)',
        boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.5)' : 'none',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: '0.875rem', background: 'linear-gradient(135deg, #6366f1, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(99,102,241,0.4)', flexShrink: 0 }}>
              <ShieldAlert style={{ width: 19, height: 19, color: 'white' }} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1.0625rem', fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-0.01em' }}>DisasterShield</div>
              <div style={{ fontSize: '0.575rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 2 }}>Emergency Response</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="auth-desk-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
            {NAV_LINKS.map((l) => (
              <Link key={l.label} to={l.to}
                style={{ padding: '0.5rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', textDecoration: 'none', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth buttons */}
          <div className="auth-desk-cta" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Link to="/login"
              style={{
                padding: '0.5rem 1.125rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600,
                color: isLogin ? '#fff' : '#cbd5e1', textDecoration: 'none',
                border: isLogin ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.1)',
                background: isLogin ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { if (!isLogin) { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { if (!isLogin) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#cbd5e1'; } }}>
              Sign In
            </Link>
            <Link to="/register"
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 700,
                color: 'white', textDecoration: 'none',
                background: !isLogin ? 'linear-gradient(135deg, #6366f1, #4338ca)' : 'rgba(99,102,241,0.15)',
                boxShadow: !isLogin ? '0 4px 16px rgba(99,102,241,0.4)' : 'none',
                border: !isLogin ? 'none' : '1px solid rgba(99,102,241,0.3)',
                transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
              Get Started <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          {/* Mobile button */}
          <button className="auth-mobile-btn" onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.375rem', display: 'none' }}>
            {menuOpen ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ background: 'rgba(6,10,20,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.75rem 1.5rem 1.25rem' }}>
            {NAV_LINKS.map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '0.75rem 0.5rem', color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {l.label}
              </Link>
            ))}
            <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem' }}>
              <Link to="/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '0.625rem', borderRadius: '0.75rem', color: '#cbd5e1', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.875rem', fontWeight: 600 }}>Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '0.625rem', borderRadius: '0.75rem', color: 'white', textDecoration: 'none', background: 'linear-gradient(135deg,#6366f1,#4338ca)', fontSize: '0.875rem', fontWeight: 700 }}>Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════ MAIN ═══════════════════ */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4rem 1.25rem 4rem', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 480, margin: '4rem auto' }} className="animate-fade-in-up">

          {/* Heading */}
          {title && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.875rem', borderRadius: 999, marginBottom: '1rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <ShieldAlert style={{ width: 13, height: 13, color: '#818cf8' }} />
                <span style={{ color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em' }}>{isLogin ? 'MEMBER PORTAL' : 'JOIN DISASTERSHIELD'}</span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 4.5vw, 2.375rem)', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)', letterSpacing: '-0.035em', lineHeight: 1.1, margin: 0 }}>{title}</h1>
              {subtitle && <p style={{ color: '#64748b', fontSize: '0.9375rem', marginTop: '0.5rem', lineHeight: 1.6 }}>{subtitle}</p>}
            </div>
          )}

          {/* Glass Card */}
          <div style={{
            background: 'linear-gradient(160deg, rgba(20,30,50,0.95) 0%, rgba(8,14,28,0.92) 100%)',
            backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.5rem',
            padding: '2.25rem', position: 'relative', overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(99,102,241,0.06), 0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(6,182,212,0.3), transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: 180, height: 180, background: 'radial-gradient(circle at top left, rgba(99,102,241,0.06), transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
              {children}
            </div>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { icon: '🔒', text: 'SSL Encrypted' },
              { icon: '🛡️', text: 'CERT-IN Certified' },
              { icon: '⚡', text: '99.9% Uptime' },
            ].map(b => (
              <span key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#334155', fontSize: '0.75rem', fontWeight: 600 }}>
                <span style={{ fontSize: '0.8rem' }}>{b.icon}</span> {b.text}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer style={{ position: 'relative', zIndex: 10, background: 'rgba(0,0,0,0.35)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 2rem 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem' }} className="auth-footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '0.625rem', background: 'linear-gradient(135deg,#6366f1,#4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert style={{ width: 14, height: 14, color: 'white' }} />
                </div>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>DisasterShield</span>
              </div>
              <p style={{ color: '#334155', fontSize: '0.8rem', lineHeight: 1.7, maxWidth: 220 }}>Coordinating emergency response across India through technology.</p>
            </div>
            {/* Platform */}
            <div>
              <p style={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Platform</p>
              {['Home', 'Features', 'How It Works', 'Testimonials'].map(item => (
                <Link key={item} to={`/#${item.toLowerCase().replace(/ /g, '-')}`}
                  style={{ display: 'block', color: '#334155', fontSize: '0.85rem', textDecoration: 'none', padding: '0.25rem 0', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#334155'}>{item}</Link>
              ))}
            </div>
            {/* Account */}
            <div>
              <p style={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Account</p>
              {[{ l: 'Sign In', t: '/login' }, { l: 'Create Account', t: '/register' }, { l: 'Reset Password', t: '/reset-password' }].map(item => (
                <Link key={item.l} to={item.t}
                  style={{ display: 'block', color: '#334155', fontSize: '0.85rem', textDecoration: 'none', padding: '0.25rem 0', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#334155'}>{item.l}</Link>
              ))}
            </div>
            {/* Contact */}
            <div>
              <p style={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Contact</p>
              <a href="mailto:support@disastershield.in" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', textDecoration: 'none', fontSize: '0.82rem', padding: '0.25rem 0', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                onMouseLeave={e => e.currentTarget.style.color = '#334155'}>
                <MailIcon style={{ width: 13, height: 13 }} /> support@disastershield.in
              </a>
              <a href="tel:1800" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', textDecoration: 'none', fontSize: '0.82rem', padding: '0.25rem 0', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                onMouseLeave={e => e.currentTarget.style.color = '#334155'}>
                <Phone style={{ width: 13, height: 13 }} /> 1800-SHIELD
              </a>
              <div style={{ marginTop: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f43f5e', animation: 'authPulse 1.5s infinite', display: 'inline-block' }} />
                <span style={{ color: '#fca5a5', fontSize: '0.72rem', fontWeight: 700 }}>Emergency: 112</span>
              </div>
            </div>
          </div>
          {/* Bottom bar */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.78rem', color: '#1e293b', margin: 0 }}>© 2025 DisasterShield Technology Pvt. Ltd.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['Privacy', 'Terms', 'Cookies'].map(l => (
                <a key={l} href="#" style={{ fontSize: '0.78rem', color: '#1e3a5f', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                  onMouseLeave={e => e.currentTarget.style.color = '#1e3a5f'}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes authPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        .auth-desk-nav  { display: flex !important; }
        .auth-desk-cta  { display: flex !important; }
        .auth-mobile-btn { display: none !important; }
        @media (max-width: 900px) {
          .auth-desk-nav  { display: none !important; }
          .auth-desk-cta  { display: none !important; }
          .auth-mobile-btn { display: flex !important; }
        }
        @media (max-width: 600px) {
          .auth-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 420px) {
          .auth-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
