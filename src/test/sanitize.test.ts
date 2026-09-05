import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/shared/lib/sanitize';

describe('sanitizeHtml', () => {
  it('supprime les balises <script>', () => {
    const out = sanitizeHtml('<p>Bonjour</p><script>alert(1)</script>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('Bonjour');
  });

  it('supprime les gestionnaires d\'événements (onerror, onclick…)', () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)"><button onclick="hack()">clique</button>');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('onclick');
  });

  it('bloque les liens javascript:', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">malveillant</a><a href="https://example.com">ok</a>');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('https://example.com');
  });

  it('bloque iframes, objets et scripts imbriqués', () => {
    const out = sanitizeHtml('<iframe src="https://evil.example"></iframe><svg onload="alert(1)"><object data="x"></object>');
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('<object');
    expect(out).not.toContain('<svg');
    expect(out).not.toContain('onload');
  });

  it('conserve la mise en forme légitime (titres, listes, gras, liens, images)', () => {
    const out = sanitizeHtml(
      '<h2>Titre</h2><p><strong>gras</strong> et <em>italique</em></p><ul><li>un</li></ul><blockquote>citation</blockquote><img src="https://cdn.example.com/a.jpg" alt=""><a href="https://gcfi-rca.com">lien</a>'
    );
    expect(out).toContain('<h2');
    expect(out).toContain('<strong>');
    expect(out).toContain('<ul>');
    expect(out).toContain('<blockquote>');
    expect(out).toContain('<img');
    expect(out).toContain('href="https://gcfi-rca.com"');
  });
});