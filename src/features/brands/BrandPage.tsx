import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppTopBar } from "../../components/layout/AppTopBar";
import { FoodVisual } from "../../components/ui/FoodVisual";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { allergenOptions } from "../../constants/allergens";
import { useSelectedAllergens } from "../allergies/useSelectedAllergens";
import { useCatalogData } from "../catalog/useCatalogData";
import { compareMenusForDisplay } from "../catalog/menuOrdering";

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

export function BrandPage() {
  const { brandSlug } = useParams();
  const [query, setQuery] = useState("");
  const [isAllergyFiltered, setIsAllergyFiltered] = useState(true);
  const { selectedCodes } = useSelectedAllergens();
  const { brands, categories, menus, isLoading, error } = useCatalogData();

  const brand = brands.find((item) => item.slug === brandSlug);
  const category = categories.find((item) => item.slug === brand?.categorySlug);
  const brandMenus = menus.filter((menu) => menu.brandSlug === brand?.slug);

  const selectedNames = allergenOptions
    .filter((allergen) => selectedCodes.includes(allergen.code))
    .map((allergen) => allergen.displayName);
  const selectedAllergenLabel = selectedNames.join(", ");

  const sortedLastCheckedDates = brandMenus
    .map((menu) => menu.lastCheckedAt)
    .sort();
  const lastUpdatedAt =
    sortedLastCheckedDates[sortedLastCheckedDates.length - 1];

  const visibleMenus = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return brandMenus
      .filter((menu) => {
        if (!keyword) {
          return true;
        }

        return menu.menuName.toLowerCase().includes(keyword);
      })
      .sort(compareMenusForDisplay);
  }, [brandMenus, query]);

  if (!brand) {
    return (
      <section className="page brand-page">
        <AppTopBar showBack title="브랜드" />
        {isLoading ? (
          <LoadingSkeleton variant="detail" count={1} />
        ) : (
          <>
            <div className="page-header">
              <p className="eyebrow">브랜드</p>
              <h1>브랜드를 찾을 수 없어요.</h1>
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
    <section className="page brand-page">
      <AppTopBar showBack action="share" />
      <div className="brand-hero">
        <span
          className="brand-logo brand-logo--hero"
          aria-label={`${brand.name} 로고`}
        >
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="" loading="lazy" />
          ) : (
            brand.logoText
          )}
        </span>
        <div className="brand-hero__copy">
          <h1>{brand.name}</h1>
          <p className="eyebrow">{category?.name ?? "브랜드"}</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="grid" count={4} />
      ) : null}

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

        <label className="search-box category-search brand-menu-search">
          <Search aria-hidden="true" size={22} />
          <input
            placeholder={`${brand.name} 메뉴 검색`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="brand-list-heading">
        <strong>{brand.name} 메뉴</strong>
        <span>{visibleMenus.length}개</span>
      </div>

      {visibleMenus.length > 0 ? (
        <div className="brand-menu-grid">
          {visibleMenus.map((menu) => {
            const isUnavailable =
              isAllergyFiltered &&
              hasSelectedAllergens &&
              !isMenuVisibleForAllergens(
                [...menu.contains, ...menu.mayContain],
                selectedCodes,
              );

            return (
              <Link
                className={`brand-menu-card${
                  isUnavailable ? " menu-card--unavailable" : ""
                }`}
                key={menu.id}
                to={`/menu/${menu.id}`}
              >
                <FoodVisual
                  imageUrl={menu.imageUrl}
                  label={menu.menuGraphicText}
                  tone="warm"
                  size="md"
                />
                <strong>{menu.menuName}</strong>
              </Link>
            );
          })}
        </div>
      ) : !isLoading && !error ? (
        <div className="empty-action-panel empty-action-panel--quiet">
          <strong>검색 결과가 없어요.</strong>
          <p>다른 메뉴명으로 검색해보세요.</p>
        </div>
      ) : null}

      <footer className="brand-info">
        <p>최종 업데이트 {lastUpdatedAt ? formatDate(lastUpdatedAt) : "-"}</p>
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
    </section>
  );
}
