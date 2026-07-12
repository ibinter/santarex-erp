'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import '@/app/landing.css';

/* ── small SVG helpers ── */
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

const MODULES = [
  { title: 'Patients & DME', desc: 'Dossiers médicaux électroniques complets, IPP automatique, historique, allergies, antécédents.', tag: 'Core', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
  { title: 'Rendez-vous', desc: 'Agenda multi-médecins, créneaux disponibles, rappels SMS automatiques, liste d\'attente.', tag: 'Core', iconColor: 'rgba(26,86,200,.15)', strokeColor: '#4A8AF4', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
  { title: 'Consultations', desc: 'CIM-10, constantes vitales, ordonnances numériques, certificats médicaux, plan de soins.', tag: 'Core', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
  { title: 'Pharmacie', desc: 'Stock temps réel, alertes rupture & péremption, gestion des lots, dispensation sur ordonnance.', tag: 'Clinique+', iconColor: 'rgba(245,166,35,.1)', strokeColor: '#F5A623', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v4H6a3 3 0 0 0 0 6h.01M12 2a3 3 0 0 1 3 3v4h3a3 3 0 0 1 0 6h-.01" /><path d="M9 17v2a2 2 0 0 0 4 0v-2" /></svg> },
  { title: 'Laboratoire', desc: 'Demandes d\'analyses, saisie & validation des résultats, interface biologiste, historique labo.', tag: 'Clinique+', iconColor: 'rgba(139,92,246,.12)', strokeColor: '#A78BFA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" /></svg> },
  { title: 'Hospitalisation', desc: 'Plan des lits temps réel, prescriptions médicales, notes infirmières, sorties et transferts.', tag: 'Clinique+', iconColor: 'rgba(239,68,68,.1)', strokeColor: '#F87171', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
  { title: 'Urgences', desc: 'Triage Manchester, file d\'attente temps réel, suivi des passages, alertes critiques.', tag: 'Enterprise', iconColor: 'rgba(239,68,68,.1)', strokeColor: '#F87171', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> },
  { title: 'Facturation', desc: 'Devis, factures, tiers-payant, paiement mobile money (Orange, MTN, Wave), historique.', tag: 'Core', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
  { title: 'Reporting & BI', desc: 'KPIs temps réel, tableau de bord direction, exports PDF/Excel, analyses de performance.', tag: 'Clinique+', iconColor: 'rgba(26,86,200,.15)', strokeColor: '#4A8AF4', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
  { title: 'Imagerie médicale', desc: 'Gestion des examens (Radio, Écho, Scanner, IRM), comptes rendus, PACS basique.', tag: 'Enterprise', iconColor: 'rgba(245,166,35,.1)', strokeColor: '#F5A623', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> },
  { title: 'Ressources humaines', desc: 'Personnel médical & administratif, plannings, congés, paie mensuelle, organigramme.', tag: 'Enterprise', iconColor: 'rgba(139,92,246,.12)', strokeColor: '#A78BFA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { title: 'Bloc opératoire', desc: 'Programme chirurgical, gestion des salles, protocoles anesthésie, compte-rendus opératoires.', tag: 'Enterprise', iconColor: 'rgba(0,200,184,.1)', strokeColor: '#00C8B8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg> },
];

const PLANS = [
  {
    code: 'Starter', eyebrow: 'Petites structures', price: '49 000', cycle: 'FCFA / mois',
    featured: false,
    features: ['Jusqu\'à 5 utilisateurs', 'Patients & DME illimités', 'Consultations & ordonnances', 'Rendez-vous & agenda', 'Facturation & encaissements', 'Support 5j/7 par WhatsApp'],
    btnClass: 'lp-plan-btn-outline', btnLabel: 'Démarrer l\'essai gratuit',
  },
  {
    code: 'Professionnel', eyebrow: 'Cliniques & polycliniques', price: '99 000', cycle: 'FCFA / mois',
    featured: true,
    features: ['Jusqu\'à 15 utilisateurs', 'Tous les modules Starter', 'Pharmacie & gestion des stocks', 'Laboratoire & résultats', 'Hospitalisation & lits', 'Reporting & dashboard BI', 'Support 7j/7, prioritaire'],
    btnClass: 'lp-plan-btn-fill', btnLabel: 'Démarrer l\'essai gratuit',
  },
  {
    code: 'Enterprise', eyebrow: 'Hôpitaux & groupes', price: 'Sur devis', cycle: '',
    featured: false,
    features: ['Utilisateurs illimités', 'Tous les 14 modules', 'Multi-sites & multi-entités', 'API dédiée & intégrations', 'Formation sur site incluse', 'SLA 99.9% garanti', 'Support dédié 24/7'],
    btnClass: 'lp-plan-btn-outline', btnLabel: 'Nous contacter',
  },
];

const TESTIMONIALS = [
  { initial: 'K', name: 'Dr. Konan Akissi', role: 'Directeur médical — Clinique du Plateau, Abidjan', quote: 'SANTAREX a transformé notre gestion de la pharmacie. La synchronisation avec les prescriptions des médecins est instantanée — plus aucune rupture non détectée.' },
  { initial: 'T', name: 'Mme Traoré Fatoumata', role: 'Responsable administratif — Polyclinique Espoir', quote: 'Le tableau de bord nous donne enfin une visibilité complète sur nos recettes et notre taux d\'occupation. On pilote l\'hôpital avec des données, pas des intuitions.' },
  { initial: 'C', name: 'Dr. Coulibaly Moussa', role: 'Médecin généraliste — Cabinet privé, Bamako', quote: 'Les ordonnances numériques et le DME m\'économisent facilement 2 heures de paperasse par jour. Je peux me concentrer sur mes patients.' },
];

/* ── Demo Form ── */
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
    state === 'success' ? '✓ Demande envoyée — on vous recontacte sous 24h' :
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

/* ── Main Component ── */
export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);
  const [logoError, setLogoError] = useState(false);
  const [footerLogoError, setFooterLogoError] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 40) {
        nav.style.background = 'rgba(6,16,31,.97)';
        nav.style.borderBottomColor = 'rgba(255,255,255,.06)';
      } else {
        nav.style.background = 'rgba(6,16,31,.88)';
        nav.style.borderBottomColor = 'rgba(255,255,255,.07)';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: '#06101F', minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav ref={navRef} className="lp-nav">
        <div className="lp-nav-logo">
          {logoError ? (
            <div className="lp-nav-logo-fallback">
              <div className="lp-nav-logo-icon">S</div>
              <span className="lp-nav-logo-text">SANTAREX <span>ERP</span></span>
            </div>
          ) : (
            <Image src="/logo.png" alt="SANTAREX ERP" width={140} height={36} style={{ height: 36, width: 'auto', objectFit: 'contain' }} onError={() => setLogoError(true)} />
          )}
        </div>
        <div className="lp-nav-links">
          <a href="#modules">Modules</a>
          <a href="#pricing">Tarifs</a>
          <a href="#testimonials">Références</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="lp-nav-actions">
          <Link href="/login" className="lp-btn-ghost">Connexion</Link>
          <a href="#contact" className="lp-btn-cta">Démo gratuite →</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-grid">
          <div>
            <div className="lp-hero-eyebrow">
              <span className="lp-hero-eyebrow-dot" />
              Logiciel SaaS — Made for Africa
            </div>
            <h1 className="lp-hero-title">
              La clinique<br />
              <span className="accent">connectée.</span><br />
              <span className="line2">L&apos;Afrique digitale.</span>
            </h1>
            <p className="lp-hero-desc">
              SANTAREX ERP centralise toute la gestion de votre établissement de santé — dossiers patients, consultations, pharmacie, laboratoire, facturation — dans une seule plateforme cloud, conçue pour les réalités africaines.
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {pays}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="lp-hero-visual">
            <div className="lp-mockup-wrap">
              <div className="lp-mockup">
                {/* Sidebar */}
                <div className="lp-mk-sidebar">
                  <div className="lp-mk-logo-area">
                    <div className="lp-mk-logo-dot">SRX</div>
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
                    {/* KPIs */}
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
                    {/* Chart + modules */}
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
                          {[{ lbl: 'Pharmacie', w: '82%', color: '#00C8B8' }, { lbl: 'Labo', w: '65%', color: '#1A56C8' }, { lbl: 'Urgences', w: '48%', color: '#F5A623' }].map(({ lbl, w, color }) => (
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
                    {/* Table */}
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

      {/* ── TRUST BAR ── */}
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

      {/* ── STATS ── */}
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

      {/* ── MODULES ── */}
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
                {['Données synchronisées en temps réel', 'Déployable par module selon vos besoins', 'Formation incluse dans tous les plans'].map(t => (
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

      {/* ── WHY SANTAREX ── */}
      <section className="lp-why-section">
        <div className="lp-why-inner">
          <div style={{ marginBottom: 56 }}>
            <span className="lp-eyebrow" style={{ color: '#1A56C8' }}>Pourquoi SANTAREX</span>
            <h2 className="lp-section-title dark">Conçu pour vos contraintes.<br />Pas pour les contourner.</h2>
          </div>
          <div className="lp-why-grid">
            {[
              { n: '01', title: 'Paiements locaux intégrés', desc: 'Orange Money, MTN MoMo, Wave, Moov, carte bancaire, espèces — tous les modes de paiement que vos patients utilisent, sans intermédiaire supplémentaire.', badge: 'FCFA natif' },
              { n: '02', title: 'Résilient aux coupures réseau', desc: 'Mode hors-ligne partiel pour les consultations et la pharmacie. Les données se synchronisent automatiquement au retour de la connexion, sans perte.', badge: 'Offline-first' },
              { n: '03', title: 'Sécurité médicale stricte', desc: 'Chiffrement AES-256 au repos et en transit. Contrôle d\'accès par rôle. Journal d\'audit complet de chaque action. Conformité RGPD et recommandations OMS.', badge: 'ISO 27001 en cours' },
              { n: '04', title: 'Déploiement en 48h', desc: 'Pas d\'installation de serveur, pas d\'IT interne requis. Création du compte, import des données de base, formation des équipes — 48h pour être opérationnel.', badge: 'Support sur site disponible' },
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

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how-section">
        <div className="lp-how-inner">
          <div style={{ textAlign: 'center' }}>
            <span className="lp-eyebrow" style={{ display: 'block', textAlign: 'center' }}>Mise en route</span>
            <h2 className="lp-section-title" style={{ textAlign: 'center' }}>Opérationnel en 3 étapes</h2>
          </div>
          <div className="lp-how-steps">
            {[
              { n: 1, title: 'Inscription & configuration', desc: 'Créez votre compte, renseignez les informations de votre établissement, configurez vos services et vos tarifs. Moins de 30 minutes.' },
              { n: 2, title: 'Formation & import', desc: 'Notre équipe forme vos agents en visioconférence ou sur site. Import de vos patients existants si besoin, via fichier Excel.' },
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

      {/* ── PRICING ── */}
      <section id="pricing" className="lp-pricing-section">
        <div className="lp-pricing-inner">
          <span className="lp-eyebrow" style={{ color: '#1A56C8' }}>Tarifs</span>
          <h2 className="lp-section-title dark">Transparent. Sans surprise.</h2>
          <p className="lp-section-desc">Tous les plans incluent l&apos;hébergement, la maintenance et le support. Pas de frais cachés. Résiliez à tout moment.</p>
          <div className="lp-pricing-grid">
            {PLANS.map(p => (
              <div key={p.code} className={`lp-plan-card ${p.featured ? 'featured' : ''}`}>
                {p.featured && <div className="lp-plan-badge">Le plus populaire</div>}
                <div className="lp-plan-eyebrow">{p.eyebrow}</div>
                <div className="lp-plan-name">{p.code}</div>
                <div>
                  <span className="lp-plan-amount" style={p.code === 'Enterprise' ? { fontSize: '1.5rem', color: '#1A56C8' } : {}}>{p.price}</span>
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
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="lp-testi-section">
        <div className="lp-testi-inner">
          <span className="lp-eyebrow">Témoignages</span>
          <h2 className="lp-section-title">Ils ont modernisé leur établissement.</h2>
          <div className="lp-testi-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="lp-testi-card">
                <div className="lp-stars">{'★★★★★'}</div>
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

      {/* ── CTA + FORM ── */}
      <section id="contact" className="lp-cta-section">
        <div className="lp-cta-inner">
          <div className="lp-cta-left">
            <h2>Prêt à moderniser votre établissement ?</h2>
            <p>Parlez à notre équipe. On répond sous 24h et on adapte la démo à votre type de structure.</p>
            <div className="lp-cta-contacts">
              <a href="mailto:contact@ibigsoft.com" className="lp-cta-contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                contact@ibigsoft.com
              </a>
              <a href="tel:+2252722276014" className="lp-cta-contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                +225 27 22 27 60 14
              </a>
              <a href="https://wa.me/2250555059901" className="lp-cta-contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                WhatsApp : +225 05 55 05 99 01
              </a>
            </div>
          </div>
          <DemoForm />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              {footerLogoError ? (
                <div className="lp-footer-brand-fallback">SANTAREX <span>ERP</span></div>
              ) : (
                <Image src="/logo.png" alt="SANTAREX ERP" width={120} height={32} style={{ height: 32, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9, marginBottom: 16 }} onError={() => setFooterLogoError(true)} />
              )}
              <p>Un produit <strong style={{ color: '#475569' }}>IBIG SOFT</strong> — Intermark Business International Group.<br />Conçu en Côte d&apos;Ivoire pour toute l&apos;Afrique.</p>
              <a href="https://ibigsoft.com" className="lp-footer-ibig">ibigsoft.com</a>
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
                <li>contact@ibigsoft.com</li>
                <li>+225 27 22 27 60 14</li>
                <li>+225 05 55 05 99 01</li>
                <li style={{ color: '#1E293B', marginTop: 4 }}>Abidjan, Côte d&apos;Ivoire</li>
              </ul>
            </div>
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
