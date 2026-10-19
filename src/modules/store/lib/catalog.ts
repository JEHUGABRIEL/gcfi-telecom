/**
 * Bornes du filtre prix de la boutique.
 *
 * Le catalogue ne doit jamais être plafonné par une constante : un produit
 * peut légitimement dépasser 500 000 FCFA. `maxPrice === null` signifie
 * « aucun plafond » et doit laisser passer tous les prix.
 */

const MIN_CATALOG_MAX = 50_000;
const PRICE_STEP = 5_000;
const SLIDER_STEPS = 200;

export function computeCatalogMaxPrice(prices: number[]): number {
  const highest = prices.reduce(
    (max, price) => (Number.isFinite(price) ? Math.max(max, price) : max),
    0,
  );
  return Math.max(MIN_CATALOG_MAX, Math.ceil(highest / PRICE_STEP) * PRICE_STEP);
}

export function computePriceStep(catalogMaxPrice: number): number {
  return Math.max(
    PRICE_STEP,
    Math.ceil(catalogMaxPrice / SLIDER_STEPS / PRICE_STEP) * PRICE_STEP,
  );
}

export function isPriceInRange(price: number, maxPrice: number | null): boolean {
  return maxPrice === null || price <= maxPrice;
}
