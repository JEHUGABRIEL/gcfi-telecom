import { supabase } from './supabase';

export async function trackPageView(page: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const device = /mobile|iphone|ipad|android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

    await supabase.from('analytics_page_views').insert([
      { page, device, user_id: user?.id ?? null, timestamp: new Date().toISOString() },
    ]);
  } catch {
    // Ne pas bloquer l'utilisateur
  }
}

export async function trackEvent(data: { event_type: string; user_id?: string; metadata?: Record<string, unknown> }): Promise<void> {
  try {
    let userId = data.user_id;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    await supabase.from('analytics_events').insert([
      {
        event_type: data.event_type,
        user_id: userId ?? null,
        metadata: data.metadata ?? null,
        timestamp: new Date().toISOString(),
      },
    ]);
  } catch {
    // Ne pas bloquer l'utilisateur
  }
}

export async function trackAddToCart(productId: string, productName: string, price: number): Promise<void> {
  await trackEvent({
    event_type: 'add_to_cart',
    metadata: { productId, productName, price },
  });
}

export async function trackPurchase(orderId: string, amount: number, itemCount: number): Promise<void> {
  await trackEvent({
    event_type: 'purchase',
    metadata: { orderId, amount, itemCount },
  });
}
