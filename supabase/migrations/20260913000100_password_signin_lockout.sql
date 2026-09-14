-- ============================================================
-- Verrouillage par compte des connexions par mot de passe
--
-- Les formulaires de connexion appellent `supabase.auth.signInWithPassword`
-- directement depuis le navigateur : aucun code de l'application ne voit la
-- tentative, il est donc impossible d'y compter les échecs. Le seul point
-- d'accroche est le hook « Password Verification Attempt », appelé après
-- chaque vérification de mot de passe avec `{ user_id, valid }`.
--
-- ⚠️ Ce hook n'est proposé que sur les offres **Teams et Enterprise**
-- (table « Auth Hooks » de la documentation Supabase). Sur Free/Pro cette
-- migration est inerte : elle ne crée qu'une table et une fonction que
-- personne n'appelle, tant que le hook n'est pas enregistré.
--
-- Mise en service :
--   1. appliquer cette migration ;
--   2. Dashboard → Authentication → Hooks → « Password verification »,
--      type « Postgres function » → public.hook_password_verification_attempt ;
--   3. en local, l'équivalent dans supabase/config.toml :
--        [auth.hook.password_verification_attempt]
--        enabled = true
--        uri = "pg-functions://postgres/public/hook_password_verification_attempt"
-- ============================================================

CREATE TABLE IF NOT EXISTS public.password_signin_attempts (
  user_id         uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  failed_attempts int NOT NULL DEFAULT 0,
  window_start    timestamptz NOT NULL DEFAULT now(),
  locked_until    timestamptz
);

-- Une ligne par utilisateur : la table ne grandit pas avec le trafic, aucune
-- purge périodique n'est nécessaire.
--
-- RLS actif sans policy : anon et authenticated ne peuvent ni lire ni écrire.
-- Le hook y accède en SECURITY DEFINER (voir plus bas).
ALTER TABLE public.password_signin_attempts ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Hook appelé par Supabase Auth à chaque connexion par mot de passe.
--
-- Règle : au-delà de 5 échecs dans une fenêtre de 15 minutes, le compte est
-- verrouillé 15 minutes. Pendant le verrouillage on refuse *même un mot de
-- passe correct* — sinon un attaquant continuerait à tester des mots de passe
-- et le verrou ne servirait à rien.
--
-- Contrepartie assumée : un attaquant peut verrouiller un compte connu (déni
-- de service). D'où une fenêtre courte ; on peut notifier l'utilisateur par
-- email depuis un autre point du système si besoin.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hook_password_verification_attempt(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_max_attempts int := 5;
  v_window       interval := interval '15 minutes';
  v_lock         interval := interval '15 minutes';
  v_user_id      uuid;
  v_valid        boolean;
  v_failed       int;
  v_locked_until timestamptz;
  v_minutes      int;
BEGIN
  v_user_id := nullif(event->>'user_id', '')::uuid;
  v_valid   := coalesce((event->>'valid')::boolean, false);

  -- Email inconnu : aucune tentative à rattacher. On laisse Supabase Auth
  -- répondre normalement (« Invalid login credentials »).
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('decision', 'continue');
  END IF;

  SELECT failed_attempts, locked_until
    INTO v_failed, v_locked_until
    FROM public.password_signin_attempts
   WHERE user_id = v_user_id;

  -- Compte verrouillé : on refuse sans toucher au compteur, pour qu'un
  -- martèlement pendant le verrouillage ne repousse pas la fin du délai.
  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    v_minutes := greatest(1, ceil(extract(epoch FROM v_locked_until - now()) / 60)::int);
    RETURN jsonb_build_object(
      'decision', 'reject',
      'message', format('Trop de tentatives de connexion. Réessayez dans %s minute(s).', v_minutes),
      'should_logout_user', false
    );
  END IF;

  -- Mot de passe correct : compteur remis à zéro et verrou levé.
  IF v_valid THEN
    UPDATE public.password_signin_attempts
       SET failed_attempts = 0,
           window_start    = now(),
           locked_until    = NULL
     WHERE user_id = v_user_id;
    RETURN jsonb_build_object('decision', 'continue');
  END IF;

  -- Mot de passe incorrect : on incrémente, en repartant de 1 si la fenêtre
  -- est expirée. Insertion et mise à jour en une seule instruction pour que
  -- deux tentatives simultanées ne s'écrasent pas.
  INSERT INTO public.password_signin_attempts AS t (user_id, failed_attempts, window_start)
  VALUES (v_user_id, 1, now())
  ON CONFLICT (user_id) DO UPDATE
    SET failed_attempts = CASE WHEN t.window_start < now() - v_window THEN 1 ELSE t.failed_attempts + 1 END,
        window_start    = CASE WHEN t.window_start < now() - v_window THEN now() ELSE t.window_start END,
        locked_until    = CASE WHEN t.window_start < now() - v_window THEN NULL ELSE t.locked_until END
  RETURNING failed_attempts INTO v_failed;

  IF v_failed >= v_max_attempts THEN
    UPDATE public.password_signin_attempts
       SET locked_until = now() + v_lock
     WHERE user_id = v_user_id;

    v_minutes := (extract(epoch FROM v_lock) / 60)::int;
    RETURN jsonb_build_object(
      'decision', 'reject',
      'message', format('Trop de tentatives de connexion. Réessayez dans %s minute(s).', v_minutes),
      'should_logout_user', false
    );
  END IF;

  RETURN jsonb_build_object('decision', 'continue');
END;
$$;

-- Le hook tourne en SECURITY DEFINER : il ne doit être exécutable que par
-- Supabase Auth (supabase_auth_admin), jamais par anon/authenticated — sans
-- quoi n'importe qui pourrait verrouiller le compte d'un tiers à volonté.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.hook_password_verification_attempt(jsonb) TO supabase_auth_admin;
REVOKE ALL ON FUNCTION public.hook_password_verification_attempt(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hook_password_verification_attempt(jsonb) FROM anon, authenticated;
REVOKE ALL ON TABLE public.password_signin_attempts FROM anon, authenticated;
