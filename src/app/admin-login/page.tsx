// Server Component — 'use client' must NOT be here so that
// dynamic = 'force-dynamic' is respected by Next.js.
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import AdminLoginPage from '@/modules/admin/components/AdminLoginPage';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-slate-100 border-t-[var(--accent)] rounded-full animate-spin" />
  </div>
);

export default function AdminLoginRoute() {
  return (
    <Suspense fallback={<Spinner />}>
      <AdminLoginPage />
    </Suspense>
  );
}
