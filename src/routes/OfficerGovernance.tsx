import { useApp } from '../context/AppContext';
import GovernancePage from '../components/GovernancePage';

export default function OfficerGovernance() {
  const { applications, recommendations } = useApp();
  return <GovernancePage applications={applications} recommendations={recommendations} />;
}
