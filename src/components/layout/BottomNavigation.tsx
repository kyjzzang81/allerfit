import { Compass, Home, Store } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "홈", icon: Home },
  { to: "/brands", label: "브랜드", icon: Store },
  { to: "/explore", label: "탐험", icon: Compass },
];

export function BottomNavigation() {
  const { pathname } = useLocation();
  const isMainTab = navItems.some((item) =>
    item.to === "/" ? pathname === "/" : pathname === item.to,
  );

  if (!isMainTab) {
    return null;
  }

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`
            }
          >
            <Icon aria-hidden="true" size={22} strokeWidth={1.2} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
