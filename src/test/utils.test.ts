import { describe, it, expect } from 'vitest';
import { cn } from '@/shared/lib/utils';

describe('cn()', () => {
  it('fusionne les classes tailwind', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('gère les classes conditionnelles', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('résout les conflits tailwind (dernière gagne)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('gère undefined et null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });

  it('gère les entrées vides', () => {
    expect(cn()).toBe('');
  });

  it('gère les tableaux', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('gère les objets', () => {
    expect(cn({ a: true, b: false, c: true })).toBe('a c');
  });
});
