import { Link } from "react-router-dom";
import { AppTopBar } from "../../components/layout/AppTopBar";
import { FoodFallback } from "../../components/ui/FoodFallback";
import { allergenOptions } from "../../constants/allergens";
import { useSelectedAllergens } from "../allergies/useSelectedAllergens";
import { useCatalogData } from "../catalog/useCatalogData";

function getCategoryGraphic(slug: string) {
  return slug === "pizza" ? "🍕" : "🍗";
}

function getCategoryTone(slug: string) {
  return slug === "pizza" ? "red" : "warm";
}

export function HomePage() {
  const { selectedCodes } = useSelectedAllergens();
  const { categories, isLoading } = useCatalogData();
  const selectedNames = allergenOptions
    .filter((allergen) => selectedCodes.includes(allergen.code))
    .map((allergen) => allergen.displayName);

  return (
    <section className="page page--home">
      <AppTopBar action="settings" showLogo />
      <div className="hero-band">
        <h1>안녕하세요! 👋</h1>
        <p className="hero-band__copy">
          {selectedNames.length > 0
            ? `${selectedNames.join(", ")} 제외 기준으로 추천해드려요.`
            : "먹을 수 있는 메뉴를 추천해드려요."}
        </p>
      </div>

      <div className="home-section-header">
        <strong>내 알레르기 성분</strong>
        <Link to="/settings/allergies">수정</Link>
      </div>
      <div className="selected-allergen-row">
        {selectedNames.length > 0 ? (
          selectedNames
            .slice(0, 4)
            .map((name) => <span key={name}>{name}</span>)
        ) : (
          <Link to="/settings/allergies">알레르기 성분 선택하기</Link>
        )}
      </div>

      <div className="home-section-header">
        <strong>추천 카테고리</strong>
      </div>
      <div className="section-grid">
        {categories.map((category) => (
          <Link
            className="content-card category-card"
            key={category.slug}
            to={`/category/${category.slug}`}
          >
            <FoodFallback
              label={getCategoryGraphic(category.slug)}
              tone={getCategoryTone(category.slug)}
              size="lg"
            />
          </Link>
        ))}
      </div>

      {isLoading ? (
        <div className="empty-card">
          <strong>Supabase 데이터를 불러오는 중이에요.</strong>
        </div>
      ) : null}

      <div className="notice-card">
        <p>
          알러핏은 공개된 알레르기 정보를 기준으로 메뉴를 분류합니다. 중증
          알레르기가 있는 경우 주문 전 매장에 반드시 확인해주세요.
        </p>
      </div>
    </section>
  );
}
