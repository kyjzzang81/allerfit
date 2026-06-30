import { Search, SlidersHorizontal, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { AppTopBar } from "../../components/layout/AppTopBar";
import { FoodVisual } from "../../components/ui/FoodVisual";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useCatalogData } from "../catalog/useCatalogData";

function getCategoryTone(slug: string) {
  return slug === "pizza" ? "red" : "warm";
}

export function HomeExamplePage() {
  const { categories, menus, isLoading, error } = useCatalogData();
  const featuredMenus = menus.slice(0, 6);

  return (
    <section className="page page--home">
      <AppTopBar action="settings" showLogo />

      <div className="home-search-row">
        <Link className="home-search-pill" to="/search">
          <Search aria-hidden="true" size={20} />
          <span>Search</span>
        </Link>
        <Link
          className="home-filter-button"
          to="/settings/allergies"
          aria-label="내 알레르기 설정"
        >
          <SlidersHorizontal aria-hidden="true" size={20} />
        </Link>
      </div>

      <div className="home-category-rail" aria-label="메뉴 카테고리">
        {categories.map((category) => (
          <Link
            className="home-category-chip"
            key={category.slug}
            to={`/category/${category.slug}`}
          >
            <span className="home-category-chip__image" aria-hidden="true">
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
          </Link>
        ))}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="cards" count={3} />
      ) : null}

      {error ? (
        <div className="empty-card">
          <strong>DB 연결을 확인해주세요.</strong>
          <p>실제 DB 데이터를 불러오지 못했어요.</p>
        </div>
      ) : null}

      {featuredMenus.length > 0 ? (
        <>
          <div className="home-section-title">
            <strong>Popular items</strong>
          </div>
          <div className="home-feature-carousel" aria-label="인기 메뉴">
            {featuredMenus.slice(0, 4).map((menu) => (
              <Link
                className="home-feature-card"
                key={menu.id}
                to={`/menu/${menu.id}`}
              >
                <FoodVisual
                  imageUrl={menu.imageUrl}
                  label={menu.menuGraphicText}
                  tone={getCategoryTone(menu.categorySlug)}
                  size="lg"
                />
                <span className="home-feature-card__copy">
                  <strong>{menu.menuName}</strong>
                  <span>{menu.brandName}</span>
                </span>
                <span className="home-feature-card__rating">
                  <Star aria-hidden="true" size={16} fill="currentColor" />
                  5.0
                </span>
              </Link>
            ))}
          </div>

          <div className="home-section-title home-section-title--inline">
            <strong>Delicious items</strong>
            <Link to="/brands">See All</Link>
          </div>
          <div className="home-delicious-list">
            {featuredMenus.slice(4, 6).map((menu) => (
              <Link
                className="home-delicious-card"
                key={menu.id}
                to={`/menu/${menu.id}`}
              >
                <FoodVisual
                  imageUrl={menu.imageUrl}
                  label={menu.menuGraphicText}
                  tone={getCategoryTone(menu.categorySlug)}
                  size="sm"
                />
                <span>
                  <strong>{menu.menuName}</strong>
                  <small>{menu.brandName}</small>
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : null}

    </section>
  );
}
