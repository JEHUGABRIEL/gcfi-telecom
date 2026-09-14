# GCFI Telecom — Project Knowledge

## Overview

GCFI Telecom is a French-first bilingual French/English corporate, services, training, and commerce site for a telecom/IT company in Bangui, Central African Republic. The app is deployed to Vercel and includes public pages, authenticated profiles, admin/backoffice screens, API route handlers, and Supabase edge functions.

## Key locations

- `src/app/` — Next.js App Router routes, layouts, metadata routes, auth pages, admin pages, and API handlers. `src/app/(main)/` contains the public site.
- `src/modules/<feature>/` — feature code for home, store, training, services, expertise, blog, profile, legal, and admin; components and Supabase-facing services are kept near their feature.
- `src/HomeView.tsx` — the main homepage view.
- `src/shared/` — reusable UI, contexts, domain types, Supabase clients, query hooks, SEO/URL helpers, sanitization, analytics, Cloudinary, MFA, and rate limiting.
- `src/test/` — Vitest/Testing Library tests and shared test setup.
- `supabase/migrations/` — database schema changes; `supabase/functions/` — Deno edge functions.
- `src/middleware.ts` — Supabase SSR session refresh plus route, role, and MFA protection.
- `next.config.ts` — security headers/CSP and external image configuration.

## Commands

This repository uses npm (`package-lock.json`).

```bash
npm install          # install dependencies
npm run dev          # Next.js dev server at http://localhost:3000
npm run type-check   # strict TypeScript check, no emit
npm test             # run Vitest once
npm run test:watch   # Vitest watch mode
npm run test:coverage
npm run build        # production build
npm start            # serve the production build
```

There is no lint script configured. Use `npm run type-check`, the relevant Vitest tests, and `npm run build` for validation.

## Database and local Supabase

Schema changes live in `supabase/migrations/`. The remote project `tivlllahuykbfnawwhba` is linked (see `supabase/.temp/linked-project.json`).

```bash
supabase start                    # local stack (API 54321, DB 54322, Studio 54323)
supabase start -x studio          # same without Studio, if its health check fails
supabase db reset                 # drop and replay every migration from scratch
supabase stop
supabase migration list --linked  # local vs remote applied versions
```

`supabase/migrations/20240601000000_baseline_schema.sql` is the **baseline**: a `pg_dump --schema-only` of the production `public` schema, taken from the point before the first versioned migration. It is required because the base tables (`profiles`, `products`, `trainings`, `orders`, `quotes`, …) were created from the Supabase dashboard, so no migration ever created them and `db reset` failed on the first migration with `relation "public.products" does not exist`. Every later migration replays on top of it, which is what makes a fresh local environment possible.

This version is not in the remote migration history, so `supabase db push` would try to replay the dump against production and fail on its non-idempotent `CREATE POLICY` / `CREATE INDEX` statements. Mark it as applied once before any push:

```bash
supabase migration repair --status applied 20240601000000
```

Two dashboard-only objects are handled explicitly:

- `on_auth_user_created` (trigger on `auth.users` → `public.handle_new_user()`) is **added to the baseline**; without it, signups in a rebuilt environment create no `profiles` row.
- the `trigger-send-emails` webhook on `emails_queue` is **omitted**: its argument embeds a `service_role` token and its URL targets the production edge function, so a local insert would send real emails to real customers.

Observed quirks of the local stack: `supabase start` can exit non-zero on the Studio health check (`container is not ready: starting`) even though the database came up and every migration applied — `-x studio` or `--ignore-health-check` gets past it. A container-start race can also make the first `db reset` fail with `error running container: exit 1`; rerunning succeeds. `supabase config.toml` changes only apply after `supabase stop` then `supabase start`.

The per-account sign-in lockout (`20260913000100_password_signin_lockout.sql`) is enabled locally by `[auth.hook.password_verification_attempt]` in `supabase/config.toml`. Supabase Auth returns the hook's message with `error_code: invalid_credentials`, so the client recognises a lockout only by its text — see `src/shared/lib/login-lockout.ts`. `AuthModal` then shows the remaining delay and disables the submit button until it elapses; the raw message alone would leave the user retrying a password the server will refuse.

## Deployment

Two Vercel projects are built from this single repository, both in the `jehubins-projects` team (`team_rYYkCIBsa1nD8cSRQb2dyHWn`):

| Project | Production domain | `APP_MODE` |
| --- | --- | --- |
| `gcfi-telecom` | `www.gcfi-rca.com` | unset → production default `public` (public site only) |
| `gcfi-admin` | `mybackoffice.gcfi-rca.com` | `admin` (backoffice only) |

The Vercel Git integration is **not connected** to this repository, so `git push` does not trigger a deployment. Deploy from the CLI instead:

```bash
npm run deploy:admin    # gcfi-admin  → mybackoffice.gcfi-rca.com
npm run deploy:public   # gcfi-telecom → www.gcfi-rca.com
npm run deploy          # both, admin then public
npm run verify:deploy   # check both domains without deploying
```

Each deploy script runs `vercel deploy --prod --project <project> --scope team_rYYkCIBsa1nD8cSRQb2dyHWn --yes`, then verifies its own domain through `scripts/verify-deploy.mjs` (non-zero exit on any mismatch, so a deploy without a working middleware fails loudly). Run the commands on separate lines: pasting both onto one line merges the arguments and `vercel` rejects `--project`.

Set `APP_MODE` explicitly on each project rather than relying on the production default: unset resolves to `public`, which redirects `/admin` **and** `/admin-login` to `/` and makes the backoffice login unreachable. After deploying, check that `/admin` returns `307 → /admin-login` on the admin domain, and on the public domain that `/admin` and `/admin-login` return `307 → /` while `/api/admin/*` returns `404`.

## Conventions

- Use the `@/*` alias for imports from `src/*`.
- Client components start with `'use client'`. UI uses Tailwind CSS v4, CSS variables, `motion/react`, and `lucide-react`; the brand red is `#C1272D`.
- Keep browser Supabase code in `src/shared/lib/supabase.ts` and server Supabase code in `supabase-server.ts`; do not use browser clients in server-only or middleware code.
- Prefer feature services and TanStack Query hooks from `src/shared/lib/queries.ts` for data access. Use exported query-key constants when invalidating cache; avoid raw `useEffect` fetching.
- Services generally use plain-object singletons, shared domain types, error logging, and safe empty results on failure.
- TypeScript is strict. Shared types in `src/shared/types/` must stay synchronized with Supabase migrations.
- `LanguageContext` defaults to French, persists as `gcfi-lang`, and localized database queries use the active `lang` value.
- Roles are stored in `profiles.role` as `client`, `admin`, or `superadmin`. Admin routes require the appropriate role; enabled TOTP MFA also requires a valid signed `mfa_verified` cookie.

## Gotchas and constraints

- Copy required environment variable names from `.env.example`; do not commit secrets. `NEXT_PUBLIC_*` values are client-visible. Keep `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`, and `MFA_COOKIE_SECRET` server-only. `MFA_COOKIE_SECRET` must be at least 32 characters. `SUPERADMIN_EMAIL` is server-only; `NEXT_PUBLIC_PUBLIC_SITE_URL` is the public site link used by the admin deployment's back button.
- Use `siteUrl()` from `src/shared/lib/site-url.ts` for canonical URLs, metadata, sitemap, robots, structured data, and email links. It uses `NEXT_PUBLIC_SITE_URL` and falls back to `https://www.gcfi-rca.com`; avoid hardcoding the domain.
- `APP_MODE` controls deployment exposure: `public` hides admin routes, `admin` serves only backoffice/support routes, and `all` is for local development. Production defaults to `public` when unset.
- Supabase schema changes belong in `supabase/migrations/`. Middleware must remain Edge-compatible and use Web Crypto APIs. Its matcher deliberately skips static assets and SEO endpoints (`sitemap.xml`, `robots.txt`, validation files) to avoid a Supabase `getUser()` round-trip on every crawler request.
- When adding an external image or media host, update both the CSP in `next.config.ts` and `images.remotePatterns`. Cloudinary reads use `res.cloudinary.com`; uploads use `api.cloudinary.com`.
- Tests run in jsdom with globals enabled, the `@/*` alias, and setup at `src/test/setup.ts`. Coverage excludes `src/app/**`, test files, and declaration files.
- Keep public SEO endpoints dynamic under `src/app/`; do not add competing static sitemap or robots files under `public/`.
- **Next special files must live under `src/`, never at the repo root.** With the App Router at `src/app`, Next computes the special-file root as `join(pagesDir || appDir, '..')` = `src/`, so a root-level `middleware.ts` or `instrumentation.ts` is silently ignored: the build succeeds but the file is never compiled. For middleware that means `.next/server/middleware-manifest.json` stays empty and no route/role/MFA/`APP_MODE` protection runs. Keep middleware at `src/middleware.ts`, and any future instrumentation at `src/instrumentation.ts`. `src/test/middleware-location.test.ts` fails if either file appears at the repo root. Verify a deployed change with `curl` (e.g. `/admin` must 307 to `/admin-login` when unauthenticated).
