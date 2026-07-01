import { useEffect, useMemo, useState } from 'react';
import { AppTopBar } from '../../components/layout/AppTopBar';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
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
  const { selectedCodes, saveAllergens } = useSelectedAllergens();
  const [draftCodes, setDraftCodes] = useState<string[]>(selectedCodes);
  const [isSaving, setIsSaving] = useState(false);
  const { allergenOptions, isLoading, error } = useAllergenOptions();
  const draftCodeSet = useMemo(() => new Set(draftCodes), [draftCodes]);
  const hasChanges =
    draftCodes.length !== selectedCodes.length ||
    draftCodes.some((code) => !selectedCodes.includes(code));

  useEffect(() => {
    if (!hasChanges) {
      setDraftCodes(selectedCodes);
    }
  }, [hasChanges, selectedCodes]);

  function toggleDraftAllergen(code: string) {
    setDraftCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    );
  }

  async function saveSelection() {
    setIsSaving(true);

    try {
      await saveAllergens(draftCodes);
      completeOnboarding();
    } finally {
      setIsSaving(false);
    }
  }

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
          <span>{draftCodes.length}</span>
          <strong>선택한 성분</strong>
        </div>
      </div>

      <div className="allergen-grid" role="list">
        {isLoading ? (
          <LoadingSkeleton variant="grid" count={6} />
        ) : null}

        {error ? (
          <div className="empty-action-panel empty-action-panel--quiet">
            <strong>DB 연결을 확인해주세요.</strong>
            <p>실제 DB 성분 목록을 불러오지 못했어요.</p>
          </div>
        ) : null}

        {allergenOptions.map((allergen) => {
          const isSelected = draftCodeSet.has(allergen.code);

          return (
            <button
              className={`allergen-chip${isSelected ? ' allergen-chip--selected' : ''}`}
              key={allergen.code}
              onClick={() => toggleDraftAllergen(allergen.code)}
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

      <div className="fixed-save-bar">
        <button
          className="button button--primary save-button"
          disabled={isSaving || !hasChanges}
          onClick={saveSelection}
          type="button"
        >
          {isSaving
            ? '저장 중'
            : draftCodes.length > 0
              ? `${draftCodes.length}개 성분 저장하기`
              : '선택 없이 저장하기'}
        </button>
      </div>
    </section>
  );
}
