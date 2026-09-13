#!/usr/bin/env node
// Vérification post-déploiement : confirme que le middleware applique bien
// APP_MODE sur chaque domaine. Sans lui (ou avec le mauvais mode), le
// backoffice renvoie vers les pages publiques — d'où ces assertions.
// Code de sortie non nul si une vérification échoue.
//
// Usage : node scripts/verify-deploy.mjs [admin|public]
//   admin  → ne vérifie que mybackoffice.gcfi-rca.com
//   public → ne vérifie que www.gcfi-rca.com
//   absent → vérifie les deux

const ADMIN_URL = process.env.VERIFY_ADMIN_URL ?? 'https://mybackoffice.gcfi-rca.com';
const PUBLIC_URL = process.env.VERIFY_PUBLIC_URL ?? 'https://www.gcfi-rca.com';

const CHECKS = [
  // Backoffice — APP_MODE=admin : tout mène à la connexion admin.
  { target: 'admin', label: 'BO  /admin redirige vers la connexion', url: `${ADMIN_URL}/admin`, expect: { status: 307, location: `${ADMIN_URL}/admin-login` } },
  { target: 'admin', label: 'BO  /admin-login est accessible',       url: `${ADMIN_URL}/admin-login`, expect: { status: 200 } },
  { target: 'admin', label: 'BO  / redirige vers la connexion',      url: `${ADMIN_URL}/`, expect: { status: 307, location: `${ADMIN_URL}/admin-login` } },

  // Site public — APP_MODE=public : le backoffice n'est jamais exposé.
  { target: 'public', label: 'PUB / reste accessible',        url: `${PUBLIC_URL}/`, expect: { status: 200 } },
  { target: 'public', label: 'PUB /admin est bloqué',         url: `${PUBLIC_URL}/admin`, expect: { status: 307, location: `${PUBLIC_URL}/` } },
  { target: 'public', label: 'PUB /admin-login est bloqué',   url: `${PUBLIC_URL}/admin-login`, expect: { status: 307, location: `${PUBLIC_URL}/` } },
  { target: 'public', label: 'PUB /api/admin/* est masqué',   url: `${PUBLIC_URL}/api/admin/users/x`, expect: { status: 404 } },
];

// Une promotion de domaine prend parfois quelques secondes après le `vercel deploy`.
const RETRIES = 3;
const RETRY_DELAY_MS = 3000;
const REQUEST_TIMEOUT_MS = 15000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function probe(check) {
  let actual = { status: null, location: null, error: null };

  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const res = await fetch(check.url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      // Vercel renvoie un `Location` relatif (`/admin-login`) : on le résout pour
      // pouvoir comparer des URL absolues, comme le fait `curl -w %{redirect_url}`.
      const rawLocation = res.headers.get('location');
      const location = rawLocation ? new URL(rawLocation, check.url).toString() : null;
      actual = { status: res.status, location, error: null };

      const statusOk = res.status === check.expect.status;
      const locationOk = !check.expect.location || actual.location === check.expect.location;
      if (statusOk && locationOk) return { ok: true, ...actual };
    } catch (error) {
      actual = { status: null, location: null, error: error.message };
    }

    if (attempt < RETRIES) await sleep(RETRY_DELAY_MS);
  }

  return { ok: false, ...actual };
}

function describe(status, location) {
  if (status === null) return 'aucune réponse';
  return `${status}${location ? ` → ${location}` : ''}`;
}

async function main() {
  const target = process.argv[2];
  if (target && target !== 'admin' && target !== 'public') {
    console.error(`Cible inconnue : "${target}" (attendu : admin ou public).`);
    process.exitCode = 2;
    return;
  }

  const checks = CHECKS.filter((check) => !target || check.target === target);
  console.log(`Vérification du déploiement (${target ?? 'admin + public'}) — ${checks.length} contrôles\n`);

  let failures = 0;
  for (const check of checks) {
    const result = await probe(check);
    const got = describe(result.status, result.location);

    if (result.ok) {
      console.log(`✓ ${check.label} : ${got}`);
      continue;
    }

    failures += 1;
    const expected = describe(check.expect.status, check.expect.location);
    console.log(`✗ ${check.label} : ${got} (attendu ${expected})${result.error ? ` — ${result.error}` : ''}`);
  }

  if (failures > 0) {
    console.error(`\n${failures}/${checks.length} contrôle(s) en échec.`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n${checks.length}/${checks.length} contrôles OK.`);
}

main().catch((error) => {
  console.error('Échec inattendu de la vérification :', error);
  process.exitCode = 1;
});
