import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/shared/lib/supabase-server';
import { SITE_URL } from '@/shared/lib/site-url';

// `/api/auth/forgot-password` refuse volontairement les comptes admin : sans
// cela, n'importe qui pourrait déclencher l'envoi de liens de réinitialisation
// vers une boîte d'administration. Un admin n'avait donc aucun moyen de
// réinitialiser son mot de passe. Cette route comble ce manque, mais depuis
// une session déjà authentifiée.
//
// L'adresse visée n'est jamais lue dans le corps de la requête : elle vient de
// la session serveur. Un admin ne peut donc déclencher un envoi que vers sa
// propre boîte, et la route ne peut pas servir à spammer un tiers.

const ALLOWED_ORIGINS = [SITE_URL, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'];

// Un lien de réinitialisation reste valide un moment : inutile d'en envoyer
// plusieurs à la suite. Empêche aussi de transformer la route en robinet à
// emails si une session admin est compromise.
const COOLDOWN_MS = 5 * 60 * 1000;

function safeOrigin(request: NextRequest): string {
  const requestOrigin = new URL(request.url).origin;
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : SITE_URL;
}

export async function POST(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[admin-password-reset] SUPABASE_SERVICE_ROLE_KEY manquant');
    return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 });
  }

  // 1. Session — l'identité vient du cookie, pas du client.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // 2. Rôle — vérifié avec la clé service pour ne pas dépendre des policies RLS.
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, password_reset_requested_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // 3. Anti-répétition.
  const lastRequest = profile.password_reset_requested_at;
  if (lastRequest) {
    const elapsed = Date.now() - new Date(lastRequest).getTime();
    if (elapsed < COOLDOWN_MS) {
      const retryInMin = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
      return NextResponse.json(
        { error: `Un lien vient d'être envoyé. Réessayez dans ${retryInMin} min.` },
        { status: 429 }
      );
    }
  }

  // 4. Envoi du lien vers l'adresse de la session.
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await anonClient.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${safeOrigin(request)}/reset-password`,
  });

  if (error) {
    console.error('[admin-password-reset] Envoi impossible :', error.message);
    return NextResponse.json({ error: "L'envoi a échoué. Réessayez plus tard." }, { status: 502 });
  }

  await adminClient
    .from('profiles')
    .update({ password_reset_requested_at: new Date().toISOString() })
    .eq('id', user.id);

  // L'adresse est renvoyée pour que l'interface indique où regarder — elle
  // provient de la session, donc elle n'apprend rien au demandeur.
  return NextResponse.json({ success: true, email: user.email });
}
