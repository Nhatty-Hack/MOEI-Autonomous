import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ReschedulingApplication } from '../types';
import UAEPassLogin from '../components/UAEPassLogin';
import BeneficiaryView from '../components/BeneficiaryView';

const normalizeId = (id: string) => id.replace(/[-\s]/g, '');

export default function CitizenPortal() {
  const navigate = useNavigate();
  const { applications, recommendations, processingApps, handleAssessAgentic } = useApp();
  const [authedApp, setAuthedApp] = useState<ReschedulingApplication | null>(null);

  const handleAuthenticated = useCallback((emiratesId: string) => {
    const match = applications.find(
      app =>
        app.beneficiary.emirates_id === emiratesId ||
        normalizeId(app.beneficiary.emirates_id) === normalizeId(emiratesId),
    );
    setAuthedApp(match ?? applications[0] ?? null);
  }, [applications]);

  const handleLogout = useCallback(() => {
    setAuthedApp(null);
    navigate('/');
  }, [navigate]);

  if (!authedApp) {
    return (
      <UAEPassLogin
        onAuthenticated={handleAuthenticated}
        onBack={() => navigate('/')}
        applications={applications}
      />
    );
  }

  return (
    <BeneficiaryView
      application={authedApp}
      recommendation={recommendations[authedApp.application_id] ?? null}
      isProcessing={processingApps.has(authedApp.application_id)}
      onSubmitForAssessment={() => handleAssessAgentic(authedApp.application_id)}
      onLogout={handleLogout}
    />
  );
}
