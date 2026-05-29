'use client';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  message: string;
  type: ToastType;
}

export function useAdminToast() {
  const [toast, setToast] = React.useState<Toast | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = React.useCallback((message: string, type: ToastType = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const dismiss = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { toast, showToast, dismiss };
}

const config = {
  success: { icon: CheckCircle2, bg: 'bg-emerald-500', text: 'text-white' },
  error:   { icon: XCircle,      bg: 'bg-red-500',     text: 'text-white' },
  info:    { icon: AlertCircle,  bg: 'bg-blue-500',    text: 'text-white' },
} as const;

interface AdminToastProps {
  toast: Toast | null;
  onDismiss: () => void;
}

export function AdminToast({ toast, onDismiss }: AdminToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.message + toast.type}
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,   scale: 1    }}
          exit={{    opacity: 0, y: -16, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={cn(
            'fixed top-6 right-6 z-[300] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl min-w-[260px] max-w-sm',
            config[toast.type].bg, config[toast.type].text
          )}
        >
          {React.createElement(config[toast.type].icon, { className: 'w-5 h-5 shrink-0' })}
          <span className="text-sm font-bold flex-1">{toast.message}</span>
          <button onClick={onDismiss} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
