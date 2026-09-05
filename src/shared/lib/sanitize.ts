import DOMPurify from 'dompurify';

/**
 * Nettoie du HTML saisi via l'éditeur (anti-XSS) :
 * supprime scripts, gestionnaires d'événements (on*), javascript: URLs,
 * iframes, etc., tout en conservant la mise en forme (titres, listes,
 * citations, images, liens, gras/italique…).
 *
 * Côté serveur (rendu SSR), on ne re-sanitise pas : le contenu a déjà été
 * assaini à l'enregistrement. Les anciens contenus non assainis sont
 * nettoyés côté client à la lecture.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['iframe', 'object', 'embed', 'form', 'input', 'button', 'script', 'style'],
    FORBID_ATTR: ['style', 'srcdoc'],
  });
}