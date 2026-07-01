import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppTopBar } from "../../components/layout/AppTopBar";
import { FoodVisual } from "../../components/ui/FoodVisual";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { allergenOptions } from "../../constants/allergens";
import { useSelectedAllergens } from "../allergies/useSelectedAllergens";
import { useCatalogData } from "../catalog/useCatalogData";
import { compareMenusForDisplay } from "../catalog/menuOrdering";
import { MenuDetailSheet } from "../menus/MenuDetailSheet";

function formatDate(date: string) {
  return date.replace(/-/g, ".");
}

function isMenuVisibleForAllergens(
  menuAllergens: string[],
  selectedCodes: string[],
) {
  return !selectedCodes.some((code) => menuAllergens.includes(code));
}

function getEuRoParticle(text: string) {
  const lastChar = [...text.trim()]
    .reverse()
    .find((char) => /[가-힣]/.test(char));

  if (!lastChar) {
    return "로";
  }

  const jongseongIndex = (lastChar.charCodeAt(0) - 0xac00) % 28;

  return jongseongIndex === 0 || jongseongIndex === 8 ? "로" : "으로";
}

export function CategoryPage() {
  const { categorySlug } = useParams();
  const [query, setQuery] = useState("");
  const [isAllergyFiltered, setIsAllergyFiltered] = useState(true);
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string | null>(
    null,
  );
  const [selectedMenuSlug, setSelectedMenuSlug] = useState<string | null>(null);
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
  const selectedNames = allergenOptions
    .filter((allergen) => selectedCodes.includes(allergen.code))
    .map((allergen) => allergen.displayName);
  const selectedAllergenLabel = selectedNames.join(", ");

  const visibleMenus = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return categoryMenuList
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
      .sort(compareMenusForDisplay);
  }, [categoryMenuList, query, selectedBrandSlug]);

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

      {isLoading ? <LoadingSkeleton variant="cards" count={4} /> : null}

      {error ? (
        <div className="empty-action-panel empty-action-panel--quiet">
          <strong>DB 연결을 확인해주세요.</strong>
          <p>실제 DB 데이터를 불러오지 못했어요.</p>
        </div>
      ) : null}

      <div className="brand-control-stack">
        <label className="filter-toggle-row">
          <input
            className="filter-toggle-row__input"
            type="checkbox"
            checked={isAllergyFiltered}
            disabled={!hasSelectedAllergens}
            onChange={(event) => setIsAllergyFiltered(event.target.checked)}
          />
          <span className="filter-toggle-row__text">
            <strong>
              {hasSelectedAllergens
                ? `${selectedAllergenLabel}${getEuRoParticle(
                    selectedAllergenLabel,
                  )} 필터링`
                : "알레르기 설정 후 필터링"}
            </strong>
          </span>
          <span className="filter-toggle-row__control" aria-hidden="true">
            <span />
          </span>
        </label>

        <label className="search-box category-search">
          <Search aria-hidden="true" size={22} />
          <input
            placeholder="메뉴명 또는 브랜드명으로 검색"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

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
          전체 메뉴 <strong>{visibleMenus.length}</strong>
        </p>
        <span>
          {categoryBrands.find((brand) => brand.slug === selectedBrandSlug)
            ?.name ?? "브랜드"}
        </span>
      </div>

      {visibleMenus.length > 0 ? (
        <div className="menu-card-grid">
          {visibleMenus.map((menu) => {
            const isUnavailable =
              isAllergyFiltered &&
              !isMenuVisibleForAllergens(
                [...menu.contains, ...menu.mayContain],
                selectedCodes,
              );

            return (
              <button
                className={`menu-card${
                  isUnavailable ? " menu-card--unavailable" : ""
                }`}
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
                  <span>{menu.menuName}</span>
                  <strong>{menu.brandName}</strong>
                </span>
              </button>
            );
          })}
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
      <MenuDetailSheet
        menuSlug={selectedMenuSlug}
        onClose={() => setSelectedMenuSlug(null)}
      />
    </section>
  );
}
