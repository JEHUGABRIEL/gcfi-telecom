import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOrderNotification } from '@/shared/hooks/useOrderNotification';
import { useCourseNotification } from '@/shared/hooks/useCourseNotification';

// ── Mocks email-service ───────────────────────────────────────
const mockSendOrder  = vi.fn().mockResolvedValue(undefined);
const mockSendCourse = vi.fn().mockResolvedValue(undefined);

vi.mock('@/shared/lib/email-service', () => ({
  sendOrderConfirmationEmail:  (...args: unknown[]) => mockSendOrder(...args),
  sendCourseEnrollmentEmail: (...args: unknown[]) => mockSendCourse(...args),
}));

describe('useOrderNotification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envoie un email de confirmation quand gcfi:order-placed est dispatché', async () => {
    renderHook(() => useOrderNotification());

    const orderData = {
      customerEmail: 'client@test.com',
      orderId: 'order-1',
      customerName: 'Jean',
      items: [{ name: 'Routeur', quantity: 1, price: 50000 }],
      totalAmount: 50000,
      deliveryAddress: 'Bangui, RCA',
    };

    window.dispatchEvent(new CustomEvent('gcfi:order-placed', { detail: { orderData } }));

    await vi.waitFor(() => expect(mockSendOrder).toHaveBeenCalledWith('client@test.com', orderData));
  });

  it("n'envoie pas d'email si customerEmail est absent", async () => {
    renderHook(() => useOrderNotification());

    window.dispatchEvent(new CustomEvent('gcfi:order-placed', {
      detail: { orderData: { customerEmail: '', orderId: 'x' } },
    }));

    await new Promise(r => setTimeout(r, 50));
    expect(mockSendOrder).not.toHaveBeenCalled();
  });

  it('retire le listener au démontage (pas de memory leak)', () => {
    const spy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOrderNotification());
    unmount();
    expect(spy).toHaveBeenCalledWith('gcfi:order-placed', expect.any(Function));
  });
});

describe('useCourseNotification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envoie un email quand gcfi:course-enrolled est dispatché', async () => {
    renderHook(() => useCourseNotification());

    const courseData = {
      studentEmail: 'etudiant@test.com',
      courseName: 'Cybersécurité',
      studentName: 'Marie',
      startDate: '2026-06-01',
      instructor: 'Dr. Binga',
    };

    window.dispatchEvent(new CustomEvent('gcfi:course-enrolled', { detail: { courseData } }));

    await vi.waitFor(() => expect(mockSendCourse).toHaveBeenCalledWith('etudiant@test.com', courseData));
  });

  it('retire le listener au démontage (pas de memory leak)', () => {
    const spy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useCourseNotification());
    unmount();
    expect(spy).toHaveBeenCalledWith('gcfi:course-enrolled', expect.any(Function));
  });
});
