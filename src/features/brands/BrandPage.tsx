import { ExternalLink, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { allergenOptions } from '../../constants/allergens';
import { useSelectedAllergens } from '../allergies/useSelectedAllergens';
import { brands, categories, categoryMenus } from '../categories/categoryData';

function formatDate(date: string) {
  return date.replace(/-/g, '.');
}

function isMenuVisibleForAllergens(
  menuAllergens: string[],
  selectedCodes: string[],
) {
  return !selectedCodes.some((code) => menuAllergens.includes(code));
}

export function BrandPage() {
  const { brandSlug } = useParams();
  const [query, setQuery] = useState('');
  const { selectedCodes } = useSelectedAllergens();

  const brand = brands.find((item) => item.slug === brandSlug);
  const category = categories.find((item) => item.slug === brand?.categorySlug);
  const brandMenus = categoryMenus.filter(
    (menu) => menu.brandSlug === brand?.slug,
  );

  const selectedNames = allergenOptions
    .filter((allergen) => selectedCodes.includes(allergen.code))
    .map((allergen) => allergen.displayName);

  const sortedLastCheckedDates = brandMenus
    .map((menu) => menu.lastCheckedAt)
    .sort();
  const lastUpdatedAt = sortedLastCheckedDates[sortedLastCheckedDates.length - 1];

  const visibleMenus = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return brandMenus
      .filter((menu) =>
        isMenuVisibleForAllergens(
          [...menu.contains, ...menu.mayContain],
          selectedCodes,
        ),
      )
      .filter((menu) => {
        if (!keyword) {
          return true;
        }

        return menu.menuName.toLowerCase().includes(keyword);
      })
      .sort((a, b) => a.menuName.localeCompare(b.menuName, 'ko'));
  }, [brandMenus, query, selectedCodes]);

  if (!brand) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">브랜드</p>
          <h1>브랜드를 찾을 수 없어요.</h1>
        </div>
        <Link className="button button--primary" to="/">
          홈으로 돌아가기
        </Link>
      </section>
    );
  }

  const hasSelectedAllergens = selectedCodes.length > 0;

  return (
    <section className="page brand-page">
      <div className="brand-hero">
        <span className="brand-logo brand-logo--hero" aria-label={`${brand.name} 로고`}>
          {brand.logoText}
        </span>
        <div className="brand-hero__copy">
          <p className="eyebrow">{category?.name ?? '브랜드'} 브랜드</p>
          <h1>{brand.name}</h1>
          <p>
            {hasSelectedAllergens
              ? `${selectedNames.join(', ')} 제외 기준으로 볼게요.`
              : '알레르기 선택이 필요합니다.'}
          </p>
        </div>
      </div>

      {!hasSelectedAllergens ? (
        <div className="empty-action-panel">
          <strong>알레르기 선택이 필요합니다.</strong>
          <p>
            내 알레르기를 선택하면 이 브랜드에서 먹을 수 있는 메뉴를
            보여드릴게요.
          </p>
          <Link className="button button--primary" to="/settings/allergies">
            내 알레르기 선택하기
          </Link>
        </div>
      ) : (
        <>
          <div className="brand-summary">
            <strong>{visibleMenus.length}개</strong>
            <span>먹을 수 있는 메뉴</span>
            <p>선택한 알레르기 기준으로 표시됩니다.</p>
          </div>

          <label className="search-box category-search">
            <Search aria-hidden="true" size={22} />
            <input
              placeholder={`${brand.name} 메뉴 검색`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {visibleMenus.length > 0 ? (
            <div className="brand-menu-grid">
              {visibleMenus.map((menu) => (
                <Link className="brand-menu-card" key={menu.id} to={`/menu/${menu.id}`}>
                  <span className="brand-menu-card__graphic" aria-hidden="true">
                    {brand.logoText}
                  </span>
                  <strong>{menu.menuName}</strong>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-action-panel empty-action-panel--quiet">
              <strong>검색 결과가 없어요.</strong>
              <p>다른 메뉴명으로 검색해보세요.</p>
            </div>
          )}

          <footer className="brand-info">
            <p>최종 업데이트 {lastUpdatedAt ? formatDate(lastUpdatedAt) : '-'}</p>
            <p>공식 알레르기 정보 기준</p>
            <div className="brand-info__links">
              <a href={brand.allergenSourceUrl} target="_blank" rel="noreferrer">
                알레르기 정보 출처 보기
                <ExternalLink aria-hidden="true" size={15} />
              </a>
              <a href={brand.officialUrl} target="_blank" rel="noreferrer">
                공식 홈페이지 보기
                <ExternalLink aria-hidden="true" size={15} />
              </a>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
