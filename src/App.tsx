import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';

import Home from './routes/Home';
import CitizenPortal from './routes/CitizenPortal';
import OfficerLayout from './routes/OfficerLayout';
import OfficerDashboard from './routes/OfficerDashboard';
import OfficerApplications from './routes/OfficerApplications';
import OfficerPipeline from './routes/OfficerPipeline';
import OfficerGovernance from './routes/OfficerGovernance';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
      <div className="flex flex-col items-center gap-5 fade-up">
        <svg width="46" height="52" viewBox="0 0 46 52" fill="none" aria-hidden="true">
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
        <div className="spinner" />
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Loading MOEI Portal</p>
          <p className="text-xs mt-1 rtl" style={{ color: 'var(--text-muted)' }}>جارٍ تحميل بوابة الوزارة</p>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { loading } = useApp();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/citizen" element={<CitizenPortal />} />
      <Route path="/officer" element={<OfficerLayout />}>
        <Route index element={<OfficerDashboard />} />
        <Route path="applications" element={<OfficerApplications />} />
        <Route path="pipeline" element={<OfficerPipeline />} />
        <Route path="governance" element={<OfficerGovernance />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
