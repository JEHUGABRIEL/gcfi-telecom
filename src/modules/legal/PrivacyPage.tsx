'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Database, Lock, Mail, Eye, Trash2, FileText, Phone } from 'lucide-react';

const LAST_UPDATED = '29 mai 2025';
const CONTACT_EMAIL = 'gcfitelecom@gmail.com';
const COMPANY_NAME = 'GCFI Centrafrique';
const COMPANY_ADDRESS = 'Bangui, République Centrafricaine';

interface SectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, children }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-[var(--accent)]" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        {children}
      </div>
    </motion.section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
                  Données personnelles
                </p>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                  Politique de Confidentialité
                </h1>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Dernière mise à jour : <strong className="text-slate-700 dark:text-slate-300">{LAST_UPDATED}</strong>
            </p>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              {COMPANY_NAME} s'engage à protéger la vie privée de ses utilisateurs. Cette politique explique
              quelles données nous collectons, pourquoi, comment nous les utilisons, et quels sont vos droits.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">

        {/* 1. Responsable du traitement */}
        <Section icon={FileText} title="1. Responsable du traitement">
          <p>
            Le responsable du traitement de vos données personnelles est :
          </p>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 mt-2 space-y-1">
            <p><strong className="text-slate-700 dark:text-slate-300">{COMPANY_NAME}</strong></p>
            <p>{COMPANY_ADDRESS}</p>
            <p>
              Email :{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline font-medium">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </Section>

        {/* 2. Données collectées */}
        <Section icon={Database} title="2. Données que nous collectons">
          <p>Selon votre utilisation du site, nous collectons les données suivantes :</p>

          <div className="space-y-4 mt-2">
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Lors de la création d'un compte :</p>
              <ul className="space-y-1">
                <Li>Nom complet</Li>
                <Li>Adresse email</Li>
                <Li>Photo de profil (optionnelle, via Google OAuth)</Li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Lors d'une commande :</p>
              <ul className="space-y-1">
                <Li>Articles commandés et quantités</Li>
                <Li>Montant total</Li>
                <Li>Email associé au compte</Li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Lors de l'abonnement à la newsletter :</p>
              <ul className="space-y-1">
                <Li>Adresse email</Li>
                <Li>Date d'inscription</Li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Données techniques collectées automatiquement :</p>
              <ul className="space-y-1">
                <Li>Adresse IP (gérée par Supabase, utilisée pour la sécurité de la session)</Li>
                <Li>Type de navigateur et système d'exploitation</Li>
                <Li>Pages visitées et durée de navigation (si analytics activé)</Li>
              </ul>
            </div>
          </div>
        </Section>

        {/* 3. Finalités */}
        <Section icon={Eye} title="3. Pourquoi nous utilisons vos données">
          <p>Vos données sont utilisées exclusivement pour les finalités suivantes :</p>
          <ul className="space-y-2 mt-2">
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Gestion de votre compte :</strong>{' '}
              authentification, accès à votre espace personnel, historique de commandes.
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Traitement des commandes :</strong>{' '}
              transmission de votre commande via WhatsApp pour finalisation.
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Communication :</strong>{' '}
              envoi de notifications relatives à votre compte ou vos commandes (si activées).
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Newsletter :</strong>{' '}
              envoi d'actualités et offres GCFI si vous y avez souscrit.
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Sécurité :</strong>{' '}
              prévention des fraudes, protection de nos systèmes.
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Amélioration du service :</strong>{' '}
              analyse de la navigation pour améliorer l'expérience utilisateur.
            </Li>
          </ul>
          <p className="mt-4 text-xs bg-[var(--accent-light)] text-[var(--accent)] rounded-2xl px-4 py-3 font-medium">
            Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers à des fins commerciales.
          </p>
        </Section>

        {/* 4. Stockage et sécurité */}
        <Section icon={Lock} title="4. Stockage et sécurité">
          <p>Vos données sont hébergées et sécurisées via les services suivants :</p>
          <ul className="space-y-2 mt-2">
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Supabase</strong> (base de données) —
              infrastructure hébergée sur AWS, chiffrement en transit (TLS) et au repos (AES-256).
              Politique de confidentialité :{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline">supabase.com/privacy</a>
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Cloudinary</strong> (images téléversées) —
              stockage sécurisé des médias.
              Politique de confidentialité :{' '}
              <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline">cloudinary.com/privacy</a>
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Vercel</strong> (hébergement du site) —
              serveurs en Europe et Amérique du Nord.
              Politique de confidentialité :{' '}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline">vercel.com/legal/privacy-policy</a>
            </Li>
          </ul>
          <p className="mt-4">
            Les mots de passe ne sont jamais stockés en clair. L'authentification est gérée par
            Supabase Auth, conforme aux standards OAuth 2.0 et PKCE.
          </p>
          <p className="mt-2">
            Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte,
            elles sont effacées dans un délai de <strong className="text-slate-700 dark:text-slate-300">30 jours</strong>.
          </p>
        </Section>

        {/* 5. Cookies */}
        <Section icon={Database} title="5. Cookies et technologies similaires">
          <p>Notre site utilise les cookies suivants :</p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="text-left p-3 rounded-tl-xl font-bold text-slate-700 dark:text-slate-300">Cookie</th>
                  <th className="text-left p-3 font-bold text-slate-700 dark:text-slate-300">Finalité</th>
                  <th className="text-left p-3 rounded-tr-xl font-bold text-slate-700 dark:text-slate-300">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                <tr>
                  <td className="p-3 font-mono text-[var(--accent)]">sb-*</td>
                  <td className="p-3">Session d'authentification Supabase</td>
                  <td className="p-3">Session / 7 jours</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[var(--accent)]">theme</td>
                  <td className="p-3">Préférence de thème (clair/sombre)</td>
                  <td className="p-3">Persistent</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[var(--accent)]">wishlist</td>
                  <td className="p-3">Liste de souhaits (localStorage)</td>
                  <td className="p-3">Persistent</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[var(--accent)]">gcfi-newsletter-*</td>
                  <td className="p-3">Statut d'abonnement newsletter</td>
                  <td className="p-3">Persistent</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            Ces cookies sont essentiels au bon fonctionnement du site. Vous pouvez les supprimer
            via les paramètres de votre navigateur, ce qui entraînera la déconnexion de votre compte.
          </p>
        </Section>

        {/* 6. Vos droits */}
        <Section icon={Shield} title="6. Vos droits (RGPD)">
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD) et aux lois applicables,
            vous disposez des droits suivants :
          </p>
          <ul className="space-y-3 mt-3">
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Droit d'accès :</strong>{' '}
              obtenir une copie de vos données personnelles que nous détenons.
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Droit de rectification :</strong>{' '}
              corriger des données inexactes ou incomplètes (via votre espace profil).
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Droit à l'effacement :</strong>{' '}
              demander la suppression de votre compte et de vos données.
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Droit à la portabilité :</strong>{' '}
              recevoir vos données dans un format structuré et lisible.
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Droit d'opposition :</strong>{' '}
              vous opposer au traitement de vos données à des fins marketing.
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Désabonnement newsletter :</strong>{' '}
              à tout moment en nous contactant par email.
            </Li>
          </ul>
          <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4">
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Pour exercer vos droits :</p>
            <p>
              Contactez-nous à{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline font-medium">
                {CONTACT_EMAIL}
              </a>{' '}
              en précisant votre demande. Nous nous engageons à vous répondre dans un délai de{' '}
              <strong>30 jours ouvrés</strong>.
            </p>
          </div>
        </Section>

        {/* 7. Partage des données */}
        <Section icon={Mail} title="7. Partage des données">
          <p>
            Vos données ne sont partagées qu'avec les sous-traitants strictement nécessaires au
            fonctionnement du service (Supabase, Cloudinary, Vercel), tous soumis à des obligations
            contractuelles de confidentialité.
          </p>
          <p>
            Dans le cadre du processus de commande, certaines informations (article, quantité, nom)
            sont transmises via <strong className="text-slate-700 dark:text-slate-300">WhatsApp</strong>{' '}
            à notre équipe commerciale pour finaliser votre achat. WhatsApp est soumis à la politique
            de confidentialité de Meta Platforms Inc.
          </p>
          <p>
            Nous pouvons être amenés à divulguer des données si la loi l'exige (réquisition judiciaire,
            obligation légale).
          </p>
        </Section>

        {/* 8. Mineurs */}
        <Section icon={Shield} title="8. Protection des mineurs">
          <p>
            Notre site est destiné à un public adulte. Nous ne collectons pas sciemment de données
            personnelles relatives à des personnes de moins de 16 ans. Si vous êtes parent ou tuteur
            et pensez que votre enfant nous a fourni des données, contactez-nous immédiatement à{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline font-medium">
              {CONTACT_EMAIL}
            </a>.
          </p>
        </Section>

        {/* 9. Modifications */}
        <Section icon={FileText} title="9. Modifications de cette politique">
          <p>
            Nous nous réservons le droit de modifier cette politique à tout moment. En cas de changement
            substantiel, nous vous en informerons par email (si vous disposez d'un compte) ou via une
            notification sur le site.
          </p>
          <p>
            La version en vigueur est toujours accessible à l'adresse{' '}
            <strong className="text-slate-700 dark:text-slate-300">gcfi-rca.com/confidentialite</strong>.
            La date de dernière mise à jour est indiquée en haut de page.
          </p>
        </Section>

        {/* 10. Contact */}
        <Section icon={Phone} title="10. Nous contacter">
          <p>Pour toute question relative à cette politique ou à vos données personnelles :</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline font-medium">
                {CONTACT_EMAIL}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>{COMPANY_NAME} — {COMPANY_ADDRESS}</span>
            </div>
          </div>
        </Section>

      </div>

      {/* Footer note */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          Cette politique de confidentialité s'applique au site{' '}
          <strong>www.gcfi-rca.com</strong> et à tous ses sous-domaines.
          Dernière mise à jour le {LAST_UPDATED}.
        </p>
      </div>
    </div>
  );
}
