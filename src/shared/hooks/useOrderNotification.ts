import { useEffect } from 'react';
import { sendOrderConfirmationEmail } from '@/shared/lib/email-service';

interface OrderPlacedDetail {
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
      const { orderData } = (event as CustomEvent<{ orderData: OrderPlacedDetail }>).detail;
      if (orderData.customerEmail) {
        await sendOrderConfirmationEmail(orderData.customerEmail, orderData);
      }
    };

    window.addEventListener('gcfi:order-placed', handler);
    return () => window.removeEventListener('gcfi:order-placed', handler);
  }, []);
}