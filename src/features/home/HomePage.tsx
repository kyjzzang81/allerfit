import { Link } from 'react-router-dom';
import { allergenOptions } from '../../constants/allergens';
import { useSelectedAllergens } from '../allergies/useSelectedAllergens';

export function HomePage() {
  const { selectedCodes } = useSelectedAllergens();
  const selectedNames = allergenOptions
    .filter((allergen) => selectedCodes.includes(allergen.code))
    .map((allergen) => allergen.displayName);

  return (
    <section className="page page--home">
      <div className="hero-band">
        <p className="eyebrow">AllerFit</p>
        <h1>오늘 먹어도 되는 메뉴를 더 빠르게.</h1>
        <p className="hero-band__copy">
          {selectedNames.length > 0
            ? `${selectedNames.join(', ')} 제외 기준으로 확인할게요.`
            : '내 알레르기를 설정하면 메뉴 판정이 더 정확해져요.'}
        </p>
        <Link className="button button--primary" to="/settings/allergies">
          내 알레르기 설정
        </Link>
      </div>

      <div className="section-grid">
        <Link className="content-card category-card" to="/category/chicken">
          <span>치킨</span>
          <strong>공시 정보 기준으로 확인하기</strong>
        </Link>
        <Link className="content-card category-card" to="/category/pizza">
          <span>피자</span>
          <strong>브랜드와 메뉴를 검색하기</strong>
        </Link>
      </div>

      <div className="content-card notice-card">
        <strong>안전 문구</strong>
        <p>
          알러핏은 공개된 알레르기 정보를 기준으로 메뉴를 분류합니다. 중증
          알레르기가 있는 경우 주문 전 매장에 반드시 확인해주세요.
        </p>
      </div>
    </section>
  );
}
