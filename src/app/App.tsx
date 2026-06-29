import { Outlet } from 'react-router-dom';
import { BottomNavigation } from '../components/layout/BottomNavigation';

export function App() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
