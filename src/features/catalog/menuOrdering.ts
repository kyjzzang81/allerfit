import type { CategoryMenu } from '../categories/categoryData';

const sideMenuPatterns = [
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
  /윙/,
  /봉/,
  /닭발/,
  /닭똥집/,
  /목/,
];

const pizzaSideMenuPatterns = [
  ...sideMenuPatterns,
  /치킨/,
  /윙/,
  /봉/,
];

function normalizeMenuName(menuName: string) {
  return menuName.replace(/\s+/g, '').toLowerCase();
}

export function inferMenuType(categorySlug: string, menuName: string) {
  const normalizedName = normalizeMenuName(menuName);
  const patterns =
    categorySlug === 'pizza' ? pizzaSideMenuPatterns : sideMenuPatterns;

  return patterns.some((pattern) => pattern.test(normalizedName)) ? 3 : 1;
}

export function compareMenusForDisplay(
  first: CategoryMenu,
  second: CategoryMenu,
) {
  const firstSortOrder =
    first.menuSortOrder ??
    inferMenuType(first.categorySlug, first.menuName);
  const secondSortOrder =
    second.menuSortOrder ??
    inferMenuType(second.categorySlug, second.menuName);
  const orderDiff = firstSortOrder - secondSortOrder;

  if (orderDiff !== 0) {
    return orderDiff;
  }

  const brandDiff = first.brandName.localeCompare(second.brandName, 'ko');

  if (brandDiff !== 0) {
    return brandDiff;
  }

  return first.menuName.localeCompare(second.menuName, 'ko');
}
