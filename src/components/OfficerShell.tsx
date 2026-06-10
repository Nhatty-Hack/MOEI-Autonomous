import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Workflow, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ErrorBanner from './ErrorBanner';
import { AnimatePresence } from 'motion/react';

interface NavItem { to: string; ar: string; en: string; Icon: LucideIcon; exact?: boolean; }

const NAV: NavItem[] = [
  { to: '/officer',              ar: 'لوحة المعلومات', en: 'Dashboard',          Icon: LayoutDashboard, exact: true },
  { to: '/officer/applications', ar: 'الطلبات',         en: 'Applications',       Icon: FileText },
  { to: '/officer/pipeline',     ar: 'مسار المعالجة',   en: 'AI Pipeline',        Icon: Workflow },
  { to: '/officer/governance',   ar: 'الحوكمة',         en: 'Governance',         Icon: ShieldCheck },
  { to: '/citizen',              ar: 'بوابة المستفيد',  en: 'Beneficiary Portal', Icon: Users },
];

const BREADCRUMBS: Record<string, { ar: string; en: string }> = {
  '/officer':              { ar: 'لوحة المعلومات', en: 'Dashboard' },
  '/officer/applications': { ar: 'الطلبات',         en: 'Applications' },
  '/officer/pipeline':     { ar: 'مسار المعالجة',   en: 'AI Pipeline' },
  '/officer/governance':   { ar: 'الحوكمة',         en: 'Governance' },
};

export default function OfficerShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { applications, error, setError } = useApp();
  const bc = BREADCRUMBS[pathname] ?? { ar: '', en: '' };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--app-bg)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="sidebar no-print">
        <div className="sidebar-logo">
          <img
            src="/logo/logo.png"
            alt="Ministry of Energy & Infrastructure"
            style={{ maxHeight: '48px', width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
          />
          <div style={{ marginTop: '10px' }}>
            <div className="rtl" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              وزارة الطاقة والبنية التحتية
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '2px' }}>
              Ministry of Energy &amp; Infrastructure
            </div>
          </div>
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F0EBE0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Arrears Portal</div>
            <div style={{ fontSize: '9px', color: '#CCBBAA' }}>·</div>
            <div style={{ fontSize: '9px', color: 'var(--gold)', fontWeight: 600 }}>v2.0</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            const Icon = item.Icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-item ${active ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <span className="nav-icon"><Icon size={16} /></span>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div className="nav-label-ar">{item.ar}</div>
                  <div className="nav-label-en">{item.en}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--green)', flexShrink: 0, display: 'inline-block' }} />
            <div>
              <div className="rtl" style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700 }}>مباشر</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>System Live</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="main-wrapper">

        {/* Topbar */}
        <header className="topbar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>MOEI</span>
            <span style={{ fontSize: '12px', color: '#CCBBAA' }}>›</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{bc.en}</span>
            <span className="rtl" style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginRight: '4px' }}>
              · {bc.ar}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--gold-light)', border: '1px solid rgba(200,146,42,0.3)', borderRadius: '6px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="tabular" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gold)' }}>{applications.length}</span>
              <span style={{ fontSize: '10px', color: 'var(--gold-hover)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cases</span>
            </div>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', fontSize: '11px', fontWeight: 600 }}>
              <div style={{ padding: '5px 12px', backgroundColor: 'var(--gold)', color: '#FFFFFF' }}>EN</div>
              <div style={{ padding: '5px 12px', color: 'var(--text-muted)', cursor: 'pointer', backgroundColor: '#FFFFFF' }}>AR</div>
            </div>
          </div>
        </header>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <div style={{ padding: '12px 28px 0' }}>
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </div>
          )}
        </AnimatePresence>

        {/* Page content */}
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
