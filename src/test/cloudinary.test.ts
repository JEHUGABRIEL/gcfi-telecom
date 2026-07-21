import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadToCloudinary, getOptimizedUrl } from '@/shared/lib/cloudinary';

// On définit les vars d'env avant tout import
vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'demo');
vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'test_preset');

describe('getOptimizedUrl', () => {
  it('génère une URL Cloudinary optimisée', () => {
    const url = getOptimizedUrl('gcfi/test.jpg');
    expect(url).toMatch(/res\.cloudinary\.com\/[^/]+\/image\/upload/);
    expect(url).toContain('q_auto');
    expect(url).toContain('f_auto');
    expect(url).toContain('w_800');
    expect(url).toContain('c_fill');
    expect(url).toContain('gcfi/test.jpg');
  });

  it('accepte les options personnalisées', () => {
    const url = getOptimizedUrl('test.png', {
      width: 400,
      height: 300,
      quality: 90,
      format: 'webp',
    });
    expect(url).toContain('q_90');
    expect(url).toContain('f_webp');
    expect(url).toContain('w_400');
    expect(url).toContain('h_300');
  });
});

describe('uploadToCloudinary', () => {
  let capturedOnload: (() => void) | null;
  let capturedOnerror: (() => void) | null;
  const mockOpen = vi.fn();
  const mockSend = vi.fn();
  const mockSetRequestHeader = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    capturedOnload = null;
    capturedOnerror = null;

    class MockXHR {
      open = mockOpen;
      send = mockSend;
      setRequestHeader = mockSetRequestHeader;
      upload = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      status = 200;
      responseText = '';
      get onload() { return capturedOnload; }
      set onload(fn: (() => void) | null) { capturedOnload = fn; }
      get onerror() { return capturedOnerror; }
      set onerror(fn: (() => void) | null) { capturedOnerror = fn; }
    }

    vi.stubGlobal('XMLHttpRequest', MockXHR);
  });

  it('rejette les types MIME non autorisés', async () => {
    const file = new File(['fake'], 'test.txt', { type: 'text/plain' });
    await expect(uploadToCloudinary(file)).rejects.toThrow('Type de fichier non autorisé');
  });

  it('rejette les fichiers trop volumineux', async () => {
    const large = new ArrayBuffer(6 * 1024 * 1024);
    const file = new File([large], 'large.jpg', { type: 'image/jpeg' });
    await expect(uploadToCloudinary(file)).rejects.toThrow('Fichier trop volumineux');
  });

  it('upload avec succès via XHR', async () => {
    const file = new File(['fake'], 'test.jpg', { type: 'image/jpeg' });

    // Remplace la classe MockXHR pour ce test spécifique avec la réponse appropriée
    class MockXHRSuccess {
      open = mockOpen;
      send = mockSend;
      setRequestHeader = mockSetRequestHeader;
      upload = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      status = 200;
      responseText = JSON.stringify({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/gcfi/test',
        public_id: 'gcfi/test',
        width: 800,
        height: 600,
        format: 'jpg',
      });
      get onload() { return capturedOnload; }
      set onload(fn: (() => void) | null) { capturedOnload = fn; }
      get onerror() { return capturedOnerror; }
      set onerror(fn: (() => void) | null) { capturedOnerror = fn; }
    }

    vi.stubGlobal('XMLHttpRequest', MockXHRSuccess);

    const uploadPromise = uploadToCloudinary(file);
    // Attendre que le microtask du XHR s'exécute
    await new Promise(r => setTimeout(r, 5));
    // Déclencher onload
    if (capturedOnload) capturedOnload();
    // Attendre que la promesse se résolve
    await vi.waitFor(async () => {
      const result = await uploadPromise;
      expect(mockOpen).toHaveBeenCalledWith('POST', expect.stringContaining('api.cloudinary.com'));
      expect(mockSend).toHaveBeenCalled();
      expect(result.secure_url).toBe('https://res.cloudinary.com/demo/image/upload/v1/gcfi/test');
      expect(result.public_id).toBe('gcfi/test');
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });
  });

  it('gère les erreurs réseau XHR', async () => {
    const file = new File(['fake'], 'test.jpg', { type: 'image/jpeg' });

    class MockXHRError {
      open = mockOpen;
      send = mockSend;
      setRequestHeader = mockSetRequestHeader;
      upload = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      get onerror() { return capturedOnerror; }
      set onerror(fn: (() => void) | null) { capturedOnerror = fn; }
    }

    vi.stubGlobal('XMLHttpRequest', MockXHRError);

    const uploadPromise = uploadToCloudinary(file);
    await new Promise(r => setTimeout(r, 5));
    if (capturedOnerror) capturedOnerror();
    await expect(uploadPromise).rejects.toThrow('Erreur réseau Cloudinary');
  });

  it('gère les erreurs HTTP XHR', async () => {
    const file = new File(['fake'], 'test.jpg', { type: 'image/jpeg' });

    class MockXHRHTTPError {
      open = mockOpen;
      send = mockSend;
      setRequestHeader = mockSetRequestHeader;
      upload = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      status = 401;
      responseText = 'Unauthorized';
      get onload() { return capturedOnload; }
      set onload(fn: (() => void) | null) { capturedOnload = fn; }
      get onerror() { return capturedOnerror; }
      set onerror(fn: (() => void) | null) { capturedOnerror = fn; }
    }

    vi.stubGlobal('XMLHttpRequest', MockXHRHTTPError);

    const uploadPromise = uploadToCloudinary(file);
    await new Promise(r => setTimeout(r, 5));
    if (capturedOnload) capturedOnload();
    await expect(uploadPromise).rejects.toThrow('Cloudinary error 401');
  });
});
