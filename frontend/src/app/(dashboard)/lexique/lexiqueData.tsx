'use client';
// ════════════════════════════════════════════════════════════════════════════
//  LEXIQUE SANTAREX ERP — SOURCE UNIQUE DE VÉRITÉ (contenu)
//  Glossaire bilingue FR (défaut) / EN des termes métier utilisés dans
//  l'application : clinique, ERP/logiciel, comptabilité OHADA/facturation,
//  sigles & rôles (Côte d'Ivoire / zone OHADA, SYSCOHADA, FCFA).
//
//  Modèle d'entrée :
//    { terme, def }
//      - terme : intitulé du terme / sigle (gras)
//      - def   : définition courte (~1 phrase)
//
//  Chaque catégorie fournit un bloc `fr_content` et `en_content` en miroir.
// ════════════════════════════════════════════════════════════════════════════

import type { ReactNode } from 'react';
import {
  Stethoscope, Monitor, Calculator, Contact,
} from 'lucide-react';

export type Lang = 'fr' | 'en';

export interface Terme {
  terme: string;
  def: string;
}

export interface Categorie {
  id: string;
  icon: ReactNode;
  color: string;
  bg: string;
  border: string;
  fr: { titre: string; desc: string };
  en: { titre: string; desc: string };
  fr_content: Terme[];
  en_content: Terme[];
}

const ICON = 16;

export const CATEGORIES: Categorie[] = [
  // ══════════════════════════════════════════════════════════════════════════
  //  1. CLINIQUE
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'clinique', icon: <Stethoscope size={ICON} />, color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD',
    fr: { titre: 'Clinique', desc: 'Soins, dossier médical et actes cliniques' },
    en: { titre: 'Clinical', desc: 'Care, medical records and clinical acts' },
    fr_content: [
      { terme: 'DME (Dossier Médical Électronique)', def: "Version numérique du dossier patient regroupant antécédents, consultations, résultats et prescriptions ; équivalent de l'EMR anglophone." },
      { terme: 'CIM-10', def: 'Classification internationale des maladies (10e révision) utilisée pour coder les diagnostics ; ICD-10 en anglais.' },
      { terme: 'Constantes vitales', def: "Mesures cliniques de base (tension, pouls, température, fréquence respiratoire, SpO2) suivant l'état du patient." },
      { terme: 'Ordonnance / Prescription', def: 'Document médical listant les médicaments ou examens prescrits au patient par un praticien habilité.' },
      { terme: 'Consultation', def: "Rencontre entre un patient et un soignant donnant lieu à examen, diagnostic et conduite à tenir." },
      { terme: 'Triage (urgences)', def: 'Évaluation rapide à l\'arrivée aux urgences pour classer les patients par degré de gravité et priorité de prise en charge.' },
      { terme: 'Partogramme', def: "Graphique de suivi du travail d'accouchement (dilatation, contractions, état fœtal) permettant de détecter les anomalies." },
      { terme: 'CPN (Consultation Prénatale)', def: 'Consultation de suivi de la grossesse ; ANC (Antenatal Care) en anglais.' },
      { terme: 'DAR (Données-Actions-Résultats)', def: "Méthode de transmission ciblée des soins infirmiers : donnée observée, action menée, résultat obtenu." },
      { terme: 'SSPI (Salle de Surveillance Post-Interventionnelle)', def: 'Salle de réveil où le patient est surveillé après une intervention ; PACU en anglais.' },
      { terme: 'Check-list de sécurité au bloc', def: "Liste de vérifications obligatoires avant, pendant et après une intervention chirurgicale pour prévenir les erreurs." },
      { terme: 'Compte rendu opératoire', def: "Document décrivant le déroulement, les gestes et les constats d'une intervention chirurgicale." },
      { terme: 'Valeur critique labo', def: 'Résultat d\'analyse hors seuil vital nécessitant une alerte immédiate au médecin prescripteur.' },
      { terme: 'Interaction médicamenteuse', def: 'Effet indésirable ou modification d\'action résultant de l\'association de plusieurs médicaments.' },
      { terme: 'Banque de sang', def: 'Service gérant la collecte, la qualification, le stockage et la distribution des produits sanguins.' },
      { terme: 'Stérilisation', def: "Procédé éliminant tout micro-organisme des dispositifs médicaux réutilisables avant leur réemploi." },
      { terme: 'DASRI', def: 'Déchets d\'Activités de Soins à Risques Infectieux, collectés et éliminés selon une filière dédiée.' },
      { terme: 'HAD (Hospitalisation À Domicile)', def: "Prise en charge de soins hospitaliers au domicile du patient sous coordination médicale." },
      { terme: 'Consentement éclairé', def: "Accord du patient donné après information complète sur un acte, ses bénéfices et ses risques." },
      { terme: 'Imagerie / Radiologie', def: "Ensemble des examens produisant des images du corps (radio, échographie, scanner, IRM) à visée diagnostique." },
      { terme: 'Vaccination / Calendrier vaccinal', def: "Administration de vaccins selon un calendrier officiel définissant les âges et rappels recommandés." },
      { terme: 'Morgue / Chambre mortuaire', def: "Local réfrigéré assurant la conservation et la gestion des corps des personnes décédées." },
    ],
    en_content: [
      { terme: 'EMR (Electronic Medical Record)', def: 'Digital version of the patient file gathering history, visits, results and prescriptions; "DME" in French.' },
      { terme: 'ICD-10', def: 'International Classification of Diseases (10th revision) used to code diagnoses; CIM-10 in French.' },
      { terme: 'Vital signs', def: 'Core clinical measurements (blood pressure, pulse, temperature, respiratory rate, SpO2) tracking the patient\'s condition.' },
      { terme: 'Prescription', def: 'Medical document listing the drugs or exams prescribed to the patient by an authorised practitioner.' },
      { terme: 'Consultation', def: 'Encounter between a patient and a caregiver leading to examination, diagnosis and a plan of care.' },
      { terme: 'Triage (emergency)', def: 'Rapid assessment on ER arrival to sort patients by severity and priority of care.' },
      { terme: 'Partogram', def: 'Chart tracking labour (dilation, contractions, foetal status) to detect abnormalities early.' },
      { terme: 'ANC (Antenatal Care)', def: 'Pregnancy follow-up consultation; CPN in French.' },
      { terme: 'DAR (Data-Action-Result)', def: 'Focused nursing charting method: observed data, action taken, result obtained.' },
      { terme: 'PACU (Post-Anaesthesia Care Unit)', def: 'Recovery room where the patient is monitored after a procedure; SSPI in French.' },
      { terme: 'Surgical safety checklist', def: 'Mandatory verifications before, during and after surgery to prevent errors.' },
      { terme: 'Operative report', def: 'Document describing the course, gestures and findings of a surgical procedure.' },
      { terme: 'Critical lab value', def: 'Test result beyond a life-threatening threshold requiring immediate alert to the ordering physician.' },
      { terme: 'Drug interaction', def: 'Adverse effect or altered action resulting from combining several medications.' },
      { terme: 'Blood bank', def: 'Service managing collection, screening, storage and distribution of blood products.' },
      { terme: 'Sterilisation', def: 'Process removing all micro-organisms from reusable medical devices before reuse.' },
      { terme: 'DASRI (infectious care waste)', def: 'Healthcare waste with infectious risk, collected and disposed of through a dedicated channel.' },
      { terme: 'HHC (Home Hospital Care)', def: 'Delivery of hospital-level care at the patient\'s home under medical coordination; HAD in French.' },
      { terme: 'Informed consent', def: 'Patient agreement given after full information about an act, its benefits and its risks.' },
      { terme: 'Imaging / Radiology', def: 'All exams producing images of the body (X-ray, ultrasound, CT, MRI) for diagnostic purposes.' },
      { terme: 'Vaccination / Immunisation schedule', def: 'Administration of vaccines following an official schedule of recommended ages and boosters.' },
      { terme: 'Morgue / Mortuary', def: 'Refrigerated facility for the conservation and management of deceased persons.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  2. ERP / LOGICIEL
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'erp', icon: <Monitor size={ICON} />, color: '#0891B2', bg: '#CFFAFE', border: '#67E8F9',
    fr: { titre: 'ERP / Logiciel', desc: 'Concepts de la plateforme et du système' },
    en: { titre: 'ERP / Software', desc: 'Platform and system concepts' },
    fr_content: [
      { terme: 'Module', def: "Bloc fonctionnel de l'ERP couvrant un domaine (patients, pharmacie, caisse…), activable selon les besoins." },
      { terme: 'Tableau de bord (Dashboard)', def: "Écran de synthèse affichant indicateurs clés, alertes et raccourcis pour piloter l'activité." },
      { terme: 'Rôle', def: "Profil attribué à un utilisateur (médecin, caissier…) qui détermine ses droits d'accès." },
      { terme: 'Permission', def: "Droit précis autorisant une action (lire, créer, modifier, supprimer) sur une ressource." },
      { terme: 'Superadmin', def: "Compte disposant du niveau d'accès le plus élevé, capable de configurer l'ensemble de la plateforme." },
      { terme: 'Multi-site', def: "Capacité à gérer plusieurs établissements ou sites depuis une même instance de l'ERP." },
      { terme: "Journal d'audit (Audit log)", def: "Historique horodaté et infalsifiable des actions des utilisateurs à des fins de traçabilité." },
      { terme: 'Interopérabilité', def: "Aptitude du système à échanger des données avec d'autres logiciels de santé." },
      { terme: 'HL7 / FHIR', def: "Standards internationaux d'échange de données de santé entre systèmes d'information." },
      { terme: 'DICOM', def: "Standard de stockage et d'échange des images médicales et de leurs métadonnées." },
      { terme: 'Service personnalisé', def: "Prestation ou acte configuré sur mesure par l'établissement en dehors du catalogue standard." },
      { terme: 'Recherche globale', def: "Barre de recherche transversale permettant de retrouver patients, factures ou documents dans toute l'application." },
      { terme: 'Abonnement / Licence', def: "Droit d'usage du logiciel accordé pour une période et un périmètre définis, généralement payant." },
      { terme: 'Changelog', def: "Journal des nouveautés et corrections apportées à chaque nouvelle version du logiciel." },
      { terme: 'Portail patient', def: "Espace en ligne où le patient consulte ses rendez-vous, résultats et documents." },
      { terme: 'Notification / Rappel SMS', def: "Message automatique (appli ou SMS) informant d'un rendez-vous, d'un résultat ou d'une échéance." },
    ],
    en_content: [
      { terme: 'Module', def: 'Functional block of the ERP covering a domain (patients, pharmacy, cash desk…), enabled as needed.' },
      { terme: 'Dashboard', def: 'Summary screen showing key indicators, alerts and shortcuts to steer activity.' },
      { terme: 'Role', def: 'Profile assigned to a user (doctor, cashier…) that determines their access rights.' },
      { terme: 'Permission', def: 'Specific right authorising an action (read, create, edit, delete) on a resource.' },
      { terme: 'Superadmin', def: 'Account with the highest access level, able to configure the entire platform.' },
      { terme: 'Multi-site', def: 'Ability to manage several facilities or sites from a single ERP instance.' },
      { terme: 'Audit log', def: 'Time-stamped, tamper-proof history of user actions for traceability.' },
      { terme: 'Interoperability', def: 'System\'s ability to exchange data with other healthcare software.' },
      { terme: 'HL7 / FHIR', def: 'International standards for exchanging health data between information systems.' },
      { terme: 'DICOM', def: 'Standard for storing and exchanging medical images and their metadata.' },
      { terme: 'Custom service', def: 'Service or act configured to measure by the facility outside the standard catalogue.' },
      { terme: 'Global search', def: 'Cross-cutting search bar to find patients, invoices or documents across the whole app.' },
      { terme: 'Subscription / License', def: 'Right to use the software granted for a defined period and scope, usually paid.' },
      { terme: 'Changelog', def: 'Log of new features and fixes delivered in each new software version.' },
      { terme: 'Patient portal', def: 'Online space where patients view their appointments, results and documents.' },
      { terme: 'Notification / SMS reminder', def: 'Automatic message (app or SMS) about an appointment, a result or a due date.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  3. COMPTABLE OHADA / FACTURATION
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'comptable', icon: <Calculator size={ICON} />, color: '#B45309', bg: '#FEF3C7', border: '#FCD34D',
    fr: { titre: 'Comptable OHADA / Facturation', desc: 'Comptabilité SYSCOHADA, caisse et facturation' },
    en: { titre: 'OHADA Accounting / Billing', desc: 'SYSCOHADA accounting, cash and billing' },
    fr_content: [
      { terme: 'OHADA', def: "Organisation pour l'Harmonisation en Afrique du Droit des Affaires, cadre juridique commun à 17 États africains." },
      { terme: 'SYSCOHADA', def: "Système comptable OHADA fixant les règles et le plan comptable applicables dans la zone." },
      { terme: 'Plan comptable', def: "Liste normalisée des comptes utilisés pour enregistrer les opérations de l'établissement." },
      { terme: 'Écriture comptable', def: "Enregistrement d'une opération au débit et au crédit, respectant le principe de la partie double." },
      { terme: 'Facture', def: "Document détaillant les biens ou services fournis et les montants dus par le client." },
      { terme: 'Avoir', def: "Facture rectificative en faveur du client (remboursement, remise ou annulation partielle)." },
      { terme: 'Caisse / Encaissement', def: "Réception d'un paiement (espèces, carte, Mobile Money) enregistrée dans le système." },
      { terme: 'Session de caisse', def: "Période d'ouverture d'une caisse, du fonds initial à la clôture avec contrôle des montants." },
      { terme: 'Devis', def: "Estimation chiffrée d'une prestation proposée au patient avant sa réalisation." },
      { terme: 'Prise en charge (PEC) / BPC', def: "Engagement d'un assureur à couvrir tout ou partie des frais ; matérialisé par un Bon de Prise en Charge." },
      { terme: 'Tiers-payant', def: "Dispositif où l'assureur paie directement l'établissement, dispensant le patient d'avancer les frais couverts." },
      { terme: 'Part assurance / Part patient', def: "Répartition du montant d'une facture entre ce que couvre l'assureur et ce qui reste à la charge du patient." },
      { terme: 'Budget', def: "Prévision chiffrée des recettes et dépenses de l'établissement sur une période donnée." },
      { terme: 'Impayé / Relance', def: "Facture non réglée à l'échéance ; la relance est l'action de rappel du paiement au débiteur." },
    ],
    en_content: [
      { terme: 'OHADA', def: 'Organisation for the Harmonisation of Business Law in Africa, a common legal framework across 17 African states.' },
      { terme: 'SYSCOHADA', def: 'OHADA accounting system setting the rules and chart of accounts applicable in the zone.' },
      { terme: 'Chart of accounts', def: 'Standardised list of accounts used to record the facility\'s transactions.' },
      { terme: 'Accounting entry', def: 'Recording of a transaction in debit and credit, respecting double-entry bookkeeping.' },
      { terme: 'Invoice', def: 'Document detailing the goods or services supplied and the amounts owed by the client.' },
      { terme: 'Credit note', def: 'Corrective invoice in the client\'s favour (refund, discount or partial cancellation).' },
      { terme: 'Cash desk / Payment collection', def: 'Receipt of a payment (cash, card, Mobile Money) recorded in the system.' },
      { terme: 'Cash session', def: 'Period a cash desk is open, from the opening float to closing with amount reconciliation.' },
      { terme: 'Quote', def: 'Priced estimate of a service proposed to the patient before it is carried out.' },
      { terme: 'Coverage authorisation (PEC / BPC)', def: 'Insurer\'s commitment to cover all or part of the costs; issued as a coverage voucher.' },
      { terme: 'Third-party payment', def: 'Scheme where the insurer pays the facility directly, sparing the patient from advancing covered costs.' },
      { terme: 'Insurer share / Patient share', def: 'Split of an invoice amount between what the insurer covers and what remains payable by the patient.' },
      { terme: 'Budget', def: 'Quantified forecast of the facility\'s income and expenses over a given period.' },
      { terme: 'Unpaid / Dunning', def: 'Invoice unpaid at its due date; dunning is the action of reminding the debtor to pay.' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  4. SIGLES / RÔLES CI
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'sigles', icon: <Contact size={ICON} />, color: '#6D28D9', bg: '#EDE9FE', border: '#C4B5FD',
    fr: { titre: 'Sigles / Rôles CI', desc: 'Rôles métier et sigles (contexte Côte d\'Ivoire)' },
    en: { titre: 'Acronyms / CI Roles', desc: 'Business roles and acronyms (Ivory Coast context)' },
    fr_content: [
      { terme: 'DRH', def: 'Directeur des Ressources Humaines, responsable du personnel, des contrats et des plannings.' },
      { terme: 'Directeur', def: "Responsable de la direction de l'établissement, avec vue d'ensemble sur l'activité et les finances." },
      { terme: 'Rôles soignants (Médecin, Infirmier, Pharmacien, Laborantin)', def: "Professionnels de santé aux droits adaptés à leur métier : diagnostic et prescription (médecin), soins (infirmier), délivrance (pharmacien), analyses (laborantin)." },
      { terme: 'Caissier', def: "Agent chargé de l'encaissement des paiements et de la gestion de la caisse." },
      { terme: 'MoMo (Mobile Money)', def: "Paiement par porte-monnaie mobile via l'opérateur téléphonique, très répandu en Côte d'Ivoire." },
      { terme: 'Garde / Astreinte', def: "Garde : présence sur site hors horaires normaux ; astreinte : disponibilité à distance pour intervenir si besoin." },
    ],
    en_content: [
      { terme: 'DRH (HR Director)', def: 'Human Resources Director, in charge of staff, contracts and schedules.' },
      { terme: 'Director', def: 'Head of the facility, with an overview of activity and finances.' },
      { terme: 'Care roles (Doctor, Nurse, Pharmacist, Lab technician)', def: 'Health professionals with rights tailored to their job: diagnosis and prescription (doctor), care (nurse), dispensing (pharmacist), analyses (lab technician).' },
      { terme: 'Cashier', def: 'Agent responsible for collecting payments and managing the cash desk.' },
      { terme: 'MoMo (Mobile Money)', def: 'Payment via a mobile wallet through the phone operator, widely used in Ivory Coast.' },
      { terme: 'On-site duty / On-call', def: 'On-site duty: presence at the facility outside normal hours; on-call: remote availability to step in if needed.' },
    ],
  },
];
