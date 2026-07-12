'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import '@/app/landing.css';

/* ── SVG helpers ── */
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polygon points="10,8 16,12 10,16" />
  </svg>
);

/* ── Logo SVG SANTAREX (S + croix médicale ECG, dégradé teal→bleu) ── */
const SantarexIcon = ({ size = 38 }: { size?: number }) => (
  <svg width={size} height={Math.round(size * 1.15)} viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sg1" x1="10" y1="5" x2="90" y2="110" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00D9C4"/>
        <stop offset="45%" stopColor="#0070E0"/>
        <stop offset="100%" stopColor="#1228B8"/>
      </linearGradient>
      <linearGradient id="sg2" x1="10" y1="5" x2="90" y2="110" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00CEB8"/>
        <stop offset="100%" stopColor="#1535C8"/>
      </linearGradient>
    </defs>
    {/* Ruban supérieur du S — arc de gauche-centre vers haut-droite avec aile */}
    <path d="M 16,64 C 16,64 14,52 20,42 C 28,30 44,26 60,24 C 72,22 84,18 90,10 C 94,4 90,2 84,4 C 76,7 64,12 50,14 C 36,16 22,20 14,32 C 6,44 8,58 12,66 Z"
      fill="url(#sg1)"/>
    {/* Ruban inférieur du S — arc de droite-centre vers bas-gauche */}
    <path d="M 84,50 C 84,50 86,62 80,72 C 72,84 56,88 40,90 C 28,92 16,96 10,104 C 6,110 10,113 16,111 C 24,108 36,103 50,101 C 64,99 78,95 86,83 C 94,71 92,57 88,49 Z"
      fill="url(#sg1)"/>
    {/* Croix médicale — barre verticale */}
    <rect x="43" y="36" width="14" height="42" rx="5" fill="url(#sg2)"/>
    {/* Croix médicale — barre horizontale */}
    <rect x="31" y="48" width="38" height="14" rx="5" fill="url(#sg2)"/>
    {/* Reflet blanc sur les rubans pour effet 3D */}
    <path d="M 16,64 C 16,64 14,52 20,42 C 26,32 40,27 54,25 C 54,25 40,30 34,42 C 28,54 28,64 28,64 Z"
      fill="white" opacity="0.12"/>
    {/* Ligne ECG dans la croix */}
    <polyline points="33,55 39,55 43,47 50,63 57,49 61,55 67,55"
      stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
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

/* ── Hero slides ── */
const HERO_SLIDES = [
  {
    line1: 'La clinique',
    accent: 'connectée.',
    line3: "L'Afrique digitale.",
    sub: 'SANTAREX ERP centralise toute la gestion de votre établissement de santé — dossiers patients, consultations, pharmacie, laboratoire, facturation — dans une seule plateforme cloud.',
  },
  {
    line1: "L'hôpital",
    accent: 'numérique.',
    line3: 'Zéro paperasse.',
    sub: 'Ordonnances électroniques, résultats labo instantanés, prescriptions directement reliées à la pharmacie. Votre établissement tourne à plein régime.',
  },
  {
    line1: 'La pharmacie',
    accent: 'intelligente.',
    line3: 'Zéro rupture de stock.',
    sub: 'Alertes automatiques de péremption, synchronisation temps réel avec les prescriptions médecin, gestion des lots et traçabilité complète.',
  },
  {
    line1: 'La facturation',
    accent: 'simplifiée.',
    line3: 'Mobile Money intégré.',
    sub: "Orange Money, MTN MoMo, Wave — tous les modes de paiement de vos patients intégrés nativement. Tiers-payant, mutuelles, espèces : tout en un.",
  },
];

/* ── Modules ── */
const MODULES = [
  { title: 'Patients & DME', desc: 'Dossiers médicaux électroniques complets, IPP automatique, historique, allergies, antécédents.', tag: 'Core', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { title: 'Rendez-vous', desc: "Agenda multi-médecins, créneaux disponibles, rappels SMS automatiques, liste d'attente.", tag: 'Core', iconColor: 'rgba(26,86,200,.15)', strokeColor: '#4A8AF4', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { title: 'Consultations', desc: 'CIM-10, constantes vitales, ordonnances numériques, certificats médicaux, plan de soins.', tag: 'Core', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { title: 'Pharmacie', desc: 'Stock temps réel, alertes rupture & péremption, gestion des lots, dispensation sur ordonnance.', tag: 'Clinique+', iconColor: 'rgba(245,166,35,.1)', strokeColor: '#F5A623', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg> },
  { title: 'Laboratoire', desc: "Demandes d'analyses, saisie & validation des résultats, interface biologiste, historique labo.", tag: 'Clinique+', iconColor: 'rgba(139,92,246,.12)', strokeColor: '#A78BFA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4"/></svg> },
  { title: 'Hospitalisation', desc: 'Plan des lits temps réel, prescriptions médicales, notes infirmières, sorties et transferts.', tag: 'Clinique+', iconColor: 'rgba(239,68,68,.1)', strokeColor: '#F87171', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { title: 'Urgences', desc: 'Triage Manchester, file attente temps réel, suivi des passages, alertes critiques.', tag: 'Hôpital+', iconColor: 'rgba(239,68,68,.1)', strokeColor: '#F87171', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { title: 'Facturation', desc: 'Devis, factures, tiers-payant, paiement mobile money (Orange, MTN, Wave), historique.', tag: 'Core', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { title: 'Reporting & BI', desc: 'KPIs temps réel, tableau de bord direction, exports PDF/Excel, analyses de performance.', tag: 'Clinique+', iconColor: 'rgba(26,86,200,.15)', strokeColor: '#4A8AF4', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { title: 'Imagerie médicale', desc: 'Gestion des examens (Radio, Écho, Scanner, IRM), comptes rendus, PACS basique.', tag: 'Hôpital+', iconColor: 'rgba(245,166,35,.1)', strokeColor: '#F5A623', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { title: 'Ressources humaines', desc: 'Personnel médical & administratif, plannings, congés, paie mensuelle, organigramme.', tag: 'Hôpital+', iconColor: 'rgba(139,92,246,.12)', strokeColor: '#A78BFA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { title: 'Bloc opératoire', desc: 'Programme chirurgical, gestion des salles, protocoles anesthésie, comptes rendus opératoires.', tag: 'Hôpital+', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
];

/* ── Plans tarifaires ── */
const PLANS = [
  {
    code: 'Starter',
    eyebrow: 'Cabinet solo',
    price: '15 000',
    cycle: 'FCFA / mois',
    users: '1 à 3 utilisateurs',
    featured: false,
    badge: null,
    features: [
      'Jusqu\'à 3 utilisateurs',
      'Patients & DME illimités',
      'Consultations & ordonnances',
      'Rendez-vous & agenda',
      'Facturation mobile money',
      'Support WhatsApp 5j/7',
    ],
    btnClass: 'lp-plan-btn-outline',
    btnLabel: 'Démarrer l\'essai gratuit',
  },
  {
    code: 'Cabinet Pro',
    eyebrow: 'Cabinet multipraticiens',
    price: '35 000',
    cycle: 'FCFA / mois',
    users: 'Jusqu\'à 10 utilisateurs',
    featured: false,
    badge: null,
    features: [
      'Jusqu\'à 10 utilisateurs',
      'Tous les modules Starter',
      'Pharmacie & gestion stocks',
      'Laboratoire & résultats',
      'Reporting basique',
      'Support prioritaire 6j/7',
    ],
    btnClass: 'lp-plan-btn-outline',
    btnLabel: 'Démarrer l\'essai gratuit',
  },
  {
    code: 'Clinique',
    eyebrow: 'Clinique & polyclinique',
    price: '75 000',
    cycle: 'FCFA / mois',
    users: 'Jusqu\'à 30 utilisateurs',
    featured: true,
    badge: 'Le plus populaire',
    features: [
      'Jusqu\'à 30 utilisateurs',
      'Tous les modules Cabinet Pro',
      'Hospitalisation & plan des lits',
      'Urgences & triage Manchester',
      'Dashboard BI & reporting avancé',
      'API & intégrations tierces',
      'Support 7j/7 prioritaire',
    ],
    btnClass: 'lp-plan-btn-fill',
    btnLabel: 'Démarrer l\'essai gratuit',
  },
  {
    code: 'Hôpital',
    eyebrow: 'Hôpital & groupe',
    price: '150 000',
    cycle: 'FCFA / mois',
    users: 'Utilisateurs illimités',
    featured: false,
    badge: null,
    features: [
      'Utilisateurs illimités',
      'Tous les 14 modules',
      'Bloc opératoire & chirurgie',
      'Imagerie médicale (PACS)',
      'Ressources humaines & paie',
      'Multi-sites & consolidation',
      'SLA 99.9% garanti',
      'Support 24/7 dédié + sur site',
    ],
    btnClass: 'lp-plan-btn-outline',
    btnLabel: 'Nous contacter',
  },
];

/* ── Témoignages ── */
const TESTIMONIALS = [
  { initial: 'K', name: 'Dr. Konan Akissi', role: 'Directeur médical — Clinique du Plateau, Abidjan', quote: 'SANTAREX a transformé notre pharmacie. La synchronisation avec les prescriptions médecin est instantanée — plus aucune rupture non détectée.' },
  { initial: 'T', name: 'Mme Traoré Fatoumata', role: 'Responsable administratif — Polyclinique Espoir', quote: 'Le tableau de bord nous donne enfin une visibilité complète sur nos recettes et notre taux d\'occupation. On pilote l\'hôpital avec des données.' },
  { initial: 'C', name: 'Dr. Coulibaly Moussa', role: 'Médecin généraliste — Cabinet privé, Bamako', quote: 'Les ordonnances numériques et le DME m\'économisent 2 heures par jour. Je me concentre sur mes patients, pas sur la paperasse.' },
];

/* ── Formulaire démo ── */
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

  const btnLabel =
    state === 'success' ? '✓ Demande envoyée — nous revenons sous 24h' :
    state === 'error'   ? 'Veuillez remplir nom et email' :
    'Envoyer la demande →';

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
          <option>Cabinet médical</option>
          <option>Clinique privée</option>
          <option>Polyclinique</option>
          <option>Hôpital</option>
          <option>Centre de santé</option>
        </select>
      </div>
      <div className="lp-form-group">
        <label className="lp-form-label">Pays</label>
        <select className="lp-form-input" disabled={state === 'success'}>
          <option value="">Sélectionner…</option>
          <option>Côte d&apos;Ivoire</option>
          <option>Sénégal</option>
          <option>Mali</option>
          <option>Burkina Faso</option>
          <option>Autre</option>
        </select>
      </div>
      <button
        className={`lp-form-btn ${state === 'success' ? 'success' : state === 'error' ? 'error-state' : ''}`}
        onClick={handleSubmit}
        disabled={state === 'success'}
      >
        {btnLabel}
      </button>
      <div className="lp-form-note">Réponse garantie sous 24h · Aucun engagement</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [sliding, setSliding] = useState(false);

  /* nav scroll */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 40) {
        nav.style.background = 'rgba(6,16,31,.98)';
        nav.style.boxShadow = '0 1px 0 rgba(255,255,255,.05)';
      } else {
        nav.style.background = 'rgba(6,16,31,.85)';
        nav.style.boxShadow = 'none';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* hero auto-slide */
  useEffect(() => {
    const timer = setInterval(() => {
      setSliding(true);
      setTimeout(() => {
        setSlideIdx(i => (i + 1) % HERO_SLIDES.length);
        setSliding(false);
      }, 400);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[slideIdx];

  return (
    <div style={{ background: '#06101F', minHeight: '100vh' }}>

      {/* ══ NAV ══ */}
      <nav ref={navRef} className="lp-nav">
        <div className="lp-nav-logo">
          <NavLogo />
        </div>
        <div className="lp-nav-links">
          <a href="#modules">Modules</a>
          <a href="#pricing">Tarifs</a>
          <a href="#testimonials">Références</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="lp-nav-actions">
          <a href="https://ibigpartners.com/" target="_blank" rel="noopener noreferrer" className="lp-btn-partner">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Devenir Partenaire
          </a>
          <Link href="/login" className="lp-btn-ghost">Connexion</Link>
          <a href="#contact" className="lp-btn-cta">Démo gratuite →</a>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="lp-hero">
        <div className="lp-hero-grid">
          <div>
            <div className="lp-hero-eyebrow">
              <span className="lp-hero-eyebrow-dot" />
              Logiciel SaaS — Made for Africa
            </div>
            <div className="lp-hero-ibig-badge">
              Un produit&nbsp;<a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer">IBIG SOFT</a>
              &nbsp;·&nbsp;ibigsoft.com
            </div>

            {/* Titre animé */}
            <h1 className={`lp-hero-title ${sliding ? 'lp-slide-out' : 'lp-slide-in'}`}>
              {slide.line1}<br />
              <span className="accent">{slide.accent}</span><br />
              <span className="line2">{slide.line3}</span>
            </h1>

            <p className={`lp-hero-desc ${sliding ? 'lp-slide-out' : 'lp-slide-in'}`} style={{ transitionDelay: sliding ? '0ms' : '60ms' }}>
              {slide.sub}
            </p>

            <div className="lp-hero-ctas">
              <a href="#contact" className="lp-btn-primary"><ArrowRight />Essai gratuit 30 jours</a>
              <a href="#modules" className="lp-btn-secondary"><PlayIcon />Voir les modules</a>
            </div>

            <div className="lp-hero-trust">
              {['Côte d\'Ivoire', 'Sénégal', 'Mali', 'Burkina Faso'].map((pays, i) => (
                <div key={pays} style={{ display: 'contents' }}>
                  {i > 0 && <div className="lp-trust-sep" />}
                  <div className="lp-trust-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {pays}
                  </div>
                </div>
              ))}
            </div>

            {/* Indicateurs de slide */}
            <div className="lp-slide-dots">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`lp-slide-dot ${i === slideIdx ? 'active' : ''}`}
                  onClick={() => { setSliding(true); setTimeout(() => { setSlideIdx(i); setSliding(false); }, 300); }}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Maquette dashboard */}
          <div className="lp-hero-visual">
            <div className="lp-mockup-wrap">
              <div className="lp-mockup">
                {/* Sidebar */}
                <div className="lp-mk-sidebar">
                  <div className="lp-mk-logo-area">
                    <div className="lp-mk-logo-dot">
                      <SantarexIcon size={18} />
                    </div>
                  </div>
                  <div className="lp-mk-nav-item active"><div className="lp-mk-icon" /></div>
                  <div className="lp-mk-nav-item" style={{ position: 'relative' }}>
                    <div className="lp-mk-icon" style={{ background: 'rgba(255,255,255,.08)' }} />
                    <div className="lp-mk-notif" />
                  </div>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="lp-mk-nav-item">
                      <div className="lp-mk-icon" style={{ background: 'rgba(255,255,255,.08)' }} />
                    </div>
                  ))}
                </div>
                {/* Main */}
                <div className="lp-mk-main">
                  <div className="lp-mk-topbar">
                    <span className="lp-mk-topbar-title">Tableau de bord</span>
                    <div className="lp-mk-topbar-right">
                      <div className="lp-mk-search" />
                      <div className="lp-mk-avatar" />
                    </div>
                  </div>
                  <div className="lp-mk-body">
                    <div className="lp-mk-kpis">
                      <div className="lp-mk-kpi">
                        <div className="lp-mk-kpi-val">1 284</div>
                        <div className="lp-mk-kpi-lbl">Patients</div>
                        <div className="lp-mk-kpi-trend">↑ +4.2%</div>
                      </div>
                      <div className="lp-mk-kpi">
                        <div className="lp-mk-kpi-val">38/56</div>
                        <div className="lp-mk-kpi-lbl">Lits occupés</div>
                        <div className="lp-mk-kpi-trend orange">68%</div>
                      </div>
                      <div className="lp-mk-kpi">
                        <div className="lp-mk-kpi-val">127</div>
                        <div className="lp-mk-kpi-lbl">RDV du jour</div>
                        <div className="lp-mk-kpi-trend">↑ +12</div>
                      </div>
                      <div className="lp-mk-kpi">
                        <div className="lp-mk-kpi-val" style={{ fontSize: 10 }}>2.4M FCFA</div>
                        <div className="lp-mk-kpi-lbl">Recettes</div>
                        <div className="lp-mk-kpi-trend">↑ +8.1%</div>
                      </div>
                    </div>
                    <div className="lp-mk-row">
                      <div className="lp-mk-chart">
                        <div className="lp-mk-chart-title">Consultations — 7 jours</div>
                        <div className="lp-mk-chart-bars">
                          {[55, 70, 45, 80, 100, 65, 75].map((h, i) => (
                            <div key={i} className={`lp-mk-bar ${h === 100 ? 'hi' : h > 60 ? 'med' : ''}`} style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                      <div className="lp-mk-chart">
                        <div className="lp-mk-chart-title">Modules actifs</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                          {[
                            { lbl: 'Pharmacie', w: '82%', color: '#00C8B8' },
                            { lbl: 'Labo', w: '65%', color: '#1A56C8' },
                            { lbl: 'Urgences', w: '48%', color: '#F5A623' },
                          ].map(({ lbl, w, color }) => (
                            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 7.5, color: '#64748B' }}>{lbl}</span>
                              <div className="lp-mk-progress-bar-track">
                                <div className="lp-mk-progress-bar-fill" style={{ width: w, background: color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="lp-mk-table">
                      <div className="lp-mk-table-head">
                        <span className="lp-mk-th">Patient</span>
                        <span className="lp-mk-th">Médecin</span>
                        <span className="lp-mk-th">Statut</span>
                      </div>
                      {[
                        { n: 'Konan A. Désiré', m: 'Dr. Diallo', s: 'EN COURS', cls: 'lp-mk-badge' },
                        { n: 'Traoré Fatouma', m: 'Dr. Bamba', s: 'ATTENTE', cls: 'lp-mk-badge-orange' },
                        { n: 'Coulibaly M.', m: 'Dr. Ouédraogo', s: 'TERMINÉ', cls: 'lp-mk-badge' },
                      ].map(({ n, m, s, cls }) => (
                        <div key={n} className="lp-mk-tr">
                          <span className="lp-mk-td">{n}</span>
                          <span className="lp-mk-td">{m}</span>
                          <span className="lp-mk-td"><span className={cls}>{s}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-scroll-indicator">
          <div className="lp-scroll-line" />
          Découvrir
        </div>
      </section>

      {/* ══ TRUST BAR ══ */}
      <div className="lp-trust-bar">
        <div className="lp-trust-bar-inner">
          <span className="lp-trust-label">Déployé dans</span>
          <div className="lp-trust-logos">
            {['Clinique du Plateau', 'Polyclinique Espoir', 'Cabinet Dr. Koné', 'Centre Médical Riviera'].map(n => (
              <span key={n} className="lp-trust-logo">{n}</span>
            ))}
          </div>
          <div className="lp-trust-count"><strong>40+</strong> établissements actifs</div>
        </div>
      </div>

      {/* ══ STATS ══ */}
      <section className="lp-stats-section">
        <div className="lp-stats-inner">
          {[
            { num: '14', sup: '+', lbl: 'Modules cliniques intégrés' },
            { num: '30', sup: 'j', lbl: 'Essai gratuit sans engagement' },
            { num: '99', sup: '%', lbl: 'Disponibilité garantie SLA' },
            { num: '24', sup: '/7', lbl: 'Support technique inclus' },
          ].map(({ num, sup, lbl }) => (
            <div key={lbl} className="lp-stat-box">
              <div className="lp-stat-num">{num}<span>{sup}</span></div>
              <div className="lp-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ MODULES ══ */}
      <section id="modules" className="lp-modules-section">
        <div className="lp-modules-inner">
          <div className="lp-modules-layout">
            <div className="lp-modules-sticky">
              <span className="lp-eyebrow">Modules</span>
              <h2 className="lp-section-title">Une seule plateforme.<br />Tout votre hôpital.</h2>
              <p className="lp-section-desc" style={{ marginTop: 14 }}>
                Chaque module communique en temps réel. Une prescription générée en consultation alerte automatiquement la pharmacie. Un résultat labo apparaît dans le DME dès validation.
              </p>
              <div className="lp-modules-checklist">
                {['Données synchronisées en temps réel', 'Déployable module par module', 'Formation incluse dans tous les plans'].map(t => (
                  <div key={t} className="lp-check-item">
                    <div className="lp-check-icon"><CheckIcon /></div>
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-modules-grid">
              {MODULES.map(m => (
                <div key={m.title} className="lp-module-card">
                  <div className="lp-module-icon" style={{ background: m.iconColor }}>
                    <span style={{ color: m.strokeColor }}>{m.icon}</span>
                  </div>
                  <h3>{m.title}</h3>
                  <p>{m.desc}</p>
                  <span className="lp-module-tag">{m.tag}</span>
                </div>
              ))}
            </div>
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
              { n: '03', title: 'Sécurité médicale stricte', desc: 'Chiffrement AES-256 au repos et en transit. Contrôle d\'accès par rôle. Journal d\'audit complet de chaque action. Conformité RGPD.', badge: 'ISO 27001 en cours' },
              { n: '04', title: 'Déploiement en 48h', desc: 'Aucune installation de serveur. Compte créé, données importées, équipes formées — 48h pour être opérationnel, support sur site disponible.', badge: 'Support sur site' },
            ].map(({ n, title, desc, badge }) => (
              <div key={n} className="lp-why-card">
                <div className="lp-why-num">{n}</div>
                <div className="lp-why-title">{title}</div>
                <div className="lp-why-desc">{desc}</div>
                <div className="lp-why-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  {badge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW ══ */}
      <section className="lp-how-section">
        <div className="lp-how-inner">
          <div style={{ textAlign: 'center' }}>
            <span className="lp-eyebrow" style={{ display: 'block', textAlign: 'center' }}>Mise en route</span>
            <h2 className="lp-section-title" style={{ textAlign: 'center' }}>Opérationnel en 3 étapes</h2>
          </div>
          <div className="lp-how-steps">
            {[
              { n: 1, title: 'Inscription & configuration', desc: 'Créez votre compte, renseignez les informations de votre établissement, configurez vos services et tarifs. Moins de 30 minutes.' },
              { n: 2, title: 'Formation & import', desc: 'Notre équipe forme vos agents en visioconférence ou sur site. Import de vos patients existants via fichier Excel si besoin.' },
              { n: 3, title: 'Lancement en production', desc: 'Votre établissement est en ligne. Support disponible par WhatsApp, téléphone et email pendant les 30 premiers jours.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="lp-how-step">
                <div className="lp-step-num">{n}</div>
                <div className="lp-step-title">{title}</div>
                <p className="lp-step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="lp-pricing-section">
        <div className="lp-pricing-inner">
          <span className="lp-eyebrow" style={{ color: '#1A56C8' }}>Tarifs</span>
          <h2 className="lp-section-title dark">Transparent. Sans surprise.</h2>
          <p className="lp-section-desc">Tous les plans incluent hébergement, maintenance et support. Pas de frais cachés. Résiliez à tout moment.</p>
          <div className="lp-pricing-grid lp-pricing-4col">
            {PLANS.map(p => (
              <div key={p.code} className={`lp-plan-card ${p.featured ? 'featured' : ''}`}>
                {p.badge && <div className="lp-plan-badge">{p.badge}</div>}
                <div className="lp-plan-eyebrow">{p.eyebrow}</div>
                <div className="lp-plan-name">{p.code}</div>
                <div className="lp-plan-users">{p.users}</div>
                <div style={{ marginBottom: 20 }}>
                  <span className="lp-plan-amount" style={p.price === 'Sur devis' ? { fontSize: '1.375rem', color: '#1A56C8' } : {}}>
                    {p.price}
                  </span>
                  {p.cycle && <span className="lp-plan-cycle">{p.cycle}</span>}
                </div>
                <div className="lp-plan-divider" />
                <ul className="lp-plan-features">
                  {p.features.map(f => (
                    <li key={f}>
                      <div className="lp-feature-check"><CheckIcon /></div>
                      {f}
                    </li>
                  ))}
                </ul>
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
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA + FORM ══ */}
      <section id="contact" className="lp-cta-section">
        <div className="lp-cta-inner">
          <div className="lp-cta-left">
            <h2>Prêt à moderniser votre établissement ?</h2>
            <p>Parlez à notre équipe. Réponse garantie sous 24h, démo adaptée à votre type de structure.</p>
            <div className="lp-cta-contacts">
              <a href="mailto:contact@ibigsoft.com" className="lp-cta-contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                contact@ibigsoft.com
              </a>
              <a href="tel:+2252722276014" className="lp-cta-contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                +225 27 22 27 60 14
              </a>
              <a href="https://wa.me/2250778882592" className="lp-cta-contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                WhatsApp : +225 07 78 88 25 92
              </a>
            </div>
          </div>
          <DemoForm />
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              {/* Logo SVG SANTAREX */}
              <div className="lp-footer-wordmark">
                <SantarexIcon size={44} />
                <div className="lp-footer-wordmark-textblock">
                  <span className="lp-footer-wordmark-text">SANTA<em>REX</em></span>
                  <span className="lp-footer-wordmark-sub">ERP v2.0</span>
                </div>
              </div>
              <p>Un produit <strong>IBIG SOFT</strong> — Intermark Business International Group.<br />Conçu en Côte d&apos;Ivoire pour toute l&apos;Afrique.</p>
              <a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer" className="lp-footer-ibig">ibigsoft.com ↗</a>
            </div>
            <div className="lp-footer-col">
              <h4>Produit</h4>
              <ul>
                <li><a href="#modules">Modules</a></li>
                <li><a href="#pricing">Tarifs</a></li>
                <li><a href="#testimonials">Références</a></li>
                <li><Link href="/login">Connexion</Link></li>
                <li><a href="#contact">Démo gratuite</a></li>
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>Légal</h4>
              <ul>
                <li><Link href="/cgu">CGU</Link></li>
                <li><Link href="/confidentialite">Confidentialité</Link></li>
                <li><Link href="/mentions-legales">Mentions légales</Link></li>
                <li><Link href="/securite">Sécurité</Link></li>
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a></li>
                <li><a href="tel:+2252722276014">+225 27 22 27 60 14</a></li>
                <li><a href="https://wa.me/2250778882592">WhatsApp +225 07 78 88 25 92</a></li>
                <li>Abidjan, Côte d&apos;Ivoire</li>
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
            <span className="lp-footer-copy">© {new Date().getFullYear()} IBIG SOFT · Tous droits réservés</span>
            <span className="lp-footer-made">SANTAREX ERP v2.0 · <span>Made for Africa</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
