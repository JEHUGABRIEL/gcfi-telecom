import React from 'react';
import { Megaphone, Send, CheckCircle, Trash2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';

interface Notification { id: string; title: string; message: string; type: string; created_at: string; }

interface NotificationsTabProps {
  onDelete: (id: string, table: string) => void;
}

export default function NotificationsTab({ onDelete }: NotificationsTabProps) {
  const [msgTitle, setMsgTitle] = React.useState('');
  const [msgContent, setMsgContent] = React.useState('');
  const [category, setCategory] = React.useState('info');
  const [isSending, setIsSending] = React.useState(false);
  const [sendSuccess, setSendSuccess] = React.useState(false);
  const [allNotifications, setAllNotifications] = React.useState<Notification[]>([]);

  React.useEffect(() => {
    supabase.from('global_notifications').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAllNotifications(data as Notification[]); })
      .catch(err => logError('NotificationsTab', err));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const { data, error } = await supabase.from('global_notifications').insert([{
        title: msgTitle, message: msgContent, type: category
      }]).select().single();
      if (error) throw error;
      if (data) setAllNotifications(prev => [data as Notification, ...prev]);
      setSendSuccess(true);
      setMsgTitle(''); setMsgContent('');
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) { logError('NotificationsTab/send', err); }
    finally { setIsSending(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
          <Megaphone className="w-6 h-6 text-[#2563B0]" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Envoyer une Annonce</h3>
          <p className="text-sm text-slate-500">Diffusez un message à tous les utilisateurs.</p>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Titre</label>
            <input type="text" value={msgTitle} onChange={e => setMsgTitle(e.target.value)}
              placeholder="Ex: Promotion de fin d'année..." required
              className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#2563B0] outline-none dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#2563B0] outline-none dark:text-white appearance-none">
              <option value="info">Info</option>
              <option value="success">Offre / Promotion</option>
              <option value="warning">Important</option>
              <option value="error">Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Message</label>
          <textarea rows={4} value={msgContent} onChange={e => setMsgContent(e.target.value)}
            placeholder="Détails de votre annonce..." required
            className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#2563B0] outline-none dark:text-white resize-none" />
        </div>
        <button type="submit" disabled={isSending}
          className={cn("w-full flex items-center justify-center gap-3 py-4 rounded-full font-black uppercase tracking-widest transition-all",
            isSending ? "bg-slate-100 text-slate-400" : "bg-[#2563B0] text-white hover:bg-opacity-90 shadow-xl shadow-blue-500/20")}>
          {isSending ? "Envoi..." : sendSuccess ? "Annonce Envoyée !" : "Diffuser l'annonce"}
          {!isSending && !sendSuccess && <Send className="w-4 h-4" />}
          {sendSuccess && <CheckCircle className="w-4 h-4" />}
        </button>
      </form>

      <div className="mt-12">
        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-6">Historique</h4>
        <div className="space-y-4">
          {allNotifications.map(notif => (
            <div key={notif.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded",
                    notif.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                    notif.type === 'info' ? "bg-blue-100 text-blue-600" :
                    notif.type === 'warning' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600")}>
                    {notif.type === 'success' ? 'Offre' : notif.type}
                  </span>
                  <h5 className="font-bold text-slate-900 dark:text-white">{notif.title}</h5>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{notif.message}</p>
                <p className="text-[10px] text-slate-400 mt-2">{new Date(notif.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => onDelete(notif.id, 'global_notifications')}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
