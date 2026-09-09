-- Drop lang column from tables (no longer needed with LanguageSwitcher)
-- The admin interface now auto-translates via LanguageContext, so
-- there's no need for per-row language tagging.

ALTER TABLE IF EXISTS public.services       DROP COLUMN IF EXISTS lang;
ALTER TABLE IF EXISTS public.blog_posts     DROP COLUMN IF EXISTS lang;
ALTER TABLE IF EXISTS public.products       DROP COLUMN IF EXISTS lang;
ALTER TABLE IF EXISTS public.trainings      DROP COLUMN IF EXISTS lang;
ALTER TABLE IF EXISTS public.announcements  DROP COLUMN IF EXISTS lang;
