import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle, X, FileText, Phone, Mail, Building2, MessageSquare, DollarSign, Wrench } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import type { QuoteServiceType } from '@/shared/types';

const SERVICE_TYPES: QuoteServiceType[] = [
  'Réseau LAN/WAN', 'Fibre Optique', 'Vidéosurveillance',
  'WiFi / Hotspot', 'Starlink', 'Cybersécurité',
  'Développement App', 'Formation', 'Autre',
];

const BUDGETS = ['< 500 000 FCFA', '500 000 – 2M FCFA', '2M – 10M FCFA', '10M – 50M FCFA', '> 50M FCFA', 'À définir'];

// ✅ Rate limiting côté client — 3 devis max par heure
function checkRateLimit(): { allowed: boolean; remainingMs: number } {
  const KEY = 'gcfi-quote-ts';
  const MAX = 3;
  const WINDOW = 60 * 60 * 1000; // 1h
  const now = Date.now();
  const stored: number[] = JSON.parse(localStorage.getItem(KEY) || '[]');
  const recent = stored.filter(t => now - t < WINDOW);
  if (recent.length >= MAX) {
    const oldest = Math.min(...recent);
    return { allowed: false, remainingMs: WINDOW - (now - oldest) };
  }
  recent.push(now);
  localStorage.setItem(KEY, JSON.stringify(recent));
  return { allowed: true, remainingMs: 0 };
}

interface QuoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: QuoteServiceType;
}

export default function QuoteForm({ isOpen, onClose, defaultService }: QuoteFormProps) {
  const [step, setStep] = React.useState<'form' | 'success'>('form');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // ✅ Honeypot — champ invisible que les bots remplissent
  const [honeypot, setHoneypot] = React.useState('');

  const [form, setForm] = React.useState({
    full_name: '', email: '', phone: '', company: '',
    service_type: defaultService ?? '' as QuoteServiceType | '',
    message: '', budget: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Honeypot check — si rempli c'est un bot, on rejette silencieusement
    if (honeypot) {
      setStep('success');
      return;
    }

    if (!form.full_name || !form.email || !form.service_type || !form.message) {
      setError('Veuillez remplir tous les champs obligatoires (*).');
      return;
    }

    // ✅ Rate limiting
    const { allowed, remainingMs } = checkRateLimit();
    if (!allowed) {
      const mins = Math.ceil(remainingMs / 60000);
      setError(`Trop de demandes. Veuillez réessayer dans ${mins} minute${mins > 1 ? 's' : ''}.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.from('quotes').insert([{
        full_name:    form.full_name.trim().slice(0, 100),
        email:        form.email.trim().toLowerCase().slice(0, 150),
        phone:        form.phone || null,
        company:      form.company || null,
        service_type: form.service_type,
        message:      form.message.trim().slice(0, 2000),
        budget:       form.budget || null,
        status:       'nouveau',
      }]);
      if (err) throw err;
      setStep('success');
    } catch (err) {
      logError('QuoteForm/submit', err);
      setError('Une erreur est survenue. Veuillez réessayer ou nous contacter par WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('form');
      setForm({ full_name: '', email: '', phone: '', company: '', service_type: defaultService ?? '', message: '', budget: '' });
      setHoneypot('');
      setError(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

            <button onClick={handleClose} className="absolute top-6 right-6 z-10 p-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:text-[#C1272D] transition-colors">
              <X className="w-5 h-5" />
            </button>

            {step === 'success' ? (
              <div className="p-12 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                </motion.div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Demande envoyée !</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-2">Notre équipe analysera votre demande et vous contactera sous <strong>24–48h ouvrables</strong>.</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">Un récapitulatif a été enregistré dans notre système.</p>
                <button onClick={handleClose} className="bg-[#C1272D] text-white px-8 py-4 rounded-full font-bold hover:bg-[#1E4D8C] transition-all">
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 md:p-12">
                {/* ✅ Honeypot anti-bot — invisible pour les humains */}
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                  <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
                </div>
                <div className="mb-8">
                  <div className="flex items-center gap-3 text-[#C1272D] font-black uppercase tracking-widest text-xs mb-3">
                    <FileText className="w-4 h-4" /> Demande de devis
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">Décrivez votre projet</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Nous vous répondons sous 24–48h ouvrables.</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Nom + Email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Nom complet *</label>
                      <div className="relative">
                        <input value={form.full_name} onChange={set('full_name')} placeholder="Jean Dupont" required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-[#C1272D] transition-colors" />
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Email *</label>
                      <div className="relative">
                        <input type="email" value={form.email} onChange={set('email')} placeholder="vous@email.com" required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-[#C1272D] transition-colors" />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Téléphone + Société */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Téléphone</label>
                      <div className="relative">
                        <input value={form.phone} onChange={set('phone')} placeholder="+236 72 00 00 00"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-[#C1272D] transition-colors" />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Société / Organisation</label>
                      <div className="relative">
                        <input value={form.company} onChange={set('company')} placeholder="Nom de l'entreprise"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-[#C1272D] transition-colors" />
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Type de service */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Type de service *</label>
                    <div className="relative">
                      <select value={form.service_type} onChange={set('service_type')} required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-[#C1272D] transition-colors appearance-none">
                        <option value="">Sélectionner un service...</option>
                        {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Budget estimé</label>
                    <div className="relative">
                      <select value={form.budget} onChange={set('budget')}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-[#C1272D] transition-colors appearance-none">
                        <option value="">Sélectionner une tranche...</option>
                        {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Description du projet *</label>
                    <div className="relative">
                      <textarea value={form.message} onChange={set('message')} required rows={4}
                        placeholder="Décrivez votre besoin, le contexte, les contraintes particulières..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-[#C1272D] transition-colors resize-none" />
                      <MessageSquare className="absolute left-3 top-4 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full mt-8 bg-[#C1272D] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#1E4D8C] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send className="w-5 h-5" /> Envoyer la demande</>
                  )}
                </button>
                <p className="text-center text-xs text-slate-400 mt-4">Vos données sont traitées de façon confidentielle et ne sont jamais partagées.</p>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
