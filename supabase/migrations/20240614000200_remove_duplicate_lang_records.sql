-- Supprimer les doublons EN des tables après la migration vers le système de traduction frontend
-- On garde uniquement les enregistrements FR (ou ceux sans langue)

-- 1. Products : supprimer les EN (keep FR)
DELETE FROM public.products
WHERE lang = 'en'
  AND id IN (
    SELECT p2.id FROM public.products p2
    WHERE p2.lang = 'en'
      AND EXISTS (
        SELECT 1 FROM public.products p3
        WHERE p3.lang = 'fr' AND p3.id != p2.id
          AND (
            p3.name = p2.name
            OR (p3.name IS NULL AND p2.name IS NULL)
          )
      )
  );

-- 2. Trainings : supprimer les EN (keep FR)
DELETE FROM public.trainings
WHERE lang = 'en'
  AND id IN (
    SELECT t2.id FROM public.trainings t2
    WHERE t2.lang = 'en'
      AND EXISTS (
        SELECT 1 FROM public.trainings t3
        WHERE t3.lang = 'fr' AND t3.id != t2.id
          AND (
            t3.title = t2.title
            OR (t3.title IS NULL AND t2.title IS NULL)
          )
      )
  );

-- 3. Services : supprimer les EN (keep FR)
DELETE FROM public.services
WHERE lang = 'en'
  AND id IN (
    SELECT s2.id FROM public.services s2
    WHERE s2.lang = 'en'
      AND EXISTS (
        SELECT 1 FROM public.services s3
        WHERE s3.lang = 'fr' AND s3.id != s2.id
          AND (
            s3.title = s2.title
            OR (s3.title IS NULL AND s2.title IS NULL)
          )
      )
  );

-- 4. Blog posts : supprimer les EN (keep FR)
DELETE FROM public.blog_posts
WHERE lang = 'en'
  AND id IN (
    SELECT b2.id FROM public.blog_posts b2
    WHERE b2.lang = 'en'
      AND EXISTS (
        SELECT 1 FROM public.blog_posts b3
        WHERE b3.lang = 'fr' AND b3.id != b2.id
          AND (
            b3.title = b2.title
            OR (b3.title IS NULL AND b2.title IS NULL)
          )
      )
  );

-- 5. Announcements : supprimer les EN (keep FR)
DELETE FROM public.announcements
WHERE lang = 'en'
  AND id IN (
    SELECT a2.id FROM public.announcements a2
    WHERE a2.lang = 'en'
      AND EXISTS (
        SELECT 1 FROM public.announcements a3
        WHERE a3.lang = 'fr' AND a3.id != a2.id
          AND (
            a3.message = a2.message
            OR (a3.message IS NULL AND a2.message IS NULL)
          )
      )
  );
