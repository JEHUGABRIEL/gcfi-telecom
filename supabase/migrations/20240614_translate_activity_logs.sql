-- Translate existing French activity log entries to English
-- This migration updates all existing French labels in admin_activity_log
-- to their English equivalents so they display correctly in all languages.

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Produit "(.+)" modifié$', 'Product "\1" modified')
WHERE label ~ '^Produit ".+" modifié$';

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Produit "(.+)" ajouté$', 'Product "\1" added')
WHERE label ~ '^Produit ".+" ajouté$';

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Produit "(.+)" supprimé$', 'Product "\1" deleted')
WHERE label ~ '^Produit ".+" supprimé$';

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Formation "(.+)" modifiée$', 'Training "\1" modified')
WHERE label ~ '^Formation ".+" modifiée$';

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Formation "(.+)" ajoutée$', 'Training "\1" added')
WHERE label ~ '^Formation ".+" ajoutée$';

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Formation "(.+)" supprimée$', 'Training "\1" deleted')
WHERE label ~ '^Formation ".+" supprimée$';

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Annonce modifiée : "(.+)"$', 'Announcement modified: "\1"')
WHERE label ~ '^Annonce modifiée : ".+"$';

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Annonce créée : "(.+)"$', 'Announcement created: "\1"')
WHERE label ~ '^Annonce créée : ".+"$';

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Annonce supprimée : "(.+)"$', 'Announcement deleted: "\1"')
WHERE label ~ '^Annonce supprimée : ".+"$';

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Annonce diffusée : "(.+)"$', 'Notification sent: "\1"')
WHERE label ~ '^Annonce diffusée : ".+"$';

-- User management logs (these are now stored as English via ap.* keys)
UPDATE admin_activity_log
SET label = regexp_replace(label, '^Utilisateur bloqué', 'User blocked')
WHERE label LIKE 'Utilisateur bloqué%';

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Utilisateur débloqué', 'User unblocked')
WHERE label LIKE 'Utilisateur débloqué%';

UPDATE admin_activity_log
SET label = regexp_replace(label, '^Rôle modifié', 'Role changed')
WHERE label LIKE 'Rôle modifié%';
