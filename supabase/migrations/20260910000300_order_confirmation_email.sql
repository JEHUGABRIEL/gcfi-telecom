-- ============================================================
-- Email de confirmation de commande
--
-- Le mécanisme prévu ne fonctionnait pas : `useOrderNotification` écoutait un
-- CustomEvent `gcfi:order-placed` qui n'était émis que dans les tests, et le
-- hook n'était monté nulle part. `StoreService.createOrder` était lui aussi du
-- code mort — la commande est insérée en ligne dans `handleCheckout`.
-- Résultat : aucune confirmation n'a jamais été mise en file.
--
-- Le déclenchement passe donc par la base plutôt que par le navigateur. Un
-- CustomEvent est fragile ici : `handleCheckout` ouvre WhatsApp dans la
-- foulée, et si l'onglet part avant que l'envoi soit lancé, rien ne se
-- produit. Un trigger s'exécute dans la même transaction que l'insertion de
-- la commande, quel que soit le chemin d'appel — y compris ceux à venir.
-- ============================================================

CREATE OR REPLACE FUNCTION public.queue_order_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_name       text;
  v_items_html text;
  v_html       text;
BEGIN
  -- Sans destinataire, rien à envoyer.
  IF NEW.customer_email IS NULL OR NEW.customer_email = '' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(p.full_name, ''), 'Client')
  INTO v_name
  FROM public.profiles p
  WHERE p.id = NEW.customer_id;

  v_name := COALESCE(v_name, 'Client');

  -- Une ligne de tableau par article. `to_char` avec un séparateur littéral
  -- plutôt que 'G' : ce dernier dépend de lc_numeric du serveur et donnerait
  -- un rendu variable.
  SELECT COALESCE(string_agg(
    format(
      '<tr style="border-bottom:1px solid #e5e7eb;">'
      '<td style="padding:12px;text-align:left;">%s</td>'
      '<td style="padding:12px;text-align:center;">%s</td>'
      '<td style="padding:12px;text-align:right;">%s FCFA</td></tr>',
      COALESCE(it->>'name', 'Article'),
      COALESCE(it->>'quantity', '1'),
      replace(to_char(COALESCE((it->>'price')::numeric, 0), 'FM999,999,999'), ',', ' ')
    ), ''), '')
  INTO v_items_html
  FROM jsonb_array_elements(
    CASE jsonb_typeof(NEW.items) WHEN 'array' THEN NEW.items ELSE '[]'::jsonb END
  ) AS it;

  -- La commande se finalise sur WhatsApp : la table `orders` ne porte aucune
  -- adresse de livraison. On ne promet donc pas ce qu'on n'a pas — le bloc
  -- « adresse » du gabarit d'origine est remplacé par un rappel du canal réel.
  v_html := format(
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">'
    '<div style="background:linear-gradient(135deg,#C1272D 0%%,#1E4D8C 100%%);padding:40px;text-align:center;color:white;">'
    '<h1 style="margin:0;">Commande confirmée ✓</h1></div>'
    '<div style="padding:40px;background:#f9fafb;">'
    '<p style="font-size:16px;color:#333;">Bonjour %s,</p>'
    '<p style="font-size:14px;color:#666;line-height:1.6;">Merci pour votre commande ! Voici le récapitulatif de votre achat.</p>'
    '<div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border:1px solid #e5e7eb;">'
    '<p style="font-size:12px;color:#999;margin:0;">Numéro de commande</p>'
    '<p style="font-size:18px;font-weight:bold;color:#C1272D;margin:5px 0;">%s</p></div>'
    '<table style="width:100%%;border-collapse:collapse;margin:20px 0;">'
    '<thead style="background:#f3f4f6;"><tr>'
    '<th style="padding:12px;text-align:left;color:#333;">Produit</th>'
    '<th style="padding:12px;text-align:center;color:#333;">Qté</th>'
    '<th style="padding:12px;text-align:right;color:#333;">Prix</th></tr></thead>'
    '<tbody>%s'
    '<tr style="background:#f9fafb;">'
    '<td colspan="2" style="padding:12px;text-align:right;font-weight:bold;color:#333;">Total :</td>'
    '<td style="padding:12px;text-align:right;font-weight:bold;color:#C1272D;font-size:16px;">%s FCFA</td>'
    '</tr></tbody></table>'
    '<div style="background:#eff6ff;padding:15px;border-radius:8px;border-left:4px solid #C1272D;">'
    '<p style="font-size:14px;color:#333;margin:0;">Notre équipe vous recontacte sur WhatsApp pour convenir de la livraison et du règlement.</p></div>'
    '<div style="margin:30px 0;text-align:center;">'
    '<a href="https://www.gcfi-rca.com/profil" style="background:#C1272D;color:white;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Suivre ma commande</a></div>'
    '<p style="font-size:12px;color:#999;line-height:1.6;">Livraison estimée : 2-3 jours ouvrables à Bangui, 5-7 jours en province.</p>'
    '</div></div>',
    v_name,
    NEW.id,
    v_items_html,
    replace(to_char(COALESCE(NEW.total, 0), 'FM999,999,999'), ',', ' ')
  );

  INSERT INTO public.emails_queue ("to", subject, html, text, status, created_at)
  VALUES (
    NEW.customer_email,
    format('Commande confirmée #%s', NEW.id),
    v_html,
    '',
    'pending',
    now()
  );

  RETURN NEW;

EXCEPTION
  -- Un problème d'email ne doit jamais faire échouer une commande. On trace
  -- et on laisse passer.
  WHEN OTHERS THEN
    RAISE WARNING '[queue_order_confirmation] commande % : %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS queue_order_confirmation ON public.orders;
CREATE TRIGGER queue_order_confirmation
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.queue_order_confirmation();
