const CONSENT_KEY = 'gcfi-consent';

function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
}

type GAItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
};

/**
 * Envoie un événement personnalisé à Google Analytics (gtag).
 * Ne fait rien si le consentement n'a pas été donné.
 */
export function trackGAEvent(
  action: string,
  params?: Record<string, string | number | boolean | unknown[] | undefined>,
): void {
  if (!hasConsent()) return;
  try {
    window.gtag?.('event', action, params);
  } catch {
    // Silencieux
  }
}

/**
 * Suivi générique d'un clic sur un lien externe ou un bouton.
 */
export function trackClick(label: string, category?: string): void {
  trackGAEvent('click', {
    link_label: label,
    link_category: category ?? 'engagement',
  });
}

/** Suivi d'un clic WhatsApp */
export function trackWhatsAppClick(context: string): void {
  trackClick(`whatsapp_${context}`, 'contact');
}

/** Suivi d'un clic téléphone */
export function trackPhoneClick(context: string): void {
  trackClick(`phone_${context}`, 'contact');
}

/** Suivi d'un clic sur un réseau social */
export function trackSocialClick(platform: string): void {
  trackClick(`social_${platform.toLowerCase()}`, 'social');
}

/** Suivi d'une soumission de formulaire (lead) */
export function trackFormSubmit(formName: string, serviceType?: string): void {
  trackGAEvent('generate_lead', {
    form_name: formName,
    service_type: serviceType ?? '',
  });
}

/** Suivi d'une erreur de formulaire */
export function trackFormError(formName: string, errorType: string): void {
  trackGAEvent('form_error', {
    form_name: formName,
    error_type: errorType,
  });
}

/**
 * Événements e-commerce GA4
 */

export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
}): void {
  const items: GAItem[] = [{
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    quantity: product.quantity ?? 1,
    item_category: product.category,
  }];
  trackGAEvent('add_to_cart', {
    currency: 'XAF',
    value: product.price * (product.quantity ?? 1),
    items,
  });
}

export function trackRemoveFromCart(product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}): void {
  const items: GAItem[] = [{
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    item_category: product.category,
  }];
  trackGAEvent('remove_from_cart', {
    currency: 'XAF',
    value: product.price,
    items,
  });
}

export function trackBeginCheckout(cart: {
  items: Array<{ id: string; name: string; price: number; quantity: number; category?: string }>;
  total: number;
}): void {
  const items: GAItem[] = cart.items.map(i => ({
    item_id: i.id,
    item_name: i.name,
    price: i.price,
    quantity: i.quantity,
    item_category: i.category,
  }));
  trackGAEvent('begin_checkout', {
    currency: 'XAF',
    value: cart.total,
    items,
  });
}

export function trackPurchase(purchase: {
  transactionId: string;
  value: number;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
}): void {
  const items: GAItem[] = purchase.items.map(i => ({
    item_id: i.id,
    item_name: i.name,
    price: i.price,
    quantity: i.quantity,
  }));
  trackGAEvent('purchase', {
    currency: 'XAF',
    value: purchase.value,
    transaction_id: purchase.transactionId,
    items,
  });
}

export function trackViewItem(item: {
  id: string;
  name: string;
  price: number;
  category?: string;
}): void {
  const items: GAItem[] = [{
    item_id: item.id,
    item_name: item.name,
    price: item.price,
    item_category: item.category,
  }];
  trackGAEvent('view_item', {
    currency: 'XAF',
    value: item.price,
    items,
  });
}

export function trackEnroll(course: {
  id: string;
  title: string;
  price: number;
  category?: string;
}): void {
  const items: GAItem[] = [{
    item_id: course.id,
    item_name: course.title,
    price: course.price,
    item_category: course.category,
  }];
  trackGAEvent('enroll', {
    currency: 'XAF',
    value: course.price,
    items,
  });
}
