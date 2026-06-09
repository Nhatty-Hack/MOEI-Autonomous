import React, { useEffect, useState, useCallback } from 'react';
import { ReschedulingApplication, AgentRecommendation } from './types';
import {
  Briefcase, Scale, User, Workflow, Settings, Home, ChevronRight, Zap,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';

import UAEPassLogin from './components/UAEPassLogin';
import BeneficiaryView from './components/BeneficiaryView';
import ApplicationsTable from './components/ApplicationsTable';
import Dashboard from './components/Dashboard';
import GovernancePage from './components/GovernancePage';
import AgentPipelinePage from './components/AgentPipelinePage';
import ErrorBanner from './components/ErrorBanner';

type Tab = 'beneficiary' | 'officer' | 'pipeline' | 'dashboard' | 'governance' | 'settings';

/* ── UAE Falcon SVG ──────────────────────────────────────────────── */
function UAEFalcon({ size = 36 }: { size?: number }) {
  const w = size; const h = size * 1.1;
  return (
    <svg width={w} height={h} viewBox="0 0 46 52" fill="none" aria-label="UAE Coat of Arms">
      <path d="M14 21 C9 15 2 18 2 27 C7 26 12 24 14 27Z" fill="#C8922A" />
      <path d="M14 27 C8 28 4 34 6 40 C10 37 13 32 14 32Z" fill="#C8922A" />
      <path d="M32 21 C37 15 44 18 44 27 C39 26 34 24 32 27Z" fill="#C8922A" />
      <path d="M32 27 C38 28 42 34 40 40 C36 37 33 32 32 32Z" fill="#C8922A" />
      <ellipse cx="23" cy="28" rx="8" ry="11" fill="#C8922A" />
      <circle cx="23" cy="13" r="6.5" fill="#C8922A" />
      <path d="M19.5 16 Q23 22 23 22 Q26.5 22 26.5 16Z" fill="#7A5008" />
      <circle cx="21" cy="11" r="1.4" fill="#1A0A00" />
      <rect x="17.5" y="24" width="11" height="14" rx="1" fill="#FFFFFF" />
      <rect x="17.5" y="24" width="3.2" height="14" fill="#EF3340" />
      <rect x="20.7" y="24"   width="7.8" height="4.7" fill="#00732F" />
      <rect x="20.7" y="28.7" width="7.8" height="4.6" fill="#FFFFFF" />
      <rect x="20.7" y="33.3" width="7.8" height="4.7" fill="#1A1A1A" />
      <line x1="18" y1="39" x2="15" y2="47" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20.5" y1="40" x2="19.5" y2="48" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="23" y1="40" x2="23"  y2="49" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25.5" y1="40" x2="26.5" y2="48" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="39" x2="31" y2="47" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="11" y="47" width="24" height="5" rx="2" fill="#C8922A" />
    </svg>
  );
}

const NAV_ITEMS = [
  { id: 'dashboard'   as Tab, label: 'Dashboard',          labelAr: 'لوحة المعلومات',  icon: Home },
  { id: 'beneficiary' as Tab, label: 'Beneficiary Portal', labelAr: 'بوابة المستفيد',  icon: User },
  { id: 'officer'     as Tab, label: 'Applications',       labelAr: 'الطلبات',          icon: Briefcase },
  { id: 'pipeline'    as Tab, label: 'AI Agent Pipeline',  labelAr: 'مسار المعالجة',   icon: Workflow },
  { id: 'governance'  as Tab, label: 'Governance',         labelAr: 'الحوكمة',          icon: Scale },
  { id: 'settings'    as Tab, label: 'Settings',           labelAr: 'الإعدادات',        icon: Settings },
] as const;

const BREADCRUMBS: Record<Tab, string> = {
  dashboard:   'Dashboard',
  beneficiary: 'Beneficiary Portal',
  officer:     'Applications',
  pipeline:    'AI Agent Pipeline',
  governance:  'Governance',
  settings:    'Settings',
};
const BREADCRUMBS_AR: Record<Tab, string> = {
  dashboard:   'لوحة المعلومات',
  beneficiary: 'بوابة المستفيد',
  officer:     'الطلبات',
  pipeline:    'مسار المعالجة',
  governance:  'الحوكمة',
  settings:    'الإعدادات',
};

export default function App() {
  const [applications, setApplications] = useState<ReschedulingApplication[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, AgentRecommendation>>({});
  const [processingApps, setProcessingApps] = useState<Set<string>>(new Set());
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedBeneficiaryApp, setSelectedBeneficiaryApp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resApps = await fetch('/api/applications');
        const apps = await resApps.json();
        setApplications(apps);
        if (apps.length > 0) setSelectedBeneficiaryApp(apps[0].application_id);
      } catch (err) {
        console.error('Failed to load initial data', err);
        setError('Failed to load application data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 8000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleAssessAgentic = useCallback(async (appId: string) => {
    setProcessingApps((prev) => new Set(prev).add(appId));
    setExpandedApp(appId);
    try {
      const agentRes = await fetch(`/api/agent-assess/${appId}`, { method: 'POST' });
      if (agentRes.ok) {
        const json = await agentRes.json();
        if (json.data) { setRecommendations((prev) => ({ ...prev, [appId]: json.data })); return; }
      }
      throw new Error('agent-assess returned no data');
    } catch {
      try {
        const deterRes = await fetch(`/api/assess/${appId}`, { method: 'POST' });
        const json = await deterRes.json();
        if (json.data) setRecommendations((prev) => ({ ...prev, [appId]: json.data }));
      } catch (e) { console.error('Both assessment paths failed:', e); }
    } finally {
      setProcessingApps((prev) => { const next = new Set(prev); next.delete(appId); return next; });
    }
  }, []);

  const handleAssessAll = useCallback(async () => {
    const unassessed = applications.filter((app) => !recommendations[app.application_id]);
    if (unassessed.length === 0) return;
    for (let i = 0; i < unassessed.length; i++) {
      const app = unassessed[i];
      setBatchProgress(`Processing ${i + 1} of ${unassessed.length}...`);
      await handleAssessAgentic(app.application_id);
    }
    setBatchProgress(null);
  }, [applications, recommendations, handleAssessAgentic]);

  const handleToggleExpand = useCallback((appId: string) => {
    setExpandedApp((prev) => (prev === appId ? null : appId));
  }, []);

  const handleAuthenticated = useCallback((emiratesId: string) => {
    const normalize = (id: string) => id.replace(/[-\s]/g, '');
    const match = applications.find(
      app =>
        app.beneficiary.emirates_id === emiratesId ||
        normalize(app.beneficiary.emirates_id) === normalize(emiratesId)
    );
    if (match) setSelectedBeneficiaryApp(match.application_id);
    setIsAuthenticated(true);
  }, [applications]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setSelectedBeneficiaryApp(null);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0E8' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <UAEFalcon size={52} />
          <div style={{ width: '36px', height: '36px', border: '3px solid rgba(200,146,42,0.25)', borderTopColor: '#C8922A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px', fontFamily: 'Segoe UI, sans-serif' }}>Loading MOEI Portal</p>
            <p dir="rtl" style={{ fontSize: '12px', color: '#888888', margin: 0, fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>جارٍ تحميل بوابة الوزارة</p>
          </div>
        </div>
      </div>
    );
  }

  /* Full-screen UAE Pass login (no sidebar) */
  if (activeTab === 'beneficiary' && !isAuthenticated) {
    return <UAEPassLogin onAuthenticated={handleAuthenticated} onBack={() => setActiveTab('dashboard')} applications={applications} />;
  }

  const unassessedCount = applications.filter((app) => !recommendations[app.application_id]).length;
  const beneficiaryApp = applications.find((a) => a.application_id === selectedBeneficiaryApp) || applications[0];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="sidebar no-print">
        {/* Logo */}
        <div className="sidebar-logo">
          <img
            src="/logo/logo.png"
            alt="Ministry of Energy & Infrastructure"
            style={{ maxHeight: '48px', width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
          />
          <div style={{ marginTop: '10px' }}>
            <div dir="rtl" style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.2, fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>
              وزارة الطاقة والبنية التحتية
            </div>
            <div style={{ fontSize: '9.5px', color: '#C8922A', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '2px' }}>
              Ministry of Energy &amp; Infrastructure
            </div>
          </div>
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F0EBE0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', color: '#999999', textTransform: 'uppercase' }}>Arrears Portal</div>
            <div style={{ fontSize: '9px', color: '#CCBBAA' }}>·</div>
            <div style={{ fontSize: '9px', color: '#C8922A', fontWeight: 600 }}>v2.0</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon"><Icon size={16} /></span>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div className="nav-label-ar">{item.labelAr}</div>
                  <div className="nav-label-en">{item.label}</div>
                </div>
                {isActive && <ChevronRight size={12} style={{ opacity: 0.5, flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00704A', flexShrink: 0, animation: 'pulseDot 2s ease infinite' }} />
            <div>
              <div dir="rtl" style={{ fontSize: '11px', color: '#00704A', fontWeight: 700, fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>مباشر</div>
              <div style={{ fontSize: '10px', color: '#888888', fontWeight: 500 }}>System Live</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="main-wrapper">

        {/* Top bar */}
        <header className="topbar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#999999', fontWeight: 500 }}>MOEI</span>
            <ChevronRight size={12} color="#CCBBAA" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>{BREADCRUMBS[activeTab]}</span>
            <span dir="rtl" style={{ fontSize: '11.5px', color: '#AAAAAA', marginRight: '4px', fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>
              · {BREADCRUMBS_AR[activeTab]}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Cases badge */}
            <div style={{ background: '#FDF3E3', border: '1px solid rgba(200,146,42,0.3)', borderRadius: '6px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#C8922A', fontFamily: 'IBM Plex Mono, monospace' }}>{applications.length}</span>
              <span style={{ fontSize: '10px', color: '#A67420', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cases</span>
            </div>
            {/* EN/AR toggle */}
            <div style={{ display: 'flex', border: '1px solid #E8E0D0', borderRadius: '6px', overflow: 'hidden', fontSize: '11px', fontWeight: 600 }}>
              <div style={{ padding: '5px 12px', backgroundColor: '#C8922A', color: '#FFFFFF' }}>EN</div>
              <div style={{ padding: '5px 12px', color: '#999999', cursor: 'pointer', backgroundColor: '#FFFFFF' }}>AR</div>
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
        <main className="page-content">

          {activeTab === 'dashboard' && (
            <Dashboard applications={applications} recommendations={recommendations} />
          )}

          {activeTab === 'beneficiary' && (
            beneficiaryApp ? (
              <BeneficiaryView
                application={beneficiaryApp}
                recommendation={recommendations[beneficiaryApp.application_id] || null}
                isProcessing={processingApps.has(beneficiaryApp.application_id)}
                onSubmitForAssessment={() => handleAssessAgentic(beneficiaryApp.application_id)}
                onLogout={handleLogout}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#888888', padding: '80px 0' }}>No applications found.</div>
            )
          )}

          {activeTab === 'officer' && (
            <ApplicationsTable
              applications={applications}
              recommendations={recommendations}
              processingApps={processingApps}
              expandedApp={expandedApp}
              batchProgress={batchProgress}
              onAssess={handleAssessAgentic}
              onToggleExpand={handleToggleExpand}
              onAssessAll={handleAssessAll}
            />
          )}

          {activeTab === 'pipeline' && (
            <AgentPipelinePage applications={applications} recommendations={recommendations} onAssessAll={handleAssessAll} batchProgress={batchProgress} />
          )}

          {activeTab === 'governance' && (
            <GovernancePage applications={applications} recommendations={recommendations} />
          )}

          {activeTab === 'settings' && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#CCBBAA' }}>
              <Settings size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3, color: '#C8922A' }} />
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#888888' }}>Settings — Coming Soon</p>
              <p dir="rtl" style={{ fontSize: '12px', color: '#AAAAAA', fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>الإعدادات — قريباً</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
