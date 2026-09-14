


-- ============================================================================
-- BASELINE — schéma public tel qu'il existait AVANT la première migration
-- versionnée du dépôt.
-- ============================================================================
--
-- Pourquoi ce fichier existe
-- --------------------------
-- Les tables de base (profiles, products, trainings, orders, quotes, …) ont été
-- créées directement dans le dashboard Supabase, avant que l'historique des
-- migrations ne soit versionné. Aucune migration du dépôt ne les crée, donc
-- `supabase start` / `supabase db reset` échouait dès la première migration :
--
--   20240614000200_remove_duplicate_lang_records.sql
--   ERROR: relation "public.products" does not exist (SQLSTATE 42P01)
--
-- Conséquence : aucun environnement local neuf ne pouvait être monté.
--
-- Contenu : `pg_dump --schema-only` du schéma `public` de la production
-- (projet tivlllahuykbfnawwhba), sans les données. Les migrations suivantes
-- s'appliquent par-dessus lors d'un `db reset`.
--
-- ⚠️ Ne pas pousser ce fichier vers la production
-- -----------------------------------------------
-- La production contient déjà tous ces objets et cette version n'est pas dans
-- `supabase_migrations.schema_migrations`. Avant tout `supabase db push`,
-- marquer la version comme déjà appliquée :
--
--   supabase migration repair --status applied 20240601000000
--
-- Sinon `db push` rejoue ce dump sur la production et échoue sur les
-- `CREATE POLICY` / `CREATE INDEX`, qui ne sont pas idempotents.
--
-- Différence assumée avec la production : le webhook `trigger-send-emails`
-- (sur `emails_queue`) est volontairement absent — son argument contient un
-- jeton `service_role`, qui n'a rien à faire dans git. Voir la note à
-- l'emplacement de ce trigger.
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."consume_rate_limit"("p_key" "text", "p_limit" integer, "p_window_seconds" integer) RETURNS TABLE("allowed" boolean, "retry_after_seconds" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."consume_rate_limit"("p_key" "text", "p_limit" integer, "p_window_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."disable_email_drain"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM cron.unschedule('drain-emails-queue');
EXCEPTION
  -- cron.unschedule lève si le job n'existe pas. Arrêter ce qui est déjà
  -- arrêté n'est pas une erreur.
  WHEN OTHERS THEN NULL;
END;
$$;


ALTER FUNCTION "public"."disable_email_drain"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_email_drain"() RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
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
$_$;


ALTER FUNCTION "public"."enable_email_drain"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_own_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_own_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Utilisateur'),
    'client'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_auth_rate_limits"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  DELETE FROM public.auth_rate_limits WHERE window_start < now() - interval '1 day';
$$;


ALTER FUNCTION "public"."purge_auth_rate_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."queue_order_confirmation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_name       text;
  v_items_html text;
  v_html       text;
BEGIN
  -- Sans destinataire, rien à envoyer.
  IF NEW.customer_email IS NULL OR NEW.customer_email = '' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(p.full_name, ''), 'Client')
  INTO v_name
  FROM public.profiles p
  WHERE p.id = NEW.customer_id;

  v_name := COALESCE(v_name, 'Client');

  -- Une ligne de tableau par article. `to_char` avec un séparateur littéral
  -- plutôt que 'G' : ce dernier dépend de lc_numeric du serveur et donnerait
  -- un rendu variable.
  SELECT COALESCE(string_agg(
    format(
      '<tr style="border-bottom:1px solid #e5e7eb;">'
      '<td style="padding:12px;text-align:left;">%s</td>'
      '<td style="padding:12px;text-align:center;">%s</td>'
      '<td style="padding:12px;text-align:right;">%s FCFA</td></tr>',
      COALESCE(it->>'name', 'Article'),
      COALESCE(it->>'quantity', '1'),
      replace(to_char(COALESCE((it->>'price')::numeric, 0), 'FM999,999,999'), ',', ' ')
    ), ''), '')
  INTO v_items_html
  FROM jsonb_array_elements(
    CASE jsonb_typeof(NEW.items) WHEN 'array' THEN NEW.items ELSE '[]'::jsonb END
  ) AS it;

  -- La commande se finalise sur WhatsApp : la table `orders` ne porte aucune
  -- adresse de livraison. On ne promet donc pas ce qu'on n'a pas — le bloc
  -- « adresse » du gabarit d'origine est remplacé par un rappel du canal réel.
  v_html := format(
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">'
    '<div style="background:linear-gradient(135deg,#C1272D 0%%,#1E4D8C 100%%);padding:40px;text-align:center;color:white;">'
    '<h1 style="margin:0;">Commande confirmée ✓</h1></div>'
    '<div style="padding:40px;background:#f9fafb;">'
    '<p style="font-size:16px;color:#333;">Bonjour %s,</p>'
    '<p style="font-size:14px;color:#666;line-height:1.6;">Merci pour votre commande ! Voici le récapitulatif de votre achat.</p>'
    '<div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border:1px solid #e5e7eb;">'
    '<p style="font-size:12px;color:#999;margin:0;">Numéro de commande</p>'
    '<p style="font-size:18px;font-weight:bold;color:#C1272D;margin:5px 0;">%s</p></div>'
    '<table style="width:100%%;border-collapse:collapse;margin:20px 0;">'
    '<thead style="background:#f3f4f6;"><tr>'
    '<th style="padding:12px;text-align:left;color:#333;">Produit</th>'
    '<th style="padding:12px;text-align:center;color:#333;">Qté</th>'
    '<th style="padding:12px;text-align:right;color:#333;">Prix</th></tr></thead>'
    '<tbody>%s'
    '<tr style="background:#f9fafb;">'
    '<td colspan="2" style="padding:12px;text-align:right;font-weight:bold;color:#333;">Total :</td>'
    '<td style="padding:12px;text-align:right;font-weight:bold;color:#C1272D;font-size:16px;">%s FCFA</td>'
    '</tr></tbody></table>'
    '<div style="background:#eff6ff;padding:15px;border-radius:8px;border-left:4px solid #C1272D;">'
    '<p style="font-size:14px;color:#333;margin:0;">Notre équipe vous recontacte sur WhatsApp pour convenir de la livraison et du règlement.</p></div>'
    '<div style="margin:30px 0;text-align:center;">'
    '<a href="https://www.gcfi-rca.com/profil" style="background:#C1272D;color:white;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Suivre ma commande</a></div>'
    '<p style="font-size:12px;color:#999;line-height:1.6;">Livraison estimée : 2-3 jours ouvrables à Bangui, 5-7 jours en province.</p>'
    '</div></div>',
    v_name,
    NEW.id,
    v_items_html,
    replace(to_char(COALESCE(NEW.total, 0), 'FM999,999,999'), ',', ' ')
  );

  INSERT INTO public.emails_queue ("to", subject, html, text, status, created_at)
  VALUES (
    NEW.customer_email,
    format('Commande confirmée #%s', NEW.id),
    v_html,
    '',
    'pending',
    now()
  );

  RETURN NEW;

EXCEPTION
  -- Un problème d'email ne doit jamais faire échouer une commande. On trace
  -- et on laisse passer.
  WHEN OTHERS THEN
    RAISE WARNING '[queue_order_confirmation] commande % : %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."queue_order_confirmation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_cart_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin new.updated_at = now(); return new; end;
$$;


ALTER FUNCTION "public"."update_cart_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "year" "text" NOT NULL,
    "image" "text",
    "gallery" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lang" "text" DEFAULT 'fr'::"text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "admin_name" "text",
    "action" "text" NOT NULL,
    "entity" "text" NOT NULL,
    "entity_id" "text",
    "label" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message" "text" NOT NULL,
    "link_label" "text",
    "link_url" "text",
    "bg_color" "text" DEFAULT 'red'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lang" "text" DEFAULT 'fr'::"text" NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_rate_limits" (
    "key" "text" NOT NULL,
    "hits" integer DEFAULT 0 NOT NULL,
    "window_start" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."auth_rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "excerpt" "text",
    "content" "text" NOT NULL,
    "image" "text",
    "category" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "author" "text" DEFAULT 'GCFI Télécom'::"text",
    "published" boolean DEFAULT false,
    "read_time" integer DEFAULT 5,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "lang" "text" DEFAULT 'fr'::"text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "gallery" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "resource_id" "uuid" NOT NULL,
    "resource_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "rating" integer,
    "status" "text" DEFAULT 'approved'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "chk_comments_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "comments_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emails_queue" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "to" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "html" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL
);


ALTER TABLE "public"."emails_queue" OWNER TO "postgres";


ALTER TABLE "public"."emails_queue" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."emails_queue_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."global_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."global_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mfa_codes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "expires_at" timestamp without time zone NOT NULL,
    "used" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."mfa_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "excerpt" "text",
    "content" "text",
    "category" "text" DEFAULT 'telecom'::"text",
    "image" "text",
    "source" "text",
    "url" "text",
    "published_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lang" "text" DEFAULT 'fr'::"text" NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "news_category_check" CHECK (("category" = ANY (ARRAY['telecom'::"text", 'gold'::"text", 'it'::"text"])))
);


ALTER TABLE "public"."news" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text",
    "status" "text" DEFAULT 'unread'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "customer_email" "text",
    "total" numeric NOT NULL,
    "status" "text" DEFAULT 'En préparation'::"text",
    "items" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "chk_orders_status" CHECK (("status" = ANY (ARRAY['En préparation'::"text", 'En cours'::"text", 'Expédiée'::"text", 'Livrée'::"text", 'Annulée'::"text", 'Remboursée'::"text", 'nouveau'::"text", 'en_cours'::"text", 'livré'::"text", 'annulé'::"text", 'remboursé'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "logo" "text",
    "website" "text",
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lang" "text" DEFAULT 'fr'::"text" NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."partners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "image" "text",
    "category" "text",
    "stock" integer DEFAULT 10,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "popularity" integer DEFAULT 0,
    "rating" numeric(3,1) DEFAULT 0,
    "reviews_count" integer DEFAULT 0,
    "discount" integer DEFAULT 0,
    "is_promo" boolean DEFAULT false,
    "lang" "text" DEFAULT 'fr'::"text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "gallery" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_products_price" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "products_discount_check" CHECK ((("discount" >= 0) AND ("discount" <= 100)))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."products_with_promo" AS
 SELECT "id",
    "name",
    "description",
    "price",
    "image",
    "category",
    "stock",
    "created_at",
    "popularity",
    "rating",
    "reviews_count",
    "discount",
    "is_promo",
        CASE
            WHEN ("discount" > 0) THEN ("price" - (("price" * ("discount")::numeric) / (100)::numeric))
            ELSE "price"
        END AS "discounted_price"
   FROM "public"."products";


ALTER VIEW "public"."products_with_promo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "text" DEFAULT 'client'::"text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_blocked" boolean DEFAULT false,
    "blocked_until" timestamp with time zone,
    "block_reason" "text",
    "password_reset_requested_at" timestamp with time zone,
    CONSTRAINT "chk_profiles_role" CHECK (("role" = ANY (ARRAY['client'::"text", 'admin'::"text", 'superadmin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."password_reset_requested_at" IS 'Dernière demande de réinitialisation envoyée depuis le profil admin. Sert au délai anti-répétition ; écrit uniquement par la clé service.';



CREATE OR REPLACE VIEW "public"."profiles_with_block_status" AS
 SELECT "id",
    "email",
    "full_name",
    "role",
    "avatar_url",
    "created_at",
    "is_blocked",
    "blocked_until",
    "block_reason",
        CASE
            WHEN ("is_blocked" = true) THEN 'blocked_permanent'::"text"
            WHEN (("blocked_until" IS NOT NULL) AND ("blocked_until" > "now"())) THEN 'blocked_temp'::"text"
            ELSE 'active'::"text"
        END AS "block_status"
   FROM "public"."profiles";


ALTER VIEW "public"."profiles_with_block_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "company" "text",
    "service_type" "text" NOT NULL,
    "message" "text" NOT NULL,
    "budget" "text",
    "status" "text" DEFAULT 'nouveau'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chk_quotes_status" CHECK (("status" = ANY (ARRAY['nouveau'::"text", 'en_cours'::"text", 'traité'::"text", 'refusé'::"text"]))),
    CONSTRAINT "quotes_service_type_check" CHECK (("service_type" = ANY (ARRAY['Réseau LAN/WAN'::"text", 'Fibre Optique'::"text", 'Vidéosurveillance'::"text", 'WiFi / Hotspot'::"text", 'Starlink'::"text", 'Cybersécurité'::"text", 'Développement App'::"text", 'Formation'::"text", 'Business Or'::"text", 'Autre'::"text"]))),
    CONSTRAINT "quotes_status_check" CHECK (("status" = ANY (ARRAY['nouveau'::"text", 'en_cours'::"text", 'traité'::"text", 'annulé'::"text"])))
);


ALTER TABLE "public"."quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text" DEFAULT 'Wrench'::"text" NOT NULL,
    "color" "text" DEFAULT 'blue'::"text" NOT NULL,
    "image" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lang" "text" DEFAULT 'fr'::"text" NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "subscribed_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_subscribers_email" CHECK (("email" ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'::"text"))
);


ALTER TABLE "public"."subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "avatar_url" "text",
    "rating" integer DEFAULT 5,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lang" "text" DEFAULT 'fr'::"text" NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chk_testimonials_rating" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "testimonials_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "testimonials_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "price" numeric DEFAULT 0,
    "duration" "text",
    "level" "text",
    "instructor" "text",
    "image" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "discount" integer DEFAULT 0,
    "is_promo" boolean DEFAULT false,
    "lang" "text" DEFAULT 'fr'::"text" NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "trainings_discount_check" CHECK ((("discount" >= 0) AND ("discount" <= 100)))
);


ALTER TABLE "public"."trainings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."trainings_with_promo" AS
 SELECT "id",
    "title",
    "description",
    "category",
    "price",
    "duration",
    "level",
    "instructor",
    "image",
    "tags",
    "created_at",
    "updated_at",
    "discount",
    "is_promo",
        CASE
            WHEN ("discount" > 0) THEN ("price" - (("price" * ("discount")::numeric) / (100)::numeric))
            ELSE "price"
        END AS "discounted_price"
   FROM "public"."trainings";


ALTER VIEW "public"."trainings_with_promo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."upload_rate_limits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "text" NOT NULL,
    "upload_count" integer DEFAULT 0,
    "reset_at" timestamp without time zone DEFAULT "now"(),
    "is_banned" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."upload_rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_mfa_settings" (
    "user_id" "uuid" NOT NULL,
    "phone" "text" NOT NULL,
    "enabled" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "failed_attempts" integer DEFAULT 0 NOT NULL,
    "locked_until" timestamp with time zone
);


ALTER TABLE "public"."user_mfa_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tokens" (
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_tokens" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_activity_log"
    ADD CONSTRAINT "admin_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_rate_limits"
    ADD CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emails_queue"
    ADD CONSTRAINT "emails_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."global_notifications"
    ADD CONSTRAINT "global_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mfa_codes"
    ADD CONSTRAINT "mfa_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainings"
    ADD CONSTRAINT "trainings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."upload_rate_limits"
    ADD CONSTRAINT "upload_rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."upload_rate_limits"
    ADD CONSTRAINT "upload_rate_limits_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_mfa_settings"
    ADD CONSTRAINT "user_mfa_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_tokens"
    ADD CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "achievements_year_idx" ON "public"."achievements" USING "btree" ("year" DESC);



CREATE INDEX "activity_log_admin_idx" ON "public"."admin_activity_log" USING "btree" ("admin_id");



CREATE INDEX "activity_log_created_idx" ON "public"."admin_activity_log" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "carts_user_id_idx" ON "public"."carts" USING "btree" ("user_id");



CREATE INDEX "idx_achievements_deleted_at" ON "public"."achievements" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_achievements_lang" ON "public"."achievements" USING "btree" ("lang");



CREATE INDEX "idx_announcements_deleted_at" ON "public"."announcements" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_announcements_lang" ON "public"."announcements" USING "btree" ("lang");



CREATE INDEX "idx_auth_rate_limits_window" ON "public"."auth_rate_limits" USING "btree" ("window_start");



CREATE INDEX "idx_blog_posts_deleted_at" ON "public"."blog_posts" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_blog_posts_lang" ON "public"."blog_posts" USING "btree" ("lang");



CREATE INDEX "idx_carts_user_id" ON "public"."carts" USING "btree" ("user_id");



CREATE INDEX "idx_emails_queue_pending" ON "public"."emails_queue" USING "btree" ("created_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_global_notifications_created_at" ON "public"."global_notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_mfa_codes_expires" ON "public"."mfa_codes" USING "btree" ("expires_at");



CREATE INDEX "idx_mfa_codes_user_id" ON "public"."mfa_codes" USING "btree" ("user_id");



CREATE INDEX "idx_news_deleted_at" ON "public"."news" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_news_lang" ON "public"."news" USING "btree" ("lang");



CREATE INDEX "idx_notifications_status" ON "public"."notifications" USING "btree" ("status");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_partners_deleted_at" ON "public"."partners" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_partners_lang" ON "public"."partners" USING "btree" ("lang");



CREATE INDEX "idx_products_deleted_at" ON "public"."products" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_products_lang" ON "public"."products" USING "btree" ("lang");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_quotes_created_at" ON "public"."quotes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_quotes_deleted_at" ON "public"."quotes" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_quotes_status" ON "public"."quotes" USING "btree" ("status");



CREATE INDEX "idx_services_deleted_at" ON "public"."services" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_services_lang" ON "public"."services" USING "btree" ("lang");



CREATE INDEX "idx_subscribers_email" ON "public"."subscribers" USING "btree" ("email");



CREATE INDEX "idx_testimonials_deleted_at" ON "public"."testimonials" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_testimonials_lang" ON "public"."testimonials" USING "btree" ("lang");



CREATE INDEX "idx_trainings_deleted_at" ON "public"."trainings" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_trainings_lang" ON "public"."trainings" USING "btree" ("lang");



CREATE INDEX "idx_upload_rate_limits_user_id" ON "public"."upload_rate_limits" USING "btree" ("user_id");



CREATE INDEX "news_category_idx" ON "public"."news" USING "btree" ("category");



CREATE INDEX "news_published_idx" ON "public"."news" USING "btree" ("published_at" DESC);



CREATE INDEX "partners_order_idx" ON "public"."partners" USING "btree" ("order_index");



CREATE INDEX "quotes_created_idx" ON "public"."quotes" USING "btree" ("created_at" DESC);



CREATE INDEX "quotes_status_idx" ON "public"."quotes" USING "btree" ("status");



CREATE INDEX "services_order_idx" ON "public"."services" USING "btree" ("order_index");



CREATE INDEX "testimonials_created_idx" ON "public"."testimonials" USING "btree" ("created_at" DESC);



CREATE INDEX "testimonials_status_idx" ON "public"."testimonials" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "cart_updated_at" BEFORE UPDATE ON "public"."carts" FOR EACH ROW EXECUTE FUNCTION "public"."update_cart_timestamp"();



CREATE OR REPLACE TRIGGER "queue_order_confirmation" AFTER INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."queue_order_confirmation"();



CREATE OR REPLACE TRIGGER "set_announcements_updated_at" BEFORE UPDATE ON "public"."announcements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_services_updated_at" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."achievements" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."trainings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



-- NOTE : le webhook « trigger-send-emails » de la production est absent ici.
--
-- En production, `emails_queue` déclenche un Database Webhook configuré depuis
-- le dashboard Supabase :
--
--   AFTER INSERT ON public.emails_queue
--   EXECUTE FUNCTION supabase_functions.http_request(
--     'https://<ref>.supabase.co/functions/v1/send-emails', 'POST',
--     '{"Authorization":"Bearer <service_role>"}', '{}', '5000')
--
-- Il est volontairement omis, pour deux raisons :
--   1. son argument contient un jeton `service_role`, qui n'a rien à faire
--      dans un fichier versionné ;
--   2. l'URL vise le projet de PRODUCTION : recopié tel quel, ce trigger
--      enverrait de vraies requêtes HTTP à l'edge function de production — donc
--      de vrais emails à de vrais clients — à chaque insertion locale dans
--      `emails_queue`.
--
-- L'envoi des emails est assuré côté dépôt par `queue_order_confirmation()`
-- (trigger de commande) et par le job pg_cron alimenté par `enable_email_drain()`
-- — voir supabase/EMAIL_SETUP.md. Une base locale n'a donc pas besoin de ce
-- webhook ; la production est inchangée.



ALTER TABLE ONLY "public"."admin_activity_log"
    ADD CONSTRAINT "admin_activity_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mfa_codes"
    ADD CONSTRAINT "mfa_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_mfa_settings"
    ADD CONSTRAINT "user_mfa_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tokens"
    ADD CONSTRAINT "user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Activity log insertable par admin" ON "public"."admin_activity_log" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Activity log lisible par admin" ON "public"."admin_activity_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admin all" ON "public"."blog_posts" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"])))));



CREATE POLICY "Admins can do everything on profiles" ON "public"."profiles" USING ((("auth"."jwt"() ->> 'email'::"text") = 'jehubin@gmail.com'::"text"));



CREATE POLICY "Admins can manage all comments" ON "public"."comments" USING ((("auth"."jwt"() ->> 'email'::"text") = 'jehubin@gmail.com'::"text"));



CREATE POLICY "Admins can manage all notifications" ON "public"."notifications" USING ((("auth"."jwt"() ->> 'email'::"text") = 'jehubin@gmail.com'::"text"));



CREATE POLICY "Admins can manage notifications" ON "public"."global_notifications" USING ((("auth"."jwt"() ->> 'email'::"text") = 'jehubin@gmail.com'::"text"));



CREATE POLICY "Admins can manage orders" ON "public"."orders" USING ((("auth"."jwt"() ->> 'email'::"text") = 'jehubin@gmail.com'::"text"));



CREATE POLICY "Admins manage achievements" ON "public"."achievements" USING ("public"."is_admin"());



CREATE POLICY "Admins manage news" ON "public"."news" USING ("public"."is_admin"());



CREATE POLICY "Admins manage orders" ON "public"."orders" USING ("public"."is_admin"());



CREATE POLICY "Admins manage partners" ON "public"."partners" USING ("public"."is_admin"());



CREATE POLICY "Admins manage products" ON "public"."products" USING ("public"."is_admin"());



CREATE POLICY "Admins manage quotes" ON "public"."quotes" USING ("public"."is_admin"());



CREATE POLICY "Admins manage testimonials" ON "public"."testimonials" USING ("public"."is_admin"());



CREATE POLICY "Allow authenticated delete" ON "public"."trainings" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated insert" ON "public"."trainings" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated update" ON "public"."trainings" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow public read" ON "public"."trainings" FOR SELECT USING (true);



CREATE POLICY "Annonces admin" ON "public"."announcements" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Annonces lisibles publiquement" ON "public"."announcements" FOR SELECT USING (true);



CREATE POLICY "Annonces modifiables par admin" ON "public"."announcements" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Annonces publiques" ON "public"."announcements" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read global notifications" ON "public"."global_notifications" FOR SELECT USING (true);



CREATE POLICY "Anyone can see approved comments" ON "public"."comments" FOR SELECT USING (("status" = 'approved'::"text"));



CREATE POLICY "Anyone can see products" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Anyone reads achievements" ON "public"."achievements" FOR SELECT USING (true);



CREATE POLICY "Anyone reads news" ON "public"."news" FOR SELECT USING (true);



CREATE POLICY "Anyone reads partners" ON "public"."partners" FOR SELECT USING (true);



CREATE POLICY "Anyone submits quote" ON "public"."quotes" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone submits testimonial" ON "public"."testimonials" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable all for authenticated" ON "public"."trainings" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Public read" ON "public"."blog_posts" FOR SELECT USING (("published" = true));



CREATE POLICY "Public reads approved testimonials" ON "public"."testimonials" FOR SELECT USING (("status" = 'approved'::"text"));



CREATE POLICY "Services lisibles publiquement" ON "public"."services" FOR SELECT USING (true);



CREATE POLICY "Services modifiables par admin" ON "public"."services" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own comments" ON "public"."comments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own tokens" ON "public"."user_tokens" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can see their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can see their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("public"."is_admin"() OR (("auth"."uid"() = "id") AND ("role" = "public"."get_own_role"()))));



CREATE POLICY "Users manage own cart" ON "public"."carts" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users read own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "customer_id"));



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "achievements_delete" ON "public"."achievements" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "achievements_insert" ON "public"."achievements" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "achievements_select" ON "public"."achievements" FOR SELECT USING (true);



CREATE POLICY "achievements_update" ON "public"."achievements" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."admin_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "carts_delete" ON "public"."carts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "carts_insert" ON "public"."carts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "carts_select" ON "public"."carts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "carts_update" ON "public"."carts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comments_delete" ON "public"."comments" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "comments_insert" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "comments_select" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "comments_update" ON "public"."comments" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."emails_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."global_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "global_notifications_delete" ON "public"."global_notifications" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "global_notifications_insert" ON "public"."global_notifications" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "global_notifications_select" ON "public"."global_notifications" FOR SELECT USING (true);



CREATE POLICY "global_notifications_update" ON "public"."global_notifications" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."mfa_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "news_delete" ON "public"."news" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "news_insert" ON "public"."news" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "news_select" ON "public"."news" FOR SELECT USING (true);



CREATE POLICY "news_update" ON "public"."news" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete" ON "public"."notifications" FOR DELETE USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "notifications_insert" ON "public"."notifications" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "notifications_select" ON "public"."notifications" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "notifications_update" ON "public"."notifications" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_delete" ON "public"."orders" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "orders_insert" ON "public"."orders" FOR INSERT WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "orders_select" ON "public"."orders" FOR SELECT USING ((("auth"."uid"() = "customer_id") OR "public"."is_admin"()));



CREATE POLICY "orders_update" ON "public"."orders" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."partners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "partners_delete" ON "public"."partners" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "partners_insert" ON "public"."partners" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "partners_select" ON "public"."partners" FOR SELECT USING (true);



CREATE POLICY "partners_update" ON "public"."partners" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_delete" ON "public"."products" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "products_insert" ON "public"."products" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "products_select" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "products_update" ON "public"."products" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR "public"."is_admin"()));



CREATE POLICY "profiles_update" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") OR "public"."is_admin"())) WITH CHECK (("public"."is_admin"() OR (("auth"."uid"() = "id") AND ("role" = "public"."get_own_role"()))));



ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quotes_delete" ON "public"."quotes" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "quotes_insert" ON "public"."quotes" FOR INSERT WITH CHECK (true);



CREATE POLICY "quotes_select" ON "public"."quotes" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "quotes_update" ON "public"."quotes" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscribers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscribers_insert" ON "public"."subscribers" FOR INSERT WITH CHECK (true);



CREATE POLICY "subscribers_select" ON "public"."subscribers" FOR SELECT USING ("public"."is_admin"());



ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "testimonials_delete" ON "public"."testimonials" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "testimonials_insert" ON "public"."testimonials" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "testimonials_select" ON "public"."testimonials" FOR SELECT USING (true);



CREATE POLICY "testimonials_update" ON "public"."testimonials" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."trainings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."upload_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_mfa_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_can_insert_own_mfa_setup" ON "public"."user_mfa_settings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_can_view_own_mfa_status" ON "public"."user_mfa_settings" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."consume_rate_limit"("p_key" "text", "p_limit" integer, "p_window_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."consume_rate_limit"("p_key" "text", "p_limit" integer, "p_window_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."disable_email_drain"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."disable_email_drain"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."enable_email_drain"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enable_email_drain"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_own_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_own_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_own_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_auth_rate_limits"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_auth_rate_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."queue_order_confirmation"() TO "anon";
GRANT ALL ON FUNCTION "public"."queue_order_confirmation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."queue_order_confirmation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_cart_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_cart_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cart_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."admin_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."auth_rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."auth_rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."carts" TO "anon";
GRANT ALL ON TABLE "public"."carts" TO "authenticated";
GRANT ALL ON TABLE "public"."carts" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."emails_queue" TO "anon";
GRANT ALL ON TABLE "public"."emails_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."emails_queue" TO "service_role";



GRANT ALL ON SEQUENCE "public"."emails_queue_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."emails_queue_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."emails_queue_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."global_notifications" TO "anon";
GRANT ALL ON TABLE "public"."global_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."global_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."mfa_codes" TO "anon";
GRANT ALL ON TABLE "public"."mfa_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."mfa_codes" TO "service_role";



GRANT ALL ON TABLE "public"."news" TO "anon";
GRANT ALL ON TABLE "public"."news" TO "authenticated";
GRANT ALL ON TABLE "public"."news" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."partners" TO "anon";
GRANT ALL ON TABLE "public"."partners" TO "authenticated";
GRANT ALL ON TABLE "public"."partners" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."products_with_promo" TO "anon";
GRANT ALL ON TABLE "public"."products_with_promo" TO "authenticated";
GRANT ALL ON TABLE "public"."products_with_promo" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."profiles_with_block_status" TO "anon";
GRANT ALL ON TABLE "public"."profiles_with_block_status" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles_with_block_status" TO "service_role";



GRANT ALL ON TABLE "public"."quotes" TO "anon";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."subscribers" TO "anon";
GRANT ALL ON TABLE "public"."subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."testimonials" TO "anon";
GRANT ALL ON TABLE "public"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonials" TO "service_role";



GRANT ALL ON TABLE "public"."trainings" TO "anon";
GRANT ALL ON TABLE "public"."trainings" TO "authenticated";
GRANT ALL ON TABLE "public"."trainings" TO "service_role";



GRANT ALL ON TABLE "public"."trainings_with_promo" TO "anon";
GRANT ALL ON TABLE "public"."trainings_with_promo" TO "authenticated";
GRANT ALL ON TABLE "public"."trainings_with_promo" TO "service_role";



GRANT ALL ON TABLE "public"."upload_rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."upload_rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."upload_rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."user_mfa_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_mfa_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_mfa_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_tokens" TO "anon";
GRANT ALL ON TABLE "public"."user_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tokens" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


-- ----------------------------------------------------------------------------
-- Trigger de création de profil (schéma `auth`)
--
-- En production, l'insertion dans `auth.users` crée la ligne `profiles`
-- correspondante (voir `public.handle_new_user()`). Ce trigger a été créé depuis
-- le dashboard, donc un `pg_dump --schema public` ne le capte pas : il est
-- ajouté ici pour que l'inscription fonctionne dans un environnement recréé
-- depuis zéro.
--
-- `CREATE OR REPLACE TRIGGER` (et non `CREATE TRIGGER`) reste rejouable si le
-- trigger est déjà présent.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER "on_auth_user_created"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();







