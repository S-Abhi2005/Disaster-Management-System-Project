import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert, Zap, Users, Globe, Menu, X, ChevronRight, ArrowRight,
  Phone, Mail as MailIcon, MapPin, Bell, Shield, Radio, Heart,
  BarChart3, Clock, CheckCircle2, Star, MessageCircle, ExternalLink,
  AlertTriangle, Layers, Eye, Activity,
} from 'lucide-react';
import LoginModal from '../components/auth/LoginModal';
import RegisterModal from '../components/auth/RegisterModal';

/* ─────────── DATA ─────────── */
const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
];

const FEATURES = [
  {
    icon: Bell, color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.2)',
    title: 'Real-Time Alerts',
    desc: 'Get instant notifications about disasters in your area with precise geolocation tracking and severity assessment.',
  },
  {
    icon: MapPin, color: '#22d3ee', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.2)',
    title: 'Live Incident Mapping',
    desc: 'Interactive maps showing active incidents, safe zones, evacuation routes and nearby shelters updated in real-time.',
  },
  {
    icon: Users, color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.2)',
    title: 'Volunteer Coordination',
    desc: 'Smart matching system that deploys volunteers based on skills, proximity and availability for maximum impact.',
  },
  {
    icon: Radio, color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.2)',
    title: 'Emergency SOS',
    desc: 'One-tap SOS broadcasting to emergency services with auto-shared GPS location and medical information.',
  },
  {
    icon: BarChart3, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.2)',
    title: 'Analytics Dashboard',
    desc: 'Comprehensive dashboards for authorities with response metrics, resource allocation and predictive patterns.',
  },
  {
    icon: Shield, color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.2)',
    title: 'Community Safety',
    desc: 'Crowdsourced incident reporting, community-driven alerts and neighborhood watch integration.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign Up', desc: 'Create your account as a citizen or volunteer in under 2 minutes.', icon: CheckCircle2, color: '#818cf8' },
  { step: '02', title: 'Set Your Location', desc: 'Enable GPS or enter your area to receive relevant alerts and updates.', icon: MapPin, color: '#22d3ee' },
  { step: '03', title: 'Stay Protected', desc: 'Receive real-time alerts, report incidents and access emergency resources.', icon: Shield, color: '#4ade80' },
  { step: '04', title: 'Respond & Help', desc: 'Volunteers get dispatched to incidents. Citizens can track and communicate.', icon: Heart, color: '#f97316' },
];

const STATS = [
  { value: '50,000+', label: 'Citizens Protected', icon: Users },
  { value: '2,400+', label: 'Active Volunteers', icon: Heart },
  { value: '98.7%', label: 'Response Rate', icon: Activity },
  { value: '120+', label: 'Districts Covered', icon: Globe },
];

const TESTIMONIALS = [
  {
    quote: 'DisasterShield alerted us 15 minutes before the flood reached our village. That time saved lives. Every household in our district should be on this platform.',
    name: 'Priya Mehta',
    role: 'Citizen, Pune',
    initials: 'PM',
    gradient: 'linear-gradient(135deg, #818cf8, #c084fc)',
  },
  {
    quote: 'The volunteer dispatch system is incredible. I get matched with incidents based on my medical training and I arrive faster because of the optimized routing.',
    name: 'Dr. Arjun Rao',
    role: 'Volunteer, Bangalore',
    initials: 'AR',
    gradient: 'linear-gradient(135deg, #22d3ee, #4ade80)',
  },
  {
    quote: 'As a district administrator, the analytics dashboard has completely transformed how we allocate resources during monsoon season. Response times dropped 60%.',
    name: 'Vikram Singh',
    role: 'District Officer, Maharashtra',
    initials: 'VS',
    gradient: 'linear-gradient(135deg, #f97316, #f472b6)',
  },
];

/* ─────────── HELPERS ─────────── */
const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ─────────── COMPONENT ─────────── */
const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Auto-open modals from URL query params (e.g. /?auth=login)
  useEffect(() => {
    const auth = searchParams.get('auth');
    if (auth === 'login') { setLoginOpen(true); setSearchParams({}, { replace: true }); }
    else if (auth === 'register') { setRegisterOpen(true); setSearchParams({}, { replace: true }); }
  }, [searchParams, setSearchParams]);

  const handleNav = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    const id = href.replace('#', '');
    scrollTo(id);
  };

  const openLogin = () => { setRegisterOpen(false); setLoginOpen(true); };
  const openRegister = () => { setLoginOpen(false); setRegisterOpen(true); };

  return (
    <div style={{ minHeight: '100vh', background: '#03070f', color: '#f1f5f9', fontFamily: 'var(--font-sans)', position: 'relative', overflow: 'hidden' }}>

      {/* ── Background effects ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '20%', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,132,252,0.05) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.018, backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/*  NAVBAR                                         */}
      {/* ═══════════════════════════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        transition: 'all 0.35s ease',
        background: scrolled ? 'rgba(3,7,15,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.5)' : 'none',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          {/* Logo */}
          <a href="#home" onClick={(e) => handleNav(e, '#home')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.875rem', background: 'linear-gradient(135deg, #6366f1, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(99,102,241,0.5)' }}>
              <ShieldAlert style={{ width: 20, height: 20, color: 'white' }} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1.125rem', fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-0.02em' }}>DisasterShield</div>
              <div style={{ fontSize: '0.6rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 2 }}>Emergency Response</div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="landing-desk-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={(e) => handleNav(e, l.href)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', textDecoration: 'none', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}>
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA — now opens modals */}
          <div className="landing-desk-cta" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button onClick={openLogin}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#cbd5e1'; }}>
              Sign In
            </button>
            <button onClick={openRegister}
              style={{ padding: '0.5rem 1.375rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 700, color: 'white', textDecoration: 'none', background: 'linear-gradient(135deg, #6366f1, #4338ca)', boxShadow: '0 4px 18px rgba(99,102,241,0.45)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', border: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(99,102,241,0.45)'; }}>
              Get Started <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="landing-mobile-btn" onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.375rem', display: 'none' }}>
            {menuOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: 'rgba(6,10,20,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.75rem 1.5rem 1.25rem', animation: 'fadeIn 0.2s ease' }}>
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={(e) => handleNav(e, l.href)}
                style={{ display: 'block', padding: '0.875rem 0.5rem', color: '#94a3b8', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {l.label}
              </a>
            ))}
            <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem' }}>
              <button onClick={() => { setMenuOpen(false); openLogin(); }} style={{ flex: 1, textAlign: 'center', padding: '0.75rem', borderRadius: '0.75rem', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.9rem', fontWeight: 600, background: 'transparent', cursor: 'pointer' }}>Sign In</button>
              <button onClick={() => { setMenuOpen(false); openRegister(); }} style={{ flex: 1, textAlign: 'center', padding: '0.75rem', borderRadius: '0.75rem', color: 'white', background: 'linear-gradient(135deg,#6366f1,#4338ca)', fontSize: '0.9rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Get Started</button>
            </div>
          </div>
        )}
      </header>


      {/* ═══════════════════════════════════════════════ */}
      {/*  HERO SECTION — with background image           */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="home" style={{ position: 'relative', zIndex: 1, paddingTop: '0', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(/images/disaster-bg.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}>
          {/* Dark overlay with gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(3,7,15,0.75) 0%, rgba(3,7,15,0.6) 30%, rgba(3,7,15,0.7) 60%, rgba(3,7,15,0.95) 100%)',
          }} />
          {/* Additional color tint */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.15) 0%, transparent 60%)',
          }} />
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '7rem 2rem 6rem', textAlign: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900,
            fontFamily: 'var(--font-display)', lineHeight: 1.08,
            letterSpacing: '-0.04em', margin: '0 auto', maxWidth: 800,
            animation: 'fadeInUp 0.7s ease both 0.1s',
            textShadow: '0 4px 30px rgba(0,0,0,0.5)',
          }}>
            <span style={{ color: 'white' }}>Protecting Lives{' '}</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #a5b4fc, #818cf8, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              When It Matters Most
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{ color: 'rgba(203,213,225,0.9)', fontSize: 'clamp(1rem, 2vw, 1.1875rem)', lineHeight: 1.7, maxWidth: 620, margin: '1.5rem auto 0', animation: 'fadeInUp 0.7s ease both 0.2s', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            India's unified emergency response platform connecting citizens, volunteers and authorities for faster, smarter disaster management across 120+ districts.
          </p>

          {/* CTA Buttons — now open modals */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap', animation: 'fadeInUp 0.7s ease both 0.3s' }}>
            <button onClick={openRegister} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 2.25rem', borderRadius: '0.875rem',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)',
              color: 'white', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #4338ca)',
              boxShadow: '0 6px 24px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(99,102,241,0.6), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15)'; }}>
              Create Free Account <ArrowRight style={{ width: 18, height: 18 }} />
            </button>

            <a href="#features" onClick={(e) => handleNav(e, '#features')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 2rem', borderRadius: '0.875rem',
              fontSize: '1rem', fontWeight: 600,
              color: '#94a3b8', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
              <Eye style={{ width: 18, height: 18 }} /> Explore Features
            </a>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', maxWidth: 720, margin: '4.5rem auto 0', animation: 'fadeInUp 0.7s ease both 0.5s' }}>
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} style={{
                padding: '1.25rem 1rem', borderRadius: '1rem', textAlign: 'center',
                background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <Icon style={{ width: 18, height: 18, color: '#64748b', margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '0.25rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════ */}
      {/*  FEATURES SECTION                               */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '6rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '1.25rem' }}>
              <Layers style={{ width: 13, height: 13, color: '#818cf8' }} />
              <span style={{ color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em' }}>PLATFORM FEATURES</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)', letterSpacing: '-0.035em', margin: '0 0 1rem' }}>
              Everything You Need to<br /><span style={{ background: 'linear-gradient(135deg, #818cf8, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Stay Protected</span>
            </h2>
            <p style={{ color: '#475569', fontSize: '1.0625rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              Built with cutting-edge technology to provide real-time disaster management capabilities for every stakeholder.
            </p>
          </div>

          {/* Features grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {FEATURES.map(({ icon: Icon, color, bg, border, title, desc }) => (
              <div key={title} style={{
                padding: '2rem', borderRadius: '1.25rem',
                background: 'linear-gradient(145deg, rgba(20,30,48,0.8), rgba(10,16,30,0.6))',
                border: `1px solid rgba(255,255,255,0.06)`,
                transition: 'all 0.3s ease', cursor: 'default',
                position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.4)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                {/* Hover glow */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${bg}, transparent 70%)`, opacity: 0.5, pointerEvents: 'none' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '0.875rem', background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <Icon style={{ width: 22, height: 22, color }} />
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-display)', margin: '0 0 0.625rem' }}>{title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════ */}
      {/*  HOW IT WORKS SECTION                           */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ position: 'relative', zIndex: 1, padding: '6rem 0', background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.03) 50%, transparent 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: 999, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', marginBottom: '1.25rem' }}>
              <Zap style={{ width: 13, height: 13, color: '#22d3ee' }} />
              <span style={{ color: '#67e8f9', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em' }}>HOW IT WORKS</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)', letterSpacing: '-0.035em', margin: '0 0 1rem' }}>
              Get Protected in<br /><span style={{ background: 'linear-gradient(135deg, #22d3ee, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Four Simple Steps</span>
            </h2>
            <p style={{ color: '#475569', fontSize: '1.0625rem', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
              Join thousands of citizens and volunteers already using DisasterShield to stay safe.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon, color }, i) => (
              <div key={step} style={{
                position: 'relative', padding: '2rem 1.5rem', borderRadius: '1.25rem',
                background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center', transition: 'all 0.3s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}33`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: `${color}99`, fontFamily: 'var(--font-display)', letterSpacing: '0.1em', marginBottom: '1rem' }}>STEP {step}</div>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${color}15`, border: `2px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <Icon style={{ width: 24, height: 24, color }} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-display)', margin: '0 0 0.625rem' }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════ */}
      {/*  TESTIMONIALS SECTION                           */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="testimonials" style={{ position: 'relative', zIndex: 1, padding: '6rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: 999, background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', marginBottom: '1.25rem' }}>
              <Star style={{ width: 13, height: 13, color: '#f472b6' }} />
              <span style={{ color: '#f9a8d4', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em' }}>TESTIMONIALS</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)', letterSpacing: '-0.035em', margin: '0 0 1rem' }}>
              Trusted by<br /><span style={{ background: 'linear-gradient(135deg, #f472b6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Real People</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{
                padding: '2rem', borderRadius: '1.25rem',
                background: 'linear-gradient(145deg, rgba(20,30,48,0.7), rgba(10,16,30,0.5))',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.3s ease',
                display: 'flex', flexDirection: 'column',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 15, height: 15, color: '#facc15', fill: '#facc15' }} />)}
                </div>
                <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.75, fontStyle: 'italic', margin: '0 0 1.5rem', flex: 1 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '0.75rem', background: t.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-display)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════ */}
      {/*  CTA SECTION — Redesigned                       */}
      {/* ═══════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '7rem 0 6rem', overflow: 'hidden' }}>
        {/* Animated background orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div className="cta-orb cta-orb-1" style={{ position: 'absolute', top: '10%', left: '5%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)', filter: 'blur(60px)' }} />
          <div className="cta-orb cta-orb-2" style={{ position: 'absolute', bottom: '5%', right: '8%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.15), transparent 70%)', filter: 'blur(50px)' }} />
          <div className="cta-orb cta-orb-3" style={{ position: 'absolute', top: '40%', left: '60%', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,132,252,0.12), transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{
            borderRadius: '2rem', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(160deg, rgba(15,23,42,0.85) 0%, rgba(20,30,55,0.75) 40%, rgba(10,16,35,0.9) 100%)',
            border: '1px solid rgba(99,102,241,0.15)',
            boxShadow: '0 0 80px rgba(99,102,241,0.08), 0 40px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
          }}>
            {/* Inner gradient border glow */}
            <div style={{ position: 'absolute', inset: -1, borderRadius: '2rem', padding: 1, background: 'linear-gradient(135deg, rgba(99,102,241,0.3), transparent 40%, transparent 60%, rgba(34,211,238,0.2))', pointerEvents: 'none', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
            
            {/* Grid pattern overlay */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

            {/* Content Layout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', padding: '3.5rem 3.5rem', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>

              {/* Left — Shield icon cluster */}
              <div className="cta-icon-side" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: 180, height: 180 }}>
                  {/* Pulsing rings */}
                  <div className="cta-pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.15)', animation: 'ctaPulse 3s ease-in-out infinite' }} />
                  <div className="cta-pulse-ring" style={{ position: 'absolute', inset: -15, borderRadius: '50%', border: '1px solid rgba(99,102,241,0.08)', animation: 'ctaPulse 3s ease-in-out infinite 0.6s' }} />
                  <div className="cta-pulse-ring" style={{ position: 'absolute', inset: -30, borderRadius: '50%', border: '1px solid rgba(99,102,241,0.04)', animation: 'ctaPulse 3s ease-in-out infinite 1.2s' }} />
                  
                  {/* Central glow */}
                  <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)', filter: 'blur(20px)' }} />
                  
                  {/* Shield icon */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 100, height: 100, borderRadius: '1.75rem',
                    background: 'linear-gradient(145deg, #6366f1, #4338ca, #3730a3)',
                    boxShadow: '0 0 40px rgba(99,102,241,0.4), 0 8px 32px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'ctaFloat 4s ease-in-out infinite',
                  }}>
                    <ShieldAlert style={{ width: 44, height: 44, color: 'white', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
                  </div>

                  {/* Orbiting dots */}
                  <div style={{ position: 'absolute', top: 12, right: 18, width: 10, height: 10, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 12px rgba(34,211,238,0.6)', animation: 'ctaFloat 3s ease-in-out infinite 0.5s' }} />
                  <div style={{ position: 'absolute', bottom: 20, left: 10, width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 10px rgba(167,139,250,0.5)', animation: 'ctaFloat 3.5s ease-in-out infinite 1s' }} />
                  <div style={{ position: 'absolute', top: '50%', right: -5, width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.5)', animation: 'ctaFloat 2.8s ease-in-out infinite 0.3s' }} />
                </div>
              </div>

              {/* Right — Text & CTA */}
              <div style={{ flex: 1, minWidth: 280 }}>
                {/* Badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: 999, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', marginBottom: '1.25rem' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.5)', animation: 'livePulse 1.5s infinite' }} />
                  <span style={{ color: '#86efac', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em' }}>FREE FOREVER FOR CITIZENS</span>
                </div>

                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 900,
                  fontFamily: 'var(--font-display)', letterSpacing: '-0.04em',
                  lineHeight: 1.1, margin: '0 0 1rem',
                }}>
                  <span style={{ color: 'white' }}>Your community's safety </span>
                  <span style={{ background: 'linear-gradient(135deg, #818cf8, #22d3ee, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>starts with you</span>
                </h2>

                <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.75, margin: '0 0 1.75rem', maxWidth: 500 }}>
                  Be part of a network that has already protected <span style={{ color: '#c7d2fe', fontWeight: 600 }}>50,000+ lives</span> across <span style={{ color: '#c7d2fe', fontWeight: 600 }}>120+ districts</span>. Sign up in under 2 minutes.
                </p>

                {/* CTA Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                  <button onClick={openRegister} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.9375rem 2.5rem', borderRadius: '0.875rem',
                    fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5, #4338ca)',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                    transition: 'all 0.25s ease',
                    position: 'relative', overflow: 'hidden',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 44px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.15)'; }}>
                    Create Free Account <ArrowRight style={{ width: 18, height: 18 }} />
                  </button>

                  <button onClick={openLogin} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.9375rem 1.75rem', borderRadius: '0.875rem',
                    fontSize: '0.9375rem', fontWeight: 600,
                    color: '#94a3b8', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.25s ease',
                    backdropFilter: 'blur(8px)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                    Sign In <ChevronRight style={{ width: 16, height: 16 }} />
                  </button>
                </div>

                {/* Trust indicators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {[
                    { icon: CheckCircle2, text: 'No credit card required' },
                    { icon: Clock, text: '2-min setup' },
                    { icon: Shield, text: 'Govt. verified' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Icon style={{ width: 14, height: 14, color: '#475569' }} />
                      <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════ */}
      {/*  FOOTER                                         */}
      {/* ═══════════════════════════════════════════════ */}
      <footer id="contact" style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 2rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }} className="landing-footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '0.75rem', background: 'linear-gradient(135deg,#6366f1,#4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert style={{ width: 16, height: 16, color: 'white' }} />
                </div>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-display)' }}>DisasterShield</span>
              </div>
              <p style={{ color: '#334155', fontSize: '0.85rem', lineHeight: 1.75, maxWidth: 240 }}>
                India's unified platform for connecting citizens with emergency responders and volunteers for faster disaster management.
              </p>
            </div>

            {/* Platform links */}
            <div>
              <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Platform</p>
              {['Home', 'Features', 'How It Works', 'Testimonials'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} onClick={(e) => handleNav(e, `#${item.toLowerCase().replace(/ /g, '-')}`)}
                  style={{ display: 'block', color: '#334155', fontSize: '0.875rem', textDecoration: 'none', padding: '0.3rem 0', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#334155'}>
                  {item}
                </a>
              ))}
            </div>

            {/* Account */}
            <div>
              <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Account</p>
              {[
                { label: 'Sign In', action: openLogin },
                { label: 'Create Account', action: openRegister },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  style={{ display: 'block', color: '#334155', fontSize: '0.875rem', textDecoration: 'none', padding: '0.3rem 0', transition: 'color 0.15s', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#334155'}>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Contact */}
            <div>
              <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Contact</p>
              <a href="mailto:support@disastershield.in" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', textDecoration: 'none', fontSize: '0.85rem', padding: '0.3rem 0', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                onMouseLeave={e => e.currentTarget.style.color = '#334155'}>
                <MailIcon style={{ width: 14, height: 14, flexShrink: 0 }} /> support@disastershield.in
              </a>
              <a href="tel:+911800" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', textDecoration: 'none', fontSize: '0.85rem', padding: '0.3rem 0', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                onMouseLeave={e => e.currentTarget.style.color = '#334155'}>
                <Phone style={{ width: 14, height: 14, flexShrink: 0 }} /> 1800-SHIELD (Toll Free)
              </a>
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.18)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e', animation: 'livePulse 1.5s infinite', display: 'inline-block' }} />
                <span style={{ color: '#fca5a5', fontSize: '0.75rem', fontWeight: 700 }}>Emergency: 112</span>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#1e293b', margin: 0 }}>© 2025 DisasterShield Technology Pvt. Ltd. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
                <a key={l} href="#" style={{ fontSize: '0.8rem', color: '#1e3a5f', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                  onMouseLeave={e => e.currentTarget.style.color = '#1e3a5f'}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Auth Modals ── */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToRegister={openRegister}
      />
      <RegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSwitchToLogin={openLogin}
      />

      {/* ── Global styles ── */}
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }

        .landing-desk-nav { display: flex !important; }
        .landing-desk-cta { display: flex !important; }
        .landing-mobile-btn { display: none !important; }

        .modal-scrollbar::-webkit-scrollbar { width: 4px; }
        .modal-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .modal-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 9px; }
        .modal-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        @keyframes ctaFloat {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-8px); }
        }
        @keyframes ctaPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.08); }
        }
        @keyframes ctaOrbDrift {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(20px, -15px); }
          66% { transform: translate(-10px, 10px); }
        }

        .cta-orb-1 { animation: ctaOrbDrift 8s ease-in-out infinite; }
        .cta-orb-2 { animation: ctaOrbDrift 10s ease-in-out infinite 2s; }
        .cta-orb-3 { animation: ctaOrbDrift 7s ease-in-out infinite 4s; }

        @media (max-width: 900px) {
          .landing-desk-nav { display: none !important; }
          .landing-desk-cta { display: none !important; }
          .landing-mobile-btn { display: flex !important; }
          .cta-icon-side { display: none !important; }
        }
        @media (max-width: 600px) {
          .landing-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 420px) {
          .landing-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
