-- ============================================================
-- Réinitialisation du mot de passe admin depuis le profil
--
-- `/api/auth/forgot-password` refuse les comptes admin, pour qu'un tiers ne
-- puisse pas déclencher d'envoi vers une boîte d'administration. Les admins
-- n'avaient donc aucun moyen de réinitialiser leur mot de passe.
-- `/api/auth/admin-password-reset` le permet depuis une session authentifiée
-- et s'appuie sur cette colonne pour espacer les envois.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_reset_requested_at timestamptz;

COMMENT ON COLUMN public.profiles.password_reset_requested_at IS
  'Dernière demande de réinitialisation envoyée depuis le profil admin. Sert au délai anti-répétition ; écrit uniquement par la clé service.';
