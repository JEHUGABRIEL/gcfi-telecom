import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  // Pour les comptes normaux, envoyer le lien de réinitialisation.
  // L'origine est dérivée de la requête entrante (fonctionne en dev et en prod).
  const origin = new URL(request.url).origin;
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
