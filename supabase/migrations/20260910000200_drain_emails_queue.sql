-- ============================================================
-- Vidange automatique de emails_queue
--
-- L'edge function `send-emails` existe, est déployée et fonctionne — mais
-- rien ne l'appelait. Les emails applicatifs (bienvenue, confirmation de
-- commande) s'accumulaient donc en `pending` sans jamais partir.
--
-- Le déclencheur vit dans la base plutôt que chez l'hébergeur : le plan
-- Vercel Hobby limite les crons à une exécution par jour, très en deçà de ce
-- qu'exige de l'email transactionnel. pg_cron descend à la minute.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- La fonction interroge `where status = 'pending'` à chaque passage.
CREATE INDEX IF NOT EXISTS idx_emails_queue_pending
  ON public.emails_queue (created_at)
  WHERE status = 'pending';

-- ------------------------------------------------------------
-- Cette migration n'ordonnance AUCUN job. Elle installe seulement de quoi le
-- faire en une commande.
--
-- Deux raisons :
--
-- 1. La file contient un arriéré accumulé depuis des mois. Ordonnancer sans
--    précaution expédierait d'un seul jet des emails de bienvenue et des
--    confirmations de commande périmés à de vrais clients — un dégât bien
--    pire que le silence actuel, et irréversible une fois les emails partis.
--
-- 2. Sur Supabase, le rôle `postgres` peut appeler les fonctions de pg_cron
--    mais n'a aucun droit sur la table `cron.job`. Créer un job puis le
--    désactiver par `update cron.job set active = false` échoue en
--    « permission denied for table job ». On s'en tient donc à
--    cron.schedule / cron.unschedule, qui suffisent : un job absent équivaut
--    à un job inactif, sans dépendre d'un accès à la table.
--
-- Marche à suivre :
--
--   1. Inspecter l'arriéré
--        select status, count(*), min(created_at), max(created_at)
--        from public.emails_queue group by status;
--
--   2. Neutraliser ce qui est périmé — 'failed' est déjà écrit par l'edge
--      function, donc compatible avec la colonne quel que soit son type :
--        update public.emails_queue
--        set status = 'failed'
--        where status = 'pending' and created_at < now() - interval '24 hours';
--
--   3. Démarrer la vidange
--        select public.enable_email_drain();
--
--   Pour l'arrêter :
--        select public.disable_email_drain();
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enable_email_drain()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_url        text := 'https://tivlllahuykbfnawwhba.supabase.co/functions/v1/send-emails';
  v_net_schema text;
BEGIN
  -- Selon les projets, Supabase installe pg_net dans le schéma `net` ou dans
  -- `extensions`. Le search_path d'un job cron ne couvre pas forcément le bon,
  -- et l'appel échouerait silencieusement à chaque exécution : on résout donc
  -- le schéma réel plutôt que de le supposer.
  SELECT n.nspname INTO v_net_schema
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = 'http_post'
  LIMIT 1;

  IF v_net_schema IS NULL THEN
    RAISE EXCEPTION 'pg_net introuvable : http_post absent de tout schéma.';
  END IF;

  -- cron.schedule remplace le job de même nom s'il existe : rejouable sans
  -- effet de bord.
  --
  -- L'edge function est déployée avec verify_jwt = false : elle n'attend aucun
  -- jeton et n'accepte aucune donnée d'entrée — elle ne fait que vider la
  -- file. Rien de sensible ne transite ici.
  RETURN cron.schedule(
    'drain-emails-queue',
    '*/5 * * * *',
    format(
      $job$select %I.http_post(
        url := %L,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb,
        timeout_milliseconds := 20000
      );$job$,
      v_net_schema,
      v_url
    )
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.disable_email_drain()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  PERFORM cron.unschedule('drain-emails-queue');
EXCEPTION
  -- cron.unschedule lève si le job n'existe pas. Arrêter ce qui est déjà
  -- arrêté n'est pas une erreur.
  WHEN OTHERS THEN NULL;
END;
$fn$;

-- Piloter la vidange d'emails n'a rien à faire entre les mains d'un visiteur.
REVOKE ALL ON FUNCTION public.enable_email_drain()  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.disable_email_drain() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enable_email_drain()  FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.disable_email_drain() FROM anon, authenticated;
