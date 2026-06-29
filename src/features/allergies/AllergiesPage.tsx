import { AppTopBar } from '../../components/layout/AppTopBar';
import { completeOnboarding } from '../../lib/storage';
import { useAllergenOptions } from './useAllergenOptions';
import { useSelectedAllergens } from './useSelectedAllergens';

const allergenGraphics: Record<string, string> = {
  egg: '🥚',
  milk: '🥛',
  buckwheat: '🌾',
  peanut: '🥜',
  soybean: '🫘',
  wheat: '🌾',
  mackerel: '🐟',
  crab: '🦀',
  shrimp: '🦐',
  pork: '🥓',
  peach: '🍑',
  tomato: '🍅',
  sulfite: '⋯',
  walnut: '🌰',
  chicken: '🍗',
  beef: '🥩',
  squid: '🦑',
  shellfish: '🦪',
};

export function AllergiesPage() {
  const { selectedCodes, selectedCodeSet, toggleAllergen } =
    useSelectedAllergens();
  const { allergenOptions, isLoading, error } = useAllergenOptions();

  return (
    <section className="page allergies-page">
      <AppTopBar showBack title="알레르기 설정" />
      <div className="allergies-hero">
        <div>
          <p className="eyebrow">내 알레르기</p>
          <h1>피해야 하는 성분을 선택하세요.</h1>
        </div>
        <p>
          선택한 성분은 이 기기에 저장되고, 메뉴 판정 기준으로 사용됩니다.
        </p>
        <div className="selection-summary" aria-live="polite">
          <span>{selectedCodes.length}</span>
          <strong>선택한 성분</strong>
        </div>
      </div>

      <div className="allergen-grid" role="list">
        {isLoading ? (
          <div className="empty-action-panel empty-action-panel--quiet">
            <strong>Supabase 데이터를 불러오는 중이에요.</strong>
          </div>
        ) : null}

        {error ? (
          <div className="empty-action-panel empty-action-panel--quiet">
            <strong>DB 연결을 확인해주세요.</strong>
            <p>현재는 임시 성분 목록으로 표시하고 있어요.</p>
          </div>
        ) : null}

        {allergenOptions.map((allergen) => {
          const isSelected = selectedCodeSet.has(allergen.code);

          return (
            <button
              className={`allergen-chip${isSelected ? ' allergen-chip--selected' : ''}`}
              key={allergen.code}
              onClick={() => toggleAllergen(allergen.code)}
              type="button"
              aria-pressed={isSelected}
            >
              <span className="allergen-card__check" aria-hidden="true">
                ✓
              </span>
              <span className="allergen-card__image" aria-hidden="true">
                {allergenGraphics[allergen.code]}
              </span>
              <span className="allergen-card__content">
                <strong>{allergen.displayName}</strong>
                <span>{allergen.name}</span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        className="button button--primary save-button"
        onClick={completeOnboarding}
        type="button"
      >
        {selectedCodes.length > 0
          ? `${selectedCodes.length}개 성분 저장됨`
          : '선택 없이 시작하기'}
      </button>
    </section>
  );
}
