import React from 'react';
import { Home, GraduationCap, ShoppingBag, User, LayoutGrid } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '@/shared/context/AuthContext';

// ✅ Plus de props — NavLink gère l'état actif via useLocation
const BottomNav = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    { to: '/',          label: 'Accueil',     icon: Home },
    { to: '/formation', label: 'Formation',   icon: GraduationCap },
    { to: '/boutique',  label: 'Boutique',    icon: ShoppingBag },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: LayoutGrid }] : []),
    { to: '/profil',    label: 'Profil',      icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 transition-colors pb-safe">
      <div className="flex justify-around items-center h-14 px-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full transition-all relative group',
                isActive ? 'text-[var(--accent)]' : 'text-slate-500 dark:text-slate-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={{ scale: isActive ? 1.2 : 1, y: isActive ? -5 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className={cn(
                    'p-3 rounded-2xl shadow-2xl transition-all duration-300 z-10',
                    isActive
                      ? 'bg-[var(--accent)] text-white shadow-black/20 ring-4 ring-[var(--accent)]/10'
                      : 'bg-transparent text-slate-500 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800',
                  )}
                >
                  <item.icon className={cn('w-5 h-5', isActive ? 'stroke-[2.5px]' : 'stroke-2')} />
                </motion.div>

                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active-bg"
                    className="absolute inset-0 bg-[var(--accent-light)] -z-0 rounded-2xl mx-1 my-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
