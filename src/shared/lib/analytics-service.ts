'use client';
import { supabase } from './supabase';

export interface PageView {
  page: string;
  timestamp: string;
  user_id?: string;
  referrer?: string;
  device?: string;
}

export interface UserEvent {
  event_type: 'add_to_cart' | 'purchase' | 'signup' | 'login' | 'course_view' | 'product_view';
  user_id?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface AnalyticsMetrics {
  pageViews: number;
  uniqueUsers: number;
  conversionRate: number;
  avgSessionDuration: number;
  topPages: { page: string; views: number }[];
  topEvents: { event: string; count: number }[];
}

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function trackPageView(page: string, referrer?: string): Promise<void> {
  try {
    const deviceType = /mobile|tablet|android|iphone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    const userId = await getCurrentUserId();

    await supabase.from('analytics_page_views').insert([{
      page,
      timestamp: new Date().toISOString(),
      referrer: referrer || document.referrer,
      device: deviceType,
      user_id: userId,
    }]);
  } catch (err) {
    console.error('[Analytics] trackPageView error:', err);
  }
}

export async function trackEvent(event: UserEvent): Promise<void> {
  try {
    const userId = event.user_id ?? await getCurrentUserId();
    await supabase.from('analytics_events').insert([{
      event_type: event.event_type,
      user_id: userId,
      metadata: event.metadata || {},
      timestamp: event.timestamp || new Date().toISOString(),
    }]);
  } catch (err) {
    console.error('[Analytics] trackEvent error:', err);
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

export async function trackCourseView(courseId: string, courseTitle: string): Promise<void> {
  await trackEvent({
    event_type: 'course_view',
    metadata: { courseId, courseTitle },
  });
}

export async function trackProductView(productId: string, productName: string): Promise<void> {
  await trackEvent({
    event_type: 'product_view',
    metadata: { productId, productName },
  });
}

export async function getAnalyticsMetrics(days: number = 30): Promise<AnalyticsMetrics> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Page views
    const { data: pageViews } = await supabase
      .from('analytics_page_views')
      .select('*')
      .gte('timestamp', startDate);

    // Events
    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('timestamp', startDate);

    const totalPageViews = pageViews?.length || 0;
    const uniqueUsers = new Set(pageViews?.map(p => p.user_id).filter(Boolean)).size;
    const purchases = events?.filter(e => e.event_type === 'purchase') || [];
    const conversionRate = uniqueUsers > 0 ? (purchases.length / uniqueUsers) * 100 : 0;

    // Top pages
    const pageGroups = pageViews?.reduce((acc: Record<string, number>, pv: { page: string }) => {
      acc[pv.page] = (acc[pv.page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topPages = Object.entries(pageGroups)
      .map(([page, views]) => ({ page, views: views as number }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Top events
    const eventGroups = events?.reduce((acc: Record<string, number>, e: { event_type: string }) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topEvents = Object.entries(eventGroups)
      .map(([event, count]) => ({ event, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      pageViews: totalPageViews,
      uniqueUsers,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgSessionDuration: 0, // À implémenter
      topPages,
      topEvents,
    };
  } catch (err) {
    console.error('[Analytics] getMetrics error:', err);
    return {
      pageViews: 0,
      uniqueUsers: 0,
      conversionRate: 0,
      avgSessionDuration: 0,
      topPages: [],
      topEvents: [],
    };
  }
}

export async function trackUserSignup(userId: string, email: string): Promise<void> {
  await trackEvent({
    event_type: 'signup',
    user_id: userId,
    metadata: { email },
  });
}

export async function trackUserLogin(userId: string): Promise<void> {
  await trackEvent({
    event_type: 'login',
    user_id: userId,
  });
}