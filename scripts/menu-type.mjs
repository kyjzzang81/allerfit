const SIDE_SOURCE_CATEGORIES = new Set(['side', 'pastaandside']);
const SECONDARY_SOURCE_CATEGORIES = new Set(['parts']);
const BBQ_SIDE_CATEGORY_IDS = new Set([21, 22]);
const BBQ_SECONDARY_CATEGORY_IDS = new Set([20]);

const SIDE_MENU_PATTERNS = [
  /사이드/,
  /치즈볼/,
  /치즈스틱/,
  /감자튀김/,
  /프라이/,
  /웨지/,
  /너겟/,
  /텐더/,
  /떡볶이/,
  /핫도그/,
  /브라우니/,
  /파스타/,
  /스파게티/,
  /리조또/,
  /샐러드/,
  /콜라/,
  /사이다/,
  /음료/,
  /소스/,
  /피클/,
  /치킨무/,
  /무$/,
  /콘샐러드/,
  /새우.*튀김/,
  /미니.*튀김/,
  /오징어/,
  /먹태/,
  /윙봉/,
  /닭발/,
  /닭똥집/,
  /닭껍데기/,
  /김말이/,
  /멘보샤/,
  /오뎅탕/,
  /시즈닝/,
  /디핑/,
];

function normalizeMenuName(menuName) {
  return String(menuName ?? '').replace(/\s+/g, '').toLowerCase();
}

export function getMenuType({
  brandCategorySlug,
  menuCategorySlug,
  sourceCategory,
  sourceCategoryId,
  menuName,
}) {
  if (BBQ_SIDE_CATEGORY_IDS.has(Number(sourceCategoryId))) {
    return 3;
  }

  if (BBQ_SECONDARY_CATEGORY_IDS.has(Number(sourceCategoryId))) {
    return 2;
  }

  if (SIDE_SOURCE_CATEGORIES.has(sourceCategory)) {
    return 3;
  }

  if (SECONDARY_SOURCE_CATEGORIES.has(sourceCategory)) {
    return 2;
  }

  if (
    brandCategorySlug &&
    menuCategorySlug &&
    brandCategorySlug !== menuCategorySlug
  ) {
    return 2;
  }

  const normalizedName = normalizeMenuName(menuName);

  return SIDE_MENU_PATTERNS.some((pattern) => pattern.test(normalizedName))
    ? 3
    : 1;
}
