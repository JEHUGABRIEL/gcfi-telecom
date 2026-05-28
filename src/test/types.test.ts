import { describe, it, expect } from 'vitest';
import type { Product, Order, CartItem } from '@/shared/types';

describe('Product type', () => {
  it('accepte les champs discount et is_promo', () => {
    const product: Product = {
      id: '1', name: 'Routeur', price: 50000,
      category: 'Réseau', image: 'img.jpg', description: 'Test',
      discount: 10, is_promo: true,
    };
    expect(product.discount).toBe(10);
    expect(product.is_promo).toBe(true);
  });

  it('fonctionne sans champs optionnels', () => {
    const product: Product = {
      id: '2', name: 'Switch', price: 30000,
      category: 'Réseau', image: 'img.jpg', description: 'Test',
    };
    expect(product.discount).toBeUndefined();
    expect(product.is_promo).toBeUndefined();
  });

  it('CartItem étend Product avec quantity', () => {
    const item: CartItem = {
      id: '1', name: 'Routeur', price: 50000,
      category: 'Réseau', image: 'img.jpg', description: 'Test',
      quantity: 3,
    };
    expect(item.quantity).toBe(3);
  });
});

describe('Order type', () => {
  it('accepte les statuts valides', () => {
    const statuses: Order['status'][] = ['En préparation', 'Expédiée', 'Livrée', 'Annulée'];
    expect(statuses).toHaveLength(4);
  });
});
