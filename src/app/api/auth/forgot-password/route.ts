import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL } from '@/shared/lib/site-url';
import { consumeRateLimit, callerIp, ipKey, emailKey } from '@/shared/lib/auth-rate-limit';

// Origines de confiance pour le lien de réinitialisation. On ne fait jamais
// confiance au header Host brut de la requête (falsifiable côté client) —
// sinon un attaquant pourrait faire pointer le lien envoyé par email vers
// un domaine qu'il contrôle (empoisonnement du lien de reset).
const ALLOWED_ORIGINS = [
  SITE_URL,
  'http://localhost:3000', 'http://127.0.0.1:3000',
  'http://localhost:3001', 'http://127.0.0.1:3001',
];

// Deux garde-fous distincts, pour deux abus distincts.
//
// Par adresse IP : empêche de balayer des milliers d'emails depuis un même
// point. Renvoie un 429 franc — l'appelant n'apprend rien qu'il ne sache
// déjà sur son propre débit.
const IP_LIMIT = 5;
const IP_WINDOW_SEC = 15 * 60;

// Par email : empêche de bombarder la boîte d'une personne précise. Ici on
// répond SUCCESS sans envoyer, jamais 429 : un 429 révélerait qu'un envoi a
// eu lieu récemment pour cette adresse, ce qui trahirait l'existence du
// compte et ruinerait la protection contre l'énumération.
const EMAIL_LIMIT = 1;
const EMAIL_WINDOW_SEC = 5 * 60;

function safeOrigin(request: NextRequest): string {
  const requestOrigin = new URL(request.url).origin;
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : SITE_URL;
}

// Réponse identique qu'il y ait un compte ou non — évite l'énumération d'emails.
const SUCCESS = { success: true };

export async function POST(request: NextRequest) {
  let email: string;
  try {
    const body = await request.json();
    email = body?.email;
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[forgot-password] SUPABASE_SERVICE_ROLE_KEY manquant');
    return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 });
  }

  // Avant toute lecture en base : inutile de faire travailler la base pour un
  // appelant déjà hors quota.
  const perIp = await consumeRateLimit(
    ipKey('forgot', callerIp(request)), IP_LIMIT, IP_WINDOW_SEC
  );
  if (!perIp.allowed) {
    return NextResponse.json(
      { error: 'Trop de demandes. Réessayez plus tard.' },
      { status: 429, headers: { 'Retry-After': String(perIp.retryAfterSeconds) } }
    );
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Vérification du rôle côté serveur — non contournable par le client.
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (profile?.role === 'admin' || profile?.role === 'superadmin') {
    // Bloquer silencieusement — message identique pour ne pas révéler le statut admin.
    return NextResponse.json(SUCCESS);
  }

  // Un même destinataire ne reçoit pas deux liens coup sur coup. On sort en
  // SUCCESS sans envoyer : le lien précédent est encore valable.
  const perEmail = await consumeRateLimit(
    emailKey('forgot', email), EMAIL_LIMIT, EMAIL_WINDOW_SEC
  );
  if (!perEmail.allowed) {
    return NextResponse.json(SUCCESS);
  }

  // Pour les comptes normaux, envoyer le lien de réinitialisation.
  const origin = safeOrigin(request);
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  await anonClient.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
    redirectTo: `${origin}/reset-password`,
  });

  // Toujours répondre avec succès — ne pas révéler si l'email existe en base.
  return NextResponse.json(SUCCESS);
}
