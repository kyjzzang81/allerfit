import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppTopBar } from '../../components/layout/AppTopBar';
import { FoodVisual } from '../../components/ui/FoodVisual';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useCatalogData } from '../catalog/useCatalogData';
import { compareMenusForDisplay } from '../catalog/menuOrdering';

export function CategorySearchPage() {
  const { categorySlug } = useParams();
  const [query, setQuery] = useState('');
  const { categories, menus, isLoading, error } = useCatalogData();
  const category = categories.find((item) => item.slug === categorySlug);

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return menus
      .filter((menu) => menu.categorySlug === category?.slug)
      .filter((menu) => {
        if (!keyword) {
          return true;
        }

        return `${menu.brandName} ${menu.menuName}`
          .toLowerCase()
          .includes(keyword);
      })
      .sort(compareMenusForDisplay);
  }, [category?.slug, menus, query]);

  if (!category) {
    return (
      <section className="page category-page">
        <AppTopBar showBack title="검색 결과" />
        {isLoading ? (
          <LoadingSkeleton variant="cards" count={3} />
        ) : (
          <div className="page-header">
            <p className="eyebrow">검색</p>
            <h1>카테고리를 찾을 수 없어요.</h1>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="page category-page">
      <AppTopBar showBack title="검색 결과" />
      <div className="category-hero">
        <p className="eyebrow">카테고리 검색</p>
        <h1>{category.name} 검색</h1>
        <p>브랜드명이나 메뉴명으로 빠르게 찾아보세요.</p>
      </div>

      <label className="search-box category-search">
        <Search aria-hidden="true" size={22} />
        <input
          placeholder="메뉴명 또는 브랜드명으로 검색"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="menu-card-grid">
        {isLoading ? (
          <LoadingSkeleton variant="cards" count={3} />
        ) : null}

        {error ? (
          <div className="empty-action-panel empty-action-panel--quiet">
            <strong>DB 연결을 확인해주세요.</strong>
            <p>실제 DB 데이터를 불러오지 못했어요.</p>
          </div>
        ) : null}

        {results.map((menu) => (
          <Link className="menu-card" key={menu.id} to={`/brand/${menu.brandSlug}`}>
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
          </Link>
        ))}
      </div>
    </section>
  );
}
