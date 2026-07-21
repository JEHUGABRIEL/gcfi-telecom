-- ================================================================
-- Duplication des contenus FR → EN (toutes les tables multilingues)
-- ================================================================

-- Témoignages
INSERT INTO testimonials (name, role, content, avatar_url, rating, status, lang, created_at)
SELECT name, role, content, avatar_url, rating, status, 'en', now()
FROM testimonials
WHERE lang = 'fr'
  AND NOT EXISTS (SELECT 1 FROM testimonials t2 WHERE t2.lang = 'en' AND t2.name = testimonials.name);

-- Réalisations
INSERT INTO achievements (title, description, year, image, gallery, lang, created_at)
SELECT title, description, year, image, gallery, 'en', now()
FROM achievements
WHERE lang = 'fr'
  AND NOT EXISTS (SELECT 1 FROM achievements a2 WHERE a2.lang = 'en' AND a2.title = achievements.title);

-- Partenaires (logos identiques, juste marqués EN)
INSERT INTO partners (name, logo, website, order_index, lang, created_at)
SELECT name, logo, website, order_index, 'en', now()
FROM partners
WHERE lang = 'fr'
  AND NOT EXISTS (SELECT 1 FROM partners p2 WHERE p2.lang = 'en' AND p2.name = partners.name);

-- Produits
INSERT INTO products (name, description, price, category, image, stock, discount, is_promo, popularity, rating, reviews_count, lang, created_at)
SELECT name, description, price, category, image, stock, discount, is_promo, popularity, rating, reviews_count, 'en', now()
FROM products
WHERE lang = 'fr'
  AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.lang = 'en' AND p2.name = products.name);

-- Formations
INSERT INTO trainings (title, description, price, category, duration, image, tags, discount, is_promo, lang, created_at)
SELECT title, description, price, category, duration, image, tags, discount, is_promo, 'en', now()
FROM trainings
WHERE lang = 'fr'
  AND NOT EXISTS (SELECT 1 FROM trainings t2 WHERE t2.lang = 'en' AND t2.title = trainings.title);

-- Vérification finale
SELECT 'testimonials'  AS table_name, COUNT(*) AS total, COUNT(*) FILTER (WHERE lang='fr') AS fr, COUNT(*) FILTER (WHERE lang='en') AS en FROM testimonials
UNION ALL
SELECT 'achievements',  COUNT(*), COUNT(*) FILTER (WHERE lang='fr'), COUNT(*) FILTER (WHERE lang='en') FROM achievements
UNION ALL
SELECT 'partners',      COUNT(*), COUNT(*) FILTER (WHERE lang='fr'), COUNT(*) FILTER (WHERE lang='en') FROM partners
UNION ALL
SELECT 'products',      COUNT(*), COUNT(*) FILTER (WHERE lang='fr'), COUNT(*) FILTER (WHERE lang='en') FROM products
UNION ALL
SELECT 'trainings',     COUNT(*), COUNT(*) FILTER (WHERE lang='fr'), COUNT(*) FILTER (WHERE lang='en') FROM trainings;
