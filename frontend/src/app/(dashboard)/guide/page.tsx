'use client';

import { useState } from 'react';
import {
  BookOpen, Users, Calendar, FlaskConical, Pill, Receipt,
  Bed, Activity, Settings, ChevronRight, Search, Globe,
} from 'lucide-react';

type Lang = 'fr' | 'en';

const SECTIONS = [
  {
    id: 'demarrage', icon: <Activity size={16}/>, color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD',
    fr: { titre: 'Démarrage rapide', desc: 'Premiers pas avec SANTAREX ERP' },
    en: { titre: 'Quick Start',      desc: 'Getting started with SANTAREX ERP' },
    fr_content: [
      { titre: 'Connexion', texte: "Accédez à l'ERP via votre navigateur. Saisissez votre identifiant (email) et votre mot de passe fournis par l'administrateur. En cas d'oubli, contactez votre administrateur système." },
      { titre: 'Tableau de bord', texte: "Après connexion, le tableau de bord affiche les indicateurs clés : patients du jour, consultations en attente, alertes stock pharmacie, et recettes. Toutes les données se rechargent automatiquement toutes les 5 minutes." },
      { titre: 'Navigation', texte: "Le menu latéral gauche donne accès à tous les modules. Les éléments visibles dépendent de votre rôle (médecin, infirmier, caissier, pharmacien, laborantin, DRH, admin)." },
    ],
    en_content: [
      { titre: 'Login', texte: 'Access the ERP via your browser. Enter your credentials (email and password) provided by your administrator. If you forget your password, contact your system administrator.' },
      { titre: 'Dashboard', texte: "After login, the dashboard displays key indicators: today's patients, pending consultations, pharmacy stock alerts, and revenue. All data refreshes automatically every 5 minutes." },
      { titre: 'Navigation', texte: 'The left sidebar gives access to all modules. Visible items depend on your role (doctor, nurse, cashier, pharmacist, lab technician, HR, admin).' },
    ],
  },
  {
    id: 'patients', icon: <Users size={16}/>, color: '#0F766E', bg: '#CCFBF1', border: '#5EEAD4',
    fr: { titre: 'Gestion des patients', desc: 'Enregistrement et dossiers patients' },
    en: { titre: 'Patient Management',  desc: 'Registration and patient records' },
    fr_content: [
      { titre: 'Créer un patient', texte: "Allez dans Patients → Nouveau patient. Remplissez le nom, prénom, date de naissance et sexe (obligatoires). Ajoutez le téléphone, l'adresse, le groupe sanguin, les allergies et l'assurance selon les informations disponibles. Cliquez sur Enregistrer." },
      { titre: 'Rechercher un patient', texte: "Sur la page Patients, utilisez la barre de recherche pour trouver un patient par nom, prénom ou IPP. La liste se met à jour en temps réel." },
      { titre: 'Dossier Médical Électronique (DME)', texte: "Cliquez sur l'icône «Voir» d'un patient pour accéder à son DME complet : antécédents, consultations passées, ordonnances, analyses, hospitalisations." },
      { titre: 'Modifier un patient', texte: "Depuis la fiche patient ou le DME, cliquez sur Modifier pour mettre à jour les informations. Toutes les modifications sont tracées dans le journal d'audit." },
    ],
    en_content: [
      { titre: 'Create a patient', texte: 'Go to Patients → New patient. Fill in name, date of birth and gender (required). Add phone, address, blood group, allergies and insurance as available. Click Save.' },
      { titre: 'Search a patient', texte: 'On the Patients page, use the search bar to find a patient by name, first name or IPP. The list updates in real time.' },
      { titre: 'Electronic Medical Record (EMR)', texte: "Click the 'View' icon on a patient to access their complete EMR: history, past consultations, prescriptions, lab results, hospitalizations." },
      { titre: 'Edit a patient', texte: 'From the patient file or EMR, click Edit to update information. All changes are tracked in the audit log.' },
    ],
  },
  {
    id: 'consultations', icon: <Activity size={16}/>, color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7',
    fr: { titre: 'Consultations', desc: 'Gestion des consultations médicales' },
    en: { titre: 'Consultations',  desc: 'Medical consultation management' },
    fr_content: [
      { titre: 'Nouvelle consultation', texte: "Allez dans Consultations → Nouvelle consultation. Suivez le wizard en 5 étapes : (1) Sélection du patient, (2) Sélection du médecin, (3) Motif et anamnèse, (4) Examen clinique et diagnostic, (5) Récapitulatif. La consultation est créée au clic sur Valider." },
      { titre: 'Constantes vitales', texte: "À l'étape 3, saisissez les constantes : tension artérielle (systolique/diastolique), fréquence cardiaque, température, poids, taille, saturation O₂. Ces valeurs sont visibles dans le DME du patient." },
      { titre: 'Diagnostic CIM-10', texte: "À l'étape 4, le champ diagnostic accepte le code CIM-10 et/ou le libellé en clair. Le plan de soins et la conclusion sont facultatifs mais recommandés." },
    ],
    en_content: [
      { titre: 'New consultation', texte: 'Go to Consultations → New consultation. Follow the 5-step wizard: (1) Patient selection, (2) Doctor selection, (3) Chief complaint & history, (4) Clinical exam & diagnosis, (5) Summary. The consultation is created when you click Validate.' },
      { titre: 'Vital signs', texte: 'At step 3, enter vital signs: blood pressure (systolic/diastolic), heart rate, temperature, weight, height, O₂ saturation. These values appear in the patient EMR.' },
      { titre: 'ICD-10 diagnosis', texte: 'At step 4, the diagnosis field accepts ICD-10 code and/or free text label. Treatment plan and conclusion are optional but recommended.' },
    ],
  },
  {
    id: 'rdv', icon: <Calendar size={16}/>, color: '#6D28D9', bg: '#EDE9FE', border: '#C4B5FD',
    fr: { titre: 'Rendez-vous', desc: 'Planification des rendez-vous' },
    en: { titre: 'Appointments',  desc: 'Appointment scheduling' },
    fr_content: [
      { titre: 'Vue calendrier', texte: "La page Rendez-vous affiche un calendrier hebdomadaire. Naviguez entre les semaines avec les boutons < >. Cliquez sur un créneau pour voir le détail du rendez-vous." },
      { titre: 'Créer un rendez-vous', texte: "Cliquez sur + Nouveau RDV. Sélectionnez le patient, le médecin, la date, l'heure et le motif. Le système vérifie automatiquement la disponibilité du médecin." },
      { titre: 'Statuts', texte: "Les statuts possibles : Planifié (bleu), Confirmé (vert), Annulé (rouge), Terminé (gris). Le statut se met à jour depuis le détail du rendez-vous." },
    ],
    en_content: [
      { titre: 'Calendar view', texte: 'The Appointments page shows a weekly calendar. Navigate between weeks using the < > buttons. Click a slot to see appointment details.' },
      { titre: 'Create an appointment', texte: "Click + New Appointment. Select the patient, doctor, date, time and reason. The system automatically checks the doctor's availability." },
      { titre: 'Statuses', texte: 'Possible statuses: Scheduled (blue), Confirmed (green), Cancelled (red), Completed (grey). The status updates from the appointment detail view.' },
    ],
  },
  {
    id: 'labo', icon: <FlaskConical size={16}/>, color: '#5B21B6', bg: '#EDE9FE', border: '#A78BFA',
    fr: { titre: 'Laboratoire', desc: "Demandes et résultats d'analyses" },
    en: { titre: 'Laboratory',  desc: 'Lab requests and results' },
    fr_content: [
      { titre: 'Nouvelle demande', texte: "Allez dans Laboratoire → Nouvelle demande. Sélectionnez le patient et cochez les analyses souhaitées dans le catalogue (hématologie, biochimie, sérologie, bactériologie). Activez le mode Urgente si nécessaire." },
      { titre: 'Saisir les résultats', texte: "Depuis la liste des demandes, cliquez sur une demande pour ouvrir sa fiche. Les résultats s'affichent avec un code couleur : normal (vert), élevé (orange), bas (bleu), critique (rouge)." },
      { titre: 'Résultats critiques', texte: "Les valeurs critiques déclenchent une alerte visuelle. Le laborantin doit contacter le médecin prescripteur immédiatement pour toute valeur critique." },
    ],
    en_content: [
      { titre: 'New request', texte: 'Go to Laboratory → New request. Select the patient and check the desired tests in the catalog (hematology, biochemistry, serology, bacteriology). Enable Urgent mode if needed.' },
      { titre: 'Enter results', texte: 'From the request list, click a request to open its record. Results display with a color code: normal (green), high (orange), low (blue), critical (red).' },
      { titre: 'Critical results', texte: 'Critical values trigger a visual alert. The lab technician must immediately contact the prescribing doctor for any critical value.' },
    ],
  },
  {
    id: 'pharmacie', icon: <Pill size={16}/>, color: '#047857', bg: '#D1FAE5', border: '#6EE7B7',
    fr: { titre: 'Pharmacie', desc: 'Stock et dispensation des médicaments' },
    en: { titre: 'Pharmacy',  desc: 'Drug stock and dispensing' },
    fr_content: [
      { titre: 'Gestion du stock', texte: "La page Pharmacie affiche l'inventaire complet. Les médicaments en rupture ou sous le seuil minimum apparaissent en rouge/orange. Utilisez le bouton XLSX pour exporter l'inventaire." },
      { titre: 'Ajouter un médicament', texte: "Cliquez sur + Nouveau médicament. Renseignez le nom commercial, DCI, forme, dosage, catégorie, prix de vente, stock actuel et minimum. Activez «Ordonnance requise» pour les médicaments sous prescription." },
      { titre: 'Alertes de stock', texte: "Les alertes de stock faible sont visibles sur le tableau de bord principal et dans la page Pharmacie. Le seuil minimum est configurable par médicament." },
    ],
    en_content: [
      { titre: 'Stock management', texte: 'The Pharmacy page displays the complete inventory. Medicines out of stock or below minimum threshold appear in red/orange. Use the XLSX button to export the inventory.' },
      { titre: 'Add a medicine', texte: 'Click + New medicine. Fill in the brand name, INN, form, dosage, category, sale price, current and minimum stock. Enable "Prescription required" for prescription medicines.' },
      { titre: 'Stock alerts', texte: 'Low stock alerts are visible on the main dashboard and the Pharmacy page. The minimum threshold is configurable per medicine.' },
    ],
  },
  {
    id: 'facturation', icon: <Receipt size={16}/>, color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD',
    fr: { titre: 'Facturation & Caisse', desc: 'Facturation des actes et encaissements' },
    en: { titre: 'Billing & Cashier',    desc: 'Act billing and collections' },
    fr_content: [
      { titre: 'Créer une facture', texte: "Allez dans Facturation → Nouvelle facture. Sélectionnez le patient et ajoutez les lignes de prestation : type (consultation, médicament, analyse…), libellé, quantité et prix unitaire. Le total se calcule en temps réel." },
      { titre: 'Enregistrer un paiement', texte: "Depuis le détail d'une facture, cliquez sur «Enregistrer un paiement». Choisissez le mode (espèces, mobile money, carte, assurance, virement) et le montant. Un paiement partiel est possible." },
      { titre: 'Exporter une facture PDF', texte: "Depuis le détail d'une facture, cliquez sur le bouton PDF pour télécharger la facture. La page Caisse affiche les encaissements du jour avec le total par mode de paiement." },
    ],
    en_content: [
      { titre: 'Create an invoice', texte: 'Go to Billing → New invoice. Select the patient and add service lines: type (consultation, medicine, analysis…), label, quantity and unit price. The total calculates in real time.' },
      { titre: 'Record a payment', texte: "From an invoice detail, click 'Record a payment'. Choose the method (cash, mobile money, card, insurance, transfer) and amount. Partial payment is supported." },
      { titre: 'Export invoice PDF', texte: "From an invoice detail, click the PDF button to download the invoice. The Cashier page shows today's collections with totals per payment method." },
    ],
  },
  {
    id: 'hospit', icon: <Bed size={16}/>, color: '#0369A1', bg: '#E0F2FE', border: '#7DD3FC',
    fr: { titre: 'Hospitalisation', desc: 'Gestion des séjours et lits' },
    en: { titre: 'Hospitalization', desc: 'Stay and bed management' },
    fr_content: [
      { titre: 'Vue des lits', texte: "La page Hospitalisation affiche l'état en temps réel de tous les lits : disponible (vert), occupé (bleu), en nettoyage (orange), hors service (rouge). Le taux d'occupation est visible en haut de page." },
      { titre: 'Notes médicales', texte: "Depuis le détail d'un séjour, les onglets permettent d'accéder aux notes médicales (avec constantes vitales), prescriptions et soins infirmiers. Chaque note est horodatée et attribuée à son auteur." },
    ],
    en_content: [
      { titre: 'Bed view', texte: 'The Hospitalization page shows real-time status of all beds: available (green), occupied (blue), being cleaned (orange), out of service (red). Occupancy rate is shown at the top.' },
      { titre: 'Medical notes', texte: 'From a stay detail, tabs give access to medical notes (with vital signs), prescriptions and nursing care. Each note is timestamped and attributed to its author.' },
    ],
  },
  {
    id: 'parametres', icon: <Settings size={16}/>, color: '#374151', bg: '#F3F4F6', border: '#D1D5DB',
    fr: { titre: 'Paramètres', desc: 'Configuration de la clinique' },
    en: { titre: 'Settings',   desc: 'Clinic configuration' },
    fr_content: [
      { titre: 'Informations établissement', texte: "Dans Paramètres, renseignez le nom de la clinique, la ville, le pays, le téléphone et l'email. Ces informations apparaissent sur les documents générés (factures, ordonnances)." },
      { titre: 'Sécurité', texte: "Activez la double authentification (2FA) pour renforcer la sécurité. Définissez le délai d'expiration de session (15-480 minutes). Ces paramètres s'appliquent à tous les utilisateurs de la clinique." },
      { titre: 'Notifications', texte: "Configurez les alertes automatiques : stock faible (pharmacie), nouveaux rendez-vous, résultats de laboratoire, nouvelles factures. Les notifications apparaissent dans la cloche en haut à droite." },
    ],
    en_content: [
      { titre: 'Establishment information', texte: 'In Settings, enter the clinic name, city, country, phone and email. This information appears on generated documents (invoices, prescriptions).' },
      { titre: 'Security', texte: 'Enable two-factor authentication (2FA) for enhanced security. Set the session timeout duration (15-480 minutes). These settings apply to all clinic users.' },
      { titre: 'Notifications', texte: 'Configure automatic alerts: low stock (pharmacy), new appointments, lab results, new invoices. Notifications appear in the bell icon at the top right.' },
    ],
  },
];

export default function GuidePage() {
  const [lang, setLang] = useState<Lang>('fr');
  const [activeSection, setActiveSection] = useState('demarrage');
  const [search, setSearch] = useState('');

  const section = SECTIONS.find(s => s.id === activeSection)!;
  const content = lang === 'fr' ? section.fr_content : section.en_content;
  const sIdx = SECTIONS.findIndex(s => s.id === activeSection);

  const filteredSections = search
    ? SECTIONS.filter(s => {
        const t = lang === 'fr' ? s.fr : s.en;
        const items = lang === 'fr' ? s.fr_content : s.en_content;
        return t.titre.toLowerCase().includes(search.toLowerCase()) ||
          items.some(i => i.titre.toLowerCase().includes(search.toLowerCase()) || i.texte.toLowerCase().includes(search.toLowerCase()));
      })
    : SECTIONS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden', background: '#F4F6FA' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .guide-nav-btn:hover { background: #E8EEF8 !important; }
      `}</style>

      {/* ── HERO STRIP ────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0A2E6E 0%,#1565C0 55%,#0891B2 100%)', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, boxShadow: '0 2px 12px rgba(10,46,110,0.3)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={20} color="#fff"/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.2px' }}>
            {lang === 'fr' ? 'Guide utilisateur SANTAREX ERP' : 'SANTAREX ERP User Guide'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
            {lang === 'fr' ? `${SECTIONS.length} chapitres · Section ${sIdx + 1}/${SECTIONS.length}` : `${SECTIONS.length} chapters · Section ${sIdx + 1}/${SECTIONS.length}`}
          </div>
        </div>
        {/* Lang toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 3, gap: 2 }}>
          {(['fr', 'en'] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: lang === l ? '#fff' : 'transparent', color: lang === l ? '#1565C0' : 'rgba(255,255,255,0.8)', transition: 'all .15s' }}>
              <Globe size={11}/> {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ width: 256, flexShrink: 0, background: '#fff', borderRight: '1px solid #E8EEF8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid #EEF2F8' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }}/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'fr' ? 'Rechercher…' : 'Search…'}
                style={{ width: '100%', padding: '8px 10px 8px 28px', border: '1.5px solid #E0E8F0', borderRadius: 9, fontSize: 12, outline: 'none', background: '#F8FAFC', color: '#37474F', boxSizing: 'border-box' }}/>
            </div>
          </div>

          {/* Nav items */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 8px' }}>
            {filteredSections.map((s, i) => {
              const t = lang === 'fr' ? s.fr : s.en;
              const isActive = s.id === activeSection;
              return (
                <button key={s.id} onClick={() => { setActiveSection(s.id); setSearch(''); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2, background: isActive ? s.bg : 'transparent', borderLeft: isActive ? `3px solid ${s.color}` : '3px solid transparent', transition: 'all .12s' }}
                  className="guide-nav-btn">
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: isActive ? 'rgba(255,255,255,0.7)' : '#F0F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? s.color : '#90A4AE', flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: isActive ? 800 : 600, color: isActive ? s.color : '#37474F', lineHeight: 1.2 }}>{t.titre}</div>
                    <div style={{ fontSize: 10, color: '#90A4AE', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                  </div>
                  {isActive && <ChevronRight size={12} color={s.color} style={{ flexShrink: 0 }}/>}
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid #EEF2F8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#90A4AE', fontWeight: 600, marginBottom: 5 }}>
              <span>{lang === 'fr' ? 'Progression' : 'Progress'}</span>
              <span>{sIdx + 1}/{SECTIONS.length}</span>
            </div>
            <div style={{ height: 4, background: '#EEF2F8', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((sIdx + 1) / SECTIONS.length) * 100}%`, background: `linear-gradient(90deg,#1565C0,#0891B2)`, borderRadius: 2, transition: 'width .3s ease' }}/>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px 40px', background: '#F4F6FA' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, animation: 'fadeUp .2s ease' }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: section.bg, border: `2px solid ${section.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: section.color, flexShrink: 0 }}>
                {section.icon}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1A2332', letterSpacing: '-0.3px' }}>
                  {lang === 'fr' ? section.fr.titre : section.en.titre}
                </h1>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#546E7A' }}>
                  {lang === 'fr' ? section.fr.desc : section.en.desc}
                </p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: section.color, background: section.bg, border: `1.5px solid ${section.border}`, padding: '3px 12px', borderRadius: 20, flexShrink: 0 }}>
                {sIdx + 1} / {SECTIONS.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp .25s ease' }}>
              {content.map((item, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  {/* Card header */}
                  <div style={{ background: section.bg, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1.5px solid ${section.border}` }}>
                    <span style={{ width: 24, height: 24, borderRadius: 8, background: section.color, color: '#fff', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: section.color }}>{item.titre}</h3>
                  </div>
                  {/* Card body */}
                  <div style={{ padding: '16px 20px' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#37474F', lineHeight: 1.8 }}>{item.texte}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1.5px solid #EEF2F8' }}>
              {sIdx > 0 ? (
                <button onClick={() => setActiveSection(SECTIONS[sIdx - 1].id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  ← {lang === 'fr' ? 'Précédent' : 'Previous'}
                </button>
              ) : <div/>}
              {sIdx < SECTIONS.length - 1 ? (
                <button onClick={() => setActiveSection(SECTIONS[sIdx + 1].id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: section.color, cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 700, boxShadow: `0 4px 14px ${section.color}40` }}>
                  {lang === 'fr' ? 'Suivant' : 'Next'} →
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: '#D1FAE5', border: '1.5px solid #6EE7B7', fontSize: 13, color: '#065F46', fontWeight: 700 }}>
                  ✓ {lang === 'fr' ? 'Guide terminé !' : 'Guide complete!'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
