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
