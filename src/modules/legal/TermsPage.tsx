'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FileText, User, ShoppingBag, Shield, AlertTriangle, Scale, RefreshCw, Mail, Ban, GraduationCap } from 'lucide-react';

const LAST_UPDATED = '29 mai 2025';
const CONTACT_EMAIL = 'gcfitelecom@gmail.com';
const COMPANY_NAME = 'GCFI Centrafrique';
const SITE_URL = 'www.gcfi-rca.com';

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

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl px-4 py-3 text-amber-700 dark:text-amber-400 text-sm font-medium flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">

      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center">
                <Scale className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Légal</p>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">Conditions d'utilisation</h1>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Dernière mise à jour : <strong className="text-slate-700 dark:text-slate-300">{LAST_UPDATED}</strong>
            </p>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              En accédant au site <strong className="text-slate-700 dark:text-slate-300">{SITE_URL}</strong> et en
              utilisant nos services, vous acceptez sans réserve les présentes conditions générales d'utilisation (CGU).
              Si vous n'êtes pas d'accord avec l'une de ces conditions, veuillez ne pas utiliser le site.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">

        {/* 1. Présentation */}
        <Section icon={FileText} title="1. Présentation du site">
          <p>
            Le site <strong className="text-slate-700 dark:text-slate-300">{SITE_URL}</strong> est édité par{' '}
            <strong className="text-slate-700 dark:text-slate-300">{COMPANY_NAME}</strong>, entreprise spécialisée
            dans les télécommunications, la formation IT et la vente d'équipements réseau en République Centrafricaine.
          </p>
          <p>Le site propose les services suivants :</p>
          <ul className="space-y-1 mt-1">
            <Li>Boutique en ligne d'équipements télécom et réseaux</Li>
            <Li>Catalogue et inscription aux formations IT et cybersécurité</Li>
            <Li>Informations sur nos services professionnels</Li>
            <Li>Actualités du secteur télécom en RCA</Li>
            <Li>Espace personnel pour gérer vos commandes et profil</Li>
          </ul>
        </Section>

        {/* 2. Compte utilisateur */}
        <Section icon={User} title="2. Création et gestion de votre compte">
          <p>
            Pour accéder à certaines fonctionnalités (passage de commande, suivi, liste de souhaits),
            la création d'un compte est nécessaire. En créant un compte, vous vous engagez à :
          </p>
          <ul className="space-y-1 mt-1">
            <Li>Fournir des informations exactes, complètes et à jour</Li>
            <Li>Maintenir la confidentialité de vos identifiants de connexion</Li>
            <Li>Ne pas partager votre compte avec des tiers</Li>
            <Li>Nous notifier immédiatement de tout accès non autorisé à votre compte</Li>
            <Li>Être âgé d'au moins 16 ans pour créer un compte</Li>
          </ul>
          <p className="mt-2">
            {COMPANY_NAME} se réserve le droit de suspendre ou supprimer tout compte en cas de violation
            des présentes CGU, sans préavis ni indemnité.
          </p>
          <Warning>
            Vous êtes seul responsable de toutes les activités effectuées depuis votre compte.
          </Warning>
        </Section>

        {/* 3. Commandes */}
        <Section icon={ShoppingBag} title="3. Commandes et processus d'achat">
          <p>
            Notre boutique en ligne permet de constituer un panier et de passer une commande. Le processus
            de finalisation s'effectue via <strong className="text-slate-700 dark:text-slate-300">WhatsApp</strong>,
            où notre équipe commerciale vous confirmera la disponibilité, le prix définitif et les modalités
            de livraison.
          </p>

          <div>
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Étapes d'une commande :</p>
            <ol className="space-y-1 list-decimal list-inside ml-1">
              <li>Ajout des articles au panier sur le site</li>
              <li>Validation du panier et envoi automatique sur WhatsApp</li>
              <li>Confirmation de disponibilité et accord sur le prix final par notre équipe</li>
              <li>Paiement et livraison selon les modalités convenues</li>
            </ol>
          </div>

          <p>
            Les prix affichés sur le site sont indicatifs en <strong className="text-slate-700 dark:text-slate-300">
            Francs CFA (FCFA)</strong> et peuvent être actualisés sans préavis. Le prix définitif est celui
            confirmé par notre équipe via WhatsApp.
          </p>
          <Warning>
            L'ajout au panier ne constitue pas une réservation ferme du produit. La commande n'est effective
            qu'après confirmation écrite de notre équipe commerciale.
          </Warning>
        </Section>

        {/* 4. Formations */}
        <Section icon={GraduationCap} title="4. Formations et inscriptions">
          <p>
            L'inscription à une formation s'effectue via notre site. En vous inscrivant, vous reconnaissez :
          </p>
          <ul className="space-y-1 mt-1">
            <Li>Avoir pris connaissance du programme et des prérequis de la formation</Li>
            <Li>Votre inscription est soumise à la disponibilité des places et à la validation de notre équipe</Li>
            <Li>Le programme, les dates et le lieu peuvent être modifiés par GCFI avec un préavis raisonnable</Li>
            <Li>Toute annulation doit être notifiée au moins 48h à l'avance</Li>
          </ul>
          <p className="mt-2">
            Les conditions tarifaires et modalités de paiement des formations sont communiquées
            directement par notre équipe pédagogique.
          </p>
        </Section>

        {/* 5. Utilisation interdite */}
        <Section icon={Ban} title="5. Utilisations interdites">
          <p>Il vous est strictement interdit d'utiliser le site pour :</p>
          <ul className="space-y-1 mt-1">
            <Li>Usurper l'identité d'une autre personne ou entité</Li>
            <Li>Publier, transmettre ou distribuer tout contenu illégal, diffamatoire, haineux ou frauduleux</Li>
            <Li>Tenter de contourner les mesures de sécurité du site</Li>
            <Li>Collecter des données d'autres utilisateurs sans leur consentement</Li>
            <Li>Utiliser des robots, scrapers ou tout outil automatisé non autorisé</Li>
            <Li>Perturber le fonctionnement du site ou des serveurs associés</Li>
            <Li>Passer des commandes fictives ou frauduleuses</Li>
            <Li>Créer plusieurs comptes pour contourner une suspension</Li>
          </ul>
          <p className="mt-2">
            Toute violation pourra entraîner la suspension immédiate de votre compte et, le cas échéant,
            des poursuites judiciaires.
          </p>
        </Section>

        {/* 6. Propriété intellectuelle */}
        <Section icon={Shield} title="6. Propriété intellectuelle">
          <p>
            L'ensemble des éléments du site — textes, images, logos, icônes, vidéos, graphiques, mises en page,
            code source — est la propriété exclusive de{' '}
            <strong className="text-slate-700 dark:text-slate-300">{COMPANY_NAME}</strong> ou de ses partenaires,
            et est protégé par les lois applicables en matière de propriété intellectuelle.
          </p>
          <p>
            Toute reproduction, représentation, modification, publication ou adaptation, même partielle,
            de ces éléments est <strong className="text-slate-700 dark:text-slate-300">strictement interdite</strong>{' '}
            sans autorisation écrite préalable.
          </p>
          <p>
            Les marques et logos affichés sur le site (partenaires, fabricants) restent la propriété
            de leurs détenteurs respectifs.
          </p>
        </Section>

        {/* 7. Responsabilité */}
        <Section icon={AlertTriangle} title="7. Limitation de responsabilité">
          <p>
            {COMPANY_NAME} s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées
            sur le site. Cependant, nous ne pouvons garantir :
          </p>
          <ul className="space-y-1 mt-1">
            <Li>L'exactitude, l'exhaustivité ou l'actualité de toutes les informations publiées</Li>
            <Li>L'absence d'interruption ou d'erreur dans le fonctionnement du site</Li>
            <Li>La compatibilité du site avec tous les appareils et navigateurs</Li>
          </ul>
          <p className="mt-2">
            {COMPANY_NAME} ne saurait être tenu responsable des dommages directs ou indirects résultant
            de l'utilisation du site, d'une interruption de service, d'une perte de données ou d'un accès
            non autorisé à votre compte.
          </p>
          <p>
            Notre responsabilité, dans les cas où elle pourrait être engagée, est limitée au montant
            des sommes effectivement payées par l'utilisateur pour le service concerné.
          </p>
        </Section>

        {/* 8. Liens externes */}
        <Section icon={FileText} title="8. Liens vers des sites tiers">
          <p>
            Le site peut contenir des liens vers des sites internet tiers (partenaires, réseaux sociaux,
            services de paiement). Ces liens sont fournis à titre informatif uniquement.
          </p>
          <p>
            {COMPANY_NAME} n'exerce aucun contrôle sur le contenu de ces sites et décline toute
            responsabilité quant à leurs pratiques en matière de confidentialité ou à la légalité
            de leur contenu. La consultation de ces sites s'effectue sous votre seule responsabilité.
          </p>
        </Section>

        {/* 9. Droit applicable */}
        <Section icon={Scale} title="9. Droit applicable et litiges">
          <p>
            Les présentes CGU sont régies par le droit en vigueur en{' '}
            <strong className="text-slate-700 dark:text-slate-300">République Centrafricaine</strong>.
          </p>
          <p>
            En cas de litige relatif à l'interprétation ou à l'exécution des présentes conditions,
            les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire.
            À défaut d'accord, le litige sera soumis aux juridictions compétentes de Bangui.
          </p>
          <p>
            Pour toute réclamation ou différend, contactez-nous d'abord à{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline font-medium">
              {CONTACT_EMAIL}
            </a>{' '}
            afin de trouver une solution amiable dans les meilleurs délais.
          </p>
        </Section>

        {/* 10. Modifications */}
        <Section icon={RefreshCw} title="10. Modifications des CGU">
          <p>
            {COMPANY_NAME} se réserve le droit de modifier les présentes CGU à tout moment, notamment
            pour s'adapter aux évolutions légales, réglementaires ou techniques.
          </p>
          <p>
            Les modifications prennent effet dès leur publication sur cette page. En continuant à utiliser
            le site après modification, vous acceptez les nouvelles conditions. Il vous est donc conseillé
            de consulter régulièrement cette page.
          </p>
          <p>
            La version en vigueur est toujours accessible à l'adresse{' '}
            <strong className="text-slate-700 dark:text-slate-300">{SITE_URL}/conditions</strong>.
          </p>
        </Section>

        {/* 11. Contact */}
        <Section icon={Mail} title="11. Contact">
          <p>Pour toute question relative aux présentes conditions d'utilisation :</p>
          <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 space-y-2">
            <p className="font-bold text-slate-700 dark:text-slate-300">{COMPANY_NAME}</p>
            <p>Bangui, République Centrafricaine</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 text-[var(--accent)] hover:underline font-medium">
              <Mail className="w-4 h-4" /> {CONTACT_EMAIL}
            </a>
          </div>
        </Section>

      </div>

      {/* Footer note */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          Ces conditions d'utilisation s'appliquent au site{' '}
          <strong>{SITE_URL}</strong> et à tous ses sous-domaines.
          Dernière mise à jour le {LAST_UPDATED}.
        </p>
      </div>
    </div>
  );
}
