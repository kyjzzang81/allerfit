import { Link } from 'react-router-dom';
import { AppTopBar } from '../../components/layout/AppTopBar';
import { FoodVisual } from '../../components/ui/FoodVisual';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { allergenOptions } from '../../constants/allergens';
import { useSelectedAllergens } from '../allergies/useSelectedAllergens';
import { useCatalogData } from '../catalog/useCatalogData';

function isMenuVisibleForAllergens(
  menuAllergens: string[],
  selectedCodes: string[],
) {
  return !selectedCodes.some((code) => menuAllergens.includes(code));
}

export function ExplorePage() {
  const { selectedCodes } = useSelectedAllergens();
  const { menus, isLoading, error } = useCatalogData();

  const selectedNames = allergenOptions
    .filter((allergen) => selectedCodes.includes(allergen.code))
    .map((allergen) => allergen.displayName);

  const visibleMenus = menus
    .filter((menu) =>
      selectedCodes.length > 0
        ? isMenuVisibleForAllergens(
            [...menu.contains, ...menu.mayContain],
            selectedCodes,
          )
        : true,
    )
    .sort((a, b) =>
      `${b.lastCheckedAt} ${a.menuName}`.localeCompare(
        `${a.lastCheckedAt} ${b.menuName}`,
        'ko',
      ),
    );

  return (
    <section className="page explore-page">
      <AppTopBar action="settings" title="탐험" />

      {isLoading ? (
        <LoadingSkeleton variant="feed" count={1} />
      ) : null}

      {error ? (
        <div className="empty-action-panel empty-action-panel--quiet">
          <strong>DB 연결을 확인해주세요.</strong>
          <p>실제 DB 데이터를 불러오지 못했어요.</p>
        </div>
      ) : null}

      {visibleMenus.length > 0 ? (
        <div className="explore-feed" aria-label="무작위 메뉴 탐험">
          {visibleMenus.map((menu) => (
            <article className="explore-card" key={menu.id}>
              <FoodVisual
                imageUrl={menu.imageUrl}
                label={menu.menuGraphicText}
                tone={menu.categorySlug === 'pizza' ? 'red' : 'warm'}
                size="lg"
                fetchPriority="high"
              />
              <div className="explore-card__overlay">
                <span>{menu.brandName}</span>
                <h2>{menu.menuName}</h2>
                <p>
                  {selectedNames.length > 0
                    ? `${selectedNames.join(', ')} 제외 기준`
                    : '전체 메뉴 기준'}
                </p>
                <Link className="explore-card__link" to={`/menu/${menu.id}`}>
                  메뉴 상세 보기
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : !isLoading && !error ? (
        <div className="empty-action-panel">
          <strong>볼 수 있는 메뉴가 없어요.</strong>
          <p>알레르기 설정을 조정하면 더 많은 메뉴를 탐험할 수 있어요.</p>
          <Link className="button button--primary" to="/settings/allergies">
            내 알레르기 수정하기
          </Link>
        </div>
      ) : null}
    </section>
  );
}
