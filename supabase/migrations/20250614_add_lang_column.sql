-- ================================================================
-- Ajout de la colonne lang aux tables de contenu
-- Permet de filtrer le contenu par langue (fr / en)
-- ================================================================

ALTER TABLE announcements  ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE products       ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE trainings      ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE services       ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE blog_posts     ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE testimonials   ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE achievements   ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE partners       ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE news           ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'fr';

-- Index pour accélérer les filtres par langue
CREATE INDEX IF NOT EXISTS idx_announcements_lang ON announcements(lang);
CREATE INDEX IF NOT EXISTS idx_products_lang      ON products(lang);
CREATE INDEX IF NOT EXISTS idx_trainings_lang     ON trainings(lang);
CREATE INDEX IF NOT EXISTS idx_services_lang      ON services(lang);
CREATE INDEX IF NOT EXISTS idx_blog_posts_lang    ON blog_posts(lang);
CREATE INDEX IF NOT EXISTS idx_testimonials_lang  ON testimonials(lang);
CREATE INDEX IF NOT EXISTS idx_achievements_lang  ON achievements(lang);
CREATE INDEX IF NOT EXISTS idx_partners_lang      ON partners(lang);
CREATE INDEX IF NOT EXISTS idx_news_lang          ON news(lang);
