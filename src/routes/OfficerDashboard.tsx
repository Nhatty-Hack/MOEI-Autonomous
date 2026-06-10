import { useApp } from '../context/AppContext';
import Dashboard from '../components/Dashboard';

export default function OfficerDashboard() {
  const { applications, recommendations } = useApp();
  return <Dashboard applications={applications} recommendations={recommendations} />;
}
