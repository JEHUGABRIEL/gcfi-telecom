-- ================================================================
-- Suppression des doublons EN après migration vers le système de
-- traduction frontend (LanguageContext)
--
-- Contexte : les tables de contenu avaient une colonne `lang` avec
-- des doublons FR/EN. Comme le frontend gère désormais les
-- traductions via LanguageContext, on garde uniquement les versions FR.
--
-- Tables concernées par des doublons FR/EN :
--   products, trainings, testimonials, achievements, partners
-- ================================================================

BEGIN;

-- ── 1. Products : supprimer les EN qui ont un FR correspondant ──
DELETE FROM public.products
WHERE lang = 'en'
  AND id IN (
    SELECT p2.id FROM public.products p2
    WHERE p2.lang = 'en'
      AND EXISTS (
        SELECT 1 FROM public.products p3
        WHERE p3.lang = 'fr'
          AND p3.id != p2.id
          AND trim(lower(p3.name)) = trim(lower(p2.name))
      )
  );

-- ── 2. Trainings : supprimer les EN qui ont un FR correspondant ──
DELETE FROM public.trainings
WHERE lang = 'en'
  AND id IN (
    SELECT t2.id FROM public.trainings t2
    WHERE t2.lang = 'en'
      AND EXISTS (
        SELECT 1 FROM public.trainings t3
        WHERE t3.lang = 'fr'
          AND t3.id != t2.id
          AND trim(lower(t3.title)) = trim(lower(t2.title))
      )
  );

-- ── 3. Testimonials : supprimer les EN qui ont un FR correspondant ──
DELETE FROM public.testimonials
WHERE lang = 'en'
  AND id IN (
    SELECT t2.id FROM public.testimonials t2
    WHERE t2.lang = 'en'
      AND EXISTS (
        SELECT 1 FROM public.testimonials t3
        WHERE t3.lang = 'fr'
          AND t3.id != t2.id
          AND trim(lower(t3.name)) = trim(lower(t2.name))
      )
  );

-- ── 4. Achievements : supprimer les EN qui ont un FR correspondant ──
DELETE FROM public.achievements
WHERE lang = 'en'
  AND id IN (
    SELECT a2.id FROM public.achievements a2
    WHERE a2.lang = 'en'
      AND EXISTS (
        SELECT 1 FROM public.achievements a3
        WHERE a3.lang = 'fr'
          AND a3.id != a2.id
          AND trim(lower(a3.title)) = trim(lower(a2.title))
      )
  );

-- ── 5. Partners : supprimer les EN qui ont un FR correspondant ──
DELETE FROM public.partners
WHERE lang = 'en'
  AND id IN (
    SELECT p2.id FROM public.partners p2
    WHERE p2.lang = 'en'
      AND EXISTS (
        SELECT 1 FROM public.partners p3
        WHERE p3.lang = 'fr'
          AND p3.id != p2.id
          AND trim(lower(p3.name)) = trim(lower(p2.name))
      )
  );

-- ── 6. Normaliser : tout enregistrement restant sans langue → 'fr' ──
UPDATE public.products       SET lang = 'fr' WHERE lang IS NULL OR lang = '';
UPDATE public.trainings      SET lang = 'fr' WHERE lang IS NULL OR lang = '';
UPDATE public.testimonials   SET lang = 'fr' WHERE lang IS NULL OR lang = '';
UPDATE public.achievements   SET lang = 'fr' WHERE lang IS NULL OR lang = '';
UPDATE public.partners       SET lang = 'fr' WHERE lang IS NULL OR lang = '';
UPDATE public.services       SET lang = 'fr' WHERE lang IS NULL OR lang = '';
UPDATE public.blog_posts     SET lang = 'fr' WHERE lang IS NULL OR lang = '';
UPDATE public.announcements  SET lang = 'fr' WHERE lang IS NULL OR lang = '';
UPDATE public.news           SET lang = 'fr' WHERE lang IS NULL OR lang = '';

COMMIT;
