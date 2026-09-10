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

Dashboard → **Project Settings → Authentication → SMTP Settings** → *Enable Custom SMTP* :

| Champ | Valeur |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | le login `…@smtp-brevo.com` |
| Password | la clé SMTP Brevo |
| Sender email | `noreply@gcfi-rca.com` |
| Sender name | `GCFI Telecom` |

> **L'expéditeur doit être authentifié chez Brevo.** Dans Brevo → *Senders,
> Domains & Dedicated IPs*, le domaine `gcfi-rca.com` doit être vérifié avec ses
> enregistrements **SPF**, **DKIM** et **DMARC**. Sans cela Gmail et Outlook
> rejettent ou classent en spam, quelle que soit la qualité du template. C'est
> l'étape la plus souvent négligée et celle qui décide du sort de tes emails.

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

## 4. File d'attente applicative — non drainée

`emails_queue` reçoit les emails applicatifs avec `status = 'pending'`.
L'edge function `send-emails` les envoie via Brevo et bascule leur statut.

**Rien ne l'appelle.** Ni cron, ni appel depuis l'application. Les emails de
bienvenue et de confirmation de commande s'accumulent donc en base sans jamais
partir. À vérifier :

```sql
select status, count(*) from public.emails_queue group by status;
```

Deux façons de la déclencher, au choix :

**pg_cron dans Supabase** — reste dans la base, sans dépendre de l'hébergeur.
Activer les extensions `pg_cron` et `pg_net`, stocker la clé service dans Vault,
puis planifier un appel HTTP vers la fonction toutes les 5 minutes.

**Cron Vercel** — une route `/api/cron/send-emails` protégée par `CRON_SECRET`
qui invoque l'edge function, déclarée dans `vercel.json`. Attention : le plan
Hobby limite les crons à **une exécution par jour**, ce qui est trop peu pour
des emails transactionnels. Viable seulement en plan Pro.

Vérifier aussi que la fonction est déployée et que sa clé est en place :

```
npx supabase functions list
npx supabase functions deploy send-emails
npx supabase secrets set BREVO_API_KEY=xkeysib-...
```
