import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Megaphone, Send, CheckCircle, Trash2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { useAdminToast, AdminToast } from '@/shared/components/AdminToast';
import AdminTable from '@/shared/components/ui/AdminTable';
import Pagination from '@/shared/components/ui/Pagination';
import { useActivityLog } from '@/shared/hooks/useActivityLog';
import { useLang } from '@/shared/context/LanguageContext';

const PAGE_SIZE = 10;

interface Notification { id: string; title: string; message: string; type: string; created_at: string; }

interface NotificationsTabProps {
  onDelete: (id: string, table: string) => void;
  notifications: Notification[];
}

export default function NotificationsTab({ onDelete, notifications: allNotifications }: NotificationsTabProps) {
  const { t } = useLang();
  const ap = t.admin_page;
  const queryClient = useQueryClient();
  const { toast, showToast, dismiss } = useAdminToast();
  const { logActivity } = useActivityLog();
  const [msgTitle, setMsgTitle] = React.useState('');
  const [msgContent, setMsgContent] = React.useState('');
  const [category, setCategory] = React.useState('info');
  const [isSending, setIsSending] = React.useState(false);
  const [sendSuccess, setSendSuccess] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const { error } = await supabase.from('global_notifications').insert([{
        title: msgTitle, message: msgContent, type: category
      }]);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      logActivity({ action: 'sent', entity: 'notifications', label: `${ap.notif_sent}: ${msgTitle}` });
      setSendSuccess(true);
      setMsgTitle(''); setMsgContent('');
      showToast(ap.notify_sent);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) {
      logError('NotificationsTab/send', err);
      showToast(ap.notify_error, 'error');
    }
    finally { setIsSending(false); }
  };

  return (
    <>
    <AdminToast toast={toast} onDismiss={dismiss} />
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
          <Megaphone className="w-6 h-6 text-[#C1272D]" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">{ap.notif_send_title}</h3>
          <p className="text-sm text-slate-500">{ap.notif_send_desc}</p>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{ap.notif_title_label}</label>
            <input type="text" value={msgTitle} onChange={e => setMsgTitle(e.target.value)}
              placeholder={ap.notif_title_placeholder} required
              className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#C1272D] outline-none dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{ap.notif_category_label}</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#C1272D] outline-none dark:text-white appearance-none">
              <option value="info">{ap.notif_category_info}</option>
              <option value="success">{ap.notif_category_offer}</option>
              <option value="warning">{ap.notif_category_important}</option>
              <option value="error">{ap.notif_category_urgent}</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{ap.notif_message_label}</label>
          <textarea rows={4} value={msgContent} onChange={e => setMsgContent(e.target.value)}
            placeholder={ap.notif_message_placeholder} required
            className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#C1272D] outline-none dark:text-white resize-none" />
        </div>
        <button type="submit" disabled={isSending}
          className={cn("w-full flex items-center justify-center gap-3 py-4 rounded-full font-black uppercase tracking-widest transition-all",
            isSending ? "bg-slate-100 text-slate-400" : "bg-[#C1272D] text-white hover:bg-opacity-90 shadow-xl shadow-blue-500/20")}>
          {isSending ? ap.notif_sending : sendSuccess ? ap.notif_sent : ap.notif_send_btn}
          {!isSending && !sendSuccess && <Send className="w-4 h-4" />}
          {sendSuccess && <CheckCircle className="w-4 h-4" />}
        </button>
      </form>

      <div className="mt-12">
        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-6">{ap.notif_history}</h4>
        <AdminTable
          columns={[
            {
              header: ap.table_type,
              cell: (notif) => (
                <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded",
                  notif.type === 'success' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  notif.type === 'info' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                  notif.type === 'warning' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400")}>
                  {notif.type === 'success' ? ap.notif_type_offer : notif.type}
                </span>
              ),
            },
            {
              header: ap.notif_title_label,
              cell: (notif) => (
                <div className="min-w-0">
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">{notif.title}</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{notif.message}</p>
                </div>
              ),
            },
            { header: ap.table_date, cell: (notif) => <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(notif.created_at).toLocaleDateString()}</span> },
            {
              header: ap.table_actions,
              align: 'right' as const,
              cell: (notif) => (
                <button onClick={() => onDelete(notif.id, 'global_notifications')}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              ),
            },
          ]}
          data={allNotifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
          getKey={(notif) => notif.id}
          minWidth="720px"
          empty={<div className="text-center py-12 text-slate-400"><p>{ap.notif_history_empty}</p></div>}
        />
        <Pagination
          page={page}
          totalPages={Math.ceil(allNotifications.length / PAGE_SIZE)}
          totalItems={allNotifications.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
    </>
  );
}