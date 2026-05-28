'use client';

import React, { createContext, useContext, useState } from 'react';

interface ContactContextType {
  isContactOpen: boolean;
  openContact: () => void;
  closeContact: () => void;
}

const ContactContext = createContext<ContactContextType>({
  isContactOpen: false,
  openContact: () => {},
  closeContact: () => {},
});

export function ContactProvider({ children }: { children: React.ReactNode }) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  return (
    <ContactContext.Provider value={{
      isContactOpen,
      openContact: () => setIsContactOpen(true),
      closeContact: () => setIsContactOpen(false),
    }}>
      {children}
    </ContactContext.Provider>
  );
}

export const useContact = () => useContext(ContactContext);
