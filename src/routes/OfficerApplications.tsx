import { useApp } from '../context/AppContext';
import ApplicationsTable from '../components/ApplicationsTable';

export default function OfficerApplications() {
  const {
    applications, recommendations, processingApps,
    expandedApp, batchProgress,
    handleAssessAgentic, handleToggleExpand, handleAssessAll,
  } = useApp();

  return (
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
  );
}
