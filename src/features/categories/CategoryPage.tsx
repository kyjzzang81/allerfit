import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppTopBar } from "../../components/layout/AppTopBar";
import { FoodVisual } from "../../components/ui/FoodVisual";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useSelectedAllergens } from "../allergies/useSelectedAllergens";
import { useCatalogData } from "../catalog/useCatalogData";

function formatDate(date: string) {
  return date.replace(/-/g, ".");
}

function isMenuVisibleForAllergens(
  menuAllergens: string[],
  selectedCodes: string[],
) {
  return !selectedCodes.some((code) => menuAllergens.includes(code));
}

export function CategoryPage() {
  const { categorySlug } = useParams();
  const [query, setQuery] = useState("");
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string | null>(
    null,
  );
  const { selectedCodes } = useSelectedAllergens();
  const { brands, categories, menus, isLoading, error } = useCatalogData();

  const category = categories.find((item) => item.slug === categorySlug);

  const categoryMenuList = useMemo(
    () => menus.filter((menu) => menu.categorySlug === category?.slug),
    [category?.slug, menus],
  );
  const categoryBrands = useMemo(() => {
    const brandBySlug = new Map(brands.map((brand) => [brand.slug, brand]));
    const seenBrandSlugs = new Set<string>();

    return categoryMenuList.reduce<typeof brands>((result, menu) => {
      if (!menu.brandSlug || seenBrandSlugs.has(menu.brandSlug)) {
        return result;
      }

      const brand = brandBySlug.get(menu.brandSlug);

      if (brand) {
        seenBrandSlugs.add(menu.brandSlug);
        result.push(brand);
      }

      return result;
    }, []);
  }, [brands, categoryMenuList]);

  useEffect(() => {
    const firstBrandSlug = categoryBrands[0]?.slug ?? null;

    setSelectedBrandSlug((current) =>
      current && categoryBrands.some((brand) => brand.slug === current)
        ? current
        : firstBrandSlug,
    );
  }, [categoryBrands]);

  const sortedLastCheckedDates = categoryMenuList
    .map((menu) => menu.lastCheckedAt)
    .sort();
  const lastUpdatedAt =
    sortedLastCheckedDates[sortedLastCheckedDates.length - 1];

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
      .filter((menu) =>
        selectedBrandSlug ? menu.brandSlug === selectedBrandSlug : true,
      )
      .sort((a, b) =>
        `${a.brandName} ${a.menuName}`.localeCompare(
          `${b.brandName} ${b.menuName}`,
          "ko",
        ),
      );
  }, [categoryMenuList, query, selectedBrandSlug, selectedCodes]);

  if (!category) {
    return (
      <section className="page category-page">
        <AppTopBar showBack title="카테고리" />
        {isLoading ? (
          <LoadingSkeleton variant="cards" count={3} />
        ) : (
          <>
            <div className="page-header">
              <p className="eyebrow">카테고리</p>
              <h1>카테고리를 찾을 수 없어요.</h1>
            </div>
            <Link className="button button--primary" to="/">
              홈으로 돌아가기
            </Link>
          </>
        )}
      </section>
    );
  }

  const hasSelectedAllergens = selectedCodes.length > 0;

  return (
    <section className="page category-page">
      <AppTopBar showBack title={category.name} />

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
          {isLoading ? <LoadingSkeleton variant="cards" count={4} /> : null}

          {error ? (
            <div className="empty-action-panel empty-action-panel--quiet">
              <strong>DB 연결을 확인해주세요.</strong>
              <p>실제 DB 데이터를 불러오지 못했어요.</p>
            </div>
          ) : null}

          <label className="search-box category-search">
            <Search aria-hidden="true" size={22} />
            <input
              placeholder="메뉴명 또는 브랜드명으로 검색"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {categoryBrands.length > 0 ? (
            <div
              className="brand-carousel"
              aria-label={`${category.name} 브랜드 선택`}
            >
              {categoryBrands.map((brand) => {
                const isSelected = brand.slug === selectedBrandSlug;

                return (
                  <button
                    className={`brand-carousel__item${
                      isSelected ? " brand-carousel__item--selected" : ""
                    }`}
                    key={brand.slug}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedBrandSlug(brand.slug)}
                  >
                    <span className="brand-logo" aria-hidden="true">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt="" loading="lazy" />
                      ) : (
                        brand.logoText
                      )}
                    </span>
                    <span>{brand.name}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="category-toolbar">
            <p>
              먹을 수 있는 메뉴 <strong>{visibleMenus.length}</strong>
            </p>
            <span>
              {categoryBrands.find((brand) => brand.slug === selectedBrandSlug)
                ?.name ?? "브랜드"}
            </span>
          </div>

          {visibleMenus.length > 0 ? (
            <div className="menu-card-grid">
              {visibleMenus.map((menu) => (
                <Link
                  className="menu-card"
                  key={menu.id}
                  to={`/brand/${menu.brandSlug}`}
                >
                  <FoodVisual
                    imageUrl={menu.imageUrl}
                    label={menu.menuGraphicText}
                    tone="warm"
                    size="sm"
                  />
                  <span className="menu-card__text">
                    <span>{menu.menuName}</span>
                    <strong>{menu.brandName}</strong>
                  </span>
                </Link>
              ))}
            </div>
          ) : !isLoading && !error ? (
            <div className="empty-action-panel empty-action-panel--quiet">
              <strong>검색 결과가 없어요.</strong>
              <p>다른 메뉴명이나 브랜드명으로 검색해보세요.</p>
            </div>
          ) : null}

          <p className="category-updated">
            최종 업데이트 {lastUpdatedAt ? formatDate(lastUpdatedAt) : "-"}
          </p>
        </>
      )}
    </section>
  );
}
