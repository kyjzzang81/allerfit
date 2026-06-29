import { Home, Search, UserRoundCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: '홈', icon: Home },
  { to: '/search', label: '검색', icon: Search },
  { to: '/settings/allergies', label: '내 알레르기', icon: UserRoundCheck },
];

export function BottomNavigation() {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
            }
          >
            <Icon aria-hidden="true" size={22} strokeWidth={2.2} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
