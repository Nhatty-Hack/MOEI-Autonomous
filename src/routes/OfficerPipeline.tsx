import { useApp } from '../context/AppContext';
import AgentPipelinePage from '../components/AgentPipelinePage';

export default function OfficerPipeline() {
  const { applications, recommendations, handleAssessAll, batchProgress } = useApp();
  return (
    <AgentPipelinePage
      applications={applications}
      recommendations={recommendations}
      onAssessAll={handleAssessAll}
      batchProgress={batchProgress}
    />
  );
}
