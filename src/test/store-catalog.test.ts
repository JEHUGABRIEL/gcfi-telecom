import { describe, it, expect } from 'vitest';
import {
  computeCatalogMaxPrice,
  computePriceStep,
  isPriceInRange,
} from '@/modules/store/lib/catalog';

describe('catalogue boutique — filtre prix', () => {
  it('ne plafonne pas le catalogue à 500 000 FCFA', () => {
    const catalogMax = computeCatalogMaxPrice([350_000, 700_000_000]);

    expect(catalogMax).toBeGreaterThanOrEqual(700_000_000);
    expect(computePriceStep(catalogMax)).toBeGreaterThan(5_000);
  });

  it('laisse passer tous les prix quand aucune borne n’est choisie', () => {
    expect(isPriceInRange(700_000_000, null)).toBe(true);
    expect(isPriceInRange(0, null)).toBe(true);
  });

  it('applique la borne seulement quand l’utilisateur en choisit une', () => {
    expect(isPriceInRange(500_000, 500_000)).toBe(true);
    expect(isPriceInRange(500_001, 500_000)).toBe(false);
    expect(isPriceInRange(700_000_000, 500_000)).toBe(false);
  });

  it('garde un curseur utilisable même avec un catalogue vide', () => {
    expect(computeCatalogMaxPrice([])).toBe(50_000);
    expect(computePriceStep(50_000)).toBe(5_000);
  });
});
