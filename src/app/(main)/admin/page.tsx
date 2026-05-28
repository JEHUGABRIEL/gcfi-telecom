'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import AdminModule from '@/modules/admin/components/AdminModule';

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[var(--accent)] rounded-full animate-spin" /></div>}>
      <AdminModule />
    </Suspense>
  );
}
