import { useEffect, useState, useCallback } from 'react';
import { ReschedulingApplication, AgentRecommendation } from './types';
import {
  Activity,
  Zap,
  LayoutDashboard,
  Briefcase,
  Scale,
  User,
  Workflow,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';

import Header from './components/Header';
import UAEPassLogin from './components/UAEPassLogin';
import BeneficiaryView from './components/BeneficiaryView';
import PipelineComparison from './components/PipelineComparison';
import ApplicationCard from './components/ApplicationCard';
import Dashboard from './components/Dashboard';
import ErrorBanner from './components/ErrorBanner';

type Tab = 'beneficiary' | 'officer' | 'pipeline' | 'dashboard' | 'governance';

export default function App() {
  const [applications, setApplications] = useState<ReschedulingApplication[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, AgentRecommendation>>({});
  const [processingApps, setProcessingApps] = useState<Set<string>>(new Set());
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('beneficiary');
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
        if (apps.length > 0) {
          setSelectedBeneficiaryApp(apps[0].application_id);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
        setError('Failed to load application data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-dismiss errors after 8 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 8000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleAssessAgentic = useCallback(async (appId: string) => {
    setProcessingApps((prev) => new Set(prev).add(appId));
    setExpandedApp(appId);
    try {
      const res = await fetch(`/api/agent-assess/${appId}`, { method: 'POST' });
      const json = await res.json();
      if (json.data) {
        setRecommendations((prev) => ({ ...prev, [appId]: json.data }));
      } else {
        setError(`Assessment failed for ${appId}: ${json.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      setError(`Network error processing ${appId}. Please try again.`);
    } finally {
      setProcessingApps((prev) => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
    }
  }, []);

  const handleAssessAll = useCallback(async () => {
    const unassessed = applications.filter((app) => !recommendations[app.application_id]);
    if (unassessed.length === 0) return;

    for (let i = 0; i < unassessed.length; i++) {
      const app = unassessed[i];
      setBatchProgress(`Processing ${i + 1}/${unassessed.length}...`);
      await handleAssessAgentic(app.application_id);
    }
    setBatchProgress(null);
  }, [applications, recommendations, handleAssessAgentic]);

  const handleToggleExpand = useCallback((appId: string) => {
    setExpandedApp((prev) => (prev === appId ? null : appId));
  }, []);

  const handleAuthenticated = useCallback((_emiratesId: string) => {
    setIsAuthenticated(true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-800">
        <Activity className="w-6 h-6 animate-spin text-[#00694E]" />
        <span className="ml-3 font-medium">Loading SZHP Systems...</span>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'beneficiary', label: 'Beneficiary Portal', icon: <User className="w-4 h-4" /> },
    { id: 'officer', label: 'Officer Dashboard', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'pipeline', label: 'Agent Pipeline', icon: <Workflow className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Analytics', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'governance', label: 'Governance', icon: <Scale className="w-4 h-4" /> },
  ];

  const unassessedCount = applications.filter((app) => !recommendations[app.application_id]).length;

  // Get the selected beneficiary application
  const beneficiaryApp = applications.find((a) => a.application_id === selectedBeneficiaryApp) || applications[0];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Header applicationCount={applications.length} />

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <nav className="flex gap-1 overflow-x-auto" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#00694E] text-[#00694E]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-10">
        {/* Error Banner */}
        <AnimatePresence>
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
        </AnimatePresence>

        {/* Beneficiary Portal Tab */}
        {activeTab === 'beneficiary' && (
          <>
            {!isAuthenticated ? (
              <UAEPassLogin onAuthenticated={handleAuthenticated} />
            ) : beneficiaryApp ? (
              <BeneficiaryView
                application={beneficiaryApp}
                recommendation={recommendations[beneficiaryApp.application_id] || null}
                isProcessing={processingApps.has(beneficiaryApp.application_id)}
                onSubmitForAssessment={() => handleAssessAgentic(beneficiaryApp.application_id)}
              />
            ) : (
              <div className="text-center text-slate-500 py-20">No applications found.</div>
            )}
          </>
        )}

        {/* Officer Dashboard Tab */}
        {activeTab === 'officer' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-2xl font-semibold tracking-tight">Active Application Queue</h2>
              <div className="flex items-center gap-4">
                {batchProgress && (
                  <span className="text-sm font-medium text-[#00694E] animate-pulse">
                    {batchProgress}
                  </span>
                )}
                <span className="text-sm font-medium text-slate-500">
                  {applications.length} Records
                </span>
                {unassessedCount > 0 && (
                  <button
                    onClick={handleAssessAll}
                    disabled={!!batchProgress}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#00694E] hover:bg-[#005740] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg shadow-sm transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {batchProgress ? batchProgress : `Assess All (${unassessedCount})`}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {applications.map((app) => (
                <ApplicationCard
                  key={app.application_id}
                  app={app}
                  recommendation={recommendations[app.application_id]}
                  isProcessing={processingApps.has(app.application_id)}
                  isExpanded={expandedApp === app.application_id}
                  onAssess={handleAssessAgentic}
                  onToggleExpand={handleToggleExpand}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="space-y-10">
            <PipelineComparison />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'dashboard' && (
          <Dashboard applications={applications} recommendations={recommendations} />
        )}

        {/* Governance Tab */}
        {activeTab === 'governance' && (
          <Dashboard applications={applications} recommendations={recommendations} />
        )}
      </div>
    </div>
  );
}
