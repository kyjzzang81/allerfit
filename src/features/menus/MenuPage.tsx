import { ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AppTopBar } from '../../components/layout/AppTopBar';
import { FoodVisual } from '../../components/ui/FoodVisual';
import { allergenOptions } from '../../constants/allergens';
import { useSelectedAllergens } from '../allergies/useSelectedAllergens';
import { useCatalogData } from '../catalog/useCatalogData';

function formatDate(date: string) {
  return date.replace(/-/g, '.');
}

function getAllergenNames(codes: string[]) {
  return allergenOptions
    .filter((allergen) => codes.includes(allergen.code))
    .map((allergen) => allergen.displayName);
}

export function MenuPage() {
  const { menuSlug } = useParams();
  const { selectedCodes } = useSelectedAllergens();
  const { brands, categories, menus, isLoading, error } = useCatalogData();
  const menu = menus.find((item) => item.id === menuSlug);
  const brand = brands.find((item) => item.slug === menu?.brandSlug);
  const category = categories.find((item) => item.slug === menu?.categorySlug);

  if (!menu || !brand) {
    if (isLoading) {
      return (
        <section className="page">
          <AppTopBar showBack title="메뉴 상세" />
          <div className="empty-action-panel empty-action-panel--quiet">
            <strong>Supabase 데이터를 불러오는 중이에요.</strong>
          </div>
        </section>
      );
    }

    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">메뉴 상세</p>
          <h1>메뉴를 찾을 수 없어요.</h1>
        </div>
        <Link className="button button--primary" to="/">
          홈으로 돌아가기
        </Link>
      </section>
    );
  }

  const matchedContains = menu.contains.filter((code) =>
    selectedCodes.includes(code),
  );
  const matchedMayContain = menu.mayContain.filter((code) =>
    selectedCodes.includes(code),
  );
  const isAvoid = matchedContains.length > 0;
  const isCaution = !isAvoid && matchedMayContain.length > 0;
  const statusTitle = selectedCodes.length === 0
    ? '알레르기 선택이 필요합니다.'
    : isAvoid
      ? '피해야 하는 메뉴예요.'
      : isCaution
        ? '주의가 필요한 메뉴예요.'
        : '공시 기준 선택 성분 없음';

  return (
    <section className="page menu-detail-page">
      <AppTopBar showBack action="share" />
      <div className="menu-detail-hero">
        <FoodVisual
          imageUrl={menu.imageUrl}
          label={menu.menuGraphicText}
          tone="warm"
          size="lg"
        />
        <p className="eyebrow">{category?.name ?? '메뉴'} 메뉴</p>
        <h1>{menu.menuName}</h1>
        <Link className="text-link" to={`/brand/${brand.slug}`}>
          {brand.name}
        </Link>
      </div>

      {selectedCodes.length === 0 ? (
        <div className="empty-action-panel">
          <strong>알레르기 선택이 필요합니다.</strong>
          <p>내 알레르기를 선택하면 이 메뉴의 판정 결과를 보여드릴게요.</p>
          <Link className="button button--primary" to="/settings/allergies">
            내 알레르기 선택하기
          </Link>
        </div>
      ) : (
        <div className="detail-result-panel">
          <p className="eyebrow">판정 결과</p>
          <strong>{statusTitle}</strong>
          <p>
            {isAvoid
              ? `${getAllergenNames(matchedContains).join(', ')} 성분이 포함되어 있어요.`
              : isCaution
                ? `${getAllergenNames(matchedMayContain).join(', ')} 혼입 가능성이 있어요.`
                : '설정한 알레르기 성분은 공개 정보상 확인되지 않았어요.'}
          </p>
        </div>
      )}

      {error ? (
        <div className="empty-action-panel empty-action-panel--quiet">
          <strong>DB 연결을 확인해주세요.</strong>
          <p>현재는 임시 데이터로 표시하고 있어요.</p>
        </div>
      ) : null}

      <div className="detail-section">
        <h2>공시 성분</h2>
        <div className="detail-chip-list">
          {getAllergenNames(menu.contains).map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </div>

      <div className="detail-section">
        <h2>주의 가능 성분</h2>
        {menu.mayContain.length > 0 ? (
          <div className="detail-chip-list">
            {getAllergenNames(menu.mayContain).map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        ) : (
          <p>공개 정보상 별도 주의 가능 성분이 없어요.</p>
        )}
      </div>

      <footer className="brand-info">
        <p>최종 업데이트 {formatDate(menu.lastCheckedAt)}</p>
        <p>공식 알레르기 정보 기준</p>
        <div className="brand-info__links">
          <a href={brand.allergenSourceUrl} target="_blank" rel="noreferrer">
            알레르기 정보 출처 보기
            <ExternalLink aria-hidden="true" size={15} />
          </a>
        </div>
      </footer>
    </section>
  );
}
