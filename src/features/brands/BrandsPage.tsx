import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppTopBar } from "../../components/layout/AppTopBar";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useCatalogData } from "../catalog/useCatalogData";

export function BrandsPage() {
  const { brands, categories, isLoading, error } = useCatalogData();
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<
    string | null
  >(null);

  const activeCategorySlug =
    selectedCategorySlug ?? categories[0]?.slug ?? null;
  const activeCategory = categories.find(
    (category) => category.slug === activeCategorySlug,
  );

  const visibleBrands = useMemo(
    () =>
      brands
        .filter((brand) =>
          activeCategorySlug ? brand.categorySlug === activeCategorySlug : true,
        )
        .sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [activeCategorySlug, brands],
  );

  return (
    <section className="page brands-page">
      <AppTopBar action="settings" title="브랜드" />

      {categories.length > 0 ? (
        <div className="category-chip-carousel" aria-label="카테고리 선택">
          {categories.map((category) => {
            const isSelected = category.slug === activeCategorySlug;

            return (
              <button
                className={`category-chip-carousel__item${
                  isSelected ? " category-chip-carousel__item--selected" : ""
                }`}
                key={category.slug}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedCategorySlug(category.slug)}
              >
                <span
                  className="category-chip-carousel__image"
                  aria-hidden="true"
                >
                  <img
                    src={`/assets/categories/${category.slug}.png`}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                </span>
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingSkeleton variant="grid" count={6} />
      ) : null}

      {error ? (
        <div className="empty-action-panel empty-action-panel--quiet">
          <strong>DB 연결을 확인해주세요.</strong>
          <p>실제 DB 데이터를 불러오지 못했어요.</p>
        </div>
      ) : null}

      <div className="brand-list-heading">
        <strong>오늘은 {activeCategory?.name ?? "브랜드"}</strong>
        <span>{visibleBrands.length}개</span>
      </div>

      <div className="brand-card-grid">
        {visibleBrands.map((brand) => (
          <Link
            className="brand-card"
            key={brand.slug}
            to={`/brand/${brand.slug}`}
          >
            <span className="brand-logo" aria-hidden="true">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" loading="lazy" />
              ) : (
                brand.logoText
              )}
            </span>
            <strong>{brand.name}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
