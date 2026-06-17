import { supabase } from './supabase';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}


export async function sendOrderConfirmationEmail(
  email: string,
  orderData: {
    orderId: string;
    customerName: string;
    items: { name: string; quantity: number; price: number }[];
    totalAmount: number;
    deliveryAddress: string;
  }
): Promise<void> {
  const itemsHtml = orderData.items
    .map(
      item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${item.name}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">${item.price.toLocaleString('fr-FR')} FCFA</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #C1272D 0%, #1E4D8C 100%); padding: 40px; text-align: center; color: white;">
        <h1 style="margin: 0;">Commande confirmée ✓</h1>
      </div>
      <div style="padding: 40px; background: #f9fafb;">
        <p style="font-size: 16px; color: #333;">Bonjour ${orderData.customerName},</p>
        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Merci pour votre commande ! Voici les détails de votre achat.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #999; margin: 0;">Numéro de commande</p>
          <p style="font-size: 18px; font-weight: bold; color: #C1272D; margin: 5px 0;">${orderData.orderId}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead style="background: #f3f4f6;">
            <tr>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #333;">Produit</th>
              <th style="padding: 12px; text-align: center; font-weight: bold; color: #333;">Qté</th>
              <th style="padding: 12px; text-align: right; font-weight: bold; color: #333;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr style="background: #f9fafb;">
              <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; color: #333;">Total :</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; color: #C1272D; font-size: 16px;">
                ${orderData.totalAmount.toLocaleString('fr-FR')} FCFA
              </td>
            </tr>
          </tbody>
        </table>

        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #C1272D;">
          <p style="font-size: 12px; color: #666; margin: 0; font-weight: bold;">📍 Adresse de livraison</p>
          <p style="font-size: 14px; color: #333; margin: 5px 0;">${orderData.deliveryAddress}</p>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <a href="https://www.gcfi-rca.com/#/profil" style="background: #C1272D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Suivre ma commande
          </a>
        </div>

        <p style="font-size: 12px; color: #999; line-height: 1.6;">
          Vous recevrez un email de suivi dès que votre commande sera expédiée.<br>
          Livraison estimée : 2-3 jours ouvrables à Bangui, 5-7 jours en provinces.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Commande confirmée #${orderData.orderId}`,
    html,
  });
}

export async function sendCourseEnrollmentEmail(
  email: string,
  courseData: {
    courseName: string;
    studentName: string;
    startDate: string;
    instructor: string;
  }
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #C1272D 0%, #1E4D8C 100%); padding: 40px; text-align: center; color: white;">
        <h1 style="margin: 0;">Inscription confirmée ✓</h1>
      </div>
      <div style="padding: 40px; background: #f9fafb;">
        <p style="font-size: 16px; color: #333;">Bonjour ${courseData.studentName},</p>
        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Félicitations ! Vous êtes maintenant inscrit à la formation <strong>${courseData.courseName}</strong>.
        </p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #999; margin: 5px 0;">📚 Formation</p>
          <p style="font-size: 16px; font-weight: bold; color: #333; margin: 5px 0;">${courseData.courseName}</p>
          
          <p style="font-size: 12px; color: #999; margin: 15px 0 5px 0;">📅 Date de début</p>
          <p style="font-size: 14px; color: #333; margin: 5px 0;">${courseData.startDate}</p>
          
          <p style="font-size: 12px; color: #999; margin: 15px 0 5px 0;">👨‍🏫 Instructeur</p>
          <p style="font-size: 14px; color: #333; margin: 5px 0;">${courseData.instructor}</p>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="font-size: 12px; color: #666; margin: 0;">
            <strong>💡 Prochaines étapes :</strong><br>
            1. Accédez à votre espace étudiant<br>
            2. Téléchargez les supports de cours<br>
            3. Participez aux sessions en direct<br>
            4. Complétez les exercices pratiques
          </p>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <a href="https://www.gcfi-rca.com/#/profil" style="background: #C1272D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Accéder à la formation
          </a>
        </div>

        <p style="font-size: 12px; color: #999; line-height: 1.6;">
          Questions ? Contactez notre équipe pédagogique à formation@gcfi-rca.com<br>
          Support WhatsApp : +236 61 37 14 49
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Bienvenue à ${courseData.courseName}`,
    html,
  });
}

async function sendEmail(emailData: EmailTemplate): Promise<void> {
  try {
    const { error } = await supabase
      .from('emails_queue')
      .insert([{
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || '',
        status: 'pending',
        created_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('[Email] Queue error:', error);
      throw error;
    }

  } catch (err) {
    console.error('[Email] Send error:', err);
    // Ne pas throw pour ne pas bloquer l'app
  }
}