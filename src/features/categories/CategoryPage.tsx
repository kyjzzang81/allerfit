import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { allergenOptions } from '../../constants/allergens';
import { useSelectedAllergens } from '../allergies/useSelectedAllergens';
import { categories, categoryMenus } from './categoryData';

function formatDate(date: string) {
  return date.replace(/-/g, '.');
}

function isMenuVisibleForAllergens(
  menuAllergens: string[],
  selectedCodes: string[],
) {
  return !selectedCodes.some((code) => menuAllergens.includes(code));
}

export function CategoryPage() {
  const { categorySlug } = useParams();
  const [query, setQuery] = useState('');
  const { selectedCodes } = useSelectedAllergens();

  const category = categories.find((item) => item.slug === categorySlug);

  const selectedNames = allergenOptions
    .filter((allergen) => selectedCodes.includes(allergen.code))
    .map((allergen) => allergen.displayName);

  const categoryMenuList = categoryMenus.filter(
    (menu) => menu.categorySlug === category?.slug,
  );

  const sortedLastCheckedDates = categoryMenuList
    .map((menu) => menu.lastCheckedAt)
    .sort();
  const lastUpdatedAt = sortedLastCheckedDates[sortedLastCheckedDates.length - 1];

  const visibleMenus = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return categoryMenuList
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

        return `${menu.brandName} ${menu.menuName}`
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) =>
        `${a.brandName} ${a.menuName}`.localeCompare(
          `${b.brandName} ${b.menuName}`,
          'ko',
        ),
      );
  }, [categoryMenuList, query, selectedCodes]);

  if (!category) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">카테고리</p>
          <h1>카테고리를 찾을 수 없어요.</h1>
        </div>
        <Link className="button button--primary" to="/">
          홈으로 돌아가기
        </Link>
      </section>
    );
  }

  const hasSelectedAllergens = selectedCodes.length > 0;

  return (
    <section className="page category-page">
      <div className="category-hero">
        <p className="eyebrow">카테고리 상세</p>
        <h1>{category.name}</h1>
        <p>
          {hasSelectedAllergens
            ? `${selectedNames.join(', ')} 제외 기준으로 볼게요.`
            : '알레르기 선택이 필요합니다.'}
        </p>
      </div>

      {!hasSelectedAllergens ? (
        <div className="empty-action-panel">
          <strong>알레르기 선택이 필요합니다.</strong>
          <p>내 알레르기를 선택하면 먹을 수 있는 메뉴를 보여드릴게요.</p>
          <Link className="button button--primary" to="/settings/allergies">
            내 알레르기 선택하기
          </Link>
        </div>
      ) : (
        <>
          <label className="search-box category-search">
            <Search aria-hidden="true" size={22} />
            <input
              placeholder="메뉴명 또는 브랜드명으로 검색"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="category-toolbar">
            <p>
              먹을 수 있는 메뉴 <strong>{visibleMenus.length}</strong>
            </p>
            <span>브랜드명순</span>
          </div>

          {visibleMenus.length > 0 ? (
            <div className="menu-card-grid">
              {visibleMenus.map((menu) => (
                <Link className="menu-card" key={menu.id} to={`/brand/${menu.brandSlug}`}>
                  <span className="brand-logo" aria-label={`${menu.brandName} 로고`}>
                    {menu.brandLogoText}
                  </span>
                  <span className="menu-card__text">
                    <strong>{menu.brandName}</strong>
                    <span>{menu.menuName}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-action-panel empty-action-panel--quiet">
              <strong>검색 결과가 없어요.</strong>
              <p>다른 메뉴명이나 브랜드명으로 검색해보세요.</p>
            </div>
          )}

          <p className="category-updated">
            최종 업데이트 {lastUpdatedAt ? formatDate(lastUpdatedAt) : '-'}
          </p>
        </>
      )}
    </section>
  );
}
