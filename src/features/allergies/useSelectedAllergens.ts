import { useEffect, useMemo, useState } from 'react';
import {
  getSelectedAllergenCodes,
  saveSelectedAllergenCodes,
  setSelectedAllergenCodes,
  subscribeSelectedAllergenCodes,
} from '../../lib/storage';

function areCodeListsEqual(first: string[], second: string[]) {
  return (
    first.length === second.length &&
    first.every((code) => second.includes(code))
  );
}

export function useSelectedAllergens() {
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    getSelectedAllergenCodes,
  );

  useEffect(() => {
    return subscribeSelectedAllergenCodes(() => {
      const storedCodes = getSelectedAllergenCodes();

      setSelectedCodes((current) =>
        areCodeListsEqual(current, storedCodes) ? current : storedCodes,
      );
    });
  }, []);

  const selectedCodeSet = useMemo(
    () => new Set(selectedCodes),
    [selectedCodes],
  );

  function toggleAllergen(code: string) {
    const nextCodes = selectedCodes.includes(code)
      ? selectedCodes.filter((item) => item !== code)
      : [...selectedCodes, code];

    setSelectedCodes(nextCodes);
    setSelectedAllergenCodes(nextCodes);
  }

  async function saveAllergens(codes: string[]) {
    await saveSelectedAllergenCodes(codes);
    setSelectedCodes(getSelectedAllergenCodes());
  }

  return { selectedCodes, selectedCodeSet, toggleAllergen, saveAllergens };
}
