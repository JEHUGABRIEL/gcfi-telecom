import React from 'react';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { useAuth } from '@/shared/context/AuthContext';
import { Shield, ShieldCheck, User, RefreshCw, Search, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const SUPERADMIN_EMAIL = 'jehubin@gmail.com';
type Role = 'client' | 'admin' | 'superadmin';

/* ── Modal confirmation ──────────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center z-10">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirmer le changement</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700">Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-[#C1272D] text-white">Confirmer</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Badge rôle ──────────────────────────────────────────────── */
function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full',
      role === 'superadmin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      : role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    )}>
      {role === 'superadmin' ? <ShieldCheck className="w-3 h-3" /> : role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {role}
    </span>
  );
}

export default function UsersTab() {
  const { user: currentUser, profile: currentProfile, isAdmin } = useAuth();
  const isSuperAdmin = currentProfile?.email === SUPERADMIN_EMAIL && currentProfile?.role === 'superadmin';

  const [users, setUsers]       = React.useState<any[]>([]);
  const [loading, setLoading]   = React.useState(true);
  const [search, setSearch]     = React.useState('');
  const [confirm, setConfirm]   = React.useState<{ userId: string; name: string; newRole: Role } | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at, avatar_url')
      .order('created_at', { ascending: false });
    if (error) logError('UsersTab', error);
    else {
      let filtered = data || [];
      // ✅ Admin ordinaire ne voit pas le superadmin
      if (!isSuperAdmin) {
        filtered = filtered.filter(u => u.email !== SUPERADMIN_EMAIL && u.role !== 'superadmin');
      }
      setUsers(filtered);
    }
    setLoading(false);
  };

  React.useEffect(() => { fetch(); }, [isSuperAdmin]);

  /* ── Règles de modification de rôle ─────────────────────────
   * Superadmin : peut tout changer sauf son propre rôle
   * Admin      : peut seulement changer les clients (pas soi-même, pas admins)
   */
  const getRoleOptions = (targetUser: any): Role[] => {
    const targetIsMe = targetUser.id === currentUser?.id;
    const targetIsSuperAdmin = targetUser.email === SUPERADMIN_EMAIL;

    // Personne ne peut changer son propre rôle
    if (targetIsMe) return [];
    // Personne ne peut changer le rôle du superadmin
    if (targetIsSuperAdmin) return [];

    if (isSuperAdmin) {
      // Superadmin peut tout changer sauf superadmin (unicité)
      return ['client', 'admin'];
    }
    // Admin ordinaire : peut seulement promouvoir/rétrograder des clients
    if (targetUser.role === 'admin' || targetUser.role === 'superadmin') return [];
    return ['client', 'admin'];
  };

  const canChangeRole = (targetUser: any) => getRoleOptions(targetUser).length > 0;

  const handleRoleChange = async () => {
    if (!confirm) return;
    const { error } = await supabase
      .from('profiles')
      .update({ role: confirm.newRole })
      .eq('id', confirm.userId);
    if (error) logError('UsersTab/roleChange', error);
    else setUsers(prev => prev.map(u => u.id === confirm.userId ? { ...u, role: confirm.newRole } : u));
    setConfirm(null);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q)
      || (u.role || '').toLowerCase().includes(q);
  });

  const stats = {
    total:      users.length,
    clients:    users.filter(u => u.role === 'client').length,
    admins:     users.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {confirm && (
          <ConfirmModal
            message={`Changer le rôle de "${confirm.name}" vers "${confirm.newRole}" ?`}
            onConfirm={handleRoleChange}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Utilisateurs', value: stats.total, color: 'slate' },
          { label: 'Clients', value: stats.clients, color: 'blue' },
          { label: 'Admins', value: stats.admins, color: 'red' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 text-center">
            <p className={cn('text-2xl font-black', s.color === 'red' ? 'text-[#C1272D]' : s.color === 'blue' ? 'text-blue-500' : 'text-slate-900 dark:text-white')}>
              {s.value}
            </p>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Rechercher par nom, email, rôle..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#C1272D]" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
        </div>
        <button onClick={fetch} className="p-2.5 text-slate-400 hover:text-[#C1272D] transition-colors">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Bandeau rôle courant */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <Shield className="w-3.5 h-3.5 shrink-0" />
        <span>
          {isSuperAdmin
            ? 'Superadmin : vous pouvez modifier le rôle de tous les utilisateurs sauf le vôtre.'
            : 'Admin : vous pouvez modifier le rôle des clients uniquement (pas le vôtre).'}
        </span>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => {
            const isMe = u.id === currentUser?.id;
            const options = getRoleOptions(u);
            const editable = options.length > 0;

            return (
              <div key={u.id} className={cn(
                'flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border transition-all',
                isMe ? 'border-[#C1272D]/30 bg-red-50/30 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-700'
              )}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#C1272D] flex items-center justify-center shrink-0 text-white font-black text-sm">
                  {u.avatar_url
                    ? <img src={u.avatar_url} className="w-full h-full object-cover rounded-full" alt="" />
                    : (u.full_name?.[0] || u.email?.[0] || '?').toUpperCase()
                  }
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {u.full_name || 'Sans nom'}
                    </p>
                    {isMe && <span className="text-[10px] text-[#C1272D] font-black uppercase">(vous)</span>}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>

                {/* Badge rôle */}
                <RoleBadge role={u.role} />

                {/* Sélecteur de rôle */}
                {editable ? (
                  <select
                    value={u.role}
                    onChange={e => setConfirm({ userId: u.id, name: u.full_name || u.email, newRole: e.target.value as Role })}
                    className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#C1272D] cursor-pointer"
                  >
                    {options.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <div className="w-24 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-slate-300 dark:text-slate-600" title="Modification non autorisée" />
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun utilisateur trouvé.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}