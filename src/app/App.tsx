import { Outlet } from 'react-router-dom';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { FixedAllergenCard } from '../components/layout/FixedAllergenCard';

export function App() {
  return (
    <div className="app-shell">
      <main className="app-main app-phone">
        <Outlet />
      </main>
      <FixedAllergenCard />
      <BottomNavigation />
    </div>
  );
}
