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
import AdminTable from '@/shared/components/ui/AdminTable';
import { useActivityLog } from '@/shared/hooks/useActivityLog';
import { useLang } from '@/shared/context/LanguageContext';

const PAGE_SIZE = 15;
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type Role = 'client' | 'admin' | 'superadmin';
type BlockType = 'none' | '1h' | '24h' | '7d' | '30d' | 'permanent';

/* ── Modal confirmation ──────────────────────────────────────── */
function ConfirmModal({ title, message, onConfirm, onCancel, danger = false, btnCancel, btnConfirm }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
  btnCancel: string; btnConfirm: string;
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
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700">{btnCancel}</button>
          <button onClick={onConfirm} className={cn('flex-1 py-3 rounded-2xl font-bold text-sm text-white', danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#C1272D] hover:opacity-90')}>{btnConfirm}</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Modal détail utilisateur ────────────────────────────────── */
function UserDetailModal({ user, isSuperAdmin, isSelf = false, onClose, onBlock, onUnblock, onRoleChange }:{
  user: any; isSuperAdmin: boolean; isSelf?: boolean; onClose: () => void;
  onBlock: (id: string, type: BlockType, userName?: string) => void;
  onUnblock: (id: string, userName?: string) => void;
  onRoleChange: (id: string, role: Role, userName?: string) => void;
}) {
  const { t } = useLang();
  const ap = t.admin_page;
  const [blockType, setBlockType] = React.useState<BlockType>('24h');
  const blockOptions: { value: BlockType; label: string }[] = [
    { value: '1h',        label: ap.users_block_1h },
    { value: '24h',       label: ap.users_block_24h },
    { value: '7d',        label: ap.users_block_7d },
    { value: '30d',       label: ap.users_block_30d },
    { value: 'permanent', label: ap.users_block_permanent },
  ];

  const isBlocked = user.is_blocked || (user.blocked_until && new Date(user.blocked_until) > new Date());
  const blockStatus = user.is_blocked ? ap.users_status_blocked_permanent
    : user.blocked_until && new Date(user.blocked_until) > new Date()
    ? `${ap.users_status_blocked_until} ${new Date(user.blocked_until).toLocaleDateString('fr-FR')}`
    : ap.users_status_active;

  const canChangeRole = !isSelf && user.role !== 'superadmin' && (isSuperAdmin || user.role === 'client');
  const hasActions = canChangeRole || !isSelf;

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl z-10 overflow-hidden">

        {/* En-tête : identité et état, d'un coup d'œil */}
        <div className="bg-slate-900 px-5 py-4 flex items-center gap-3.5">
          <div className="relative w-11 h-11 rounded-xl bg-[#C1272D] flex items-center justify-center shrink-0 text-white font-black overflow-hidden">
            {user.avatar_url
              ? <Image src={user.avatar_url} fill className="object-cover rounded-xl" alt="" sizes="44px" />
              : (user.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white truncate">{user.full_name || ap.users_no_name}</h3>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-slate-400 text-xs truncate mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Faits : deux lignes serrées plutôt que quatre tuiles */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-x-6 gap-y-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-400 shrink-0">{ap.users_label_registered}</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white ml-auto truncate">
              {new Date(user.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle className={cn('w-3.5 h-3.5 shrink-0', isBlocked ? 'text-red-500' : 'text-emerald-500')} />
            <span className="text-[11px] text-slate-400 shrink-0">{ap.users_label_status}</span>
            <span className={cn('text-xs font-semibold ml-auto truncate', isBlocked ? 'text-red-500' : 'text-slate-900 dark:text-white')}>
              {blockStatus}
            </span>
          </div>
        </div>

        {hasActions && (
          <div className="p-5 grid gap-4 sm:grid-cols-2">
            {/* Rôle */}
            {canChangeRole && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ap.users_change_role}</p>
                <div className="flex gap-2">
                  {(['client', 'admin'] as Role[]).filter(r => r !== user.role).map(r => (
                    <button key={r} onClick={() => { onRoleChange(user.id, r, user.full_name || user.email); onClose(); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#C1272D] hover:text-[#C1272D] transition-all capitalize">
                      → {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Blocage — jamais sur soi-même */}
            {!isSelf && (
              <div className={cn(!canChangeRole && 'sm:col-span-2')}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ap.users_block_management}</p>
                {isBlocked ? (
                  <button onClick={() => { onUnblock(user.id, user.full_name || user.email); onClose(); }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> {ap.users_unblock_btn}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <select value={blockType} onChange={e => setBlockType(e.target.value as BlockType)}
                      className="flex-1 min-w-0 px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#C1272D]">
                      {blockOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button onClick={() => { onBlock(user.id, blockType, user.full_name || user.email); onClose(); }}
                      title={blockType === 'permanent' ? ap.users_block_permanent_btn : ap.users_block_temp_btn}
                      className={cn('px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shrink-0 transition-all',
                        blockType === 'permanent'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200')}>
                      {blockType === 'permanent' ? <Ban className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
  const { t } = useLang();
  const ap = t.admin_page;
  const { toast, showToast, dismiss } = useAdminToast();
  const { user: currentUser, profile: currentProfile } = useAuth();
  const { logActivity } = useActivityLog();
  const isSuperAdmin = currentProfile?.role === 'superadmin';

  const queryClient = useQueryClient();
  const [search, setSearch]         = React.useState('');
  const [page, setPage]             = React.useState(1);
  const [selectedUser, setSelected] = React.useState<any>(null);
  const [confirm, setConfirm]       = React.useState<any>(null);

  const { data: rawUsers = [], isLoading: loading } = useQuery({
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
      throw new Error(data.error || ap.save_error);
    }
  };

  const blockMutation = useMutation({
    mutationFn: ({ userId, type, userName }: { userId: string; type: BlockType; userName?: string }) =>
      adminFetch(userId, { action: 'block', blockType: type }),
    onSuccess: (_d, vars) => { invalidate(); logActivity({ action: 'blocked', entity: 'users', entity_id: vars.userId, label: `${ap.users_toast_blocked}: "${vars.userName || vars.userId}"` }); showToast(ap.users_toast_blocked); },
    onError: (err: Error) => showToast(err.message || ap.save_error, 'error'),
  });

  const unblockMutation = useMutation({
    mutationFn: ({ userId }: { userId: string; userName?: string }) =>
      adminFetch(userId, { action: 'unblock' }),
    onSuccess: (_d, vars) => { invalidate(); logActivity({ action: 'unblocked', entity: 'users', entity_id: vars.userId, label: `${ap.users_toast_unblocked}: "${vars.userName || vars.userId}"` }); showToast(ap.users_toast_unblocked); },
    onError: (err: Error) => showToast(err.message || ap.save_error, 'error'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: Role; userName?: string }) =>
      adminFetch(userId, { action: 'setRole', role: newRole }),
    onSuccess: (_d, vars) => { invalidate(); logActivity({ action: 'role_changed', entity: 'users', entity_id: vars.userId, label: `${ap.users_toast_role_changed}: "${vars.userName || vars.userId}" → ${vars.newRole}` }); showToast(ap.users_toast_role_changed); },
    onError: (err: Error) => showToast(err.message || ap.save_error, 'error'),
  });

  const handleBlock      = (userId: string, type: BlockType, userName?: string) => blockMutation.mutate({ userId, type, userName });
  const handleUnblock    = (userId: string, userName?: string) => unblockMutation.mutate({ userId, userName });
  const handleRoleChange = (userId: string, newRole: Role, userName?: string) => roleMutation.mutate({ userId, newRole, userName });

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
            isSelf={selectedUser.id === currentUser?.id}
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
            btnCancel={ap.confirm_delete_cancel}
            btnConfirm={ap.confirm_delete_confirm}
            onConfirm={() => { confirm.action(); setConfirm(null); }}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: ap.users_stat_total, value: stats.total, color: 'slate' },
          { label: ap.users_stat_clients, value: stats.clients, color: 'blue' },
          { label: ap.users_stat_admins, value: stats.admins, color: 'red' },
          { label: ap.users_stat_blocked, value: stats.blocked, color: 'amber' },
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
        <input type="text" placeholder={ap.users_search_placeholder} value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#C1272D]" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>}
        <button onClick={invalidate} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#C1272D] transition-colors mr-2">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Info rôle */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <Shield className="w-3.5 h-3.5 shrink-0" />
        <span>{isSuperAdmin ? ap.users_superadmin_info : ap.users_admin_info}</span>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>
      ) : (
        <>
        <AdminTable
          columns={[
            {
              header: ap.table_name,
              cell: (u) => (
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full bg-[#C1272D] flex items-center justify-center shrink-0 text-white font-black text-xs overflow-hidden">
                    {u.avatar_url ? <Image src={u.avatar_url} fill className="object-cover" alt="" sizes="36px" /> : (u.full_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{u.full_name || ap.users_no_name}</p>
                    {u.id === currentUser?.id && <span className="text-[10px] text-[#C1272D] font-black">{ap.users_badge_you}</span>}
                  </div>
                </div>
              ),
            },
            { header: ap.users_label_email, cell: (u) => <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p> },
            { header: ap.users_label_role, cell: (u) => <RoleBadge role={u.role} /> },
            {
              header: ap.users_label_status,
              cell: (u) => {
                const s = getBlockStatus(u);
                return s === 'permanent'
                  ? <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-black px-2 py-0.5 rounded-full">{ap.users_badge_blocked}</span>
                  : s === 'temp'
                  ? <span className="text-[10px] bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 font-black px-2 py-0.5 rounded-full">{ap.users_badge_temp}</span>
                  : <span className="text-[10px] bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 font-black px-2 py-0.5 rounded-full">{ap.users_status_active}</span>;
              },
            },
            {
              header: '',
              align: 'right' as const,
              cell: () => <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto" />,
            },
          ]}
          data={paginated}
          getKey={(u) => u.id}
          onRowClick={(u) => setSelected(u)}
          rowClassName={(u) => u.id === currentUser?.id ? 'bg-red-50/40 dark:bg-red-900/10' : undefined}
          minWidth="640px"
          empty={<div className="text-center py-16 text-slate-400"><User className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{ap.users_empty}</p></div>}
        />
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