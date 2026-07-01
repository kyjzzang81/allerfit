import { Link, useLocation } from "react-router-dom";
import { allergenOptions } from "../../constants/allergens";
import { useSelectedAllergens } from "../../features/allergies/useSelectedAllergens";

const bottomNavPaths = new Set(["/", "/brands", "/explore"]);

export function FixedAllergenCard() {
  const { pathname } = useLocation();
  const { selectedCodes } = useSelectedAllergens();
  const selectedNames = allergenOptions
    .filter((allergen) => selectedCodes.includes(allergen.code))
    .map((allergen) => allergen.displayName);
  const hasBottomNav = bottomNavPaths.has(pathname);
  const hasFixedSaveBar = pathname === "/settings/allergies";
  const className = [
    "fixed-allergen-card",
    hasBottomNav ? "fixed-allergen-card--above-nav" : "",
    hasFixedSaveBar ? "fixed-allergen-card--above-save" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside
      className={className}
      aria-label="내가 선택한 알레르기 성분"
    >
      <Link to="/settings/allergies">
        <div className="fixed-allergen-card-content">
          <strong>내 알레르기 성분</strong>
          <div className="selected-allergen-row">
            {selectedNames.length > 0 ? (
              selectedNames
                .slice(0, 5)
                .map((name) => <span key={name}>{name}</span>)
            ) : (
              <span>알레르기 성분 선택하기</span>
            )}
          </div>
        </div>
      </Link>
    </aside>
  );
}
