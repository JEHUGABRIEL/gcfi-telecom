import { useEffect } from 'react';
import { sendOrderConfirmationEmail } from '@/shared/lib/email-service';

interface OrderData {
  customerEmail: string;
  orderId: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  deliveryAddress: string;
}

export function useOrderNotification() {
  useEffect(() => {
    const handler = async (event: Event) => {
      const { orderData } = (event as CustomEvent<{ orderData: OrderData }>).detail;
      if (!orderData?.customerEmail) return;

      try {
        await sendOrderConfirmationEmail(orderData.customerEmail, orderData);
      } catch {
        console.error('[OrderNotification] Erreur lors de l\'envoi de l\'email');
      }
    };

    window.addEventListener('gcfi:order-placed', handler);
    return () => window.removeEventListener('gcfi:order-placed', handler);
  }, []);
}
