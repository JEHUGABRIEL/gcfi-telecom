import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as OTPAuth from 'otpauth';
import { createHmac } from 'crypto';

const APP_NAME = 'GCFI Telecom';
const COOKIE_NAME = 'mfa_verified';
const COOKIE_TTL_SEC = 8 * 3600; // 8 heures
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function buildMFACookieValue(userId: string): string {
  const expiresAt = Date.now() + COOKIE_TTL_SEC * 1000;
  const payload = `${userId}|${expiresAt}`;
  const sig = createHmac('sha256', process.env.MFA_COOKIE_SECRET!)
    .update(payload)
    .digest('base64url');
  return `${payload}|${sig}`;
}

export async function POST(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.MFA_COOKIE_SECRET) {
    console.error('[verify-mfa] Variables d\'environnement manquantes');
    return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { userId, token } = body;

    if (
      typeof userId !== 'string' || userId.length < 1 ||
      typeof token !== 'string' || !/^\d{6}$/.test(token)
    ) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    // Lecture du secret avec la clé service (jamais exposée au client)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data } = await supabaseAdmin
      .from('user_mfa_settings')
      .select('secret, failed_attempts, locked_until')
      .eq('user_id', userId)
      .single();

    if (!data?.secret) {
      return NextResponse.json({ error: 'MFA non configuré' }, { status: 400 });
    }

    // Verrouillage anti-brute-force : après MAX_ATTEMPTS échecs, on bloque
    // toute nouvelle tentative pendant LOCKOUT_MS, quel que soit le code fourni.
    if (data.locked_until && new Date(data.locked_until) > new Date()) {
      const remainingMin = Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / 60000);
      return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${remainingMin} min.` }, { status: 429 });
    }

    const totp = new OTPAuth.TOTP({
      issuer: APP_NAME,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(data.secret),
    });

    // window: 1 tolère ±30s de décalage d'horloge
    const delta = totp.validate({ token, window: 1 });
    if (delta === null) {
      const attempts = (data.failed_attempts ?? 0) + 1;
      const lockingOut = attempts >= MAX_ATTEMPTS;
      await supabaseAdmin
        .from('user_mfa_settings')
        .update({
          failed_attempts: lockingOut ? 0 : attempts,
          locked_until: lockingOut ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null,
        })
        .eq('user_id', userId);
      return NextResponse.json({ error: 'Code incorrect ou expiré' }, { status: 401 });
    }

    // Succès : on repart d'un compteur propre.
    await supabaseAdmin
      .from('user_mfa_settings')
      .update({ failed_attempts: 0, locked_until: null })
      .eq('user_id', userId);

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, buildMFACookieValue(userId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_TTL_SEC,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
