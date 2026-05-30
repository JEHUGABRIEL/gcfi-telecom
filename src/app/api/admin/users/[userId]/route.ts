import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type Role = 'client' | 'admin';
type BlockType = '1h' | '24h' | '7d' | '30d' | 'permanent';
type Action = 'setRole' | 'block' | 'unblock';

// Helper : client authentifié (lit la session depuis les cookies de la requête)
async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            );
          } catch { /* headers already sent */ }
        },
      },
    }
  );
}

// Helper : client admin (service role — bypass RLS pour les opérations privilégiées)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'userId manquant' }, { status: 400 });
  }

  // 1. Authentifier l'appelant via sa session Supabase
  const supabase = await createAuthClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // 2. Vérifier le rôle de l'appelant avec le service role (non soumis aux RLS)
  const adminClient = createAdminClient();

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || (callerProfile.role !== 'admin' && callerProfile.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const isSuperAdmin = callerProfile.role === 'superadmin';

  // 3. Empêcher toute action sur soi-même
  if (userId === user.id) {
    return NextResponse.json({ error: 'Action impossible sur votre propre compte' }, { status: 403 });
  }

  // 4. Récupérer le profil cible
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  // 5. Interdire toute action sur un superadmin
  if (targetProfile.role === 'superadmin') {
    return NextResponse.json({ error: 'Impossible de modifier un superadmin' }, { status: 403 });
  }

  // 6. Un admin simple ne peut agir que sur les clients
  if (!isSuperAdmin && targetProfile.role !== 'client') {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
  }

  // 7. Parser le body et dispatcher l'action
  let body: { action: Action; role?: Role; blockType?: BlockType };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { action } = body;

  switch (action) {
    case 'setRole': {
      const { role } = body;
      if (!role || !['client', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
      }
      if (role === 'admin' && !isSuperAdmin) {
        return NextResponse.json({ error: 'Seul un superadmin peut promouvoir en admin' }, { status: 403 });
      }
      const { error } = await adminClient.from('profiles').update({ role }).eq('id', userId);
      if (error) return NextResponse.json({ error: 'Échec de la mise à jour' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case 'block': {
      const { blockType } = body;
      if (!blockType || !['1h', '24h', '7d', '30d', 'permanent'].includes(blockType)) {
        return NextResponse.json({ error: 'Type de blocage invalide' }, { status: 400 });
      }

      const update: Record<string, unknown> = {
        block_reason: 'Bloqué par un administrateur',
        is_blocked: false,
        blocked_until: null,
      };

      if (blockType === 'permanent') {
        update.is_blocked = true;
      } else {
        const durations: Record<string, number> = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 };
        update.blocked_until = new Date(Date.now() + (durations[blockType] ?? 24) * 3_600_000).toISOString();
      }

      const { error } = await adminClient.from('profiles').update(update).eq('id', userId);
      if (error) return NextResponse.json({ error: 'Échec du blocage' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case 'unblock': {
      const { error } = await adminClient
        .from('profiles')
        .update({ is_blocked: false, blocked_until: null, block_reason: null })
        .eq('id', userId);
      if (error) return NextResponse.json({ error: 'Échec du déblocage' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  }
}
