import React from 'react';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Users, RefreshCw, ShieldCheck, User } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function UsersTab() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });
    if (error) logError('UsersTab', error);
    else setUsers(data || []);
    setLoading(false);
  };

  React.useEffect(() => { fetch(); }, []);

  const updateRole = async (id: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setUsers(u => u.map(x => x.id === id ? { ...x, role } : x));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Utilisateurs <span className="text-sm font-normal text-slate-400">({users.length})</span></h3>
        <button onClick={fetch} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-700">
        {users.map(u => (
          <div key={u.id} className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-black',
                u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                u.role === 'admin' ? 'bg-red-100 text-[#C1272D]' : 'bg-slate-100 text-slate-600')}>
                {u.full_name?.charAt(0) ?? u.email?.charAt(0) ?? '?'}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{u.full_name ?? '—'}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
            </div>
            <select value={u.role} onChange={e => updateRole(u.id, e.target.value)}
              className="text-xs font-bold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 outline-none">
              <option value="client">Client</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
