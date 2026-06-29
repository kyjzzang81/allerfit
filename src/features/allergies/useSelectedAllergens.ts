import { useEffect, useMemo, useState } from 'react';
import {
  getSelectedAllergenCodes,
  setSelectedAllergenCodes,
} from '../../lib/storage';

export function useSelectedAllergens() {
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    getSelectedAllergenCodes,
  );

  useEffect(() => {
    setSelectedAllergenCodes(selectedCodes);
  }, [selectedCodes]);

  const selectedCodeSet = useMemo(
    () => new Set(selectedCodes),
    [selectedCodes],
  );

  function toggleAllergen(code: string) {
    setSelectedCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    );
  }

  return { selectedCodes, selectedCodeSet, toggleAllergen };
}
