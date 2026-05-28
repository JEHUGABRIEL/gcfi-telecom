import { supabase } from './supabase';

const MFA_WINDOW = 10 * 60 * 1000; // 10 min validity

export async function generateMFACode(userId: string): Promise<string> {
  const code = Math.random().toString().slice(2, 8).padEnd(6, '0');
  const expiresAt = new Date(Date.now() + MFA_WINDOW);

  await supabase.from('mfa_codes').insert([{
    user_id: userId,
    code,
    expires_at: expiresAt.toISOString(),
    used: false,
  }]);

  return code;
}

export async function sendMFAViaWhatsApp(phone: string, code: string): Promise<void> {
  // Intégration WhatsApp API (Twilio, etc.)
  // Pour MVP: juste log en console
  console.log(`[MFA] Code ${code} envoyé à ${phone}`);
  
  // TODO: Implémenter Twilio/MessageBird API
  // const response = await fetch('https://api.whatsapp.com/send', {
  //   method: 'POST',
  //   body: JSON.stringify({ phone, message: `Votre code GCFI: ${code}` }),
  // });
}

export async function verifyMFACode(userId: string, code: string): Promise<boolean> {
  const { data } = await supabase
    .from('mfa_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('code', code)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return false;

  // Marquer code comme utilisé
  await supabase
    .from('mfa_codes')
    .update({ used: true })
    .eq('id', data.id);

  return true;
}

export async function cleanExpiredMFACodes(): Promise<void> {
  await supabase
    .from('mfa_codes')
    .delete()
    .lt('expires_at', new Date().toISOString());
}

export async function enableMFAForUser(userId: string, phone: string): Promise<void> {
  await supabase
    .from('user_mfa_settings')
    .upsert([{ user_id: userId, phone, enabled: true }], { onConflict: 'user_id' });
}

export async function disableMFAForUser(userId: string): Promise<void> {
  await supabase
    .from('user_mfa_settings')
    .update({ enabled: false })
    .eq('user_id', userId);
}

export async function getUserMFASettings(userId: string) {
  const { data } = await supabase
    .from('user_mfa_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}