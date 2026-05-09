import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { ArrowUp } from 'lucide-react';

export default function ScrollProgress() {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* Top Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[#2563B0] origin-left z-[100]"
        style={{ scaleX }}
      />

      {/* Scroll to Top Button with Circular Progress */}
      <motion.button
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: isVisible ? 1 : 0, 
          scale: isVisible ? 1 : 0.5,
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-2xl z-50 flex items-center justify-center group border border-slate-100 dark:border-slate-700"
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-100 dark:text-slate-700"
          />
          <motion.circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="#2563B0"
            strokeWidth="2"
            strokeDasharray="150"
            style={{
              pathLength: scrollYProgress
            }}
          />
        </svg>
        <ArrowUp className="w-6 h-6 text-[#2563B0] group-hover:-translate-y-1 transition-transform" />
      </motion.button>
    </>
  );
}
