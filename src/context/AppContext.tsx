import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AgentRecommendation, ReschedulingApplication, DocumentValidationResult } from '../types';

interface AppContextValue {
  applications: ReschedulingApplication[];
  recommendations: Record<string, AgentRecommendation>;
  processingApps: Set<string>;
  expandedApp: string | null;
  batchProgress: string | null;
  loading: boolean;
  error: string | null;
  documentValidations: Record<string, DocumentValidationResult[]>;
  setError: (msg: string | null) => void;
  handleAssessAgentic: (appId: string) => Promise<void>;
  handleAssessAll: () => Promise<void>;
  handleToggleExpand: (appId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<ReschedulingApplication[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, AgentRecommendation>>({});
  const [processingApps, setProcessingApps] = useState<Set<string>>(new Set());
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentValidations, setDocumentValidations] = useState<Record<string, DocumentValidationResult[]>>({});

  useEffect(() => {
    fetch('/api/applications')
      .then(r => r.json())
      .then(apps => setApplications(apps))
      .catch(() => setError('Failed to load application data. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/document-validations')
      .then(r => r.json())
      .then(data => setDocumentValidations(data as Record<string, DocumentValidationResult[]>))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 8000);
    return () => clearTimeout(t);
  }, [error]);

  const handleAssessAgentic = useCallback(async (appId: string) => {
    setProcessingApps(prev => new Set(prev).add(appId));
    setExpandedApp(appId);
    try {
      const res = await fetch(`/api/agent-assess/${appId}`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setRecommendations(prev => ({ ...prev, [appId]: json.data }));
          return;
        }
      }
      throw new Error('agent-assess returned no data');
    } catch {
      try {
        const res2 = await fetch(`/api/assess/${appId}`, { method: 'POST' });
        const json = await res2.json();
        if (json.data) setRecommendations(prev => ({ ...prev, [appId]: json.data }));
      } catch (e) {
        console.error('Both assessment paths failed:', e);
      }
    } finally {
      setProcessingApps(prev => { const next = new Set(prev); next.delete(appId); return next; });
    }
  }, []);

  const handleAssessAll = useCallback(async () => {
    const unassessed = applications.filter(app => !recommendations[app.application_id]);
    if (unassessed.length === 0) return;
    for (let i = 0; i < unassessed.length; i++) {
      setBatchProgress(`Processing ${i + 1} of ${unassessed.length}…`);
      await handleAssessAgentic(unassessed[i].application_id);
    }
    setBatchProgress(null);
  }, [applications, recommendations, handleAssessAgentic]);

  const handleToggleExpand = useCallback((appId: string) => {
    setExpandedApp(prev => prev === appId ? null : appId);
  }, []);

  return (
    <AppContext.Provider value={{
      applications, recommendations, processingApps, expandedApp,
      batchProgress, loading, error, documentValidations, setError,
      handleAssessAgentic, handleAssessAll, handleToggleExpand,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
