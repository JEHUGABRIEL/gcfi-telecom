import React from 'react';
import { motion } from 'motion/react';
import { Wifi, Network, Shield, Camera, Satellite, Server, CheckCircle } from 'lucide-react';

const services = [
  {
    icon: Network,
    title: 'Réseaux LAN/WAN',
    description: 'Conception et déploiement d’infrastructures réseau robustes pour entreprises et administrations.',
    features: ['Architecture sécurisée', 'Haute disponibilité', 'Support 24/7'],
  },
  {
    icon: Wifi,
    title: 'Hotspot & WiFi Zones',
    description: 'Solutions WiFi communautaire, universitaire, hôtels, bars. Portail captif personnalisé.',
    features: ['Gestion de tickets', 'Analytique de fréquentation', 'Personnalisation totale'],
  },
  {
    icon: Satellite,
    title: 'Installation Starlink',
    description: 'Accès Internet par satellite haute performance, même dans les zones les plus reculées.',
    features: ['Débit jusqu\'à 200 Mbps', 'Latence faible', 'Installation rapide'],
  },
  {
    icon: Server,
    title: 'Fibre Optique',
    description: 'Installation et raccordement de fibre optique pour des liaisons ultra-rapides.',
    features: ['Jusqu\'à 10 Gbps', 'Fiabilité accrue', 'Maintenance proactive'],
  },
  {
    icon: Camera,
    title: 'Vidéosurveillance (CCTV)',
    description: 'Systèmes de surveillance intelligente pour protéger vos locaux 24h/24.',
    features: ['Détection de mouvement IA', 'Vision nocturne', 'Accès mobile'],
  },
  {
    icon: Shield,
    title: 'Cybersécurité',
    description: 'Protection contre les cybermenaces, audit de vulnérabilité et conseils stratégiques.',
    features: ['Tests d\'intrusion', 'Sensibilisation', 'Monitoring continu'],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Nos <span className="text-[var(--accent)]">Services</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Des solutions technologiques sur mesure pour propulser votre entreprise en Centrafrique.
          </p>
        </div>

        {/* Grille des services */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[var(--accent)] transition-colors">
                <service.icon className="w-7 h-7 text-[var(--accent)] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{service.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Section CTA */}
        <div className="mt-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Vous avez un projet ?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Contactez notre équipe d’experts pour une étude personnalisée.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 hover:bg-[var(--accent-hover)] transition-all"
          >
            Demander un devis
          </a>
        </div>
      </div>
    </div>
  );
}