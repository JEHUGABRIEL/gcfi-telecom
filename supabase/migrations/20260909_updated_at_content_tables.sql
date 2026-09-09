-- ============================================================
-- updated_at sur les tables de contenu
--
-- Seule `trainings` possédait cette colonne. Le sitemap la demandait
-- pourtant sur products, blog_posts et achievements : la requête échouait
-- et ces sections disparaissaient de l'index Google. Le code sait
-- désormais retomber sur created_at, mais une vraie date de modification
-- vaut mieux — elle indique à Google quand recrawler une fiche.
-- ============================================================

ALTER TABLE public.products      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.blog_posts    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.achievements  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Les lignes existantes héritent de now() par le DEFAULT, ce qui daterait
-- tout le catalogue d'aujourd'hui. On repart de created_at quand il existe,
-- pour ne pas annoncer à Google que 27 fiches ont changé le même jour.
UPDATE public.products     SET updated_at = created_at WHERE created_at IS NOT NULL;
UPDATE public.blog_posts   SET updated_at = created_at WHERE created_at IS NOT NULL;
UPDATE public.achievements SET updated_at = created_at WHERE created_at IS NOT NULL;

-- Trigger partagé : positionne updated_at à chaque UPDATE, sans que
-- l'application ait à y penser.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.products;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.blog_posts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.achievements;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- trainings avait déjà la colonne mais pas nécessairement le trigger.
DROP TRIGGER IF EXISTS set_updated_at ON public.trainings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.trainings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
