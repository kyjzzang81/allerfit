import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppTopBar } from '../../components/layout/AppTopBar';
import { FoodVisual } from '../../components/ui/FoodVisual';
import { useCatalogData } from '../catalog/useCatalogData';

export function SearchPage() {
  const [query, setQuery] = useState('');
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
      .sort((a, b) =>
        `${a.brandName} ${a.menuName}`.localeCompare(
          `${b.brandName} ${b.menuName}`,
          'ko',
        ),
      );
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
        <div className="content-card empty-card">
          <strong>Supabase 데이터를 불러오는 중이에요.</strong>
        </div>
      ) : null}

      {error ? (
        <div className="content-card empty-card">
          <strong>DB 연결을 확인해주세요.</strong>
          <p>현재는 임시 데이터로 검색하고 있어요.</p>
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
      ) : null}
    </section>
  );
}
