-- ============================================================
-- Limitation de débit des routes d'authentification publiques
--
-- `/api/auth/forgot-password` est ouverte et non authentifiée : n'importe
-- qui pouvait l'appeler en boucle. Le seul frein était le quota d'emails de
-- Supabase — épuisable en quelques minutes, ce qui prive au passage les
-- utilisateurs légitimes de tout email.
--
-- Le compteur vit en base et non en mémoire : sur Vercel chaque requête peut
-- atterrir sur une instance différente, un état local ne compterait rien.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  key          text PRIMARY KEY,
  hits         int NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- Aucune policy : RLS actif sans policy bloque anon et authenticated.
-- Seule la clé service, qui contourne RLS, accède à cette table.
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Pour purger les fenêtres expirées.
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window
  ON public.auth_rate_limits (window_start);

-- ------------------------------------------------------------
-- Incrémente et arbitre en une seule instruction.
--
-- Un lire-puis-écrire depuis l'application laisserait passer des requêtes
-- concurrentes entre les deux étapes. L'upsert atomique ferme cette fenêtre.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key            text,
  p_limit          int,
  p_window_seconds int
)
RETURNS TABLE (allowed boolean, retry_after_seconds int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now          timestamptz := now();
  v_expired_before timestamptz;
  v_hits         int;
  v_window_start timestamptz;
BEGIN
  v_expired_before := v_now - make_interval(secs => p_window_seconds);

  INSERT INTO public.auth_rate_limits AS t (key, hits, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO UPDATE
    -- Fenêtre expirée : on repart de 1. Sinon on incrémente.
    SET hits = CASE WHEN t.window_start < v_expired_before THEN 1 ELSE t.hits + 1 END,
        window_start = CASE WHEN t.window_start < v_expired_before THEN v_now ELSE t.window_start END
  RETURNING t.hits, t.window_start INTO v_hits, v_window_start;

  IF v_hits <= p_limit THEN
    RETURN QUERY SELECT true, 0;
  ELSE
    RETURN QUERY SELECT
      false,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (
        v_window_start + make_interval(secs => p_window_seconds) - v_now
      )))::int);
  END IF;
END;
$$;

-- La fonction est SECURITY DEFINER : elle ne doit être appelable que par la
-- clé service, sans quoi n'importe qui pourrait gonfler les compteurs d'un
-- tiers et le verrouiller.
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, int, int) FROM anon, authenticated;

-- ------------------------------------------------------------
-- Purge des fenêtres closes depuis plus d'un jour, pour que la table ne
-- grossisse pas indéfiniment. À appeler périodiquement, ou à la main.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_auth_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM public.auth_rate_limits WHERE window_start < now() - interval '1 day';
$$;

REVOKE ALL ON FUNCTION public.purge_auth_rate_limits() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_auth_rate_limits() FROM anon, authenticated;
