const SELECTED_ALLERGEN_CODES_KEY = 'allerfit_selected_allergen_codes';
const ONBOARDING_COMPLETED_KEY = 'allerfit_onboarding_completed';
const SELECTED_ALLERGEN_CODES_CHANGED_EVENT =
  'allerfit_selected_allergen_codes_changed';

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
  window.dispatchEvent(new Event(SELECTED_ALLERGEN_CODES_CHANGED_EVENT));
}

export async function saveSelectedAllergenCodes(codes: string[]) {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
  setSelectedAllergenCodes(codes);
}

export function subscribeSelectedAllergenCodes(listener: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === SELECTED_ALLERGEN_CODES_KEY) {
      listener();
    }
  }

  window.addEventListener(SELECTED_ALLERGEN_CODES_CHANGED_EVENT, listener);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(SELECTED_ALLERGEN_CODES_CHANGED_EVENT, listener);
    window.removeEventListener('storage', handleStorage);
  };
}

export function completeOnboarding() {
  window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}
