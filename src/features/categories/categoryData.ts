export interface CategoryInfo {
  slug: string;
  name: string;
  description: string;
}

export interface CategoryMenu {
  id: string;
  dbId?: string;
  categorySlug: string;
  brandSlug: string;
  brandName: string;
  brandLogoText: string;
  menuName: string;
  menuGraphicText: string;
  menuSortOrder?: number;
  imageUrl?: string | null;
  contains: string[];
  mayContain: string[];
  lastCheckedAt: string;
}

export interface BrandInfo {
  slug: string;
  name: string;
  logoText: string;
  categorySlug: string;
  officialUrl: string;
  allergenSourceUrl: string;
  logoUrl?: string | null;
}

export const categories: CategoryInfo[] = [
  {
    slug: 'chicken',
    name: '치킨',
    description: '선택한 알레르기를 제외하고 먹을 수 있는 치킨 메뉴를 모았어요.',
  },
  {
    slug: 'pizza',
    name: '피자',
    description: '선택한 알레르기를 제외하고 먹을 수 있는 피자 메뉴를 모았어요.',
  },
];

export const brands: BrandInfo[] = [
  {
    slug: 'goobne',
    name: '굽네치킨',
    logoText: '굽',
    categorySlug: 'chicken',
    officialUrl: 'https://www.goobne.co.kr',
    allergenSourceUrl: 'https://www.goobne.co.kr',
  },
  {
    slug: 'nene',
    name: '네네치킨',
    logoText: '네',
    categorySlug: 'chicken',
    officialUrl: 'https://nenechicken.com',
    allergenSourceUrl: 'https://nenechicken.com',
  },
  {
    slug: 'bbq',
    name: 'BBQ',
    logoText: 'B',
    categorySlug: 'chicken',
    officialUrl: 'https://www.bbq.co.kr',
    allergenSourceUrl: 'https://www.bbq.co.kr',
  },
  {
    slug: 'kyochon',
    name: '교촌치킨',
    logoText: '교',
    categorySlug: 'chicken',
    officialUrl: 'https://www.kyochon.com',
    allergenSourceUrl: 'https://www.kyochon.com',
  },
  {
    slug: 'domino',
    name: '도미노피자',
    logoText: 'D',
    categorySlug: 'pizza',
    officialUrl: 'https://web.dominos.co.kr',
    allergenSourceUrl: 'https://web.dominos.co.kr',
  },
  {
    slug: 'pizzahut',
    name: '피자헛',
    logoText: 'P',
    categorySlug: 'pizza',
    officialUrl: 'https://www.pizzahut.co.kr',
    allergenSourceUrl: 'https://www.pizzahut.co.kr',
  },
  {
    slug: 'mrpizza',
    name: '미스터피자',
    logoText: 'M',
    categorySlug: 'pizza',
    officialUrl: 'https://www.mrpizza.co.kr',
    allergenSourceUrl: 'https://www.mrpizza.co.kr',
  },
  {
    slug: 'pizza-school',
    name: '피자스쿨',
    logoText: '스',
    categorySlug: 'pizza',
    officialUrl: 'https://pizzaschool.net',
    allergenSourceUrl: 'https://pizzaschool.net',
  },
];

export const categoryMenus: CategoryMenu[] = [
  {
    id: 'goobne-original',
    categorySlug: 'chicken',
    brandSlug: 'goobne',
    brandName: '굽네치킨',
    brandLogoText: '굽',
    menuName: '오리지널',
    menuGraphicText: '🍗',
    contains: ['chicken'],
    mayContain: [],
    lastCheckedAt: '2026-06-28',
  },
  {
    id: 'goobne-galbi',
    categorySlug: 'chicken',
    brandSlug: 'goobne',
    brandName: '굽네치킨',
    brandLogoText: '굽',
    menuName: '갈비천왕',
    menuGraphicText: '🍗',
    contains: ['chicken', 'soybean'],
    mayContain: ['wheat'],
    lastCheckedAt: '2026-06-28',
  },
  {
    id: 'nene-fried',
    categorySlug: 'chicken',
    brandSlug: 'nene',
    brandName: '네네치킨',
    brandLogoText: '네',
    menuName: '후라이드',
    menuGraphicText: '🍗',
    contains: ['chicken', 'wheat'],
    mayContain: [],
    lastCheckedAt: '2026-06-26',
  },
  {
    id: 'nene-snow',
    categorySlug: 'chicken',
    brandSlug: 'nene',
    brandName: '네네치킨',
    brandLogoText: '네',
    menuName: '스노윙치즈',
    menuGraphicText: '🧀',
    contains: ['chicken', 'milk', 'soybean'],
    mayContain: ['wheat'],
    lastCheckedAt: '2026-06-26',
  },
  {
    id: 'bbq-golden',
    categorySlug: 'chicken',
    brandSlug: 'bbq',
    brandName: 'BBQ',
    brandLogoText: 'B',
    menuName: '황금올리브',
    menuGraphicText: '🍗',
    contains: ['chicken', 'wheat'],
    mayContain: ['soybean'],
    lastCheckedAt: '2026-06-27',
  },
  {
    id: 'kyochon-original',
    categorySlug: 'chicken',
    brandSlug: 'kyochon',
    brandName: '교촌치킨',
    brandLogoText: '교',
    menuName: '교촌 오리지날',
    menuGraphicText: '🍗',
    contains: ['chicken', 'soybean'],
    mayContain: [],
    lastCheckedAt: '2026-06-25',
  },
  {
    id: 'domino-cheese',
    categorySlug: 'pizza',
    brandSlug: 'domino',
    brandName: '도미노피자',
    brandLogoText: 'D',
    menuName: '치즈 피자',
    menuGraphicText: '🍕',
    contains: ['milk', 'wheat'],
    mayContain: ['soybean'],
    lastCheckedAt: '2026-06-28',
  },
  {
    id: 'domino-potato',
    categorySlug: 'pizza',
    brandSlug: 'domino',
    brandName: '도미노피자',
    brandLogoText: 'D',
    menuName: '포테이토',
    menuGraphicText: '🥔',
    contains: ['milk', 'wheat', 'pork'],
    mayContain: ['soybean'],
    lastCheckedAt: '2026-06-28',
  },
  {
    id: 'pizzahut-pepperoni',
    categorySlug: 'pizza',
    brandSlug: 'pizzahut',
    brandName: '피자헛',
    brandLogoText: 'P',
    menuName: '페퍼로니',
    menuGraphicText: '🍕',
    contains: ['milk', 'wheat', 'pork'],
    mayContain: [],
    lastCheckedAt: '2026-06-27',
  },
  {
    id: 'mrpizza-bulgogi',
    categorySlug: 'pizza',
    brandSlug: 'mrpizza',
    brandName: '미스터피자',
    brandLogoText: 'M',
    menuName: '불고기 피자',
    menuGraphicText: '🍕',
    contains: ['milk', 'wheat', 'beef', 'soybean'],
    mayContain: [],
    lastCheckedAt: '2026-06-26',
  },
  {
    id: 'pizza-school-gorgonzola',
    categorySlug: 'pizza',
    brandSlug: 'pizza-school',
    brandName: '피자스쿨',
    brandLogoText: '스',
    menuName: '고르곤졸라',
    menuGraphicText: '🧀',
    contains: ['milk', 'wheat'],
    mayContain: [],
    lastCheckedAt: '2026-06-24',
  },
  {
    id: 'pizza-school-sweetpotato',
    categorySlug: 'pizza',
    brandSlug: 'pizza-school',
    brandName: '피자스쿨',
    brandLogoText: '스',
    menuName: '고구마 피자',
    menuGraphicText: '🍠',
    contains: ['milk', 'wheat', 'egg'],
    mayContain: ['soybean'],
    lastCheckedAt: '2026-06-24',
  },
];
