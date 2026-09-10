# Emails — configuration

Le projet envoie des emails par **deux chemins distincts**, souvent confondus.
Ils n'utilisent pas la même plomberie et se configurent séparément.

| Chemin | Qui envoie | Emails concernés | Où se configure-t-il |
|---|---|---|---|
| **Auth** | Supabase Auth | réinitialisation de mot de passe, confirmation d'inscription, changement d'email | Dashboard → Authentication |
| **Applicatif** | table `emails_queue` → edge function `send-emails` → Brevo | bienvenue, confirmation de commande | `supabase/functions/send-emails/` + secrets |

Un SMTP configuré pour l'un ne couvre pas l'autre.

---

## 1. SMTP des emails Auth

Par défaut Supabase envoie via son relais mutualisé : **quelques emails par
heure**, expéditeur générique, et un taux de classement en spam élevé. Ça suffit
pour tester, pas pour un usage réel.

Brevo est déjà utilisé côté applicatif — autant réutiliser le même compte.

### Récupérer les identifiants SMTP Brevo

Brevo → **SMTP & API** → onglet **SMTP**. La page affiche :

- serveur `smtp-relay.brevo.com`, port `587`
- un **login** de la forme `8xxxxx001@smtp-brevo.com` (ce n'est pas ton email de connexion)
- une **clé SMTP** à générer — distincte de la clé API `xkeysib-…` utilisée par l'edge function

### Renseigner dans Supabase

Les réglages d'authentification ont changé de place plusieurs fois selon les
versions du dashboard. Liens directs pour ce projet :

| Réglage | URL |
|---|---|
| SMTP | https://supabase.com/dashboard/project/tivlllahuykbfnawwhba/auth/smtp |
| Gabarits d'email | https://supabase.com/dashboard/project/tivlllahuykbfnawwhba/auth/templates |
| URLs de redirection | https://supabase.com/dashboard/project/tivlllahuykbfnawwhba/auth/url-configuration |
| Limites de débit | https://supabase.com/dashboard/project/tivlllahuykbfnawwhba/auth/rate-limits |

Sur la page SMTP, cocher *Enable Custom SMTP* puis :

| Champ | Valeur |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | le login `…@smtp-brevo.com` |
| Password | la clé SMTP Brevo |
| Sender email | `noreply@gcfi-rca.com` |
| Sender name | `GCFI Telecom` |

### Authentification du domaine — état au 10/09/2026

Vérifié par interrogation DNS. Le domaine est authentifié à une exception près :

| Enregistrement | État |
|---|---|
| `brevo-code` sur `gcfi-rca.com` | présent |
| DKIM `brevo1._domainkey` → `b1.gcfi-rca-com.dkim.brevo.com` | publié |
| DKIM `brevo2._domainkey` → `b2.gcfi-rca-com.dkim.brevo.com` | publié |
| `_dmarc` → `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` | présent |
| **SPF** | **absent** |

DNS géré chez **Hostinger** (NS `aster` / `helios.dns-parking.com`).
Enregistrement à ajouter — un seul `v=spf1` par domaine, ne pas en créer un
second s'il en existe déjà un :

| Type | Nom | Valeur |
|---|---|---|
| TXT | `@` | `v=spf1 include:spf.brevo.com ~all` |

DMARC passe déjà par alignement DKIM seul, mais Google et Yahoo attendent les
deux depuis 2024.

### L'expéditeur doit appartenir au domaine

Le seul expéditeur déclaré dans Brevo est `jehubin@gmail.com`. **Un domaine
qu'on ne possède pas ne peut pas être authentifié** : envoyer « au nom » d'une
adresse Gmail via un service tiers déclenche le rejet ou le classement en spam
chez Google, Yahoo et Microsoft. Aucun réglage SMTP ne compense cela.

Créer l'expéditeur `noreply@gcfi-rca.com` (Brevo → Expéditeurs → Ajouter). Le
domaine étant déjà authentifié, la vérification passe sans manipulation DNS
supplémentaire.

C'est aussi ce qu'attend l'edge function : `send-emails/index.ts` envoie déjà
avec `BREVO_SENDER_EMAIL = "noreply@gcfi-rca.com"`, une adresse absente des
expéditeurs Brevo — ces envois seraient donc refusés, indépendamment du
problème de file non drainée décrit plus bas.

Une fois activé, augmente aussi les quotas : **Authentication → Rate Limits**,
le nombre d'emails par heure est bridé bas par défaut.

---

## 2. Template de réinitialisation

`supabase/templates/recovery.html`, à coller dans **Authentication → Emails →
Reset Password**.

Ne renomme pas les variables `{{ .ConfirmationURL }}`, `{{ .Email }}`,
`{{ .SiteURL }}` : Supabase les substitue à l'envoi.

---

## 3. URLs de redirection

**Authentication → URL Configuration → Redirect URLs** :

```
https://www.gcfi-rca.com/reset-password
http://localhost:3000/reset-password
http://localhost:3001/reset-password
```

Sans cette liste, Supabase ignore le `redirectTo` passé par le code et retombe
sur la *Site URL* — le lien de réinitialisation atterrit alors sur la home, avec
les jetons dans le fragment et aucun formulaire pour les exploiter.

Le composant `RecoveryRedirect` rattrape ce cas côté application, mais il ne
dispense pas du réglage : c'est un filet, pas la correction.

---

## 4. File d'attente applicative

`emails_queue` reçoit les emails applicatifs avec `status = 'pending'`.
L'edge function `send-emails` les envoie via Brevo et bascule leur statut.

Elle est déployée et fonctionnelle, mais **rien ne l'appelait** : la file
s'accumulait sans jamais être vidée. La migration
`20260910000200_drain_emails_queue.sql` installe le déclencheur manquant.

### Pourquoi pg_cron plutôt qu'un cron Vercel

Le plan Vercel Hobby limite les crons à **une exécution par jour**, très en
deçà de ce qu'exige de l'email transactionnel. pg_cron vit dans la base,
descend à la minute et ne dépend pas de l'hébergeur. Le job tourne toutes les
5 minutes.

### Aucun job n'est ordonnancé par la migration

Elle installe seulement `public.enable_email_drain()` et
`public.disable_email_drain()`. Deux raisons.

La file contient un arriéré accumulé depuis des mois. Ordonnancer sans
précaution expédierait d'un seul jet des emails de bienvenue et des
confirmations de commande périmés à de vrais clients : un dégât bien pire que
le silence actuel, et irréversible une fois les emails partis.

Et sur Supabase, le rôle `postgres` peut **appeler** les fonctions de pg_cron
mais n'a **aucun droit sur la table `cron.job`**. Créer un job puis le
désactiver par `update cron.job set active = false` échoue en
`permission denied for table job` (SQLSTATE 42501). On s'en tient donc à
`cron.schedule` / `cron.unschedule` : un job absent équivaut à un job inactif,
sans dépendre d'un accès à la table.

**1. Inspecter l'arriéré**

```sql
select status, count(*), min(created_at), max(created_at)
from public.emails_queue group by status;
```

**2. Neutraliser ce qui est périmé** — `'failed'` est déjà écrit par l'edge
function, donc compatible avec la colonne quel que soit son type :

```sql
update public.emails_queue
set status = 'failed'
where status = 'pending' and created_at < now() - interval '24 hours';
```

**3. Démarrer la vidange**

```sql
select public.enable_email_drain();
```

Pour l'arrêter : `select public.disable_email_drain();`
Les deux sont rejouables — `cron.schedule` remplace un job de même nom, et
arrêter ce qui est déjà arrêté n'est pas une erreur.

### Si les extensions manquent

`CREATE EXTENSION` figure dans la migration, mais si elle échoue faute de
droits, active **pg_cron** et **pg_net** depuis Database → Extensions du
dashboard, puis rejoue la migration.

### Garde-fou d'ancienneté

`send-emails` écarte désormais tout email en attente depuis plus de
`MAX_AGE_HOURS` (24 h) : il est marqué en échec au lieu d'être expédié. Un
email transactionnel périmé dessert plus qu'il ne sert, et ce garde-fou évite
qu'une interruption prolongée de la vidange ne déclenche une salve d'envois
obsolètes à la reprise.

La fonction traite 10 emails par passage, soit jusqu'à 120 par heure — bien
au-delà du volume réel, et sous le quota Brevo.

**La fonction doit être redéployée** pour que ce garde-fou prenne effet. La
version en ligne a d'ailleurs été déployée depuis `~/Téléchargements/`, pas
depuis ce dépôt :

```
npx supabase functions deploy send-emails
```

### Limite connue

Un envoi en échec est marqué `failed` et n'est jamais réessayé. Une panne
Brevo passagère perd donc les emails de la fenêtre concernée. Ajouter un
compteur de tentatives serait la suite logique si le besoin se confirme.
