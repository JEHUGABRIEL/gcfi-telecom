import React from 'react';
import Image from 'next/image';
import { useAdminToast, AdminToast } from '@/shared/components/AdminToast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { useAuth } from '@/shared/context/AuthContext';
import {
  Shield, ShieldCheck, User, RefreshCw, Search, AlertTriangle,
  X, Ban, Clock, CheckCircle, ChevronRight, Mail, Calendar
} from 'lucide-react';
import Pagination from '@/shared/components/ui/Pagination';

const PAGE_SIZE = 15;
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type Role = 'client' | 'admin' | 'superadmin';
type BlockType = 'none' | '1h' | '24h' | '7d' | '30d' | 'permanent';

/* ── Modal confirmation ──────────────────────────────────────── */
function ConfirmModal({ title, message, onConfirm, onCancel, danger = false }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center z-10">
        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4', danger ? 'bg-red-50' : 'bg-amber-50')}>
          <AlertTriangle className={cn('w-7 h-7', danger ? 'text-red-500' : 'text-amber-500')} />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700">Annuler</button>
          <button onClick={onConfirm} className={cn('flex-1 py-3 rounded-2xl font-bold text-sm text-white', danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#C1272D] hover:opacity-90')}>Confirmer</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Modal détail utilisateur ────────────────────────────────── */
function UserDetailModal({ user, isSuperAdmin, onClose, onBlock, onUnblock, onRoleChange }:{
  user: any; isSuperAdmin: boolean; onClose: () => void;
  onBlock: (id: string, type: BlockType) => void;
  onUnblock: (id: string) => void;
  onRoleChange: (id: string, role: Role) => void;
}) {
  const [blockType, setBlockType] = React.useState<BlockType>('24h');
  const blockOptions: { value: BlockType; label: string }[] = [
    { value: '1h',        label: '1 heure' },
    { value: '24h',       label: '24 heures' },
    { value: '7d',        label: '7 jours' },
    { value: '30d',       label: '30 jours' },
    { value: 'permanent', label: 'Blocage permanent' },
  ];

  const isBlocked = user.is_blocked || (user.blocked_until && new Date(user.blocked_until) > new Date());
  const blockStatus = user.is_blocked ? 'Bloqué définitivement'
    : user.blocked_until && new Date(user.blocked_until) > new Date()
    ? `Bloqué jusqu'au ${new Date(user.blocked_until).toLocaleDateString('fr-FR')}`
    : 'Actif';

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full shadow-2xl z-10 overflow-hidden">

        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 to-slate-800 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#C1272D] flex items-center justify-center shrink-0 text-white font-black text-xl">
            {user.avatar_url
              ? <Image src={user.avatar_url} fill className="object-cover rounded-2xl" alt="" sizes="56px" />
              : (user.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white truncate">{user.full_name || 'Sans nom'}</h3>
            <p className="text-slate-400 text-sm truncate">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Infos */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Shield, label: 'Rôle', value: user.role },
              { icon: CheckCircle, label: 'Statut', value: blockStatus, danger: isBlocked },
              { icon: Calendar, label: 'Inscrit le', value: new Date(user.created_at).toLocaleDateString('fr-FR') },
              { icon: Mail, label: 'Email', value: user.email?.split('@')[0] + '…' },
            ].map(({ icon: Icon, label, value, danger }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                </div>
                <p className={cn('text-sm font-bold truncate', danger ? 'text-red-500' : 'text-slate-900 dark:text-white')}>{value}</p>
              </div>
            ))}
          </div>

          {/* Changer le rôle */}
          {user.role !== 'superadmin' && (isSuperAdmin || user.role === 'client') && (
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Changer le rôle</p>
              <div className="flex gap-2">
                {(['client', 'admin'] as Role[]).filter(r => r !== user.role).map(r => (
                  <button key={r} onClick={() => { onRoleChange(user.id, r); onClose(); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#C1272D] hover:text-[#C1272D] transition-all capitalize">
                    → {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Blocage */}
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Gestion du blocage</p>
            {isBlocked ? (
              <button onClick={() => { onUnblock(user.id); onClose(); }}
                className="w-full py-3 rounded-xl text-sm font-bold bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-all flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Débloquer l'utilisateur
              </button>
            ) : (
              <div className="space-y-2">
                <select value={blockType} onChange={e => setBlockType(e.target.value as BlockType)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#C1272D]">
                  {blockOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button onClick={() => { onBlock(user.id, blockType); onClose(); }}
                  className={cn('w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all',
                    blockType === 'permanent'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200')}>
                  {blockType === 'permanent' ? <><Ban className="w-4 h-4" /> Blocage permanent</> : <><Clock className="w-4 h-4" /> Bloquer {blockOptions.find(o => o.value === blockType)?.label}</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Badge rôle ──────────────────────────────────────────────── */
function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full',
      role === 'superadmin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30'
      : role === 'admin'    ? 'bg-red-100 text-red-700 dark:bg-red-900/30'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    )}>
      {role === 'superadmin' ? <ShieldCheck className="w-3 h-3" /> : role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {role}
    </span>
  );
}

/* ── UsersTab principal ──────────────────────────────────────── */
export default function UsersTab() {
  const { toast, showToast, dismiss } = useAdminToast();
  const { user: currentUser, profile: currentProfile } = useAuth();
  const isSuperAdmin = currentProfile?.role === 'superadmin';

  const queryClient = useQueryClient();
  const [search, setSearch]         = React.useState('');
  const [page, setPage]             = React.useState(1);
  const [selectedUser, setSelected] = React.useState<any>(null);
  const [confirm, setConfirm]       = React.useState<any>(null);

  const { data: rawUsers = [], isLoading: loading, isFetching } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at, avatar_url, is_blocked, blocked_until, block_reason')
        .order('created_at', { ascending: false });
      if (error) { logError('UsersTab', error); return []; }
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const users = isSuperAdmin
    ? rawUsers
    : rawUsers.filter((u: any) => u.role !== 'superadmin');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const adminFetch = async (userId: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erreur serveur');
    }
  };

  const blockMutation = useMutation({
    mutationFn: ({ userId, type }: { userId: string; type: BlockType }) =>
      adminFetch(userId, { action: 'block', blockType: type }),
    onSuccess: () => { invalidate(); showToast('Utilisateur bloqué'); },
    onError: (err: Error) => showToast(err.message || 'Erreur lors du blocage', 'error'),
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) =>
      adminFetch(userId, { action: 'unblock' }),
    onSuccess: () => { invalidate(); showToast('Utilisateur débloqué'); },
    onError: (err: Error) => showToast(err.message || 'Erreur lors du déblocage', 'error'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: Role }) =>
      adminFetch(userId, { action: 'setRole', role: newRole }),
    onSuccess: () => { invalidate(); showToast('Rôle modifié avec succès'); },
    onError: (err: Error) => showToast(err.message || 'Erreur lors du changement de rôle', 'error'),
  });

  const handleBlock      = (userId: string, type: BlockType) => blockMutation.mutate({ userId, type });
  const handleUnblock    = (userId: string) => unblockMutation.mutate(userId);
  const handleRoleChange = (userId: string, newRole: Role) => roleMutation.mutate({ userId, newRole });

  const getBlockStatus = (u: any) => {
    if (u.is_blocked) return 'permanent';
    if (u.blocked_until && new Date(u.blocked_until) > new Date()) return 'temp';
    return 'active';
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q);
  });

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when search changes
  React.useEffect(() => { setPage(1); }, [search]);

  const stats = { total: users.length, clients: users.filter(u => u.role === 'client').length, admins: users.filter(u => u.role === 'admin').length, blocked: users.filter(u => getBlockStatus(u) !== 'active').length };

  return (
    <>
    <AdminToast toast={toast} onDismiss={dismiss} />
    <div className="space-y-6">
      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            isSuperAdmin={isSuperAdmin}
            onClose={() => setSelected(null)}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            onRoleChange={handleRoleChange}
          />
        )}
        {confirm && (
          <ConfirmModal
            title={confirm.title}
            message={confirm.message}
            danger={confirm.danger}
            onConfirm={() => { confirm.action(); setConfirm(null); }}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'slate' },
          { label: 'Clients', value: stats.clients, color: 'blue' },
          { label: 'Admins', value: stats.admins, color: 'red' },
          { label: 'Bloqués', value: stats.blocked, color: 'amber' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 text-center">
            <p className={cn('text-2xl font-black', s.color === 'red' ? 'text-[#C1272D]' : s.color === 'amber' ? 'text-amber-500' : s.color === 'blue' ? 'text-blue-500' : 'text-slate-900 dark:text-white')}>{s.value}</p>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Rechercher par nom, email, rôle..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#C1272D]" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>}
        <button onClick={invalidate} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#C1272D] transition-colors mr-2">
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* Info rôle */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <Shield className="w-3.5 h-3.5 shrink-0" />
        <span>{isSuperAdmin ? 'Superadmin : cliquez sur un utilisateur pour voir ses détails, changer son rôle ou le bloquer.' : 'Admin : vous pouvez voir les détails et bloquer les clients uniquement.'}</span>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>
      ) : (
        <>
        <div className="space-y-2">
          {paginated.map(u => {
            const blockStatus = getBlockStatus(u);
            const isMe = u.id === currentUser?.id;
            return (
              <div key={u.id}
                onClick={() => !isMe && setSelected(u)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl border transition-all',
                  isMe ? 'border-[#C1272D]/30 bg-red-50/30 dark:bg-red-900/10 cursor-default'
                  : blockStatus !== 'active' ? 'border-red-100 bg-red-50/50 dark:bg-red-900/10 cursor-pointer hover:shadow-md'
                  : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:shadow-md hover:border-[#C1272D]/30'
                )}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#C1272D] flex items-center justify-center shrink-0 text-white font-black text-sm overflow-hidden">
                  {u.avatar_url ? <Image src={u.avatar_url} fill className="object-cover" alt="" sizes="40px" /> : (u.full_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                </div>
                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{u.full_name || 'Sans nom'}</p>
                    {isMe && <span className="text-[10px] text-[#C1272D] font-black">(vous)</span>}
                    {blockStatus === 'permanent' && <span className="text-[10px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full">BLOQUÉ</span>}
                    {blockStatus === 'temp' && <span className="text-[10px] bg-amber-100 text-amber-600 font-black px-2 py-0.5 rounded-full">TEMP</span>}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <RoleBadge role={u.role} />
                {!isMe && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />}
              </div>
            );
          })}
          {paginated.length === 0 && (
            <div className="text-center py-16 text-slate-400"><User className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucun utilisateur trouvé.</p></div>
          )}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
        </>
      )}
    </div>
    </>
  );
}