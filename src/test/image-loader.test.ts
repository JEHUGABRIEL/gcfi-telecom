import { describe, it, expect } from 'vitest';
import imageLoader from '@/shared/lib/image-loader';

describe('imageLoader', () => {
  it('transforme une URL Cloudinary', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v123/test.jpg';
    const result = imageLoader({ src: url, width: 800, quality: 80 });
    expect(result).toContain('/upload/w_800,q_80,f_auto/');
    expect(result).toContain('v123/test.jpg');
  });

  it('utilise quality=75 par défaut pour Cloudinary', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/test.jpg';
    const result = imageLoader({ src: url, width: 400 });
    expect(result).toContain('w_400,q_75,f_auto');
  });

  it('transforme une URL Unsplash', () => {
    const url = 'https://images.unsplash.com/photo-123?auto=format&fit=crop';
    const result = imageLoader({ src: url, width: 600, quality: 90 });
    const parsed = new URL(result);
    expect(parsed.searchParams.get('w')).toBe('600');
    expect(parsed.searchParams.get('q')).toBe('90');
    expect(parsed.searchParams.get('auto')).toBe('format');
    expect(parsed.searchParams.get('fit')).toBe('crop');
  });

  it('conserve les paramètres existants Unsplash', () => {
    const url = 'https://images.unsplash.com/photo-456?auto=format';
    const result = imageLoader({ src: url, width: 300 });
    const parsed = new URL(result);
    expect(parsed.searchParams.get('auto')).toBe('format');
    expect(parsed.searchParams.get('w')).toBe('300');
  });

  it('ajoute _w aux autres URLs', () => {
    const url = 'https://upload.wikimedia.org/wikipedia/commons/foo.jpg';
    const result = imageLoader({ src: url, width: 200 });
    expect(result).toContain('?_w=200');
  });

  it('utilise &_w si l\'URL a déjà des query params', () => {
    const url = 'https://example.com/image.jpg?token=abc';
    const result = imageLoader({ src: url, width: 500 });
    expect(result).toContain('&_w=500');
  });

  it('gère les URLs avec quality par défaut', () => {
    const url = 'https://images.unsplash.com/photo-789';
    const result = imageLoader({ src: url, width: 800 });
    const parsed = new URL(result);
    expect(parsed.searchParams.get('q')).toBe('75');
  });
});
