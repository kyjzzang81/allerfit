import { useEffect, useState } from 'react';
import {
  allergenOptions as fallbackAllergenOptions,
  type AllergenOption,
} from '../../constants/allergens';
import { isSupabaseConfigured } from '../../lib/supabase';
import { fetchAllergens } from '../../lib/supabaseQueries';
import type { Database } from '../../types/database';

interface AllergenOptionsState {
  allergenOptions: AllergenOption[];
  isLoading: boolean;
  error: Error | null;
}

type SupabaseAllergen = Database['public']['Tables']['allergens']['Row'];

export function useAllergenOptions(): AllergenOptionsState {
  const hasSupabaseConfig = isSupabaseConfigured();
  const [state, setState] = useState<AllergenOptionsState>({
    allergenOptions: hasSupabaseConfig ? [] : fallbackAllergenOptions,
    isLoading: hasSupabaseConfig,
    error: null,
  });

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setState({
        allergenOptions: fallbackAllergenOptions,
        isLoading: false,
        error: null,
      });
      return;
    }

    let isMounted = true;

    async function loadAllergens() {
      try {
        const data = (await fetchAllergens()) as SupabaseAllergen[];
        const allergenOptions = data.map((allergen) => ({
          code: allergen.code,
          name: allergen.name,
          displayName: allergen.display_name,
        }));

        if (isMounted) {
          setState({
            allergenOptions,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            allergenOptions: [],
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    }

    void loadAllergens();

    return () => {
      isMounted = false;
    };
  }, [hasSupabaseConfig]);

  return state;
}
