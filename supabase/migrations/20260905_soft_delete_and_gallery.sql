-- ============================================================
-- Soft delete + galeries multi-images
-- Ajoute deleted_at (soft delete) et gallery (multi-images) aux
-- tables de contenu. Les lignes supprimées sont masquées par
-- les filtres `deleted_at IS NULL` dans l'application.
-- ============================================================

-- Soft delete
ALTER TABLE public.products      ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.trainings     ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.blog_posts    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.testimonials  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.achievements  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.partners      ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.news          ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.services      ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.quotes        ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Galeries multi-images
ALTER TABLE public.products     ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.blog_posts   ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Index partiels pour accélérer les filtres deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_products_deleted_at      ON public.products      (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trainings_deleted_at     ON public.trainings     (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_deleted_at    ON public.blog_posts    (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_testimonials_deleted_at  ON public.testimonials  (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_achievements_deleted_at  ON public.achievements  (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partners_deleted_at      ON public.partners      (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_news_deleted_at          ON public.news          (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_deleted_at      ON public.services      (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_deleted_at ON public.announcements (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_deleted_at        ON public.quotes        (deleted_at) WHERE deleted_at IS NOT NULL;