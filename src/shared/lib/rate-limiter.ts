import { supabase } from './supabase';

const CONFIG = { maxUploadsPerDay: 50 };

export async function checkRateLimit(userId: string) {
  const lastUploadKey = `last_upload_${userId}`;
  const lastUpload = localStorage.getItem(lastUploadKey);
  
  if (lastUpload && Date.now() - parseInt(lastUpload) < 30000) {
    return { allowed: false, reason: 'Attends 30 secondes avant de réessayer.' };
  }

  try {
    const { data } = await supabase
      .from('upload_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      if (data.is_banned) return { allowed: false, reason: 'Compte bloqué.' };
      if (new Date() >= new Date(data.reset_at)) {
        await supabase.from('upload_rate_limits')
          .update({ upload_count: 0, reset_at: new Date(Date.now() + 86400000).toISOString(), is_banned: false })
          .eq('user_id', userId);
      } else if (data.upload_count >= CONFIG.maxUploadsPerDay) {
        await supabase.from('upload_rate_limits').update({ is_banned: true }).eq('user_id', userId);
        return { allowed: false, reason: `Limite quotidienne atteinte (${CONFIG.maxUploadsPerDay} uploads).` };
      }
    }
  } catch (err) {
    console.error('[RateLimit]', err);
  }

  return { allowed: true };
}

export async function recordUpload(userId: string) {
  localStorage.setItem(`last_upload_${userId}`, Date.now().toString());
  const { data } = await supabase.from('upload_rate_limits').select('*').eq('user_id', userId).single();
  if (data) {
    await supabase.from('upload_rate_limits').update({ upload_count: data.upload_count + 1 }).eq('user_id', userId);
  } else {
    await supabase.from('upload_rate_limits').insert([{ user_id: userId, upload_count: 1, reset_at: new Date(Date.now() + 86400000).toISOString(), is_banned: false }]);
  }
}