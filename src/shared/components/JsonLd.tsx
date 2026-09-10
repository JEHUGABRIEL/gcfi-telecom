import React from 'react';

/**
 * Injecte un bloc JSON-LD dans le HTML rendu côté serveur.
 *
 * Les schémas doivent être présents dans la réponse initiale : un script
 * ajouté au DOM après coup n'est pas garanti d'être lu par les crawlers.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
