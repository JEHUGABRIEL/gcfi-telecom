'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import AdminLoginPage from '@/modules/admin/components/AdminLoginPage';

export default function AdminLoginRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[var(--accent)] rounded-full animate-spin" /></div>}>
      <AdminLoginPage />
    </Suspense>
  );
}
