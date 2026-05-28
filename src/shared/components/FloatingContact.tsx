'use client';
import React from 'react';
import { Phone, MessageCircle, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QuoteForm from '@/modules/expertise/components/QuoteForm';

export default function FloatingContact() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = React.useState(false);

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[70] flex flex-col items-end gap-4">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="flex flex-col gap-3 mb-2"
            >
              {/* Demander un devis */}
              <button
                onClick={() => { setIsQuoteOpen(true); setIsOpen(false); }}
                className="flex items-center gap-3 bg-[#C1272D] text-white px-6 py-3 rounded-full shadow-xl hover:bg-[#1E4D8C] transition-all font-bold group"
              >
                <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Demander un devis</span>
              </button>

              {/* WhatsApp */}
              <a
                href="https://wa.me/23672727208 "
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl hover:bg-green-600 transition-all font-bold group"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm">WhatsApp</span>
              </a>

              {/* Appeler */}
              <a
                href="tel:+23675500324"
                className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-full shadow-xl hover:bg-blue-700 transition-all font-bold group"
              >
                <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Appeler</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton principal */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(v => !v)}
          className="w-16 h-16 bg-[#C1272D] rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/30 text-white hover:bg-[#1E4D8C] transition-colors"
          aria-label="Contact"
        >
          <AnimatePresence mode="wait">
            {isOpen
              ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6" /></motion.div>
              : <motion.div key="phone" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Phone className="w-6 h-6" /></motion.div>
            }
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Formulaire de devis */}
      <QuoteForm isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </>
  );
}
