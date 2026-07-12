'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import '@/app/landing.css';

/* ═══════════════════════════════════════════════════════
   ICÔNES
═══════════════════════════════════════════════════════ */
const CheckIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12" /></svg>;
const ArrowRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
const PlayIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10,8 16,12 10,16" /></svg>;
const XIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const SendIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const ChevronDown = ({ open }: { open: boolean }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }}><polyline points="6 9 12 15 18 9"/></svg>;
const GlobeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const DownloadIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

/* ═══════════════════════════════════════════════════════
   LOGO SVG SANTAREX
═══════════════════════════════════════════════════════ */
const SantarexIcon = ({ size = 38 }: { size?: number }) => (
  <svg width={size} height={Math.round(size * 1.15)} viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sg1" x1="10" y1="5" x2="90" y2="110" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00D9C4"/><stop offset="45%" stopColor="#0070E0"/><stop offset="100%" stopColor="#1228B8"/>
      </linearGradient>
      <linearGradient id="sg2" x1="10" y1="5" x2="90" y2="110" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00CEB8"/><stop offset="100%" stopColor="#1535C8"/>
      </linearGradient>
    </defs>
    <path d="M 16,64 C 16,64 14,52 20,42 C 28,30 44,26 60,24 C 72,22 84,18 90,10 C 94,4 90,2 84,4 C 76,7 64,12 50,14 C 36,16 22,20 14,32 C 6,44 8,58 12,66 Z" fill="url(#sg1)"/>
    <path d="M 84,50 C 84,50 86,62 80,72 C 72,84 56,88 40,90 C 28,92 16,96 10,104 C 6,110 10,113 16,111 C 24,108 36,103 50,101 C 64,99 78,95 86,83 C 94,71 92,57 88,49 Z" fill="url(#sg1)"/>
    <rect x="43" y="36" width="14" height="42" rx="5" fill="url(#sg2)"/>
    <rect x="31" y="48" width="38" height="14" rx="5" fill="url(#sg2)"/>
    <path d="M 16,64 C 16,64 14,52 20,42 C 26,32 40,27 54,25 C 54,25 40,30 34,42 C 28,54 28,64 28,64 Z" fill="white" opacity="0.12"/>
    <polyline points="33,55 39,55 43,47 50,63 57,49 61,55 67,55" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NavLogo = () => (
  <div className="lp-wordmark">
    <SantarexIcon size={36} />
    <div className="lp-wordmark-textblock">
      <span className="lp-wordmark-text">SANTA<em>REX</em></span>
      <span className="lp-wordmark-sub">ERP v2.0</span>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SARA — BASE DE CONNAISSANCES
═══════════════════════════════════════════════════════ */
const SARA_KB = [
  { t: ['prix','tarif','coût','abonnement','combien','price','cost','licence','formule'],
    r: 'SANTAREX ERP propose 4 formules :\n• 💊 Pharmacie : 12 000 FCFA/mois\n• 🏥 Cabinet : 15 000 FCFA/mois\n• 🏪 Clinique : 75 000 FCFA/mois\n• 🏦 Hôpital : 150 000 FCFA/mois\n\nEssai gratuit 30 jours, sans carte bancaire.' },
  { t: ['essai','gratuit','trial','free','tester','commencer','démarrer'],
    r: "Oui ! L'essai est gratuit pendant 30 jours, sans carte bancaire et sans engagement. Cliquez sur « Démo gratuite » pour commencer." },
  { t: ['module','fonctionnalité','feature','quoi','faire','propose','contient','inclus'],
    r: 'SANTAREX ERP comprend 14 modules :\n• Patients & DME\n• Consultations & ordonnances\n• Rendez-vous\n• Pharmacie\n• Laboratoire\n• Hospitalisation\n• Urgences & triage\n• Facturation\n• Reporting BI\n• Imagerie médicale\n• Ressources humaines\n• Bloc opératoire\n\nChaque module communique en temps réel.' },
  { t: ['pharmacie','pharmacy','stock','médicament','dispensation','rupture'],
    r: 'Le module Pharmacie gère les stocks en temps réel, la dispensation sur ordonnance, les alertes péremption/rupture et la traçabilité des lots.\n\n💊 Plan Pharmacie autonome : 12 000 FCFA/mois.' },
  { t: ['pays','afrique','disponible','région','déploie','cameroun','sénégal','guinée'],
    r: "SANTAREX ERP est disponible dans toute l'Afrique de l'Ouest et Centrale : Côte d'Ivoire, Sénégal, Cameroun, Mali, Burkina Faso, Guinée, Togo, Congo, Gabon, Bénin et bien d'autres." },
  { t: ['pwa','installer','application','install','téléphone','mobile','smartphone','tablette','appli'],
    r: "SANTAREX ERP est une PWA (Progressive Web App). Installez-la directement depuis votre navigateur sur téléphone, tablette ou PC — sans App Store ni Play Store." },
  { t: ['paiement','orange','mtn','wave','mobile money','moov','cinetpay','espèces'],
    r: 'SANTAREX ERP intègre nativement :\n• Orange Money\n• MTN MoMo\n• Wave\n• Moov Money\n• CinetPay\n• Carte bancaire\n• Espèces\n\nTous les modes de paiement de vos patients sont couverts.' },
  { t: ['sécurité','données','security','data','chiffrement','rgpd','protection','sauvegarde'],
    r: 'Sécurité SANTAREX ERP :\n• Chiffrement AES-256 en transit et au repos\n• Contrôle d\'accès par rôles\n• Journal d\'audit complet\n• Sauvegardes automatiques quotidiennes\n• Données isolées par établissement\n• Conformité RGPD' },
  { t: ['support','assistance','aide','help','contact','problème','bug','urgence'],
    r: 'Support disponible :\n• 📱 WhatsApp : +225 07 78 88 25 92\n• 📞 Tél. : +225 27 22 27 60 14\n• ✉️ contact@ibigsoft.com\n\nFormules Clinique/Hôpital : support 7j/7 et 24h/24.' },
  { t: ['demo','démonstration','demonstration','voir','montrer'],
    r: 'Nous organisons des démonstrations personnalisées, adaptées à votre type de structure. Cliquez sur « Démo gratuite » ou remplissez le formulaire en bas de page. Réponse garantie sous 24h.' },
  { t: ['ibig','éditeur','société','entreprise','about','qui est'],
    r: 'SANTAREX ERP est édité par IBIG Soft (ibigsoft.com), éditeur africain de logiciels professionnels, spécialisé dans les solutions adaptées aux réalités du continent africain.' },
  { t: ['partner','partenaire','revendre','commission','ibigpartners','affilié','réseau'],
    r: 'Le programme IBIG PARTNERS vous permet de recommander SANTAREX ERP et de percevoir des commissions. Inscription gratuite sur ibigpartners.com' },
  { t: ['sara','assistante','ia','intelligence','bot','robot'],
    r: 'Je suis SARA, l\'assistante intelligente officielle de SANTAREX ERP 🤖\n\nJe peux vous présenter le logiciel, comparer les offres, répondre à vos questions ou organiser une démonstration. Que puis-je faire pour vous ?' },
  { t: ['bonjour','salut','hello','bonsoir','hi','bonne journée'],
    r: 'Bonjour ! Je suis SARA, votre assistante SANTAREX ERP 👋\n\nComment puis-je vous aider ?\n• Présentation du logiciel\n• Tarifs et formules\n• Demande de démonstration\n• Support technique' },
  { t: ['merci','thank','parfait','super','excellent','très bien'],
    r: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. Je suis disponible 24h/24 😊" },
];

function getSaraResponse(msg: string): string {
  const lower = msg.toLowerCase();
  for (const item of SARA_KB) {
    if (item.t.some(kw => lower.includes(kw))) return item.r;
  }
  return "Je n'ai pas d'information officielle sur ce point précis. Je peux transmettre votre demande à l'équipe IBIG Soft.\n\n📱 WhatsApp : +225 07 78 88 25 92\n✉️ contact@ibigsoft.com";
}

const SARA_QUICK = [
  "C'est quoi SANTAREX ERP ?",
  "Quels sont les tarifs ?",
  "Essai gratuit disponible ?",
  "Quels modules inclus ?",
  "Comment contacter le support ?",
];

/* ═══════════════════════════════════════════════════════
   DONNÉES
═══════════════════════════════════════════════════════ */
const HERO_SLIDES = [
  { line1: 'La clinique', accent: 'connectée.', line3: "L'Afrique digitale.", sub: 'SANTAREX ERP centralise toute la gestion de votre établissement — dossiers patients, consultations, pharmacie, laboratoire, facturation — dans une seule plateforme cloud.' },
  { line1: "L'hôpital", accent: 'numérique.', line3: 'Zéro paperasse.', sub: 'Ordonnances électroniques, résultats labo instantanés, prescriptions directement reliées à la pharmacie. Votre établissement tourne à plein régime.' },
  { line1: 'La pharmacie', accent: 'intelligente.', line3: 'Zéro rupture de stock.', sub: 'Alertes automatiques de péremption, synchronisation temps réel avec les prescriptions médecin, gestion des lots et traçabilité complète.' },
  { line1: 'La facturation', accent: 'simplifiée.', line3: 'Mobile Money intégré.', sub: "Orange Money, MTN MoMo, Wave — tous les modes de paiement de vos patients intégrés nativement. Tiers-payant, mutuelles, espèces : tout en un." },
  { line1: 'Votre assistante IA', accent: 'SARA.', line3: 'Disponible 24h/24.', sub: "SARA guide vos équipes, répond aux questions et aide chaque utilisateur à maîtriser SANTAREX ERP — à chaque instant, depuis n'importe quel appareil." },
];

const PROBLEMS = [
  { icon: '📋', before: 'Registres papier dispersés, risque de perte de dossiers', after: 'Dossiers médicaux électroniques centralisés, accessibles en temps réel par toute l\'équipe' },
  { icon: '💊', before: 'Stocks de médicaments gérés manuellement — ruptures et péremptions non détectées', after: 'Alertes automatiques en temps réel. Zéro rupture non détectée, zéro médicament périmé distribué' },
  { icon: '🧾', before: 'Facturation laborieuse avec des erreurs de calcul fréquentes', after: 'Facturation automatique avec Mobile Money intégré, reçus numériques générés instantanément' },
  { icon: '📊', before: 'Aucune visibilité sur les performances de l\'établissement', after: 'Tableau de bord avec KPIs en temps réel — recettes, taux d\'occupation, activité médicale' },
  { icon: '🔬', before: 'Résultats de laboratoire transmis manuellement au médecin', after: 'Résultats disponibles dans le DME dès validation du biologiste — alertes critiques immédiates' },
  { icon: '📱', before: 'Impossible de travailler depuis un smartphone ou hors connexion', after: 'SANTAREX ERP fonctionne sur tous les appareils — ordinateur, tablette, smartphone, hors ligne' },
];

const MODULES = [
  { title: 'Patients & DME', desc: 'Dossiers médicaux électroniques complets, IPP automatique, historique, allergies, antécédents.', tag: 'Core', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { title: 'Rendez-vous', desc: "Agenda multi-médecins, créneaux disponibles, rappels SMS, liste d'attente.", tag: 'Core', iconColor: 'rgba(26,86,200,.15)', strokeColor: '#4A8AF4', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { title: 'Consultations', desc: 'CIM-10, constantes vitales, ordonnances numériques, certificats médicaux, plan de soins.', tag: 'Core', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { title: 'Pharmacie', desc: 'Stock temps réel, alertes rupture & péremption, gestion des lots, dispensation sur ordonnance.', tag: 'Cabinet+', iconColor: 'rgba(245,166,35,.1)', strokeColor: '#F5A623', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg> },
  { title: 'Laboratoire', desc: "Demandes d'analyses, saisie & validation des résultats, interface biologiste, historique labo.", tag: 'Cabinet+', iconColor: 'rgba(139,92,246,.12)', strokeColor: '#A78BFA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3l-1 8H5l3 10h8l3-10h-3L14 3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg> },
  { title: 'Hospitalisation', desc: 'Plan des lits temps réel, prescriptions médicales, notes infirmières, sorties et transferts.', tag: 'Clinique+', iconColor: 'rgba(239,68,68,.1)', strokeColor: '#F87171', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { title: 'Urgences', desc: 'Triage Manchester, file attente temps réel, suivi des passages, alertes critiques.', tag: 'Clinique+', iconColor: 'rgba(239,68,68,.1)', strokeColor: '#F87171', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { title: 'Facturation', desc: 'Devis, factures, tiers-payant, paiement mobile money (Orange, MTN, Wave), historique.', tag: 'Core', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { title: 'Reporting & BI', desc: 'KPIs temps réel, tableau de bord direction, exports PDF/Excel, analyses de performance.', tag: 'Clinique+', iconColor: 'rgba(26,86,200,.15)', strokeColor: '#4A8AF4', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { title: 'Imagerie médicale', desc: 'Gestion des examens (Radio, Écho, Scanner, IRM), comptes rendus, PACS basique.', tag: 'Hôpital+', iconColor: 'rgba(245,166,35,.1)', strokeColor: '#F5A623', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { title: 'Ressources humaines', desc: 'Personnel médical & administratif, plannings, congés, paie mensuelle, organigramme.', tag: 'Hôpital+', iconColor: 'rgba(139,92,246,.12)', strokeColor: '#A78BFA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { title: 'Bloc opératoire', desc: 'Programme chirurgical, gestion des salles, protocoles anesthésie, comptes rendus opératoires.', tag: 'Hôpital+', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
];

const PLANS = [
  { code: 'Pharmacie', eyebrow: 'Pharmacie autonome', price: '12 000', cycle: 'FCFA / mois', users: '1 à 5 utilisateurs', featured: false, badge: 'Nouveau',
    features: ['Gestion des stocks complète','Dispensation sur ordonnance','Alertes péremption & rupture','Gestion des lots & traçabilité','Facturation & Mobile Money','Support WhatsApp 5j/7'],
    btnClass: 'lp-plan-btn-outline', btnLabel: "Démarrer l'essai gratuit" },
  { code: 'Cabinet', eyebrow: 'Cabinet médical', price: '15 000', cycle: 'FCFA / mois', users: '1 à 5 utilisateurs', featured: false, badge: null,
    features: ["Jusqu'à 5 utilisateurs",'Patients & DME illimités','Consultations & ordonnances','Rendez-vous & agenda','Facturation mobile money','Support WhatsApp 5j/7'],
    btnClass: 'lp-plan-btn-outline', btnLabel: "Démarrer l'essai gratuit" },
  { code: 'Clinique', eyebrow: 'Clinique & polyclinique', price: '75 000', cycle: 'FCFA / mois', users: "Jusqu'à 30 utilisateurs", featured: true, badge: 'Le plus populaire',
    features: ["Jusqu'à 30 utilisateurs",'Patients, DME & consultations','Pharmacie & gestion stocks','Laboratoire & résultats','Hospitalisation & plan des lits','Dashboard BI & reporting','Support 7j/7 prioritaire'],
    btnClass: 'lp-plan-btn-fill', btnLabel: "Démarrer l'essai gratuit" },
  { code: 'Hôpital', eyebrow: 'Hôpital & groupe', price: '150 000', cycle: 'FCFA / mois', users: 'Utilisateurs illimités', featured: false, badge: null,
    features: ['Utilisateurs illimités','Tous les 14 modules','Urgences & bloc opératoire','Imagerie médicale (PACS)','Ressources humaines & paie','Multi-sites & consolidation','SLA 99.9% · Support 24/7','Account manager dédié'],
    btnClass: 'lp-plan-btn-outline', btnLabel: 'Nous contacter' },
];

const ACTIVITES = [
  { title: 'Hôpital & Clinique', desc: 'Gestion complète multi-services : urgences, consultations, pharmacie, labo, bloc opératoire, imagerie.', tags: ['DME','Urgences','Bloc op.','Imagerie'], color: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { title: 'Pharmacie autonome', desc: 'Stocks, dispensation sur ordonnance, alertes péremption, facturation — sans module hospitalier.', tags: ['Stocks','Dispensation','Alertes','Facturation'], color: '#F5A623', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { title: 'Cabinet médical', desc: 'Agenda, consultations CIM-10, ordonnances numériques et facturation pour praticiens en cabinet.', tags: ['Agenda','DME','Ordonnances','Facturation'], color: '#4A8AF4', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { title: "Laboratoire d'analyses", desc: 'Réception des demandes, saisie & validation des résultats, interface biologiste, historique complet.', tags: ['Demandes','Résultats','Validation','Historique'], color: '#A78BFA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3l-1 8H5l3 10h8l3-10h-3L14 3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg> },
  { title: 'Centre de santé', desc: 'Solution légère pour les CSP, dispensaires et centres communautaires. Déploiement en 48h.', tags: ['Patients','Consultations','Médicaments','Reporting'], color: '#34D399', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { title: 'Clinique spécialisée', desc: 'Ophtalmologie, dentisterie, kinésithérapie, maternité — configuré selon votre spécialité.', tags: ['Spécialités','Planning','DME','Facturation'], color: '#F87171', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
];

const INTEGRATIONS = [
  { name: 'Orange Money', status: 'Disponible', color: '#FF6B00' },
  { name: 'MTN MoMo', status: 'Disponible', color: '#FFCC00' },
  { name: 'Wave', status: 'Disponible', color: '#1DC9FF' },
  { name: 'Moov Money', status: 'Disponible', color: '#0066CC' },
  { name: 'CinetPay', status: 'Disponible', color: '#E63946' },
  { name: 'WhatsApp Business', status: 'Disponible', color: '#25D366' },
  { name: 'Email SMTP', status: 'Disponible', color: '#4A8AF4' },
  { name: 'API REST', status: 'Disponible', color: '#00C8B8' },
  { name: 'FedaPay', status: 'En intégration', color: '#1A56C8' },
  { name: 'Paystack', status: 'En intégration', color: '#00C3F7' },
  { name: 'SMS Gateway', status: 'Bientôt', color: '#64748B' },
  { name: 'Stripe', status: 'Bientôt', color: '#635BFF' },
];

const OTHER_PRODUCTS = [
  { name: 'IBIG Compta', sector: 'Finance & Comptabilité', desc: 'Comptabilité générale et analytique pour PME africaines. Bilan, liasse fiscale, TVA.', color: '#4A8AF4' },
  { name: 'IBIG RH', sector: 'Ressources Humaines', desc: 'Gestion du personnel, planning, congés, paie mensuelle et déclarations sociales.', color: '#A78BFA' },
  { name: 'IBIG Stock', sector: 'Logistique & Inventaire', desc: 'Gestion des stocks, inventaires multi-dépôts, approvisionnements et mouvements.', color: '#F5A623' },
  { name: 'IBIG CRM', sector: 'Commercial & Ventes', desc: 'Gestion des prospects, clients, devis, commandes et suivi commercial.', color: '#34D399' },
];

const FAQ_ITEMS = [
  { q: "Qu'est-ce que SANTAREX ERP ?", a: "SANTAREX ERP est un logiciel de gestion hospitalière complet, conçu pour les établissements de santé en Afrique de l'Ouest et Centrale. Il centralise la gestion des patients, consultations, pharmacie, laboratoire, facturation et bien plus dans une seule plateforme cloud." },
  { q: "À qui s'adresse SANTAREX ERP ?", a: "SANTAREX ERP s'adresse aux hôpitaux, cliniques, polycliniques, cabinets médicaux, pharmacies autonomes, laboratoires d'analyses, centres de santé et cliniques spécialisées (ophtalmologie, dentaire, kinésithérapie…)." },
  { q: "Y a-t-il une période d'essai gratuite ?", a: "Oui. Un essai gratuit de 30 jours est disponible sans carte bancaire et sans engagement. Vous accédez à toutes les fonctionnalités de la formule choisie durant cette période." },
  { q: "Quels sont les tarifs ?", a: "4 formules : Pharmacie à 12 000 FCFA/mois, Cabinet à 15 000 FCFA/mois, Clinique à 75 000 FCFA/mois et Hôpital à 150 000 FCFA/mois. Tous les tarifs incluent hébergement, maintenance et support." },
  { q: "Est-il disponible hors connexion ?", a: "SANTAREX ERP propose un mode hors-ligne partiel pour les consultations et la pharmacie. Les données saisies sont synchronisées automatiquement au retour de connexion internet." },
  { q: "Puis-je l'installer sur mon téléphone ?", a: "Oui. SANTAREX ERP est une Progressive Web App (PWA). Installez-la sur votre smartphone, tablette ou ordinateur directement depuis votre navigateur, sans passer par l'App Store ou le Play Store." },
  { q: "Quels modes de paiement sont pris en charge ?", a: "Orange Money, MTN MoMo, Wave, Moov Money, CinetPay, carte bancaire et espèces. Tous les modes de paiement courants en Afrique sont intégrés nativement." },
  { q: "Combien de temps pour être opérationnel ?", a: "La mise en route prend généralement 48 heures : création du compte, configuration de votre établissement, import des données existantes et formation de vos équipes." },
  { q: "Où sont hébergées mes données ?", a: "Vos données sont hébergées sur des serveurs sécurisés, chiffrées AES-256 en transit et au repos. Chaque établissement dispose de son propre espace isolé. Des sauvegardes automatiques sont effectuées quotidiennement." },
  { q: "Y a-t-il un engagement minimum ?", a: "Non. SANTAREX ERP fonctionne sur abonnement mensuel sans engagement de durée. Vous pouvez résilier à tout moment depuis votre espace administration, sans frais." },
];

const TESTIMONIALS = [
  { initial: 'K', name: 'Dr. Konan Akissi', role: 'Directeur médical — Clinique Sainte-Marie, Douala', quote: 'SANTAREX a transformé notre pharmacie. La synchronisation avec les prescriptions médecin est instantanée — plus aucune rupture non détectée.' },
  { initial: 'T', name: 'Mme Traoré Fatoumata', role: 'Responsable administratif — Polyclinique Dakar Santé', quote: "Le tableau de bord nous donne enfin une visibilité complète sur nos recettes et notre taux d'occupation. On pilote l'hôpital avec des données." },
  { initial: 'C', name: 'Dr. Coulibaly Moussa', role: 'Médecin généraliste — Cabinet Excellence, Lomé', quote: "Les ordonnances numériques et le DME m'économisent 2 heures par jour. Je me concentre sur mes patients, pas sur la paperasse." },
];

/* ═══════════════════════════════════════════════════════
   COMPOSANT SARA FLOTTANT
═══════════════════════════════════════════════════════ */
function SaraChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: 'sara' | 'user'; text: string }[]>([
    { from: 'sara', text: "Bonjour ! Je suis SARA, votre assistante SANTAREX ERP 👋\n\nComment puis-je vous aider ?" },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, typing]);

  function send(msg: string) {
    const text = msg.trim();
    if (!text) return;
    setInput('');
    setMessages(m => [...m, { from: 'user', text }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { from: 'sara', text: getSaraResponse(text) }]);
    }, 900 + Math.random() * 600);
  }

  return (
    <>
      {/* Fenêtre */}
      {open && (
        <div className="lp-sara-window">
          <div className="lp-sara-header">
            <div className="lp-sara-header-left">
              <div className="lp-sara-avatar-sm"><SantarexIcon size={20} /></div>
              <div>
                <div className="lp-sara-header-name">SARA</div>
                <div className="lp-sara-header-status"><span className="lp-sara-online-dot" />En ligne</div>
              </div>
            </div>
            <button className="lp-sara-close" onClick={() => setOpen(false)}><XIcon /></button>
          </div>
          <div className="lp-sara-messages" ref={messagesRef}>
            {messages.map((m, i) => (
              <div key={i} className={`lp-sara-msg lp-sara-msg-${m.from}`}>
                {m.text.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < m.text.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
            ))}
            {typing && (
              <div className="lp-sara-msg lp-sara-msg-sara">
                <div className="lp-sara-typing"><span/><span/><span/></div>
              </div>
            )}
          </div>
          {messages.length === 1 && (
            <div className="lp-sara-quick">
              {SARA_QUICK.map(q => (
                <button key={q} className="lp-sara-quick-btn" onClick={() => send(q)}>{q}</button>
              ))}
            </div>
          )}
          <div className="lp-sara-input-row">
            <input
              ref={inputRef}
              className="lp-sara-input"
              placeholder="Posez votre question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
            />
            <button className="lp-sara-send" onClick={() => send(input)}><SendIcon /></button>
          </div>
          <div className="lp-sara-footer-note">Assistante IA · SANTAREX ERP — IBIG Soft</div>
        </div>
      )}
      {/* Bouton flottant */}
      <button className="lp-sara-btn" onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 200); }} title="Besoin d'aide ? Parlez à SARA">
        {open ? <XIcon /> : (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="22" height="22">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/>
          </svg>
        )}
        {!open && <span className="lp-sara-pulse" />}
      </button>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   BOUTON WHATSAPP FLOTTANT
═══════════════════════════════════════════════════════ */
function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/2250778882592?text=Bonjour%20IBIG%20Soft%2C%20je%20souhaite%20obtenir%20des%20informations%20sur%20SANTAREX%20ERP."
      target="_blank" rel="noopener noreferrer"
      className="lp-wa-btn" title="Contacter via WhatsApp"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
      </svg>
    </a>
  );
}

/* ═══════════════════════════════════════════════════════
   BANNIÈRE COOKIES
═══════════════════════════════════════════════════════ */
function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('lp_cookie_consent')) {
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);
  if (!visible) return null;
  function accept() { localStorage.setItem('lp_cookie_consent', 'accepted'); setVisible(false); }
  function refuse() { localStorage.setItem('lp_cookie_consent', 'refused'); setVisible(false); }
  return (
    <div className="lp-cookie-banner">
      <div className="lp-cookie-text">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Nous utilisons des cookies pour améliorer votre expérience. En continuant, vous acceptez notre{' '}
        <Link href="/cookies" className="lp-cookie-link">politique de cookies</Link>.
      </div>
      <div className="lp-cookie-actions">
        <button className="lp-cookie-btn-refuse" onClick={refuse}>Refuser</button>
        <button className="lp-cookie-btn-accept" onClick={accept}>Tout accepter</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BANNIÈRE PWA
═══════════════════════════════════════════════════════ */
function PwaBanner() {
  const [prompt, setPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setPrompt(e); setTimeout(() => setVisible(true), 8000); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  if (!visible || !prompt) return null;
  function install() { prompt.prompt(); setVisible(false); }
  return (
    <div className="lp-pwa-banner">
      <div className="lp-pwa-left">
        <SantarexIcon size={32} />
        <div>
          <div className="lp-pwa-title">Installer SANTAREX ERP</div>
          <div className="lp-pwa-sub">Accès rapide depuis votre écran d&apos;accueil</div>
        </div>
      </div>
      <div className="lp-pwa-actions">
        <button className="lp-pwa-later" onClick={() => setVisible(false)}>Plus tard</button>
        <button className="lp-pwa-install" onClick={install}><DownloadIcon /> Installer</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FORMULAIRE DÉMO
═══════════════════════════════════════════════════════ */
function DemoForm() {
  const [state, setState] = useState<'idle' | 'success' | 'error'>('idle');
  const nomRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  function handleSubmit() {
    const nom = nomRef.current?.value.trim() ?? '';
    const email = emailRef.current?.value.trim() ?? '';
    if (!nom || !email) { setState('error'); setTimeout(() => setState('idle'), 2500); return; }
    setState('success');
  }
  const btnLabel = state === 'success' ? '✓ Demande envoyée — nous revenons sous 24h' : state === 'error' ? 'Veuillez remplir nom et email' : 'Envoyer la demande →';
  return (
    <div className="lp-demo-form">
      <div className="lp-form-title">Demander une démo gratuite</div>
      <div className="lp-form-group">
        <label className="lp-form-label">Nom complet</label>
        <input ref={nomRef} type="text" className="lp-form-input" placeholder="Dr. Jean Dupont" disabled={state === 'success'} />
      </div>
      <div className="lp-form-group">
        <label className="lp-form-label">Email professionnel</label>
        <input ref={emailRef} type="email" className="lp-form-input" placeholder="jean@clinique.ci" disabled={state === 'success'} />
      </div>
      <div className="lp-form-group">
        <label className="lp-form-label">Type d&apos;établissement</label>
        <select className="lp-form-input" disabled={state === 'success'}>
          <option value="">Sélectionner…</option>
          <option>Hôpital</option><option>Clinique privée</option><option>Polyclinique</option>
          <option>Cabinet médical</option><option>Pharmacie autonome</option>
          <option>Laboratoire d&apos;analyses</option><option>Centre de santé</option>
        </select>
      </div>
      <div className="lp-form-group">
        <label className="lp-form-label">Pays</label>
        <select className="lp-form-input" disabled={state === 'success'}>
          <option value="">Sélectionner…</option>
          <option>Côte d&apos;Ivoire</option><option>Sénégal</option><option>Cameroun</option>
          <option>Mali</option><option>Burkina Faso</option><option>Guinée</option>
          <option>Togo</option><option>Congo</option><option>Gabon</option><option>Bénin</option><option>Autre</option>
        </select>
      </div>
      <button className={`lp-form-btn ${state === 'success' ? 'success' : state === 'error' ? 'error-state' : ''}`} onClick={handleSubmit} disabled={state === 'success'}>{btnLabel}</button>
      <div className="lp-form-note">Réponse garantie sous 24h · Aucun engagement</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.style.background = window.scrollY > 40 ? 'rgba(6,16,31,.98)' : 'rgba(6,16,31,.88)';
      nav.style.boxShadow = window.scrollY > 40 ? '0 1px 0 rgba(255,255,255,.05)' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSliding(true);
      setTimeout(() => { setSlideIdx(i => (i + 1) % HERO_SLIDES.length); setSliding(false); }, 400);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[slideIdx];

  return (
    <div style={{ background: '#06101F', minHeight: '100vh' }}>

      {/* ══ BARRE SUPÉRIEURE ══ */}
      <div className="lp-topbar">
        <div className="lp-topbar-inner">
          <span>Essayez SANTAREX ERP gratuitement pendant 30 jours</span>
          <div className="lp-topbar-sep" />
          <span>📞 +225 27 22 27 60 14</span>
          <div className="lp-topbar-sep" />
          <a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer">Une solution IBIG Soft ↗</a>
        </div>
        <button className="lp-lang-toggle" onClick={() => setLang(l => l === 'fr' ? 'en' : 'fr')}>
          <GlobeIcon /> {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>

      {/* ══ NAV ══ */}
      <nav ref={navRef} className="lp-nav" style={{ top: 36 }}>
        <div className="lp-nav-logo"><NavLogo /></div>
        <div className="lp-nav-links">
          <a href="#modules">{lang === 'fr' ? 'Modules' : 'Modules'}</a>
          <a href="#activites">{lang === 'fr' ? 'Solutions' : 'Solutions'}</a>
          <a href="#pricing">{lang === 'fr' ? 'Tarifs' : 'Pricing'}</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">{lang === 'fr' ? 'Contact' : 'Contact'}</a>
        </div>
        <div className="lp-nav-actions">
          <a href="https://ibigpartners.com/" target="_blank" rel="noopener noreferrer" className="lp-btn-partner">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {lang === 'fr' ? 'Devenir Partenaire' : 'Become Partner'}
          </a>
          <Link href="/login" className="lp-btn-ghost">{lang === 'fr' ? 'Connexion' : 'Login'}</Link>
          <a href="#contact" className="lp-btn-cta">{lang === 'fr' ? 'Démo gratuite →' : 'Free Demo →'}</a>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="lp-hero" style={{ paddingTop: 144 }}>
        <div className="lp-hero-grid">
          <div>
            <div className="lp-hero-eyebrow">
              <span className="lp-hero-eyebrow-dot" />
              {lang === 'fr' ? 'Logiciel SaaS — Made for Africa' : 'SaaS Software — Made for Africa'}
            </div>
            <div className="lp-hero-ibig-badge">
              Un produit&nbsp;<a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer">IBIG SOFT</a>&nbsp;·&nbsp;ibigsoft.com
            </div>
            <h1 className={`lp-hero-title ${sliding ? 'lp-slide-out' : 'lp-slide-in'}`}>
              {slide.line1}<br />
              <span className="accent">{slide.accent}</span><br />
              <span className="line2">{slide.line3}</span>
            </h1>
            <p className={`lp-hero-desc ${sliding ? 'lp-slide-out' : 'lp-slide-in'}`} style={{ transitionDelay: sliding ? '0ms' : '60ms' }}>
              {slide.sub}
            </p>
            <div className="lp-hero-ctas">
              <a href="#contact" className="lp-btn-primary"><ArrowRight />{lang === 'fr' ? 'Essai gratuit 30 jours' : '30-day free trial'}</a>
              <a href="#modules" className="lp-btn-secondary"><PlayIcon />{lang === 'fr' ? 'Voir les modules' : 'See modules'}</a>
            </div>
            <div className="lp-hero-trust">
              {["Côte d'Ivoire", 'Sénégal', 'Cameroun', 'Mali', 'Burkina Faso', 'Guinée', 'Togo', 'Congo'].map((pays, i) => (
                <div key={pays} style={{ display: 'contents' }}>
                  {i > 0 && <div className="lp-trust-sep" />}
                  <div className="lp-trust-item"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>{pays}</div>
                </div>
              ))}
            </div>
            <div className="lp-slide-dots">
              {HERO_SLIDES.map((_, i) => (
                <button key={i} className={`lp-slide-dot ${i === slideIdx ? 'active' : ''}`}
                  onClick={() => { setSliding(true); setTimeout(() => { setSlideIdx(i); setSliding(false); }, 300); }} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
          </div>

          {/* Mockup dashboard */}
          <div className="lp-hero-visual">
            <div className="lp-mockup-wrap">
              <div className="lp-mockup">
                <div className="lp-mk-sidebar">
                  <div className="lp-mk-logo-area"><div className="lp-mk-logo-dot"><SantarexIcon size={18} /></div></div>
                  <div className="lp-mk-nav-item active"><div className="lp-mk-icon" /></div>
                  <div className="lp-mk-nav-item" style={{ position: 'relative' }}><div className="lp-mk-icon" style={{ background: 'rgba(255,255,255,.08)' }} /><div className="lp-mk-notif" /></div>
                  {[...Array(4)].map((_, i) => <div key={i} className="lp-mk-nav-item"><div className="lp-mk-icon" style={{ background: 'rgba(255,255,255,.08)' }} /></div>)}
                </div>
                <div className="lp-mk-main">
                  <div className="lp-mk-topbar">
                    <span className="lp-mk-topbar-title">Tableau de bord</span>
                    <div className="lp-mk-topbar-right"><div className="lp-mk-search" /><div className="lp-mk-avatar" /></div>
                  </div>
                  <div className="lp-mk-body">
                    <div className="lp-mk-kpis">
                      {[{ v: '1 284', l: 'Patients', t: '↑ +4.2%' }, { v: '38/56', l: 'Lits', t: '68%', o: true }, { v: '127', l: 'RDV', t: '↑ +12' }, { v: '2.4M', l: 'FCFA', t: '↑ +8.1%' }].map(k => (
                        <div key={k.l} className="lp-mk-kpi">
                          <div className="lp-mk-kpi-val" style={{ fontSize: k.l === 'FCFA' ? 10 : undefined }}>{k.v}</div>
                          <div className="lp-mk-kpi-lbl">{k.l}</div>
                          <div className={`lp-mk-kpi-trend${k.o ? ' orange' : ''}`}>{k.t}</div>
                        </div>
                      ))}
                    </div>
                    <div className="lp-mk-row">
                      <div className="lp-mk-chart">
                        <div className="lp-mk-chart-title">Consultations — 7 jours</div>
                        <div className="lp-mk-chart-bars">
                          {[55, 70, 45, 80, 100, 65, 75].map((h, i) => <div key={i} className={`lp-mk-bar ${h === 100 ? 'hi' : h > 60 ? 'med' : ''}`} style={{ height: `${h}%` }} />)}
                        </div>
                      </div>
                      <div className="lp-mk-chart">
                        <div className="lp-mk-chart-title">Modules actifs</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                          {[{ lbl: 'Pharmacie', w: '82%', color: '#00C8B8' }, { lbl: 'Labo', w: '65%', color: '#1A56C8' }, { lbl: 'Urgences', w: '48%', color: '#F5A623' }].map(({ lbl, w, color }) => (
                            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 7.5, color: '#64748B' }}>{lbl}</span>
                              <div className="lp-mk-progress-bar-track"><div className="lp-mk-progress-bar-fill" style={{ width: w, background: color }} /></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="lp-mk-table">
                      <div className="lp-mk-table-head"><span className="lp-mk-th">Patient</span><span className="lp-mk-th">Médecin</span><span className="lp-mk-th">Statut</span></div>
                      {[{ n: 'Konan A. Désiré', m: 'Dr. Diallo', s: 'EN COURS', cls: 'lp-mk-badge' }, { n: 'Traoré Fatouma', m: 'Dr. Bamba', s: 'ATTENTE', cls: 'lp-mk-badge-orange' }, { n: 'Coulibaly M.', m: 'Dr. Ouédraogo', s: 'TERMINÉ', cls: 'lp-mk-badge' }].map(({ n, m, s, cls }) => (
                        <div key={n} className="lp-mk-tr"><span className="lp-mk-td">{n}</span><span className="lp-mk-td">{m}</span><span className="lp-mk-td"><span className={cls}>{s}</span></span></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-scroll-indicator"><div className="lp-scroll-line" />Découvrir</div>
      </section>

      {/* ══ TRUST BAR ══ */}
      <div className="lp-trust-bar">
        <div className="lp-trust-bar-inner">
          <span className="lp-trust-label">Déployé dans</span>
          <div className="lp-trust-logos">
            {['Clinique Sainte-Marie · Douala', 'Polyclinique Dakar Santé · Sénégal', 'CHR de Conakry · Guinée', 'Hôpital Général · Brazzaville', 'Cabinet Excellence · Lomé'].map(n => (
              <span key={n} className="lp-trust-logo">{n}</span>
            ))}
          </div>
          <div className="lp-trust-count"><strong>60+</strong> établissements actifs</div>
        </div>
      </div>

      {/* ══ STATS ══ */}
      <section className="lp-stats-section">
        <div className="lp-stats-inner">
          {[{ num: '14', sup: '+', lbl: 'Modules cliniques intégrés' }, { num: '30', sup: 'j', lbl: 'Essai gratuit sans engagement' }, { num: '99', sup: '%', lbl: 'Disponibilité garantie SLA' }, { num: '24', sup: '/7', lbl: 'Support technique inclus' }].map(({ num, sup, lbl }) => (
            <div key={lbl} className="lp-stat-box"><div className="lp-stat-num">{num}<span>{sup}</span></div><div className="lp-stat-lbl">{lbl}</div></div>
          ))}
        </div>
      </section>

      {/* ══ PROBLÈMES RÉSOLUS ══ */}
      <section className="lp-problems-section">
        <div className="lp-problems-inner">
          <span className="lp-eyebrow">Problèmes résolus</span>
          <h2 className="lp-section-title dark">Avant SANTAREX ERP.<br /><span style={{ color: 'var(--teal)' }}>Après SANTAREX ERP.</span></h2>
          <div className="lp-problems-grid">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="lp-problem-card">
                <div className="lp-problem-icon">{p.icon}</div>
                <div className="lp-problem-before">
                  <div className="lp-problem-label before">Avant</div>
                  <p>{p.before}</p>
                </div>
                <div className="lp-problem-arrow">→</div>
                <div className="lp-problem-after">
                  <div className="lp-problem-label after">Avec SANTAREX</div>
                  <p>{p.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MODULES ══ */}
      <section id="modules" className="lp-modules-section">
        <div className="lp-modules-inner">
          <div className="lp-modules-layout">
            <div className="lp-modules-sticky">
              <span className="lp-eyebrow">Modules</span>
              <h2 className="lp-section-title">Une seule plateforme.<br />Tout votre hôpital.</h2>
              <p className="lp-section-desc" style={{ marginTop: 14 }}>Chaque module communique en temps réel. Une prescription générée en consultation alerte automatiquement la pharmacie. Un résultat labo apparaît dans le DME dès validation.</p>
              <div className="lp-modules-checklist">
                {['Données synchronisées en temps réel', 'Déployable module par module', 'Formation incluse dans tous les plans'].map(t => (
                  <div key={t} className="lp-check-item"><div className="lp-check-icon"><CheckIcon /></div>{t}</div>
                ))}
              </div>
            </div>
            <div className="lp-modules-grid">
              {MODULES.map(m => (
                <div key={m.title} className="lp-module-card">
                  <div className="lp-module-icon" style={{ background: m.iconColor }}><span style={{ color: m.strokeColor }}>{m.icon}</span></div>
                  <h3>{m.title}</h3><p>{m.desc}</p><span className="lp-module-tag">{m.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ INTÉGRATIONS ══ */}
      <section className="lp-integrations-section">
        <div className="lp-integrations-inner">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="lp-eyebrow" style={{ display: 'block', textAlign: 'center' }}>Intégrations</span>
            <h2 className="lp-section-title" style={{ textAlign: 'center' }}>Connecté à vos outils.</h2>
          </div>
          <div className="lp-integrations-grid">
            {INTEGRATIONS.map(g => (
              <div key={g.name} className="lp-integration-card">
                <div className="lp-integration-dot" style={{ background: g.color }} />
                <div className="lp-integration-name">{g.name}</div>
                <div className={`lp-integration-status lp-int-${g.status === 'Disponible' ? 'ok' : g.status === 'En intégration' ? 'wip' : 'soon'}`}>{g.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY ══ */}
      <section className="lp-why-section">
        <div className="lp-why-inner">
          <div style={{ marginBottom: 56 }}>
            <span className="lp-eyebrow" style={{ color: '#1A56C8' }}>Pourquoi SANTAREX</span>
            <h2 className="lp-section-title dark">Conçu pour vos contraintes.<br />Pas pour les contourner.</h2>
          </div>
          <div className="lp-why-grid">
            {[
              { n: '01', title: 'Paiements locaux intégrés', desc: 'Orange Money, MTN MoMo, Wave, Moov, carte bancaire, espèces — tous les modes de paiement que vos patients utilisent, sans intermédiaire.', badge: 'FCFA natif' },
              { n: '02', title: 'Résilient aux coupures réseau', desc: 'Mode hors-ligne partiel pour les consultations et la pharmacie. Synchronisation automatique au retour de connexion, sans perte de données.', badge: 'Offline-first' },
              { n: '03', title: 'Sécurité médicale stricte', desc: "Chiffrement AES-256 au repos et en transit. Contrôle d'accès par rôle. Journal d'audit complet. Conformité RGPD.", badge: 'ISO 27001 en cours' },
              { n: '04', title: 'Déploiement en 48h', desc: 'Aucune installation de serveur. Compte créé, données importées, équipes formées — 48h pour être opérationnel, support sur site disponible.', badge: 'Support sur site' },
            ].map(({ n, title, desc, badge }) => (
              <div key={n} className="lp-why-card">
                <div className="lp-why-num">{n}</div>
                <div className="lp-why-title">{title}</div>
                <div className="lp-why-desc">{desc}</div>
                <div className="lp-why-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>{badge}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMMENT ÇA MARCHE ══ */}
      <section className="lp-how-section">
        <div className="lp-how-inner">
          <div style={{ textAlign: 'center' }}>
            <span className="lp-eyebrow" style={{ display: 'block', textAlign: 'center' }}>Mise en route</span>
            <h2 className="lp-section-title" style={{ textAlign: 'center' }}>Opérationnel en 3 étapes</h2>
          </div>
          <div className="lp-how-steps">
            {[{ n: 1, title: 'Inscription & configuration', desc: 'Créez votre compte, renseignez les informations de votre établissement, configurez vos services et tarifs. Moins de 30 minutes.' }, { n: 2, title: 'Formation & import', desc: 'Notre équipe forme vos agents en visioconférence ou sur site. Import de vos patients existants via fichier Excel si besoin.' }, { n: 3, title: 'Lancement en production', desc: 'Votre établissement est en ligne. Support disponible par WhatsApp, téléphone et email pendant les 30 premiers jours.' }].map(({ n, title, desc }) => (
              <div key={n} className="lp-how-step"><div className="lp-step-num">{n}</div><div className="lp-step-title">{title}</div><p className="lp-step-desc">{desc}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ACTIVITÉS ══ */}
      <section id="activites" className="lp-activites-section">
        <div className="lp-activites-inner">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="lp-eyebrow" style={{ display: 'block', textAlign: 'center' }}>Une plateforme, plusieurs métiers</span>
            <h2 className="lp-section-title" style={{ textAlign: 'center' }}>À l&apos;inscription, vous choisissez<br /><span style={{ color: 'var(--teal)' }}>votre activité.</span></h2>
            <p className="lp-section-desc" style={{ textAlign: 'center', margin: '16px auto 0', maxWidth: 560 }}>SANTAREX ERP se configure automatiquement selon votre type de structure. Les modules, tableaux de bord et flux de travail s&apos;adaptent à votre métier — pas l&apos;inverse.</p>
          </div>
          <div className="lp-activites-grid">
            {ACTIVITES.map(a => (
              <div key={a.title} className="lp-activite-card">
                <div className="lp-activite-icon" style={{ color: a.color, background: `${a.color}18` }}>{a.icon}</div>
                <h3 className="lp-activite-title">{a.title}</h3>
                <p className="lp-activite-desc">{a.desc}</p>
                <div className="lp-activite-tags">{a.tags.map(t => <span key={t} className="lp-activite-tag" style={{ borderColor: `${a.color}40`, color: a.color }}>{t}</span>)}</div>
              </div>
            ))}
          </div>
          <div className="lp-activites-cta">
            <div className="lp-activites-cta-text"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>À l&apos;inscription, sélectionnez votre activité — le système configure vos modules, tableau de bord et droits d&apos;accès automatiquement.</div>
            <a href="#contact" className="lp-btn-cta" style={{ whiteSpace: 'nowrap' }}>Voir une démo →</a>
          </div>
        </div>
      </section>

      {/* ══ PWA ══ */}
      <section className="lp-pwa-section">
        <div className="lp-pwa-section-inner">
          <div className="lp-pwa-section-text">
            <span className="lp-eyebrow">Application web progressive</span>
            <h2 className="lp-section-title">Installez SANTAREX ERP<br />sur votre appareil.</h2>
            <p className="lp-section-desc" style={{ marginTop: 16 }}>Accédez plus rapidement à votre espace depuis votre ordinateur, votre tablette ou votre smartphone, sans passer par une boutique d&apos;applications.</p>
            <div className="lp-pwa-features">
              {['Accès rapide depuis l\'écran d\'accueil', 'Ouverture en plein écran', 'Mises à jour automatiques', 'Compatible Android, iOS et PC', 'Fonctionne partiellement hors connexion', 'Aucun fichier lourd à télécharger'].map(f => (
                <div key={f} className="lp-check-item"><div className="lp-check-icon"><CheckIcon /></div>{f}</div>
              ))}
            </div>
            <div className="lp-pwa-ios-tip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              Sur iPhone : appuyez sur <strong>Partager</strong> puis <strong>Ajouter à l&apos;écran d&apos;accueil</strong>
            </div>
          </div>
          <div className="lp-pwa-section-visual">
            <div className="lp-pwa-device">
              <div className="lp-pwa-device-screen">
                <div className="lp-pwa-screen-bar" />
                <div className="lp-pwa-screen-content">
                  <SantarexIcon size={40} />
                  <div className="lp-pwa-screen-title">SANTAREX ERP</div>
                  <div className="lp-pwa-screen-sub">v2.0 — IBIG Soft</div>
                  <div className="lp-pwa-screen-kpis">
                    <div className="lp-pwa-screen-kpi"><div>1 284</div><span>Patients</span></div>
                    <div className="lp-pwa-screen-kpi"><div>127</div><span>RDV</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="lp-pricing-section">
        <div className="lp-pricing-inner">
          <span className="lp-eyebrow" style={{ color: '#1A56C8' }}>Tarifs</span>
          <h2 className="lp-section-title dark">Transparent. Sans surprise.</h2>
          <p className="lp-section-desc">Tous les plans incluent hébergement, maintenance et support. Pas de frais cachés. Résiliez à tout moment.</p>
          <div className="lp-pricing-grid lp-pricing-5col">
            {PLANS.map(p => (
              <div key={p.code} className={`lp-plan-card ${p.featured ? 'featured' : ''}`}>
                {p.badge && <div className="lp-plan-badge">{p.badge}</div>}
                <div className="lp-plan-eyebrow">{p.eyebrow}</div>
                <div className="lp-plan-name">{p.code}</div>
                <div className="lp-plan-users">{p.users}</div>
                <div style={{ marginBottom: 20 }}>
                  <span className="lp-plan-amount" style={p.price === 'Sur devis' ? { fontSize: '1.375rem', color: '#1A56C8' } : {}}>{p.price}</span>
                  {p.cycle && <span className="lp-plan-cycle">{p.cycle}</span>}
                </div>
                <div className="lp-plan-divider" />
                <ul className="lp-plan-features">{p.features.map(f => <li key={f}><div className="lp-feature-check"><CheckIcon /></div>{f}</li>)}</ul>
                <a href="#contact" className={`lp-plan-btn ${p.btnClass}`}>{p.btnLabel}</a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '.8125rem', color: '#64748B' }}>
            Tous les prix sont HT · Essai gratuit 30 jours sans carte bancaire · Facturation annuelle disponible (−15%)
          </p>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section id="testimonials" className="lp-testi-section">
        <div className="lp-testi-inner">
          <span className="lp-eyebrow">Témoignages</span>
          <h2 className="lp-section-title">Ils ont modernisé leur établissement.</h2>
          <div className="lp-testi-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="lp-testi-card">
                <div className="lp-stars">★★★★★</div>
                <p className="lp-testi-quote">{t.quote}</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-avatar">{t.initial}</div>
                  <div><div className="lp-testi-name">{t.name}</div><div className="lp-testi-role">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="faq" className="lp-faq-section">
        <div className="lp-faq-inner">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="lp-eyebrow" style={{ display: 'block', textAlign: 'center' }}>FAQ</span>
            <h2 className="lp-section-title dark" style={{ textAlign: 'center' }}>Questions fréquentes</h2>
          </div>
          <div className="lp-faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={`lp-faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="lp-faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{item.q}</span><ChevronDown open={openFaq === i} />
                </button>
                {openFaq === i && <div className="lp-faq-answer">{item.a}</div>}
              </div>
            ))}
          </div>
          <div className="lp-faq-sara">
            <span>Votre question n&apos;est pas listée ?</span>
            <button className="lp-faq-sara-btn" onClick={() => document.querySelector<HTMLButtonElement>('.lp-sara-btn')?.click()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Poser la question à SARA
            </button>
          </div>
        </div>
      </section>

      {/* ══ AUTRES LOGICIELS IBIG ══ */}
      <section className="lp-other-section">
        <div className="lp-other-inner">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="lp-eyebrow" style={{ display: 'block', textAlign: 'center' }}>Écosystème IBIG Soft</span>
            <h2 className="lp-section-title" style={{ textAlign: 'center' }}>Découvrez les autres solutions IBIG Soft</h2>
          </div>
          <div className="lp-other-grid">
            {OTHER_PRODUCTS.map(p => (
              <a key={p.name} href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer" className="lp-other-card">
                <div className="lp-other-dot" style={{ background: p.color }} />
                <div className="lp-other-sector">{p.sector}</div>
                <div className="lp-other-name">{p.name}</div>
                <p className="lp-other-desc">{p.desc}</p>
                <div className="lp-other-link" style={{ color: p.color }}>Découvrir →</div>
              </a>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer" className="lp-btn-secondary" style={{ display: 'inline-flex' }}>
              Voir toutes les solutions IBIG Soft ↗
            </a>
          </div>
        </div>
      </section>

      {/* ══ IBIG PARTNERS ══ */}
      <section className="lp-partners-section">
        <div className="lp-partners-inner">
          <div className="lp-partners-content">
            <div className="lp-partners-text">
              <span className="lp-eyebrow" style={{ color: '#1A56C8' }}>Programme partenaire</span>
              <h2 className="lp-section-title dark">Développez vos revenus avec <span style={{ color: 'var(--teal)' }}>IBIG PARTNERS</span></h2>
              <p style={{ color: '#64748B', lineHeight: 1.7, marginBottom: 24 }}>Rejoignez gratuitement le programme de partenariat IBIG et recommandez SANTAREX ERP à votre réseau. Accédez aux outils, suivez vos recommandations et percevez des commissions.</p>
              <div className="lp-partners-perks">
                {['Inscription 100% gratuite', 'Accès aux outils IBIG Partners', 'Suivi en temps réel de vos recommandations', 'Commissions sur chaque contrat signé', 'Accompagnement et support dédié', 'Formation aux produits IBIG Soft'].map(p => (
                  <div key={p} className="lp-check-item" style={{ color: '#475569' }}><div className="lp-check-icon"><CheckIcon /></div>{p}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
                <a href="https://ibigpartners.com/" target="_blank" rel="noopener noreferrer" className="lp-btn-primary"><ArrowRight />Devenir partenaire</a>
                <a href="https://ibigpartners.com/" target="_blank" rel="noopener noreferrer" className="lp-btn-secondary">Découvrir le programme</a>
              </div>
              <p style={{ fontSize: '.75rem', color: '#94A3B8', marginTop: 16 }}>* Les commissions varient selon les contrats. Aucun revenu garanti n&apos;est promis.</p>
            </div>
            <div className="lp-partners-badge">
              <div className="lp-partners-badge-inner">
                <div className="lp-partners-badge-logo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#00C8B8" strokeWidth="1.5" width="48" height="48"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="lp-partners-badge-title">IBIG<br /><strong>PARTNERS</strong></div>
                <div className="lp-partners-badge-sub">Programme officiel<br />IBIG Soft</div>
                <a href="https://ibigpartners.com/" target="_blank" rel="noopener noreferrer" className="lp-partners-badge-link">ibigpartners.com ↗</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL + FORM ══ */}
      <section id="contact" className="lp-cta-section">
        <div className="lp-cta-inner">
          <div className="lp-cta-left">
            <h2>Prêt à moderniser votre établissement ?</h2>
            <p>Parlez à notre équipe. Réponse garantie sous 24h, démo adaptée à votre type de structure.</p>
            <div className="lp-cta-contacts">
              <a href="mailto:contact@ibigsoft.com" className="lp-cta-contact-item"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>contact@ibigsoft.com</a>
              <a href="tel:+2252722276014" className="lp-cta-contact-item"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>+225 27 22 27 60 14</a>
              <a href="https://wa.me/2250778882592" className="lp-cta-contact-item"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>WhatsApp : +225 07 78 88 25 92</a>
            </div>
          </div>
          <DemoForm />
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            {/* Col 1 */}
            <div className="lp-footer-brand">
              <div className="lp-footer-wordmark">
                <SantarexIcon size={44} />
                <div className="lp-footer-wordmark-textblock">
                  <span className="lp-footer-wordmark-text">SANTA<em>REX</em></span>
                  <span className="lp-footer-wordmark-sub">ERP v2.0</span>
                </div>
              </div>
              <p>La technologie au service de la santé.<br />Un produit <strong>IBIG SOFT</strong> — Intermark Business International Group.<br />Conçu en Côte d&apos;Ivoire pour toute l&apos;Afrique.</p>
              <a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer" className="lp-footer-ibig">ibigsoft.com ↗</a>
            </div>
            {/* Col 2 */}
            <div className="lp-footer-col">
              <h4>Produit</h4>
              <ul>
                <li><a href="#modules">Modules</a></li>
                <li><a href="#activites">Solutions</a></li>
                <li><a href="#pricing">Tarifs</a></li>
                <li><a href="#testimonials">Références</a></li>
                <li><Link href="/login">Connexion</Link></li>
                <li><a href="#contact">Démo gratuite</a></li>
              </ul>
            </div>
            {/* Col 3 */}
            <div className="lp-footer-col">
              <h4>Ressources</h4>
              <ul>
                <li><a href="#faq">FAQ</a></li>
                <li><Link href="/aide">Centre d&apos;aide</Link></li>
                <li><Link href="/guide">Guide utilisateur</Link></li>
                <li><Link href="/nouveautes">Nouveautés</Link></li>
                <li><Link href="/statut">Statut des services</Link></li>
                <li><a href="#" onClick={() => document.querySelector<HTMLButtonElement>('.lp-sara-btn')?.click()}>Parler à SARA</a></li>
              </ul>
            </div>
            {/* Col 4 */}
            <div className="lp-footer-col">
              <h4>IBIG Soft</h4>
              <ul>
                <li><a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer">À propos d&apos;IBIG Soft</a></li>
                <li><a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer">Autres logiciels</a></li>
                <li><a href="https://ibigpartners.com/" target="_blank" rel="noopener noreferrer">IBIG PARTNERS</a></li>
                <li><a href="mailto:contact@ibigsoft.com">Contact</a></li>
                <li><Link href="/recrutement">Recrutement</Link></li>
              </ul>
            </div>
            {/* Col 5 */}
            <div className="lp-footer-col">
              <h4>Légal</h4>
              <ul>
                <li><Link href="/mentions-legales">Mentions légales</Link></li>
                <li><Link href="/cgu">CGU</Link></li>
                <li><Link href="/confidentialite">Confidentialité</Link></li>
                <li><Link href="/cookies">Cookies</Link></li>
                <li><Link href="/licence">Contrat de licence</Link></li>
                <li><Link href="/securite">Sécurité</Link></li>
              </ul>
            </div>
            {/* Col 6 */}
            <div className="lp-footer-col">
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a></li>
                <li><a href="tel:+2252722276014">+225 27 22 27 60 14</a></li>
                <li><a href="https://wa.me/2250778882592">WhatsApp +225 07 78 88 25 92</a></li>
                <li>Abidjan, Côte d&apos;Ivoire</li>
                <li style={{ marginTop: 8 }}>Lun–Ven : 8h – 18h</li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-partner-row">
            <a href="https://ibigpartners.com/" target="_blank" rel="noopener noreferrer" className="lp-footer-partner-cta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Devenir partenaire revendeur SANTAREX →
            </a>
          </div>
          <div className="lp-footer-bottom">
            <div>
              <span className="lp-footer-copy">© {new Date().getFullYear()} SANTAREX ERP. Tous droits réservés.</span>
              <span className="lp-footer-copy" style={{ display: 'block', marginTop: 4, fontSize: '.7rem' }}>Logiciel conçu, édité et exploité par IBIG Soft, une marque de IBIG SARL — Intermark Business International Group.</span>
            </div>
            <span className="lp-footer-made">SANTAREX ERP v2.0 · <span>Made for Africa</span></span>
          </div>
        </div>
      </footer>

      {/* ══ FLOTTANTS ══ */}
      <SaraChat />
      <WhatsAppButton />
      <CookieBanner />
      <PwaBanner />
    </div>
  );
}
