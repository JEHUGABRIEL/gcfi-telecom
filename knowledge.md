# GCFI Telecom — Project Knowledge

Next.js 15 (App Router) + React 19 + TypeScript corporate site for **GCFI Telecom**, a telecom/IT company in Bangui, Central African Republic. Features: e-commerce store (boutique), training courses (formation), services/expertise, blog/news, user profiles, and a role-based admin dashboard. UI text is French-first with an English mode. Deployed on Vercel.

## Commands

```bash
npm install          # setup
npm run dev          # dev server on http://localhost:3000 (port fixed in script)
npm run type-check   # tsc --noEmit
npm test             # vitest run (jsdom)
npm run test:watch   # vitest watch
npm run build        # next build
npm start            # production server
```

There is no linter/formatter configured — TS strict mode is the main gate.

## Architecture

- `src/app` — App Router pages and route groups: `(main)/` (public site incl. `/formation`, `/boutique`, `/blog`, `/realisations`, `/profil`, `/a-propos`, `/confidentialite`, `/conditions`), plus `admin/`, `admin-login/`, `auth/`, `reset-password/` and `api/` (auth, admin route handlers). `sitemap.ts` generates the sitemap from Supabase (products/trainings/blog_posts); the canonical domain comes from `NEXT_PUBLIC_SITE_URL` via `src/shared/lib/site-url.ts` (fallback: production domain). `layout.tsx` `metadataBase` uses the same helper.
- `src/modules/<feature>` — one folder per domain: `home`, `store`, `training`, `services`, `expertise`, `blog`, `about`, `profile`, `admin`, `legal`. Convention: a barrel `index.ts` exporting `export { default as <X>Module }` + `<X>Service`, with `components/` and `services/` subfolders. Note: the homepage body is `src/HomeView.tsx` (large sections incl. `#realisations`); the `/realisations/[id]` detail page renders `home` module's `AchievementDetail`.
- `src/shared` — cross-cutting code:
  - `context/` — React providers: `AuthContext`, `LanguageContext` (fr/en), `ThemeContext` (dark mode), `ContactContext`, `NotificationContext`.
  - `lib/` — `supabase.ts` (browser client), `supabase-server.ts` (server), `queries.ts` (all TanStack Query hooks), `site-url.ts` (canonical domain: `SITE_URL`/`siteUrl()` from `NEXT_PUBLIC_SITE_URL`), plus `mfa-service`, `email-service`, `rate-limiter`, `cloudinary`, `image-loader`, `analytics-service`, `structured-data`, `utils`.
  - `components/` — Header/Footer, auth + MFA modals, `ImageUpload`, `GlobalSearch`, `NotificationCenter`, etc.
  - `types/` — shared domain types.
- `supabase/` — `migrations/*.sql`, `config.toml`, seed SQL, and Deno edge functions in `functions/` (e.g. `send-emails`).
- `middleware.ts` — auth/role/MFA gate for `/profil` and `/admin`, using `@supabase/ssr`.
- `next.config.ts` — CSP + security headers; **custom image loader** (`src/shared/lib/image-loader.ts`) for Cloudinary CDN.

## Conventions

- **Path alias** `@/*` → `src/*` (tsconfig + vitest alias).
- **Services** are plain-object singletons (`export const XService = { async method(): Promise<T[]> {...} }`) that call Supabase, cast to shared types, and on error call `logError(...)` and return `[]`.
- **Data fetching**: TanStack Query hooks centralized in `src/shared/lib/queries.ts` (`useProducts`, `useTrainings`, `useNews`, `useCart`, admin `useAdmin*` hooks gated by role). Cache via exported `QUERY_KEYS` / `ADMIN_QUERY_KEYS`. No raw `useEffect` data fetches.
- **Types**: `strict: true`; domain types in `src/shared/types`.
- **Bilingual content (fr/en)**: `LanguageContext` exposes `t` translations + a `Translations` type; language persisted in localStorage key `gcfi-lang` (default `fr`). DB tables carrying localized content have a `lang` column — queries pass the current lang (e.g. `getLang()` in `queries.ts`). Realtime Supabase "readable" content is split per-language; several migrations deal with lang columns and dedup.
- **UI**: Tailwind CSS v4 (dark mode via class + CSS vars), `motion/react` for animation, `lucide-react` icons, brand red `#C1272D`. Client components start with `'use client'`; the `(main)/layout.tsx` is a client component that swaps in an admin header when the user has an admin role.
- **Auth/roles**: roles live on `profiles.role` (`client` | `admin` | `superadmin`). Admin area is enforced server-side in `middleware.ts`; optional TOTP MFA via `user_mfa_settings` + a signed `mfa_verified` cookie (HMAC, `MFA_COOKIE_SECRET`).
- **Canonical domain**: always use `SITE_URL`/`siteUrl()` from `src/shared/lib/site-url.ts` (env `NEXT_PUBLIC_SITE_URL`, fallback `https://www.gcfi-rca.com`) — used by `sitemap.ts`, `robots.ts`, `layout.tsx` `metadataBase`, `structured-data.ts` and email links. Never hardcode the domain in new code; note tests import `SITE_URL` rather than a literal.
- **SEO routes**: `src/app/sitemap.ts` and `src/app/robots.ts` are Next Metadata routes generated at request/build time. Do **not** add static `public/sitemap.xml` or `public/robots.txt` — a static file in `public/` **shadows** the route and silently breaks the dynamic sitemap.
- **Tests**: Vitest + Testing Library, files colocated in `src/test/`, setup in `src/test/setup.ts`, import via `@/` alias.
- **Commit messages**: mix of French/English conventional commits (`feat:`, `fix:`, `chore:`).

## Gotchas

- **External image/media hosts** must be added in **two** places: the CSP `img-src`/`connect-src` in `next.config.ts` **and** `images.remotePatterns`. Cloudinary images bypass the Next.js optimizer through the custom loader. NB Cloudinary needs **two** entries: `res.cloudinary.com` (read CDN, `img-src`) **and** `api.cloudinary.com` (upload XHR, `connect-src` — missing it fails silently in the browser as « Erreur réseau Cloudinary »).
- Port is fixed at **3000** (`next dev --port 3000`).
- Supabase client split matters: browser code uses `@/shared/lib/supabase`, server code `supabase-server.ts` — mixing them breaks SSR/edge usage. `middleware.ts` must stay Edge-compatible (uses `@supabase/ssr`, Web Crypto).
- The `(main)` layout is a client component; keep providers for theme/auth there.
- `.env.example` lists required env vars; `NEXT_PUBLIC_*` keys are exposed client-side, `SUPABASE_SERVICE_ROLE_KEY` and `MFA_COOKIE_SECRET` must stay server-only (min 32 chars).
- Supabase schema changes go through `supabase/migrations/`; runtime types are cast from shared types in `src/shared/types`, not generated — keep them in sync manually.
