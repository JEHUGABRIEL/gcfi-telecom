import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import NextImage from 'next/image';
import ImageUpload from '@/shared/components/ImageUpload';
import RichTextEditor from '@/shared/components/RichTextEditor';
import { sanitizeHtml } from '@/shared/lib/sanitize';
import ConfirmModal from '@/shared/components/ConfirmModal';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { Plus, Trash2, Pencil, Check, X, Star, RefreshCw, Globe } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useLang } from '@/shared/context/LanguageContext';
import AdminTable from '@/shared/components/ui/AdminTable';
import Pagination from '@/shared/components/ui/Pagination';
import type { Testimonial, Achievement, Partner, NewsItem } from '@/shared/types';

const PAGE_SIZE = 10;

// ── Onglet générique pour Témoignages, Réalisations, Partenaires, Actualités ──

type ContentType = 'testimonials' | 'achievements' | 'partners' | 'news';

interface ContentTabProps { type: ContentType; }

function getConfig(type: ContentType, ap: any) {
  const base = {
    testimonials: {
      label: ap.content_label_testimonials, table: 'testimonials',
      fields: ['name', 'role', 'content', 'avatar_url', 'rating'],
      labels: { name: ap.content_field_name, role: ap.content_field_role, content: ap.content_field_content, avatar_url: ap.content_field_avatar_url, rating: ap.content_field_rating },
      defaultItem: { name: '', role: '', content: '', avatar_url: '', rating: 5, status: 'pending' },
    },
    achievements: {
      label: ap.content_label_achievements, table: 'achievements',
      fields: ['title', 'description', 'year', 'image'],
      labels: { title: ap.content_field_title, description: ap.content_field_description, year: ap.content_field_year, image: ap.content_field_image },
      defaultItem: { title: '', description: '', year: new Date().getFullYear().toString(), image: '', gallery: [] as string[] },
    },
    partners: {
      label: ap.content_label_partners, table: 'partners',
      fields: ['name', 'logo', 'website'],
      labels: { name: ap.content_field_name, logo: ap.content_field_logo, website: ap.content_field_website },
      defaultItem: { name: '', logo: '', website: '' },
    },
    news: {
      label: ap.content_label_news, table: 'news',
      fields: ['title', 'excerpt', 'category', 'image', 'source', 'url'],
      labels: { title: ap.content_field_title, excerpt: ap.content_field_excerpt, category: ap.content_field_category, image: ap.content_field_image, source: ap.content_field_source, url: ap.content_field_url },
      defaultItem: { title: '', excerpt: '', category: 'telecom', image: '', source: '', url: '#', published_at: new Date().toISOString() },
    },
  };
  return base[type];
}

export default function ContentTab({ type }: ContentTabProps) {
  const { t } = useLang();
  const ap = t.admin_page;
  const cfg = getConfig(type, ap);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState<any>({ ...cfg.defaultItem });
  const [saving, setSaving] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => { setPage(1); }, [type]);

  const queryKey = ['admin', 'content', type];

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase.from(cfg.table).select('*').is('deleted_at', null).order('created_at', { ascending: false });
      if (error) { logError(`ContentTab/${type}`, error); return []; }
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const save = async () => {
    setSaving(true);
    const editing = !!form?.id;
    const payload = { ...form };
    // Anti-XSS : assainit le contenu édité (description réalisation, résumé actualité)
    if (type === 'achievements' && typeof payload.description === 'string') payload.description = sanitizeHtml(payload.description);
    if (type === 'news' && typeof payload.excerpt === 'string') payload.excerpt = sanitizeHtml(payload.excerpt);
    const { error } = editing
      ? await supabase.from(cfg.table).update(payload).eq('id', payload.id)
      : await supabase.from(cfg.table).insert([payload]);
    if (error) logError(`ContentTab/${type}/${editing ? 'update' : 'insert'}`, error);
    else { setShowForm(false); setForm({ ...cfg.defaultItem }); invalidate(); }
    setSaving(false);
  };

  const resetForm = () => setForm({ ...cfg.defaultItem });

  const openAdd = () => {
    resetForm();
    setShowForm(v => !v);
  };

  const startEdit = (item: any) => {
    setForm({ ...cfg.defaultItem, ...item, gallery: item.gallery ?? [] });
    setShowForm(true);
  };

  const remove = async () => {
    if (!pendingDeleteId) return;
    await supabase.from(cfg.table).update({ deleted_at: new Date().toISOString() }).eq('id', pendingDeleteId);
    setPendingDeleteId(null);
    invalidate();
  };

  const approveTestimonial = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('testimonials').update({ status }).eq('id', id);
    invalidate();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" /></div>;

  return (
    <>
      <ConfirmModal
        open={!!pendingDeleteId}
        message={ap.confirm_delete_message}
        onConfirm={remove}
        onCancel={() => setPendingDeleteId(null)}
      />
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cfg.label} ({items.length})</h3>
        <div className="flex gap-2">
          <button onClick={invalidate} className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#C1272D] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#1E4D8C] transition-all">
            <Plus className="w-4 h-4" /> {ap.content_add}
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {cfg.fields.map(field => (
              <div key={field} className={field === 'content' || field === 'excerpt' || field === 'description' ? 'sm:col-span-2' : ''}>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">{cfg.labels[field as keyof typeof cfg.labels]}</label>
                {field === 'content' || field === 'excerpt' || field === 'description' ? (
                  (type === 'achievements' && field === 'description') || (type === 'news' && field === 'excerpt') ? (
                    <RichTextEditor
                      value={form[field] || ''}
                      onChange={html => setForm((f: any) => ({ ...f, [field]: html }))}
                      placeholder={cfg.labels[field as keyof typeof cfg.labels]}
                      minHeight={140}
                    />
                  ) : (
                    <textarea rows={3} value={form[field] || ''} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
                  )
                ) : field === 'image' || field === 'logo' || field === 'avatar_url' ? (
                  <ImageUpload
                    value={form[field] || ''}
                    onChange={url => setForm((f: any) => ({ ...f, [field]: url }))}
                    folder={`gcfi/${cfg.table}`}
                  />
                ) : field === 'category' ? (
                  <select value={form[field] || 'telecom'} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]">
                    <option value="telecom">{ap.content_cat_telecom}</option>
                    <option value="it">{ap.content_cat_it}</option>
                  </select>
                ) : field === 'rating' ? (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button"
                        onClick={() => setForm((f: any) => ({ ...f, rating: star }))}
                        className="transition-transform hover:scale-110">
                        <Star className={`w-7 h-7 transition-colors ${
                          star <= (form['rating'] || 0)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`} />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-bold text-slate-500">{form['rating'] || 0}/5</span>
                  </div>
                ) : (
                  <input type="text"
                    value={form[field] || ''} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D]" />
                )}
              </div>
            ))}
          </div>

          {/* Galerie photos — Réalisations uniquement */}
          {type === 'achievements' && (
            <div className="mb-6">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">{ap.content_gallery}</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 items-start">
                {((form as any).gallery || []).map((src: string, i: number) => (
                  <div key={`${src}-${i}`} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                    <NextImage src={src} alt={`${ap.content_gallery} ${i + 1}`} fill className="object-cover" sizes="160px" />
                    <button
                      type="button"
                      onClick={() => setForm((f: any) => ({ ...f, gallery: (f.gallery || []).filter((_: string, idx: number) => idx !== i) }))}
                      className="absolute top-1 right-1 p-1 bg-slate-900/60 backdrop-blur-sm rounded-md text-white hover:bg-red-600 transition-colors"
                      aria-label={ap.content_gallery}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <ImageUpload
                  value=""
                  folder="gcfi/achievements"
                  placeholder={ap.content_add_photo}
                  onChange={(url: string) => setForm((f: any) => ({ ...f, gallery: [...(f.gallery || []), url] }))}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 items-center">
            <button onClick={save} disabled={saving} className="bg-[#C1272D] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#1E4D8C] transition-all disabled:opacity-50">
              {saving ? ap.btn_saving : ap.btn_save}
            </button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-[#C1272D] transition-all">
              {ap.btn_cancel}
            </button>
            {form?.id && <span className="text-xs text-slate-400 font-semibold">— {ap.content_edit}</span>}
          </div>
        </div>
      )}

      {/* Liste */}
      <AdminTable
        columns={[
          {
            header: ap.table_name,
            cell: (item) => (
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{item.title || item.name || item.full_name}</p>
                  {item.year && <span className="text-[10px] font-bold text-[#C1272D] bg-red-50 dark:bg-red-900/10 px-2 py-0.5 rounded-full">{item.year}</span>}
                  {item.category && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{item.category}</span>}
                </div>
                {item.rating && <span className="flex items-center gap-0.5 text-yellow-400 mt-0.5"><Star className="w-3 h-3 fill-current" /><span className="text-xs text-slate-600 dark:text-slate-400">{item.rating}/5</span></span>}
              </div>
            ),
          },
          {
            header: ap.table_message,
            cell: (item) => (
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.role || item.excerpt || item.content || item.logo || item.description || '—'}</p>
                {item.website && <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C1272D] flex items-center gap-1 mt-1"><Globe className="w-3 h-3" />{item.website}</a>}
              </div>
            ),
          },
          {
            header: ap.users_label_status,
            cell: (item) => item.status ? (
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                item.status === 'approved' ? 'bg-green-100 text-green-700' : item.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                {item.status === 'approved' ? ap.status_approved : item.status === 'rejected' ? ap.status_rejected : ap.status_pending}
              </span>
            ) : <span className="text-slate-300">—</span>,
          },
          {
            header: ap.table_actions,
            align: 'right' as const,
            cell: (item) => (
              <div className="flex items-center gap-2 justify-end">
                {/* Modération témoignages */}
                {type === 'testimonials' && item.status === 'pending' && (
                  <>
                    <button onClick={() => approveTestimonial(item.id, 'approved')} title={ap.status_approved} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={() => approveTestimonial(item.id, 'rejected')} title={ap.status_rejected} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><X className="w-4 h-4" /></button>
                  </>
                )}
                <button onClick={() => startEdit(item)} title={ap.content_edit} className="p-1.5 text-slate-400 hover:text-[#C1272D] hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setPendingDeleteId(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ),
          },
        ]}
        data={items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
        getKey={(item) => item.id}
        minWidth="760px"
        empty={<div className="text-center py-12 text-slate-400"><p>{ap.content_empty}</p></div>}
      />
      <Pagination
        page={page}
        totalPages={Math.ceil(items.length / PAGE_SIZE)}
        totalItems={items.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
    </>
  );
}