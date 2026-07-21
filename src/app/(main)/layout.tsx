'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/context/AuthContext';
import { useContact } from '@/shared/context/ContactContext';
import Header from '@/shared/components/Header';
import AdminHeader from '@/shared/components/AdminHeader';
import Footer from '@/shared/components/Footer';
import BottomNav from '@/shared/components/BottomNav';
import ScrollProgress from '@/shared/components/ScrollProgress';
import ScrollToTop from '@/shared/components/ScrollToTop';
import FloatingContact from '@/shared/components/FloatingContact';
import ContactModal from '@/shared/components/ContactModal';
import AnnouncementBanner from '@/shared/components/AnnouncementBanner';

const HeaderComponent = Header as React.ComponentType<{ onContactOpen: () => void }>;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading: authLoading } = useAuth();
  const { isContactOpen, openContact, closeContact } = useContact();
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const showAdminHeader = isAdmin || (authLoading && isAdminRoute);

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-white dark:bg-[var(--bg-primary)] font-sans transition-colors">
      <ScrollProgress />
      {showAdminHeader ? (
        <AdminHeader />
      ) : (
        <div className="sticky top-0 z-50">
          <AnnouncementBanner />
          <HeaderComponent onContactOpen={openContact} />
        </div>
      )}
      <main>{children}</main>
      {!showAdminHeader && (
        <>
          <Footer />
          <FloatingContact />
          <BottomNav />
          <ContactModal isOpen={isContactOpen} onClose={closeContact} />
        </>
      )}
      <ScrollToTop />
    </div>
  );
}