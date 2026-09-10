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
-- Le job est créé INACTIF, volontairement.
--
-- La file contient un arriéré accumulé depuis des mois. L'activer sans
-- précaution expédierait d'un seul jet des emails de bienvenue et des
-- confirmations de commande périmés à de vrais clients — un dégât bien pire
-- que le silence actuel, et irréversible une fois les emails partis.
--
-- Marche à suivre, dans cet ordre :
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
--   3. Activer le job
--        update cron.job set active = true where jobname = 'drain-emails-queue';
--
-- Pour l'arrêter plus tard :
--   update cron.job set active = false where jobname = 'drain-emails-queue';
-- ------------------------------------------------------------

DO $$
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
    RAISE EXCEPTION 'pg_net introuvable : http_post absent de tout schéma';
  END IF;

  -- Rejouable : on retire une éventuelle version précédente du job.
  PERFORM cron.unschedule('drain-emails-queue')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'drain-emails-queue');

  -- L'edge function est déployée avec verify_jwt = false : elle n'attend
  -- aucun jeton, et n'accepte aucune donnée d'entrée — elle ne fait que vider
  -- la file. Rien de sensible ne transite ici.
  PERFORM cron.schedule(
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

  UPDATE cron.job SET active = false WHERE jobname = 'drain-emails-queue';
END;
$$;
