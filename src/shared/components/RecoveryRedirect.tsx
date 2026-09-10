'use client';

import { useEffect } from 'react';

/**
 * Rattrape les liens de réinitialisation qui n'atterrissent pas sur
 * `/reset-password`.
 *
 * Supabase place les jetons dans le fragment (`#access_token=…&type=recovery`)
 * et n'honore `redirectTo` que si l'URL figure dans la liste blanche du
 * dashboard. Sinon il retombe sur la Site URL — la home — où rien n'attend
 * l'utilisateur : ni formulaire, ni message. Ce composant détecte ce cas
 * partout dans l'app et renvoie vers la bonne page.
 *
 * Le drapeau `sessionStorage` couvre la course avec le client Supabase :
 * si celui-ci a déjà consommé le fragment et émis PASSWORD_RECOVERY avant la
 * navigation, `ResetPassword` ne verrait jamais l'événement et afficherait
 * « lien invalide » alors que la session de récupération est bien ouverte.
 */
export const RECOVERY_FLAG = 'gcfi-password-recovery';

export default function RecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('type=recovery')) return;
    if (window.location.pathname.startsWith('/reset-password')) return;

    try {
      sessionStorage.setItem(RECOVERY_FLAG, '1');
    } catch {
      // Navigation privée ou stockage bloqué — le fragment transmis suffit.
    }

    // `replace` plutôt que `push` : le fragment porte des jetons, autant ne
    // pas le laisser dans l'historique de navigation.
    window.location.replace(`/reset-password${hash}`);
  }, []);

  return null;
}
