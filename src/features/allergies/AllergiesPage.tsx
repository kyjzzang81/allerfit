import { allergenOptions } from '../../constants/allergens';
import { completeOnboarding } from '../../lib/storage';
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

  return (
    <section className="page allergies-page">
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
