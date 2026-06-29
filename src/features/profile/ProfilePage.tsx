import { Link } from 'react-router-dom';
import { AppTopBar } from '../../components/layout/AppTopBar';
import { allergenOptions } from '../../constants/allergens';
import { useSelectedAllergens } from '../allergies/useSelectedAllergens';

export function ProfilePage() {
  const { selectedCodes } = useSelectedAllergens();
  const selectedNames = allergenOptions
    .filter((allergen) => selectedCodes.includes(allergen.code))
    .map((allergen) => allergen.displayName);

  return (
    <section className="page profile-page">
      <AppTopBar showBack title="프로필" />
      <div className="page-header">
        <p className="eyebrow">프로필</p>
        <h1>내 기준을 관리해요.</h1>
        <p>현재는 비로그인 프로필로 이 기기에만 저장됩니다.</p>
      </div>

      <div className="profile-summary-card">
        <span>{selectedCodes.length}</span>
        <strong>선택한 알레르기</strong>
        <p>
          {selectedNames.length > 0
            ? selectedNames.join(', ')
            : '아직 선택한 알레르기 성분이 없어요.'}
        </p>
        <Link className="button button--primary" to="/settings/allergies">
          내 알레르기 수정
        </Link>
      </div>

      <div className="profile-link-grid">
        <Link className="content-card category-card" to="/category/chicken">
          <span>카테고리</span>
          <strong>치킨 메뉴 보기</strong>
        </Link>
        <Link className="content-card category-card" to="/category/pizza">
          <span>카테고리</span>
          <strong>피자 메뉴 보기</strong>
        </Link>
      </div>
    </section>
  );
}
