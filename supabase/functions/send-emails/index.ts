// ================================================================
// GCFI — Edge Function : envoi d'emails via Brevo (gratuit)
// • 300 emails/jour GRATUIT (brevo.com)
// • Aucun paiement requis
//
// Variables Supabase à configurer :
//   supabase secrets set BREVO_API_KEY=xkeysib-xxxxx
// ================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const BREVO_SENDER_EMAIL = "noreply@gcfi-rca.com";
const BREVO_SENDER_NAME  = "GCFI Telecom";

async function sendViaBrevo(to: string, subject: string, html: string): Promise<boolean> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY || "",
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  return response.ok;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!BREVO_API_KEY) {
    return new Response(
      JSON.stringify({ error: "BREVO_API_KEY manquant. Configurez-le avec : supabase secrets set BREVO_API_KEY=xkeysib-..." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("emails_queue")
      .select("*")
      .eq("status", "pending")
      .limit(10);

    if (fetchError) throw fetchError;
    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let sent = 0;

    for (const email of pendingEmails) {
      const ok = await sendViaBrevo(email.to, email.subject, email.html);

      await supabase
        .from("emails_queue")
        .update({
          status: ok ? "sent" : "failed",
          sent_at: ok ? new Date().toISOString() : null,
        })
        .eq("id", email.id);

      if (ok) sent++;
    }

    return new Response(JSON.stringify({ sent, total: pendingEmails.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Worker error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
