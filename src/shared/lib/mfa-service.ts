// ================================================================
// GCFI — MFA via TOTP (Google Authenticator / Authy)
// • Complètement gratuit — aucune API externe
// • Compatible Google Authenticator, Authy, et toutes apps TOTP
// ================================================================

import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { supabase } from './supabase';

const APP_NAME = 'GCFI Telecom';

// ----------------------------------------------------------------
// Génère un secret TOTP et retourne l'URI + QR code (base64)
// ----------------------------------------------------------------
export async function setupTOTP(userId: string, email: string): Promise<{
  secret: string;
  uri: string;
  qrCode: string;
}> {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });

  const secret = totp.secret.base32;
  const uri = totp.toString();

  // Générer le QR code en base64
  const qrCode = await QRCode.toDataURL(uri);

  // Sauvegarder le secret chiffré côté Supabase
  await supabase.from('user_mfa_settings').upsert([{
    user_id: userId,
    secret,
    enabled: false, // activé seulement après vérification
  }], { onConflict: 'user_id' });

  return { secret, uri, qrCode };
}

// ----------------------------------------------------------------
// Vérifie un code TOTP à 6 chiffres
// ----------------------------------------------------------------
export async function verifyTOTPCode(userId: string, token: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_mfa_settings')
    .select('secret')
    .eq('user_id', userId)
    .single();

  if (!data?.secret) return false;

  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(data.secret),
  });

  // delta: ±1 période (30s) pour tolérer les décalages d'horloge
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

// ----------------------------------------------------------------
// Active le MFA après vérification du premier code
// ----------------------------------------------------------------
export async function enableMFAForUser(userId: string): Promise<void> {
  await supabase
    .from('user_mfa_settings')
    .update({ enabled: true })
    .eq('user_id', userId);
}

// ----------------------------------------------------------------
// Désactive le MFA
// ----------------------------------------------------------------
export async function disableMFAForUser(userId: string): Promise<void> {
  await supabase
    .from('user_mfa_settings')
    .update({ enabled: false })
    .eq('user_id', userId);
}

// ----------------------------------------------------------------
// Récupère les paramètres MFA de l'utilisateur
// ----------------------------------------------------------------
export async function getUserMFASettings(userId: string) {
  const { data } = await supabase
    .from('user_mfa_settings')
    .select('enabled, secret')
    .eq('user_id', userId)
    .single();
  return data;
}

// ----------------------------------------------------------------
// Vérifie si le MFA est activé pour un utilisateur
// ----------------------------------------------------------------
export async function isMFAEnabled(userId: string): Promise<boolean> {
  const settings = await getUserMFASettings(userId);
  return settings?.enabled === true;
}

// Gardés pour compatibilité avec l'ancien code (non utilisés avec TOTP)
export async function generateMFACode(_userId: string): Promise<string> {
  throw new Error('generateMFACode est remplacé par setupTOTP. Utilisez verifyTOTPCode.');
}

export async function sendMFAViaWhatsApp(_phone: string, _code: string): Promise<void> {
  throw new Error('WhatsApp MFA remplacé par TOTP (Google Authenticator). Gratuit et plus sécurisé.');
}

export async function cleanExpiredMFACodes(): Promise<void> {
  // TOTP n'utilise pas de codes en base de données — rien à nettoyer
}
