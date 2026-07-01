import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppTopBar } from '../../components/layout/AppTopBar';
import { FoodVisual } from '../../components/ui/FoodVisual';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useCatalogData } from '../catalog/useCatalogData';
import { compareMenusForDisplay } from '../catalog/menuOrdering';
import { MenuDetailSheet } from '../menus/MenuDetailSheet';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedMenuSlug, setSelectedMenuSlug] = useState<string | null>(null);
  const { menus, isLoading, error } = useCatalogData();

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return [];
    }

    return menus
      .filter((menu) =>
        `${menu.brandName} ${menu.menuName}`.toLowerCase().includes(keyword),
      )
      .sort(compareMenusForDisplay);
  }, [menus, query]);

  return (
    <section className="page">
      <AppTopBar showBack title="검색 결과" />
      <div className="page-header">
        <p className="eyebrow">검색</p>
        <h1>브랜드나 메뉴를 찾아보세요.</h1>
      </div>

      <label className="search-box">
        <Search aria-hidden="true" size={22} />
        <input
          placeholder="메뉴명 또는 브랜드명으로 검색"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {isLoading ? (
        <LoadingSkeleton variant="cards" count={3} />
      ) : null}

      {error ? (
        <div className="content-card empty-card">
          <strong>DB 연결을 확인해주세요.</strong>
          <p>실제 DB 데이터를 불러오지 못했어요.</p>
        </div>
      ) : null}

      {query.trim() && results.length === 0 ? (
        <div className="content-card empty-card">
          <strong>검색 결과가 없어요.</strong>
          <p>다른 메뉴명이나 브랜드명으로 검색해보세요.</p>
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="menu-card-grid">
          {results.map((menu) => (
            <button
              className="menu-card"
              key={menu.id}
              type="button"
              onClick={() => setSelectedMenuSlug(menu.id)}
            >
              <FoodVisual
                imageUrl={menu.imageUrl}
                label={menu.menuGraphicText}
                tone="warm"
                size="sm"
              />
              <span className="menu-card__text">
                <strong>{menu.brandName}</strong>
                <span>{menu.menuName}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <MenuDetailSheet
        menuSlug={selectedMenuSlug}
        onClose={() => setSelectedMenuSlug(null)}
      />
    </section>
  );
}
