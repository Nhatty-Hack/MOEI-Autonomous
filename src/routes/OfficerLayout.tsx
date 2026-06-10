import { Outlet } from 'react-router-dom';
import OfficerShell from '../components/OfficerShell';

export default function OfficerLayout() {
  return (
    <OfficerShell>
      <Outlet />
    </OfficerShell>
  );
}
