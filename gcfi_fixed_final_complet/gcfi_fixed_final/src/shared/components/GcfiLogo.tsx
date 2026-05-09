import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/shared/lib/utils';

interface GcfiLogoProps {
  className?: string;
  showText?: boolean;
}

export default function GcfiLogo({ className, showText = true }: GcfiLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="relative w-10 h-10 shrink-0"
      >
        {/* Fond blanc avec bordure bleue */}
        <div className="absolute inset-0 bg-white rounded-xl border-2 border-[#2563B0] shadow-sm flex items-center justify-center">
          <span className="text-[#2563B0] font-black text-2xl tracking-tighter">G</span>
        </div>
      </motion.div>

      {showText && (
        <div className="ml-3">
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">
            GCFI
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#2563B0] font-black">
            Centrafrique
          </p>
        </div>
      )}
    </div>
  );
}
