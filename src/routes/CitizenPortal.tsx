import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReschedulingApplication, AgentRecommendation, DocumentValidationResult } from '../types';
import UAEPassLogin from '../components/UAEPassLogin';
import CitizenUploadStep from '../components/CitizenUploadStep';
import CitizenProcessingScreen from '../components/CitizenProcessingScreen';
import BeneficiaryView from '../components/BeneficiaryView';

type CitizenStep = 'login' | 'upload' | 'processing' | 'status';

const normalizeId = (id: string) => id.replace(/[-\s]/g, '');

export default function CitizenPortal() {
  const navigate = useNavigate();
  const { applications, recommendations } = useApp();
  const [step, setStep] = useState<CitizenStep>('login');
  const [authedApp, setAuthedApp] = useState<ReschedulingApplication | null>(null);
  const [recommendation, setRecommendation] = useState<AgentRecommendation | null>(null);

  const handleAuthenticated = useCallback((emiratesId: string) => {
    const match = applications.find(
      app =>
        app.beneficiary.emirates_id === emiratesId ||
        normalizeId(app.beneficiary.emirates_id) === normalizeId(emiratesId),
    );
    const found = match ?? applications[0] ?? null;
    setAuthedApp(found);
    if (!found) return;
    // If officer has already assessed this case, skip upload and jump to status
    const existing = recommendations[found.application_id];
    if (existing) {
      setRecommendation(existing);
      setStep('status');
    } else {
      setStep('upload');
    }
  }, [applications, recommendations]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmitDocuments = useCallback((_validations: DocumentValidationResult[]) => {
    setStep('processing');
  }, []);

  const handleProcessingComplete = useCallback((rec: AgentRecommendation) => {
    setRecommendation(rec);
    setStep('status');
  }, []);

  const handleLogout = useCallback(() => {
    setStep('login');
    setAuthedApp(null);
    setRecommendation(null);
    navigate('/');
  }, [navigate]);

  // ── Login ─────────────────────────────────────────────────────────────────
  if (step === 'login' || !authedApp) {
    return (
      <UAEPassLogin
        onAuthenticated={handleAuthenticated}
        onBack={() => navigate('/')}
        applications={applications}
      />
    );
  }

  // ── Upload Documents ──────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <CitizenUploadStep
        application={authedApp}
        onSubmit={handleSubmitDocuments}
        onLogout={handleLogout}
      />
    );
  }

  // ── AI Processing ─────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <CitizenProcessingScreen
        application={authedApp}
        onComplete={handleProcessingComplete}
      />
    );
  }

  // ── Status / Decision ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      {/* Compact step indicator header */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E0D0', padding: '10px 28px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#00704A' }}>
          <CheckCircle2 size={12} color="#00704A" /> Login
        </span>
        <ChevronRight size={11} color="#CCBBAA" />
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#00704A' }}>
          <CheckCircle2 size={12} color="#00704A" /> Documents Submitted
        </span>
        <ChevronRight size={11} color="#CCBBAA" />
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#C8922A', background: '#FDF3E3', padding: '3px 9px', borderRadius: '20px', border: '1px solid rgba(200,146,42,0.25)' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C8922A', display: 'inline-block' }} />
          AI Decision
        </span>
      </div>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 24px 40px' }}>
        <BeneficiaryView
          application={authedApp}
          recommendation={recommendation}
          isProcessing={false}
          onSubmitForAssessment={() => {}}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}
