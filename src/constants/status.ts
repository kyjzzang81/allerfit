export type SafetyStatus =
  | 'safe_by_public_info'
  | 'caution'
  | 'avoid'
  | 'unknown';

export const safetyLabels: Record<SafetyStatus, string> = {
  safe_by_public_info: '공시 기준 선택 성분 없음',
  caution: '주의 필요',
  avoid: '피해야 함',
  unknown: '정보 없음',
};
