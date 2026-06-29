import { useNavigate } from 'react-router-dom';
import { AppTopBar } from '../../components/layout/AppTopBar';
import { allergenOptions } from '../../constants/allergens';
import { completeOnboarding } from '../../lib/storage';
import { useSelectedAllergens } from '../allergies/useSelectedAllergens';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { selectedCodes, selectedCodeSet, toggleAllergen } =
    useSelectedAllergens();

  function finishOnboarding() {
    completeOnboarding();
    navigate('/');
  }

  return (
    <section className="page onboarding-page">
      <AppTopBar action="skip" />
      <div className="onboarding-hero">
        <p className="eyebrow">AllerFit 시작하기</p>
        <h1>내 기준을 먼저 알려주세요.</h1>
        <p>
          선택한 알레르기를 기준으로 치킨과 피자 메뉴 중 먹을 수 있는 메뉴를
          보여드릴게요.
        </p>
      </div>

      <div className="onboarding-panel">
        <div className="onboarding-panel__header">
          <strong>피해야 하는 성분</strong>
          <span>{selectedCodes.length}개 선택</span>
        </div>
        <div className="compact-allergen-grid">
          {allergenOptions.map((allergen) => {
            const isSelected = selectedCodeSet.has(allergen.code);

            return (
              <button
                className={`compact-allergen${isSelected ? ' compact-allergen--selected' : ''}`}
                key={allergen.code}
                onClick={() => toggleAllergen(allergen.code)}
                type="button"
                aria-pressed={isSelected}
              >
                {allergen.displayName}
              </button>
            );
          })}
        </div>
      </div>

      <div className="onboarding-note">
        <strong>공개된 알레르기 정보 기준으로 메뉴를 분류합니다.</strong>
        <p>중증 알레르기가 있는 경우 주문 전 매장에 반드시 확인해주세요.</p>
      </div>

      <button
        className="button button--primary save-button"
        onClick={finishOnboarding}
        type="button"
      >
        먹을 수 있는 메뉴 보기
      </button>
    </section>
  );
}
