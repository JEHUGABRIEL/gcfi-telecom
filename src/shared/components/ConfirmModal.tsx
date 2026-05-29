'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title = 'Confirmer la suppression',
  message = 'Cette action est irréversible. Voulez-vous vraiment supprimer cet élément ?',
  confirmLabel = 'Supprimer',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6"
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-[#C1272D]" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2.5 bg-[#C1272D] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
