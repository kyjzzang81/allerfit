export interface AllergenOption {
  code: string;
  name: string;
  displayName: string;
}

export const allergenOptions: AllergenOption[] = [
  { code: 'egg', name: '난류', displayName: '계란' },
  { code: 'milk', name: '우유', displayName: '우유·유제품' },
  { code: 'buckwheat', name: '메밀', displayName: '메밀' },
  { code: 'peanut', name: '땅콩', displayName: '땅콩' },
  { code: 'soybean', name: '대두', displayName: '대두·콩' },
  { code: 'wheat', name: '밀', displayName: '밀·글루텐' },
  { code: 'mackerel', name: '고등어', displayName: '고등어' },
  { code: 'crab', name: '게', displayName: '게' },
  { code: 'shrimp', name: '새우', displayName: '새우' },
  { code: 'pork', name: '돼지고기', displayName: '돼지고기' },
  { code: 'peach', name: '복숭아', displayName: '복숭아' },
  { code: 'tomato', name: '토마토', displayName: '토마토' },
  { code: 'sulfite', name: '아황산류', displayName: '아황산류' },
  { code: 'walnut', name: '호두', displayName: '호두·견과류' },
  { code: 'chicken', name: '닭고기', displayName: '닭고기' },
  { code: 'beef', name: '쇠고기', displayName: '소고기' },
  { code: 'squid', name: '오징어', displayName: '오징어' },
  { code: 'shellfish', name: '조개류', displayName: '조개류' },
];
