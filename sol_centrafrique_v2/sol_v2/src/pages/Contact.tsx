import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, AlertCircle, CheckCircle2, Loader2, Facebook, Instagram, Linkedin } from 'lucide-react';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'residential',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateField = (name: string, value: string) => {
    let error = '';
    
    if (name === 'name') {
      if (!value.trim()) error = 'Le nom est requis';
      else if (value.trim().length < 3) error = 'Le nom doit contenir au moins 3 caractères';
      else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value)) error = 'Le nom contient des caractères invalides';
    }
    
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) error = 'L\'email est requis';
      else if (!emailRegex.test(value)) error = 'Format d\'email invalide (ex: nom@domaine.com)';
    }

    if (name === 'phone') {
      const phoneRegex = /^\+?[0-9\s-]{8,15}$/;
      if (value && !phoneRegex.test(value)) error = 'Format de téléphone invalide';
    }

    if (name === 'message') {
      if (!value.trim()) error = 'Le message ne peut pas être vide';
      else if (value.trim().length < 10) error = 'Votre message est trop court (min 10 caractères)';
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Request permission for push notifications on first interaction
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Final validation check
    const newErrors: FormErrors = {};
    if (!formData.name) newErrors.name = 'Le nom est requis';
    if (!formData.email) newErrors.email = 'L\'email est requis';
    if (!formData.message) newErrors.message = 'Le message est requis';

    if (Object.values(newErrors).some(err => err)) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      // Simulate adding a lead to localStorage for Admin Dashboard notification
      const newLead = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        date: new Date().toISOString(),
        isNew: true
      };
      
      const existingLeads = JSON.parse(localStorage.getItem('admin_leads') || '[]');
      localStorage.setItem('admin_leads', JSON.stringify([newLead, ...existingLeads]));
      
      // Dispatch a custom event for real-time notification if admin is in another tab/component
      window.dispatchEvent(new CustomEvent('new-lead', { detail: newLead }));

      // Browser Push Notification (Simulated for this turn)
      if (Notification.permission === 'granted') {
        new Notification("Nouveau Lead SOL!", {
          body: `Demande de ${newLead.name} (${newLead.type})`,
          icon: '/logo_sol_centrafrique.png'
        });
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', phone: '', type: 'residential', message: '' });
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <div className="pt-32 pb-24 bg-brand-neutral min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-brand-secondary mb-4"
          >
            Contactez-nous
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Besoin d'un devis gratuit ou d'une information ? Remplissez le formulaire ci-dessous ou utilisez nos coordonnées directes.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="bg-brand-secondary rounded-3xl p-10 text-white flex flex-col justify-between h-full shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-10">Coordonnées</h2>
              <div className="space-y-8">
                {[
                  { icon: Phone, label: 'Téléphone', value: '+236 70 00 00 00' },
                  { icon: Mail, label: 'Email', value: 'contact@sol-centrafrique.com' },
                  { icon: MapPin, label: 'Adresse', value: 'Avenue de France, Bangui, RCA' },
                  { icon: Clock, label: 'Horaires', value: 'Lun - Ven: 08:00 - 18:00' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 hover:translate-x-1 transition-transform">
                    <div className="p-3 bg-white/10 rounded-xl">
                      <item.icon className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{item.label}</p>
                      <p className="font-bold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-20 border-t border-white/10 pt-10">
              <p className="text-sm text-gray-400 mb-4 font-bold uppercase tracking-widest">Suivez-nous</p>
              <div className="flex gap-4">
                {[
                  { icon: Facebook, href: 'https://facebook.com/solcentrafrique' },
                  { icon: Instagram, href: 'https://instagram.com/solcentrafrique' },
                  { icon: Linkedin, href: 'https://linkedin.com/company/solcentrafrique' },
                ].map((social, i) => (
                  <a 
                    key={i} 
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(5); }}
                    className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-brand-secondary transition-all cursor-pointer group/social"
                  >
                    <social.icon className="h-5 w-5 group-hover/social:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-brand-secondary mb-8">Demander un Devis Gratuit</h2>
            
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-brand-primary/10 border border-brand-primary/20 p-12 rounded-3xl text-center"
                >
                  <div className="bg-brand-primary w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-secondary">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-secondary mb-4">Message Envoyé !</h3>
                  <p className="text-gray-600 mb-8">Merci pour votre confiance. Un expert SOL! vous contactera sous 24h ouvrées pour discuter de votre projet.</p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-brand-secondary font-bold underline"
                  >
                    Envoyer un autre message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-bold text-gray-700">Nom Complet *</label>
                      <input 
                        id="name"
                        name="name"
                        type="text" 
                        className={`w-full bg-brand-neutral border-2 px-6 py-4 rounded-xl focus:ring-0 transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-transparent focus:border-brand-primary'}`}
                        placeholder="Votre nom"
                        value={formData.name}
                        onChange={handleChange}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs font-bold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-bold text-gray-700">Email *</label>
                      <input 
                        id="email"
                        name="email"
                        type="email" 
                        className={`w-full bg-brand-neutral border-2 px-6 py-4 rounded-xl focus:ring-0 transition-all ${errors.email ? 'border-red-300 bg-red-50' : 'border-transparent focus:border-brand-primary'}`}
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs font-bold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="phone" className="block text-sm font-bold text-gray-700">Téléphone</label>
                      <input 
                        id="phone"
                        name="phone"
                        type="tel" 
                        className={`w-full bg-brand-neutral border-2 px-6 py-4 rounded-xl focus:ring-0 transition-all ${errors.phone ? 'border-red-300 bg-red-50' : 'border-transparent focus:border-brand-primary'}`}
                        placeholder="+236 70 00 00 00"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs font-bold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.phone}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="type" className="block text-sm font-bold text-gray-700">Type d'Installation</label>
                      <select 
                        id="type"
                        name="type"
                        className="w-full bg-brand-neutral border-2 border-transparent px-6 py-4 rounded-xl focus:border-brand-primary focus:ring-0 transition-all"
                        value={formData.type}
                        onChange={handleChange}
                      >
                        <option value="residential">Résidentielle (Maison)</option>
                        <option value="commercial">Commerciale (PME/Hôtel)</option>
                        <option value="institutional">Institutionnelle (ONG/Santé)</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-bold text-gray-700">Votre Message *</label>
                    <textarea 
                      id="message"
                      name="message"
                      rows={5}
                      className={`w-full bg-brand-neutral border-2 px-6 py-4 rounded-xl focus:ring-0 transition-all ${errors.message ? 'border-red-300 bg-red-50' : 'border-transparent focus:border-brand-primary'}`}
                      placeholder="Expliquez-nous votre besoin (nombre de climatiseurs, appareils...)"
                      value={formData.message}
                      onChange={handleChange}
                    ></textarea>
                    {errors.message && (
                      <p className="text-red-500 text-xs font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.message}
                      </p>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-primary text-brand-secondary font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Envoi en cours...
                      </>
                    ) : (
                      <>
                        Envoyer ma demande <Send className="h-5 w-5" />
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-center text-gray-400 mt-4">
                    * Champs obligatoires. Nous traitons vos données avec confidentialité absolue.
                  </p>
                </form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
