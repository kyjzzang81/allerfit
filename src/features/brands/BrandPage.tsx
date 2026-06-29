import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppTopBar } from "../../components/layout/AppTopBar";
import { FoodVisual } from "../../components/ui/FoodVisual";
import { allergenOptions } from "../../constants/allergens";
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

export function BrandPage() {
  const { brandSlug } = useParams();
  const [query, setQuery] = useState("");
  const { selectedCodes } = useSelectedAllergens();
  const { brands, categories, menus, isLoading, error } = useCatalogData();

  const brand = brands.find((item) => item.slug === brandSlug);
  const category = categories.find((item) => item.slug === brand?.categorySlug);
  const brandMenus = menus.filter((menu) => menu.brandSlug === brand?.slug);

  const selectedNames = allergenOptions
    .filter((allergen) => selectedCodes.includes(allergen.code))
    .map((allergen) => allergen.displayName);

  const sortedLastCheckedDates = brandMenus
    .map((menu) => menu.lastCheckedAt)
    .sort();
  const lastUpdatedAt =
    sortedLastCheckedDates[sortedLastCheckedDates.length - 1];

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
      .sort((a, b) => a.menuName.localeCompare(b.menuName, "ko"));
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
      <AppTopBar showBack action="share" />
      <div className="brand-hero">
        <span
          className="brand-logo brand-logo--hero"
          aria-label={`${brand.name} 로고`}
        >
          {brand.logoText}
        </span>
        <div className="brand-hero__copy">
          <h1>{brand.name}</h1>
          <p className="eyebrow">{category?.name ?? "브랜드"}</p>
          <p>
            ✨&nbsp;
            {hasSelectedAllergens
              ? `${selectedNames.join(", ")} 제외 기준으로 ${visibleMenus.length}개 메뉴가 있어요!`
              : "알레르기 선택이 필요합니다."}
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
          {isLoading ? (
            <div className="empty-action-panel empty-action-panel--quiet">
              <strong>Supabase 데이터를 불러오는 중이에요.</strong>
            </div>
          ) : null}

          {error ? (
            <div className="empty-action-panel empty-action-panel--quiet">
              <strong>DB 연결을 확인해주세요.</strong>
              <p>현재는 임시 데이터로 표시하고 있어요.</p>
            </div>
          ) : null}

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
                <Link
                  className="brand-menu-card"
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
              ))}
            </div>
          ) : (
            <div className="empty-action-panel empty-action-panel--quiet">
              <strong>검색 결과가 없어요.</strong>
              <p>다른 메뉴명으로 검색해보세요.</p>
            </div>
          )}

          <footer className="brand-info">
            <p>
              최종 업데이트 {lastUpdatedAt ? formatDate(lastUpdatedAt) : "-"}
            </p>
            <p>공식 알레르기 정보 기준</p>
            <div className="brand-info__links">
              <a
                href={brand.allergenSourceUrl}
                target="_blank"
                rel="noreferrer"
              >
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
