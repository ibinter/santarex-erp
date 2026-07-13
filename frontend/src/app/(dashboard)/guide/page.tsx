'use client';

import { useState } from 'react';
import { BookOpen, Users, Calendar, FlaskConical, Pill, Receipt, Bed, Activity, Settings, ChevronRight, Search } from 'lucide-react';

type Lang = 'fr' | 'en';

const SECTIONS = [
  {
    id: 'demarrage', icon: <Activity size={18} />, color: '#1565C0', bg: '#EFF6FF',
    fr: { titre: 'Démarrage rapide', desc: 'Premiers pas avec SANTAREX ERP' },
    en: { titre: 'Quick Start', desc: 'Getting started with SANTAREX ERP' },
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
    id: 'patients', icon: <Users size={18} />, color: '#0D47A1', bg: '#E3F2FD',
    fr: { titre: 'Gestion des patients', desc: 'Enregistrement et dossiers patients' },
    en: { titre: 'Patient Management', desc: 'Registration and patient records' },
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
    id: 'consultations', icon: <Activity size={18} />, color: '#00695C', bg: '#E0F2F1',
    fr: { titre: 'Consultations', desc: 'Gestion des consultations médicales' },
    en: { titre: 'Consultations', desc: 'Medical consultation management' },
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
    id: 'rdv', icon: <Calendar size={18} />, color: '#6A1B9A', bg: '#F3E5F5',
    fr: { titre: 'Rendez-vous', desc: 'Planification des rendez-vous' },
    en: { titre: 'Appointments', desc: 'Appointment scheduling' },
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
    id: 'labo', icon: <FlaskConical size={18} />, color: '#4527A0', bg: '#EDE7F6',
    fr: { titre: 'Laboratoire', desc: "Demandes et résultats d'analyses" },
    en: { titre: 'Laboratory', desc: 'Lab requests and results' },
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
    id: 'pharmacie', icon: <Pill size={18} />, color: '#00695C', bg: '#E0F2F1',
    fr: { titre: 'Pharmacie', desc: 'Stock et dispensation des médicaments' },
    en: { titre: 'Pharmacy', desc: 'Drug stock and dispensing' },
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
    id: 'facturation', icon: <Receipt size={18} />, color: '#0D47A1', bg: '#EFF6FF',
    fr: { titre: 'Facturation & Caisse', desc: 'Facturation des actes et encaissements' },
    en: { titre: 'Billing & Cashier', desc: 'Act billing and collections' },
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
    id: 'hospit', icon: <Bed size={18} />, color: '#1565C0', bg: '#E3F2FD',
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
    id: 'parametres', icon: <Settings size={18} />, color: '#37474F', bg: '#ECEFF1',
    fr: { titre: 'Paramètres', desc: 'Configuration de la clinique' },
    en: { titre: 'Settings', desc: 'Clinic configuration' },
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

  const filteredSections = search
    ? SECTIONS.filter(s => {
        const t = lang === 'fr' ? s.fr : s.en;
        const items = lang === 'fr' ? s.fr_content : s.en_content;
        return t.titre.toLowerCase().includes(search.toLowerCase()) ||
          items.some(i => i.titre.toLowerCase().includes(search.toLowerCase()) || i.texte.toLowerCase().includes(search.toLowerCase()));
      })
    : SECTIONS;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid #E0E0E0', display: 'flex', flexDirection: 'column', background: '#FAFAFA', overflow: 'hidden' }}>
        <div style={{ padding: '16px 14px', borderBottom: '1px solid #E0E0E0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <BookOpen size={16} color="#1565C0" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>
              {lang === 'fr' ? 'Guide utilisateur' : 'User Guide'}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {(['fr', 'en'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  style={{ padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: lang === l ? '#1565C0' : '#E0E0E0', color: lang === l ? '#fff' : '#546E7A' }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'fr' ? 'Rechercher…' : 'Search…'}
              style={{ width: '100%', padding: '7px 8px 7px 26px', border: '1px solid #E0E0E0', borderRadius: 7, fontSize: 12, outline: 'none', background: '#fff', color: '#37474F', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 6px' }}>
          {filteredSections.map(s => {
            const t = lang === 'fr' ? s.fr : s.en;
            const active = s.id === activeSection;
            return (
              <button key={s.id} onClick={() => { setActiveSection(s.id); setSearch(''); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left', background: active ? s.bg : 'transparent', marginBottom: 2, transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F0F4F8'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: active ? s.bg : '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0, border: active ? `1.5px solid ${s.color}44` : 'none' }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: active ? 700 : 600, color: active ? s.color : '#37474F' }}>{t.titre}</div>
                  <div style={{ fontSize: 10, color: '#90A4AE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                </div>
                {active && <ChevronRight size={12} color={s.color} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px', maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: section.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: section.color, border: `2px solid ${section.color}33` }}>
            {section.icon}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1A2332' }}>
              {lang === 'fr' ? section.fr.titre : section.en.titre}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#546E7A' }}>
              {lang === 'fr' ? section.fr.desc : section.en.desc}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {content.map((item, i) => (
            <div key={i} style={{ padding: '20px 24px', borderRadius: 12, background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderLeft: `4px solid ${section.color}` }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: section.color }}>{item.titre}</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#37474F', lineHeight: 1.7 }}>{item.texte}</p>
            </div>
          ))}
        </div>
        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1px solid #F0F4F8' }}>
          {SECTIONS.findIndex(s => s.id === activeSection) > 0 ? (
            <button onClick={() => setActiveSection(SECTIONS[SECTIONS.findIndex(s => s.id === activeSection) - 1].id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
              ← {lang === 'fr' ? 'Précédent' : 'Previous'}
            </button>
          ) : <div />}
          {SECTIONS.findIndex(s => s.id === activeSection) < SECTIONS.length - 1 ? (
            <button onClick={() => setActiveSection(SECTIONS[SECTIONS.findIndex(s => s.id === activeSection) + 1].id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, background: section.color, border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
              {lang === 'fr' ? 'Suivant' : 'Next'} →
            </button>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
