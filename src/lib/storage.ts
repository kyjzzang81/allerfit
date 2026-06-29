const SELECTED_ALLERGEN_CODES_KEY = 'allerfit_selected_allergen_codes';
const ONBOARDING_COMPLETED_KEY = 'allerfit_onboarding_completed';

export function getSelectedAllergenCodes(): string[] {
  const storedValue = window.localStorage.getItem(SELECTED_ALLERGEN_CODES_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function setSelectedAllergenCodes(codes: string[]) {
  window.localStorage.setItem(
    SELECTED_ALLERGEN_CODES_KEY,
    JSON.stringify(codes),
  );
}

export function completeOnboarding() {
  window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}
