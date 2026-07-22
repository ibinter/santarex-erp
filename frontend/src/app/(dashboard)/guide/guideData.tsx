'use client';
// ════════════════════════════════════════════════════════════════════════════
//  GUIDE UTILISATEUR SANTAREX ERP — SOURCE UNIQUE DE VÉRITÉ (contenu)
//  Ce module est partagé par la page (`page.tsx`) ET par le générateur PDF
//  (`guidePdf.ts`) afin d'éviter toute divergence entre l'affichage et l'export.
//
//  Modèle de fiche :
//    { titre, texte, etapes?, astuce? }
//      - titre  : intitulé de la fiche (gras)
//      - texte  : paragraphe explicatif
//      - etapes : liste ordonnée d'étapes pas-à-pas (facultatif)
//      - astuce : encadré conseil / point d'attention (facultatif)
//
//  Contexte produit : ERP hospitalier, Côte d'Ivoire / zone OHADA,
//  bilingue FR (défaut) / EN, comptabilité SYSCOHADA, monnaie FCFA.
// ════════════════════════════════════════════════════════════════════════════

import type { ReactNode } from 'react';
import {
  Users, Calendar, FlaskConical, Pill, Receipt, Bed, Settings, Activity,
  Siren, Scissors, ScanLine, Calculator, Users2, BarChart3, LifeBuoy, CreditCard,
} from 'lucide-react';

export type Lang = 'fr' | 'en';

export interface Fiche {
  titre: string;
  texte: string;
  etapes?: string[];
  astuce?: string;
}

export interface Section {
  id: string;
  icon: ReactNode;
  color: string;
  bg: string;
  border: string;
  fr: { titre: string; desc: string };
  en: { titre: string; desc: string };
  fr_content: Fiche[];
  en_content: Fiche[];
}

const ICON = 16;

export const SECTIONS: Section[] = [
  // ══════════════════════════════════════════════════════════════════════════
  //  1. DÉMARRAGE RAPIDE
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'demarrage', icon: <Activity size={ICON} />, color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD',
    fr: { titre: 'Démarrage rapide', desc: 'Premiers pas avec SANTAREX ERP' },
    en: { titre: 'Quick Start', desc: 'Getting started with SANTAREX ERP' },
    fr_content: [
      {
        titre: 'Se connecter à SANTAREX',
        texte: "SANTAREX est une application web : aucune installation n'est requise sur votre poste. Ouvrez votre navigateur (Chrome, Edge ou Firefox à jour), saisissez l'adresse de votre établissement fournie par l'administrateur, puis entrez votre email et votre mot de passe.",
        etapes: [
          'Ouvrez le navigateur et rendez-vous sur l\'adresse de la clinique (ex. https://votre-clinique.santarex.app).',
          'Saisissez votre email professionnel dans le champ « Identifiant ».',
          'Saisissez votre mot de passe, puis cliquez sur « Se connecter ».',
          'Si la double authentification (2FA) est activée, saisissez le code à 6 chiffres reçu.',
        ],
        astuce: "Cochez « Rester connecté » uniquement sur un poste personnel et sécurisé. Sur un poste partagé (accueil, caisse), déconnectez-vous toujours en fin de service via le menu profil en haut à droite.",
      },
      {
        titre: 'Mot de passe oublié / réinitialisation',
        texte: "En cas d'oubli, la réinitialisation est en libre-service. Le lien reçu par email est valable un temps limité pour des raisons de sécurité.",
        etapes: [
          'Sur l\'écran de connexion, cliquez sur « Mot de passe oublié ? ».',
          'Saisissez l\'email associé à votre compte et validez.',
          'Consultez votre boîte mail et ouvrez le message SANTAREX.',
          'Cliquez sur le lien, définissez un nouveau mot de passe (8 caractères minimum), confirmez.',
        ],
        astuce: "Si vous ne recevez pas l'email sous 5 minutes, vérifiez le dossier « Spam / Courrier indésirable » avant de contacter l'administrateur.",
      },
      {
        titre: 'Comprendre le tableau de bord',
        texte: "Après connexion, le tableau de bord affiche les indicateurs clés du jour : patients enregistrés, consultations en attente, alertes de stock pharmacie, résultats de laboratoire à valider et recettes encaissées. Les cartes se rechargent automatiquement toutes les 5 minutes.",
        astuce: "Cliquez sur une carte d'indicateur pour ouvrir directement le module concerné (ex. la carte « Alertes stock » ouvre la Pharmacie filtrée sur les ruptures).",
      },
      {
        titre: 'Naviguer entre les modules',
        texte: "Le menu latéral gauche donne accès à tous les modules. Les éléments visibles dépendent de votre rôle. Le fil d'Ariane en haut de chaque page rappelle où vous vous trouvez.",
        etapes: [
          'Cliquez sur un module dans le menu de gauche pour l\'ouvrir.',
          'Utilisez le fil d\'Ariane (Accueil › Module › Fiche) pour revenir en arrière.',
          'Repliez le menu avec l\'icône « chevron » pour agrandir la zone de travail.',
        ],
      },
      {
        titre: 'Rôles et permissions',
        texte: "Chaque utilisateur possède un rôle (médecin, infirmier, caissier, pharmacien, laborantin, DRH, comptable, administrateur). Le rôle détermine les modules accessibles et les actions autorisées. Un caissier ne voit pas le dossier médical, un médecin ne modifie pas la paie.",
        astuce: "Si un module attendu n'apparaît pas dans votre menu, ce n'est pas un bug : votre rôle ne l'autorise pas. Demandez à l'administrateur d'ajuster vos droits dans Paramètres › Utilisateurs.",
      },
      {
        titre: 'Recherche globale et raccourcis',
        texte: "La barre de recherche présente dans la plupart des modules filtre les listes en temps réel (patients, médicaments, factures). Les résultats se mettent à jour à chaque frappe, sans valider.",
        astuce: "Pour retrouver un patient rapidement depuis n'importe quel écran, ouvrez le module Patients et tapez les 3 premières lettres du nom ou l'IPP.",
      },
      {
        titre: 'Changer la langue de l\'interface',
        texte: "SANTAREX est bilingue français / anglais. Le français est la langue par défaut. Le choix de langue s'applique aux menus, libellés et documents générés.",
        etapes: [
          'Ouvrez le menu profil en haut à droite.',
          'Choisissez « Langue / Language ».',
          'Sélectionnez Français ou English : l\'interface se met à jour immédiatement.',
        ],
      },
      {
        titre: 'Se déconnecter en toute sécurité',
        texte: "La session expire automatiquement après le délai d'inactivité défini par l'administrateur (15 à 480 minutes). Vous pouvez aussi vous déconnecter manuellement à tout moment.",
        astuce: "En milieu hospitalier, verrouillez ou déconnectez systématiquement votre session avant de quitter un poste, même quelques minutes : les dossiers patients sont confidentiels.",
      },
    ],
    en_content: [
      {
        titre: 'Sign in to SANTAREX',
        texte: "SANTAREX is a web application: nothing to install on your workstation. Open an up-to-date browser (Chrome, Edge or Firefox), enter your clinic's address provided by the administrator, then your email and password.",
        etapes: [
          'Open the browser and go to your clinic address (e.g. https://your-clinic.santarex.app).',
          'Enter your work email in the « Username » field.',
          'Enter your password, then click « Sign in ».',
          'If two-factor authentication (2FA) is enabled, enter the 6-digit code you received.',
        ],
        astuce: "Only tick « Keep me signed in » on a personal, secured device. On a shared workstation (front desk, cashier), always sign out at the end of your shift via the profile menu at the top right.",
      },
      {
        titre: 'Forgotten password / reset',
        texte: "If you forget your password, reset is self-service. For security, the emailed link is valid for a limited time only.",
        etapes: [
          'On the login screen, click « Forgot password? ».',
          'Enter the email tied to your account and confirm.',
          'Open the SANTAREX message in your inbox.',
          'Click the link, set a new password (8 characters minimum), confirm.',
        ],
        astuce: "If no email arrives within 5 minutes, check your « Spam / Junk » folder before contacting the administrator.",
      },
      {
        titre: 'Understanding the dashboard',
        texte: "After login, the dashboard shows the day's key indicators: registered patients, pending consultations, pharmacy stock alerts, lab results to validate and revenue collected. Cards refresh automatically every 5 minutes.",
        astuce: "Click an indicator card to jump straight to the related module (e.g. the « Stock alerts » card opens Pharmacy filtered on shortages).",
      },
      {
        titre: 'Navigating between modules',
        texte: "The left sidebar gives access to all modules. Visible items depend on your role. The breadcrumb at the top of each page reminds you where you are.",
        etapes: [
          'Click a module in the left menu to open it.',
          'Use the breadcrumb (Home › Module › Record) to go back.',
          'Collapse the menu with the « chevron » icon to widen the workspace.',
        ],
      },
      {
        titre: 'Roles and permissions',
        texte: "Each user has a role (doctor, nurse, cashier, pharmacist, lab technician, HR, accountant, administrator). The role determines accessible modules and allowed actions. A cashier cannot see the medical record; a doctor cannot edit payroll.",
        astuce: "If an expected module is missing from your menu, it is not a bug: your role does not allow it. Ask the administrator to adjust your rights in Settings › Users.",
      },
      {
        titre: 'Global search and shortcuts',
        texte: "The search bar found in most modules filters lists in real time (patients, medicines, invoices). Results update on every keystroke, with no need to confirm.",
        astuce: "To find a patient quickly from any screen, open the Patients module and type the first 3 letters of the name or the MRN.",
      },
      {
        titre: 'Change the interface language',
        texte: "SANTAREX is bilingual French / English. French is the default. The language choice applies to menus, labels and generated documents.",
        etapes: [
          'Open the profile menu at the top right.',
          'Choose « Langue / Language ».',
          'Select Français or English: the interface updates instantly.',
        ],
      },
      {
        titre: 'Sign out securely',
        texte: "The session expires automatically after the inactivity delay set by the administrator (15 to 480 minutes). You can also sign out manually at any time.",
        astuce: "In a hospital setting, always lock or sign out before leaving a workstation, even for a few minutes: patient records are confidential.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  2. GESTION DES PATIENTS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'patients', icon: <Users size={ICON} />, color: '#0F766E', bg: '#CCFBF1', border: '#5EEAD4',
    fr: { titre: 'Gestion des patients', desc: 'Enregistrement et dossiers patients' },
    en: { titre: 'Patient Management', desc: 'Registration and patient records' },
    fr_content: [
      {
        titre: 'Enregistrer un nouveau patient',
        texte: "L'enregistrement crée un dossier unique et attribue un IPP (Identifiant Permanent du Patient). Les champs obligatoires sont marqués d'un astérisque.",
        etapes: [
          'Menu › Patients › bouton « Nouveau patient ».',
          'Renseignez Nom, Prénom, Date de naissance et Sexe (obligatoires).',
          'Complétez Téléphone, Adresse, Ville, Profession selon les informations disponibles.',
          'Renseignez le Groupe sanguin, les Allergies connues et la personne à prévenir.',
          'Ajoutez l\'assurance / mutuelle si le patient est couvert (assureur, n° police, taux de prise en charge).',
          'Cliquez sur « Enregistrer » : l\'IPP est généré automatiquement.',
        ],
        astuce: "Renseignez le téléphone dès la création : il sert aux rappels de rendez-vous et à retrouver un patient qui ne connaît pas son IPP.",
      },
      {
        titre: 'Rechercher un patient',
        texte: "La recherche accepte le nom, le prénom, l'IPP ou le numéro de téléphone. La liste se filtre en temps réel à chaque caractère saisi.",
        astuce: "En cas d'homonymes (fréquents), croisez avec la date de naissance affichée dans la liste avant d'ouvrir le dossier.",
      },
      {
        titre: 'Éviter les doublons',
        texte: "Un même patient enregistré deux fois fragmente son historique médical. Avant de créer un dossier, recherchez systématiquement le patient par nom ET par téléphone.",
        astuce: "Si vous détectez un doublon, ne le supprimez pas vous-même : signalez-le à l'administrateur qui procédera à la fusion des dossiers pour préserver l'historique.",
      },
      {
        titre: 'Consulter le Dossier Médical Électronique (DME)',
        texte: "Le DME centralise tout l'historique du patient : antécédents, consultations, ordonnances, résultats de laboratoire, imagerie, hospitalisations et factures. C'est la vue de référence du médecin.",
        etapes: [
          'Dans la liste Patients, cliquez sur l\'icône « Voir » (œil) de la ligne du patient.',
          'Parcourez les onglets : Résumé, Consultations, Ordonnances, Analyses, Hospitalisations.',
          'Cliquez sur une entrée pour en afficher le détail complet.',
        ],
      },
      {
        titre: 'Modifier les informations d\'un patient',
        texte: "Les données administratives évoluent (déménagement, changement de téléphone, nouvelle assurance). Toute modification est tracée dans le journal d'audit avec l'auteur et l'horodatage.",
        etapes: [
          'Ouvrez la fiche patient ou le DME.',
          'Cliquez sur « Modifier ».',
          'Mettez à jour les champs concernés, puis « Enregistrer ».',
        ],
        astuce: "Ne modifiez jamais le nom pour « recycler » un dossier vers un autre patient : cela corrompt l'historique. Créez toujours un nouveau dossier.",
      },
      {
        titre: 'Renseigner allergies et antécédents',
        texte: "Les allergies et antécédents sont des informations de sécurité. Une allergie médicamenteuse déclenche une alerte lors de la prescription du produit concerné.",
        astuce: "Documentez précisément l'allergène (ex. « Pénicilline » plutôt que « antibiotiques ») pour que les alertes de prescription soient pertinentes.",
      },
      {
        titre: 'Gérer l\'assurance et la prise en charge',
        texte: "Le taux de prise en charge saisi dans la fiche patient est repris automatiquement lors de la facturation : la part assurance et le reste à charge patient sont calculés sans ressaisie.",
        astuce: "Vérifiez la validité de la carte d'assurance à chaque passage : un taux périmé fausse la répartition sur la facture.",
      },
      {
        titre: 'Imprimer / exporter la fiche patient',
        texte: "La fiche patient et certaines vues du DME peuvent être exportées en PDF pour transmission (courrier de liaison, dossier de transfert).",
        astuce: "Respectez la confidentialité : ne transmettez un export de dossier qu'au professionnel de santé concerné et par un canal sécurisé.",
      },
    ],
    en_content: [
      {
        titre: 'Register a new patient',
        texte: "Registration creates a unique record and assigns an MRN (Medical Record Number). Required fields are marked with an asterisk.",
        etapes: [
          'Menu › Patients › « New patient » button.',
          'Fill in Last name, First name, Date of birth and Gender (required).',
          'Complete Phone, Address, City, Occupation as available.',
          'Enter Blood group, known Allergies and next of kin.',
          'Add insurance if the patient is covered (insurer, policy no., coverage rate).',
          'Click « Save »: the MRN is generated automatically.',
        ],
        astuce: "Capture the phone number at creation: it is used for appointment reminders and to find a patient who does not know their MRN.",
      },
      {
        titre: 'Search a patient',
        texte: "Search accepts name, first name, MRN or phone number. The list filters in real time on each character typed.",
        astuce: "For common namesakes, cross-check with the date of birth shown in the list before opening the record.",
      },
      {
        titre: 'Avoid duplicates',
        texte: "The same patient registered twice fragments their medical history. Before creating a record, always search by name AND phone.",
        astuce: "If you spot a duplicate, do not delete it yourself: report it to the administrator who will merge the records to preserve history.",
      },
      {
        titre: 'View the Electronic Medical Record (EMR)',
        texte: "The EMR centralises the patient's full history: history, consultations, prescriptions, lab results, imaging, hospitalisations and invoices. It is the doctor's reference view.",
        etapes: [
          'In the Patients list, click the « View » (eye) icon on the patient\'s row.',
          'Browse the tabs: Summary, Consultations, Prescriptions, Labs, Hospitalisations.',
          'Click an entry to display its full detail.',
        ],
      },
      {
        titre: 'Edit patient information',
        texte: "Administrative data changes (move, new phone, new insurance). Every change is tracked in the audit log with author and timestamp.",
        etapes: [
          'Open the patient file or EMR.',
          'Click « Edit ».',
          'Update the relevant fields, then « Save ».',
        ],
        astuce: "Never rename a record to « recycle » it for another patient: it corrupts history. Always create a new record.",
      },
      {
        titre: 'Record allergies and history',
        texte: "Allergies and history are safety information. A drug allergy triggers an alert when prescribing the related product.",
        astuce: "Document the allergen precisely (e.g. « Penicillin » rather than « antibiotics ») so prescription alerts stay relevant.",
      },
      {
        titre: 'Manage insurance and coverage',
        texte: "The coverage rate entered on the patient file is applied automatically at billing: the insurer share and the patient's out-of-pocket amount are computed without re-entry.",
        astuce: "Check the insurance card's validity at each visit: an expired rate distorts the split on the invoice.",
      },
      {
        titre: 'Print / export the patient file',
        texte: "The patient file and some EMR views can be exported to PDF for transmission (referral letter, transfer file).",
        astuce: "Respect confidentiality: only send a record export to the relevant health professional through a secure channel.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  3. CONSULTATIONS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'consultations', icon: <Activity size={ICON} />, color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7',
    fr: { titre: 'Consultations', desc: 'Gestion des consultations médicales' },
    en: { titre: 'Consultations', desc: 'Medical consultation management' },
    fr_content: [
      {
        titre: 'Créer une nouvelle consultation',
        texte: "La consultation se saisit via un assistant en 5 étapes qui structure le recueil clinique et alimente automatiquement le DME du patient.",
        etapes: [
          'Menu › Consultations › « Nouvelle consultation ».',
          'Étape 1 — Sélectionnez le patient (recherche par nom / IPP).',
          'Étape 2 — Sélectionnez le médecin réalisant l\'acte.',
          'Étape 3 — Saisissez le motif, l\'anamnèse et les constantes vitales.',
          'Étape 4 — Renseignez l\'examen clinique, le diagnostic (CIM-10) et le plan de soins.',
          'Étape 5 — Vérifiez le récapitulatif, puis cliquez sur « Valider ».',
        ],
        astuce: "Vous pouvez naviguer entre les étapes avec « Précédent » sans perdre les données déjà saisies tant que vous n'avez pas quitté l'assistant.",
      },
      {
        titre: 'Saisir les constantes vitales',
        texte: "À l'étape 3, renseignez les constantes : tension artérielle (systolique / diastolique), fréquence cardiaque, température, poids, taille et saturation en oxygène (SpO₂). Ces valeurs sont historisées dans le DME.",
        astuce: "Le poids et la taille alimentent le calcul de l'IMC. Saisissez-les à chaque consultation de suivi pour tracer une courbe pertinente.",
      },
      {
        titre: 'Poser un diagnostic CIM-10',
        texte: "À l'étape 4, le champ diagnostic accepte le code CIM-10 (ex. J11 pour la grippe) et/ou un libellé en clair. Un codage rigoureux améliore les statistiques épidémiologiques du module Reporting.",
        astuce: "Renseignez au moins le diagnostic principal codé : c'est lui qui alimente les tableaux de morbidité et les déclarations sanitaires.",
      },
      {
        titre: 'Rédiger une ordonnance',
        texte: "Depuis la consultation, générez une ordonnance en sélectionnant les médicaments, leur posologie, la durée et le nombre de renouvellements. L'ordonnance est reliée à la consultation et au patient.",
        etapes: [
          'Dans le récapitulatif de la consultation, cliquez sur « Ordonnance ».',
          'Ajoutez chaque médicament (recherche dans le catalogue pharmacie).',
          'Précisez posologie, voie, durée et renouvellement pour chaque ligne.',
          'Validez : l\'ordonnance devient imprimable / exportable en PDF.',
        ],
        astuce: "Si une allergie du patient correspond à un produit prescrit, une alerte s'affiche. Ne l'ignorez pas sans justification clinique.",
      },
      {
        titre: 'Prescrire des examens de laboratoire',
        texte: "Depuis la consultation, vous pouvez générer directement une demande d'analyses transmise au module Laboratoire, sans ressaisir le patient.",
        astuce: "Cochez « Urgent » pour les bilans à traiter en priorité : la demande remonte en tête de file côté laboratoire.",
      },
      {
        titre: 'Demander une imagerie',
        texte: "La consultation permet aussi de prescrire un examen d'imagerie (radiographie, échographie, scanner). La demande est routée vers le module Imagerie avec le motif clinique.",
        astuce: "Renseignez toujours l'indication clinique : le manipulateur et le radiologue en ont besoin pour adapter le protocole d'acquisition.",
      },
      {
        titre: 'Clôturer et facturer la consultation',
        texte: "À la validation, la consultation peut générer automatiquement une ligne de facturation (acte de consultation) transmise au module Facturation & Caisse.",
        astuce: "Vérifiez le tarif de l'acte selon le type de consultation (généraliste, spécialiste, urgence) avant de clôturer.",
      },
      {
        titre: 'Reprendre / corriger une consultation',
        texte: "Une consultation validée reste consultable dans le DME. Les corrections restent tracées ; on n'efface pas un acte médical, on l'amende.",
        astuce: "Pour un compte rendu détaillé (courrier au confrère), utilisez l'export PDF de la consultation depuis le DME.",
      },
    ],
    en_content: [
      {
        titre: 'Create a new consultation',
        texte: "A consultation is entered through a 5-step wizard that structures clinical data capture and automatically feeds the patient's EMR.",
        etapes: [
          'Menu › Consultations › « New consultation ».',
          'Step 1 — Select the patient (search by name / MRN).',
          'Step 2 — Select the attending doctor.',
          'Step 3 — Enter the chief complaint, history and vital signs.',
          'Step 4 — Record the clinical exam, diagnosis (ICD-10) and treatment plan.',
          'Step 5 — Review the summary, then click « Validate ».',
        ],
        astuce: "You can move between steps with « Previous » without losing entered data as long as you have not left the wizard.",
      },
      {
        titre: 'Enter vital signs',
        texte: "At step 3, record vital signs: blood pressure (systolic / diastolic), heart rate, temperature, weight, height and oxygen saturation (SpO₂). These values are stored in the EMR history.",
        astuce: "Weight and height feed the BMI calculation. Enter them at each follow-up to plot a meaningful curve.",
      },
      {
        titre: 'Make an ICD-10 diagnosis',
        texte: "At step 4, the diagnosis field accepts the ICD-10 code (e.g. J11 for influenza) and/or free text. Rigorous coding improves the Reporting module's epidemiological statistics.",
        astuce: "Enter at least the coded primary diagnosis: it feeds morbidity tables and health declarations.",
      },
      {
        titre: 'Write a prescription',
        texte: "From the consultation, generate a prescription by selecting medicines, their dosage, duration and number of refills. The prescription is linked to the consultation and the patient.",
        etapes: [
          'In the consultation summary, click « Prescription ».',
          'Add each medicine (search the pharmacy catalog).',
          'Specify dosage, route, duration and refill for each line.',
          'Validate: the prescription becomes printable / exportable to PDF.',
        ],
        astuce: "If a patient allergy matches a prescribed product, an alert appears. Do not ignore it without clinical justification.",
      },
      {
        titre: 'Order laboratory tests',
        texte: "From the consultation, you can directly generate a test request sent to the Laboratory module, without re-entering the patient.",
        astuce: "Tick « Urgent » for panels to prioritise: the request moves to the front of the lab queue.",
      },
      {
        titre: 'Request imaging',
        texte: "The consultation also lets you order an imaging exam (X-ray, ultrasound, CT). The request is routed to the Imaging module with the clinical reason.",
        astuce: "Always provide the clinical indication: the technologist and radiologist need it to adapt the acquisition protocol.",
      },
      {
        titre: 'Close and bill the consultation',
        texte: "On validation, the consultation can automatically generate a billing line (consultation act) sent to the Billing & Cashier module.",
        astuce: "Check the act tariff by consultation type (GP, specialist, emergency) before closing.",
      },
      {
        titre: 'Resume / correct a consultation',
        texte: "A validated consultation remains visible in the EMR. Corrections stay tracked; a medical act is not erased, it is amended.",
        astuce: "For a detailed report (letter to a colleague), use the PDF export of the consultation from the EMR.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  4. RENDEZ-VOUS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'rdv', icon: <Calendar size={ICON} />, color: '#6D28D9', bg: '#EDE9FE', border: '#C4B5FD',
    fr: { titre: 'Rendez-vous', desc: 'Planification des rendez-vous' },
    en: { titre: 'Appointments', desc: 'Appointment scheduling' },
    fr_content: [
      {
        titre: 'Utiliser la vue calendrier',
        texte: "La page Rendez-vous affiche un calendrier hebdomadaire. Chaque créneau occupé montre le patient, le médecin et le motif. Naviguez entre les semaines avec les boutons « < » et « > ».",
        astuce: "Cliquez sur « Aujourd'hui » pour revenir instantanément à la semaine en cours depuis n'importe quelle date.",
      },
      {
        titre: 'Créer un rendez-vous',
        texte: "La prise de rendez-vous vérifie automatiquement la disponibilité du médecin et évite les chevauchements.",
        etapes: [
          'Cliquez sur « + Nouveau RDV » (ou directement sur un créneau libre).',
          'Sélectionnez le patient (recherche par nom / IPP).',
          'Choisissez le médecin, la date, l\'heure et la durée.',
          'Renseignez le motif et validez.',
        ],
        astuce: "Si le créneau choisi est déjà pris, le système le signale : proposez au patient le créneau libre le plus proche affiché en vert.",
      },
      {
        titre: 'Comprendre les statuts',
        texte: "Un rendez-vous passe par plusieurs statuts, chacun avec une couleur : Planifié (bleu), Confirmé (vert), En cours, Annulé (rouge), Terminé (gris) et Absent (« no-show »).",
        astuce: "Marquez « Confirmé » après le rappel téléphonique de la veille : le taux de confirmation devient un indicateur fiable de l'affluence attendue.",
      },
      {
        titre: 'Reprogrammer ou annuler',
        texte: "Depuis le détail du rendez-vous, vous pouvez le déplacer vers un autre créneau ou l'annuler en renseignant un motif.",
        etapes: [
          'Ouvrez le rendez-vous concerné.',
          'Cliquez sur « Reprogrammer » puis choisissez le nouveau créneau, OU sur « Annuler ».',
          'Renseignez le motif (à la demande du patient, indisponibilité du médecin…).',
        ],
        astuce: "Prévenez le patient de tout déplacement par téléphone : le système ne l'appelle pas à votre place.",
      },
      {
        titre: 'Gérer les absences (no-show)',
        texte: "Un patient qui ne se présente pas est marqué « Absent ». Le suivi des absences aide à identifier les patients à rappeler systématiquement.",
        astuce: "Un taux d'absence élevé sur un créneau récurrent peut justifier un rappel SMS/téléphonique la veille.",
      },
      {
        titre: 'Enchaîner RDV et consultation',
        texte: "À l'arrivée du patient, le rendez-vous confirmé sert de point de départ à la consultation : le patient et le médecin sont déjà renseignés.",
        astuce: "Passez le statut à « En cours » quand le patient entre en salle, puis « Terminé » à la fin : la salle d'attente reflète alors l'état réel.",
      },
      {
        titre: 'Filtrer par médecin ou par jour',
        texte: "Le calendrier peut être filtré par médecin pour visualiser l'agenda d'un praticien précis, utile dans une structure multi-praticiens.",
        astuce: "Pour préparer la journée d'un médecin, filtrez sur son nom et imprimez / exportez la vue du jour.",
      },
    ],
    en_content: [
      {
        titre: 'Use the calendar view',
        texte: "The Appointments page shows a weekly calendar. Each booked slot shows the patient, doctor and reason. Navigate between weeks with the « < » and « > » buttons.",
        astuce: "Click « Today » to jump instantly back to the current week from any date.",
      },
      {
        titre: 'Create an appointment',
        texte: "Booking automatically checks the doctor's availability and prevents overlaps.",
        etapes: [
          'Click « + New Appointment » (or directly on a free slot).',
          'Select the patient (search by name / MRN).',
          'Choose the doctor, date, time and duration.',
          'Enter the reason and confirm.',
        ],
        astuce: "If the chosen slot is taken, the system flags it: offer the patient the nearest free slot shown in green.",
      },
      {
        titre: 'Understand statuses',
        texte: "An appointment moves through several statuses, each colour-coded: Scheduled (blue), Confirmed (green), In progress, Cancelled (red), Completed (grey) and No-show.",
        astuce: "Mark « Confirmed » after the day-before reminder call: the confirmation rate becomes a reliable indicator of expected attendance.",
      },
      {
        titre: 'Reschedule or cancel',
        texte: "From the appointment detail, you can move it to another slot or cancel it with a reason.",
        etapes: [
          'Open the relevant appointment.',
          'Click « Reschedule » then pick the new slot, OR « Cancel ».',
          'Enter the reason (patient request, doctor unavailable…).',
        ],
        astuce: "Notify the patient of any change by phone: the system does not call on your behalf.",
      },
      {
        titre: 'Handle no-shows',
        texte: "A patient who does not attend is marked « No-show ». Tracking no-shows helps identify patients to remind systematically.",
        astuce: "A high no-show rate on a recurring slot may justify a day-before SMS/phone reminder.",
      },
      {
        titre: 'Chain appointment and consultation',
        texte: "On the patient's arrival, the confirmed appointment is the starting point of the consultation: patient and doctor are already set.",
        astuce: "Set the status to « In progress » when the patient enters, then « Completed » at the end: the waiting room then reflects reality.",
      },
      {
        titre: 'Filter by doctor or day',
        texte: "The calendar can be filtered by doctor to view a specific practitioner's schedule, useful in a multi-practitioner facility.",
        astuce: "To prepare a doctor's day, filter on their name and print / export the day view.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  5. LABORATOIRE
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'labo', icon: <FlaskConical size={ICON} />, color: '#5B21B6', bg: '#EDE9FE', border: '#A78BFA',
    fr: { titre: 'Laboratoire', desc: "Demandes et résultats d'analyses" },
    en: { titre: 'Laboratory', desc: 'Lab requests and results' },
    fr_content: [
      {
        titre: 'Créer une demande d\'analyses',
        texte: "Une demande regroupe les analyses prescrites pour un patient. Elle peut venir d'une consultation ou être saisie directement au laboratoire.",
        etapes: [
          'Menu › Laboratoire › « Nouvelle demande ».',
          'Sélectionnez le patient.',
          'Cochez les analyses dans le catalogue (hématologie, biochimie, sérologie, bactériologie).',
          'Activez « Urgente » si le résultat conditionne une décision immédiate.',
          'Validez : la demande passe au statut « En attente de prélèvement ».',
        ],
        astuce: "Groupez les analyses d'un même tube pour limiter les prélèvements : le catalogue indique le type d'échantillon requis.",
      },
      {
        titre: 'Suivre le circuit de la demande',
        texte: "Chaque demande suit un circuit : En attente de prélèvement → Prélevée → En cours d'analyse → Résultats saisis → Validée. Le statut est visible dans la liste des demandes.",
        astuce: "Filtrez la liste sur « En attente » en début de journée pour organiser les prélèvements.",
      },
      {
        titre: 'Saisir les résultats',
        texte: "Le laborantin saisit les valeurs mesurées pour chaque paramètre. Le système les compare aux valeurs de référence et applique un code couleur.",
        etapes: [
          'Ouvrez la demande depuis la liste.',
          'Saisissez la valeur de chaque paramètre dans son unité.',
          'Le code couleur s\'affiche : normal (vert), élevé (orange), bas (bleu), critique (rouge).',
          'Cliquez sur « Enregistrer les résultats ».',
        ],
        astuce: "Vérifiez l'unité affichée avant de saisir : une glycémie en g/L et en mmol/L n'a pas la même valeur numérique.",
      },
      {
        titre: 'Gérer les valeurs critiques',
        texte: "Une valeur critique (ex. potassium très élevé) met la ligne en rouge et déclenche une alerte. La conduite à tenir est un contact immédiat du prescripteur.",
        astuce: "Tracez l'appel : indiquez dans le commentaire l'heure et le nom du médecin prévenu. C'est une exigence de sécurité et de traçabilité.",
      },
      {
        titre: 'Valider et publier les résultats',
        texte: "La validation biologique verrouille les résultats et les rend visibles dans le DME du patient et pour le médecin prescripteur.",
        astuce: "Relisez l'ensemble du bilan avant validation : une fois publié, un résultat corrigé reste tracé comme amendement.",
      },
      {
        titre: 'Éditer le compte rendu PDF',
        texte: "Un compte rendu d'analyses en PDF peut être généré pour remise au patient ou transmission au prescripteur, avec l'en-tête de l'établissement.",
        astuce: "Le compte rendu peut inclure un QR code de vérification permettant de contrôler son authenticité en ligne.",
      },
      {
        titre: 'Facturer les analyses',
        texte: "Les analyses réalisées alimentent la facturation du patient (part assurance / part patient) selon le tarif du catalogue.",
        astuce: "Assurez-vous que chaque analyse cochée correspond bien à une prescription : cela évite les litiges de facturation.",
      },
    ],
    en_content: [
      {
        titre: 'Create a test request',
        texte: "A request groups the tests ordered for a patient. It can come from a consultation or be entered directly at the lab.",
        etapes: [
          'Menu › Laboratory › « New request ».',
          'Select the patient.',
          'Check the tests in the catalog (hematology, biochemistry, serology, bacteriology).',
          'Enable « Urgent » if the result drives an immediate decision.',
          'Confirm: the request moves to « Awaiting sampling ».',
        ],
        astuce: "Group tests from the same tube to limit draws: the catalog indicates the required sample type.",
      },
      {
        titre: 'Track the request workflow',
        texte: "Each request follows a workflow: Awaiting sampling → Sampled → In analysis → Results entered → Validated. The status is visible in the request list.",
        astuce: "Filter the list on « Awaiting » at the start of the day to organise sample collection.",
      },
      {
        titre: 'Enter results',
        texte: "The technician enters the measured values for each parameter. The system compares them to reference ranges and applies a colour code.",
        etapes: [
          'Open the request from the list.',
          'Enter each parameter\'s value in its unit.',
          'The colour code appears: normal (green), high (orange), low (blue), critical (red).',
          'Click « Save results ».',
        ],
        astuce: "Check the displayed unit before entering: a glucose in g/L and in mmol/L are not the same number.",
      },
      {
        titre: 'Handle critical values',
        texte: "A critical value (e.g. very high potassium) turns the line red and triggers an alert. The required action is an immediate call to the prescriber.",
        astuce: "Trace the call: note in the comment the time and the name of the doctor informed. It is a safety and traceability requirement.",
      },
      {
        titre: 'Validate and publish results',
        texte: "Biological validation locks the results and makes them visible in the patient's EMR and to the prescribing doctor.",
        astuce: "Re-read the whole panel before validating: once published, a corrected result stays tracked as an amendment.",
      },
      {
        titre: 'Produce the PDF report',
        texte: "A PDF lab report can be generated to hand to the patient or send to the prescriber, with the facility header.",
        astuce: "The report can include a verification QR code to check its authenticity online.",
      },
      {
        titre: 'Bill the tests',
        texte: "Performed tests feed the patient's billing (insurer / patient share) based on the catalog tariff.",
        astuce: "Make sure each ticked test matches an order: this avoids billing disputes.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  6. PHARMACIE
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'pharmacie', icon: <Pill size={ICON} />, color: '#047857', bg: '#D1FAE5', border: '#6EE7B7',
    fr: { titre: 'Pharmacie', desc: 'Stock et dispensation des médicaments' },
    en: { titre: 'Pharmacy', desc: 'Drug stock and dispensing' },
    fr_content: [
      {
        titre: 'Consulter l\'inventaire',
        texte: "La page Pharmacie affiche l'inventaire complet : nom, DCI, forme, dosage, stock actuel, seuil minimum et prix. Les produits en rupture ou sous le seuil apparaissent en rouge / orange.",
        astuce: "Utilisez le bouton « XLSX » pour exporter l'inventaire vers Excel, par exemple pour préparer une commande fournisseur.",
      },
      {
        titre: 'Ajouter un médicament au catalogue',
        texte: "Chaque produit du catalogue est décrit précisément pour être prescrit et dispensé sans ambiguïté.",
        etapes: [
          'Cliquez sur « + Nouveau médicament ».',
          'Renseignez le nom commercial, la DCI, la forme et le dosage.',
          'Choisissez la catégorie thérapeutique.',
          'Saisissez le prix de vente, le stock actuel et le stock minimum.',
          'Activez « Ordonnance requise » pour les produits sous prescription.',
          'Enregistrez.',
        ],
        astuce: "Renseignez toujours la DCI (dénomination commune) : elle permet de retrouver un produit même si la marque change.",
      },
      {
        titre: 'Entrer un approvisionnement (stock)',
        texte: "À la réception d'une commande, augmentez le stock du produit concerné. Le mouvement d'entrée est tracé (date, quantité, éventuel lot / péremption).",
        astuce: "Enregistrez le numéro de lot et la date de péremption : c'est indispensable en cas de rappel de lot par le fabricant.",
      },
      {
        titre: 'Dispenser sur ordonnance',
        texte: "La dispensation décrémente le stock et relie la sortie au patient et à l'ordonnance. Pour un produit « Ordonnance requise », la dispensation sans prescription est bloquée.",
        etapes: [
          'Recherchez le patient et son ordonnance.',
          'Sélectionnez les produits et les quantités délivrées.',
          'Validez la dispensation : le stock est mis à jour automatiquement.',
        ],
        astuce: "Contrôlez la date de péremption au moment de délivrer : ne dispensez jamais un produit périmé même si le stock l'affiche encore.",
      },
      {
        titre: 'Surveiller les alertes de stock',
        texte: "Dès qu'un produit passe sous son seuil minimum, une alerte apparaît sur le tableau de bord et dans la page Pharmacie. Cela déclenche le réapprovisionnement.",
        astuce: "Ajustez le seuil minimum selon la vitesse de rotation : un produit très consommé mérite un seuil plus élevé pour éviter la rupture.",
      },
      {
        titre: 'Gérer les péremptions',
        texte: "Suivez les dates de péremption pour appliquer la règle « premier périmé, premier sorti » (FEFO) et limiter les pertes.",
        astuce: "Contrôlez régulièrement les produits proches de la péremption et écoulez-les en priorité lors des dispensations.",
      },
      {
        titre: 'Facturer les produits dispensés',
        texte: "Les produits délivrés génèrent des lignes de facturation transmises à la Caisse, avec application du taux d'assurance du patient.",
        astuce: "Vérifiez le prix de vente à jour dans le catalogue : une hausse fournisseur non répercutée réduit la marge de l'officine.",
      },
    ],
    en_content: [
      {
        titre: 'View the inventory',
        texte: "The Pharmacy page shows the full inventory: name, INN, form, dosage, current stock, minimum threshold and price. Out-of-stock or below-threshold products appear in red / orange.",
        astuce: "Use the « XLSX » button to export the inventory to Excel, e.g. to prepare a supplier order.",
      },
      {
        titre: 'Add a medicine to the catalog',
        texte: "Each catalog product is described precisely so it can be prescribed and dispensed unambiguously.",
        etapes: [
          'Click « + New medicine ».',
          'Enter the brand name, INN, form and dosage.',
          'Choose the therapeutic category.',
          'Enter the sale price, current stock and minimum stock.',
          'Enable « Prescription required » for prescription products.',
          'Save.',
        ],
        astuce: "Always fill in the INN (generic name): it lets you find a product even if the brand changes.",
      },
      {
        titre: 'Record a stock intake',
        texte: "On receiving an order, increase the product's stock. The intake movement is tracked (date, quantity, optional lot / expiry).",
        astuce: "Record the lot number and expiry date: it is essential if the manufacturer recalls a batch.",
      },
      {
        titre: 'Dispense against a prescription',
        texte: "Dispensing decrements stock and links the outflow to the patient and prescription. For a « Prescription required » product, dispensing without a prescription is blocked.",
        etapes: [
          'Search for the patient and their prescription.',
          'Select the products and quantities dispensed.',
          'Confirm the dispensing: stock updates automatically.',
        ],
        astuce: "Check the expiry date when dispensing: never dispense an expired product even if stock still shows it.",
      },
      {
        titre: 'Monitor stock alerts',
        texte: "As soon as a product falls below its minimum threshold, an alert appears on the dashboard and the Pharmacy page. This triggers reordering.",
        astuce: "Tune the minimum threshold to turnover: a high-use product deserves a higher threshold to avoid stockouts.",
      },
      {
        titre: 'Manage expiries',
        texte: "Track expiry dates to apply the « first expired, first out » (FEFO) rule and limit waste.",
        astuce: "Regularly check products near expiry and dispense them first.",
      },
      {
        titre: 'Bill dispensed products',
        texte: "Dispensed products generate billing lines sent to the Cashier, applying the patient's insurance rate.",
        astuce: "Check the up-to-date sale price in the catalog: a supplier increase not passed on reduces the pharmacy's margin.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  7. FACTURATION & CAISSE
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'facturation', icon: <Receipt size={ICON} />, color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD',
    fr: { titre: 'Facturation & Caisse', desc: 'Facturation des actes et encaissements' },
    en: { titre: 'Billing & Cashier', desc: 'Act billing and collections' },
    fr_content: [
      {
        titre: 'Créer une facture',
        texte: "Une facture regroupe les prestations d'un patient : consultation, médicaments, analyses, imagerie, hospitalisation. Le total et la répartition assurance / patient se calculent en temps réel.",
        etapes: [
          'Menu › Facturation › « Nouvelle facture ».',
          'Sélectionnez le patient (son taux d\'assurance est repris automatiquement).',
          'Ajoutez les lignes : type de prestation, libellé, quantité, prix unitaire.',
          'Vérifiez le total, la part assurance et le reste à charge patient.',
          'Enregistrez la facture.',
        ],
        astuce: "De nombreux actes (consultation, dispensation, analyses) génèrent automatiquement leur ligne de facture : vérifiez avant d'ajouter manuellement pour éviter les doublons.",
      },
      {
        titre: 'Enregistrer un paiement',
        texte: "Le paiement solde tout ou partie d'une facture. Les modes acceptés couvrent les usages en Côte d'Ivoire : espèces, mobile money, carte, virement et prise en charge assurance.",
        etapes: [
          'Ouvrez la facture concernée.',
          'Cliquez sur « Enregistrer un paiement ».',
          'Choisissez le mode (espèces, mobile money, carte, assurance, virement).',
          'Saisissez le montant (un paiement partiel est autorisé).',
          'Validez : le solde restant est recalculé.',
        ],
        astuce: "Pour un règlement en plusieurs fois, enregistrez chaque versement : l'historique des paiements reste consultable sur la facture.",
      },
      {
        titre: 'Gérer la part assurance',
        texte: "Quand le patient est assuré, la facture sépare la part prise en charge par l'assureur et le reste à charge. La part assurance fait l'objet d'un suivi de recouvrement auprès de l'assureur.",
        astuce: "Regroupez périodiquement les parts assurance par assureur pour préparer les bordereaux de remboursement.",
      },
      {
        titre: 'Éditer la facture en PDF',
        texte: "Chaque facture s'exporte en PDF avec l'en-tête de l'établissement, le détail des lignes, les totaux et le mode de règlement.",
        astuce: "La facture PDF peut porter un QR code de vérification permettant d'en contrôler l'authenticité.",
      },
      {
        titre: 'Suivre la caisse du jour',
        texte: "La page Caisse récapitule les encaissements de la journée avec le total par mode de paiement (espèces, mobile money, carte…). C'est la base du contrôle de caisse.",
        astuce: "En fin de service, comparez le total « espèces » du système avec le comptage physique du tiroir-caisse : tout écart doit être justifié.",
      },
      {
        titre: 'Clôturer la caisse',
        texte: "La clôture arrête la période comptable de la caisse, fige les totaux et prépare le versement en banque.",
        astuce: "Effectuez la clôture chaque jour à heure fixe : cela facilite le rapprochement bancaire et le contrôle interne.",
      },
      {
        titre: 'Gérer avoirs et annulations',
        texte: "Une facture erronée ne se supprime pas : on émet un avoir ou une annulation tracée, pour préserver la piste d'audit comptable.",
        astuce: "Renseignez toujours le motif de l'annulation : il est exigé lors des contrôles et audits.",
      },
      {
        titre: 'Relancer les impayés',
        texte: "Les factures partiellement réglées ou impayées peuvent être suivies pour relance. Le module de relances aide à réduire les créances.",
        astuce: "Priorisez les relances par ancienneté : une créance récente se recouvre plus facilement qu'une créance ancienne.",
      },
    ],
    en_content: [
      {
        titre: 'Create an invoice',
        texte: "An invoice groups a patient's services: consultation, medicines, tests, imaging, hospitalisation. The total and the insurer / patient split compute in real time.",
        etapes: [
          'Menu › Billing › « New invoice ».',
          'Select the patient (their insurance rate is applied automatically).',
          'Add lines: service type, label, quantity, unit price.',
          'Check the total, insurer share and patient out-of-pocket.',
          'Save the invoice.',
        ],
        astuce: "Many acts (consultation, dispensing, tests) auto-generate their invoice line: check before adding manually to avoid duplicates.",
      },
      {
        titre: 'Record a payment',
        texte: "A payment settles all or part of an invoice. Accepted methods cover Côte d'Ivoire usage: cash, mobile money, card, transfer and insurance coverage.",
        etapes: [
          'Open the relevant invoice.',
          'Click « Record a payment ».',
          'Choose the method (cash, mobile money, card, insurance, transfer).',
          'Enter the amount (partial payment is allowed).',
          'Confirm: the remaining balance is recomputed.',
        ],
        astuce: "For instalments, record each payment: the payment history stays visible on the invoice.",
      },
      {
        titre: 'Manage the insurer share',
        texte: "When the patient is insured, the invoice separates the insurer-covered share from the out-of-pocket. The insurer share is tracked for collection from the insurer.",
        astuce: "Periodically group insurer shares by insurer to prepare reimbursement statements.",
      },
      {
        titre: 'Export the invoice to PDF',
        texte: "Each invoice exports to PDF with the facility header, line details, totals and payment method.",
        astuce: "The PDF invoice can carry a verification QR code to check its authenticity.",
      },
      {
        titre: 'Track the day\'s till',
        texte: "The Cashier page summarises the day's collections with totals per payment method (cash, mobile money, card…). It is the basis for cash control.",
        astuce: "At end of shift, compare the system's « cash » total with the physical drawer count: any gap must be explained.",
      },
      {
        titre: 'Close the till',
        texte: "Closing ends the till's accounting period, freezes totals and prepares the bank deposit.",
        astuce: "Close daily at a fixed time: it eases bank reconciliation and internal control.",
      },
      {
        titre: 'Handle credit notes and cancellations',
        texte: "A wrong invoice is not deleted: a tracked credit note or cancellation is issued to preserve the accounting audit trail.",
        astuce: "Always record the cancellation reason: it is required during controls and audits.",
      },
      {
        titre: 'Chase unpaid invoices',
        texte: "Partially paid or unpaid invoices can be tracked for follow-up. The reminders module helps reduce receivables.",
        astuce: "Prioritise reminders by age: a recent receivable is easier to recover than an old one.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  8. HOSPITALISATION
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'hospit', icon: <Bed size={ICON} />, color: '#0369A1', bg: '#E0F2FE', border: '#7DD3FC',
    fr: { titre: 'Hospitalisation', desc: 'Gestion des séjours et lits' },
    en: { titre: 'Hospitalization', desc: 'Stay and bed management' },
    fr_content: [
      {
        titre: 'Visualiser l\'état des lits',
        texte: "La page Hospitalisation affiche en temps réel l'état de chaque lit : disponible (vert), occupé (bleu), en nettoyage (orange), hors service (rouge). Le taux d'occupation global est affiché en haut de page.",
        astuce: "Le taux d'occupation est un indicateur clé de pilotage : au-delà d'un certain seuil, anticipez les sorties pour libérer des lits.",
      },
      {
        titre: 'Admettre un patient',
        texte: "L'admission ouvre un séjour et affecte un lit au patient. Elle relie le séjour au service, au médecin référent et au motif d'hospitalisation.",
        etapes: [
          'Menu › Hospitalisation › « Nouvelle admission ».',
          'Sélectionnez le patient.',
          'Choisissez le service, le lit disponible et le médecin référent.',
          'Renseignez le motif d\'admission et la date d\'entrée.',
          'Validez : le lit passe au statut « Occupé ».',
        ],
        astuce: "Vérifiez que le lit choisi correspond au bon service et au bon sexe si l'organisation l'exige avant de valider.",
      },
      {
        titre: 'Rédiger les notes médicales',
        texte: "Depuis le détail du séjour, l'onglet Notes médicales permet de consigner l'évolution clinique avec les constantes vitales. Chaque note est horodatée et attribuée à son auteur.",
        astuce: "Rédigez au moins une note par tour de visite : la traçabilité des observations est essentielle en cas de transfert ou de litige.",
      },
      {
        titre: 'Gérer prescriptions et soins infirmiers',
        texte: "Les onglets Prescriptions et Soins infirmiers du séjour organisent le plan de traitement et son exécution (administration des médicaments, soins, surveillance).",
        astuce: "Faites valider l'administration de chaque médicament : cela sécurise le circuit du médicament pendant le séjour.",
      },
      {
        titre: 'Suivre les constantes du séjour',
        texte: "Les constantes vitales relevées au cours du séjour s'historisent et permettent de suivre l'évolution du patient (tension, température, fréquence cardiaque, SpO₂).",
        astuce: "Une dégradation rapide des constantes doit alerter l'équipe : consignez-la immédiatement pour déclencher la réévaluation médicale.",
      },
      {
        titre: 'Transférer ou changer de lit',
        texte: "Un patient peut être transféré vers un autre lit ou un autre service selon l'évolution de son état. Le mouvement est tracé et l'ancien lit libéré.",
        astuce: "Après un transfert, l'ancien lit passe en « Nettoyage » : il redevient disponible une fois le nettoyage validé.",
      },
      {
        titre: 'Organiser la sortie du patient',
        texte: "La sortie clôture le séjour, libère le lit et permet d'éditer les documents de sortie (compte rendu d'hospitalisation, ordonnance de sortie).",
        etapes: [
          'Ouvrez le séjour concerné.',
          'Cliquez sur « Sortie » et renseignez la date et le motif (guérison, transfert, sortie contre avis…).',
          'Éditez le compte rendu de sortie et l\'ordonnance si nécessaire.',
          'Validez : le lit passe en « Nettoyage » puis « Disponible ».',
        ],
      },
      {
        titre: 'Facturer le séjour',
        texte: "Le séjour agrège les prestations (journées d'hospitalisation, actes, médicaments, analyses) qui alimentent la facture globale du patient.",
        astuce: "Contrôlez que toutes les prestations du séjour sont bien facturées avant la sortie : une prestation oubliée est difficile à récupérer après le départ du patient.",
      },
    ],
    en_content: [
      {
        titre: 'View bed status',
        texte: "The Hospitalization page shows each bed's status in real time: available (green), occupied (blue), being cleaned (orange), out of service (red). The overall occupancy rate is shown at the top.",
        astuce: "Occupancy rate is a key steering indicator: beyond a certain threshold, anticipate discharges to free beds.",
      },
      {
        titre: 'Admit a patient',
        texte: "Admission opens a stay and assigns a bed to the patient. It links the stay to the ward, the attending doctor and the reason for admission.",
        etapes: [
          'Menu › Hospitalization › « New admission ».',
          'Select the patient.',
          'Choose the ward, an available bed and the attending doctor.',
          'Enter the admission reason and entry date.',
          'Confirm: the bed becomes « Occupied ».',
        ],
        astuce: "Check the chosen bed matches the right ward and gender if your organisation requires it, before confirming.",
      },
      {
        titre: 'Write medical notes',
        texte: "From the stay detail, the Medical notes tab records clinical progress with vital signs. Each note is timestamped and attributed to its author.",
        astuce: "Write at least one note per ward round: traceability of observations is essential in case of transfer or dispute.",
      },
      {
        titre: 'Manage prescriptions and nursing care',
        texte: "The stay's Prescriptions and Nursing care tabs organise the treatment plan and its execution (drug administration, care, monitoring).",
        astuce: "Have each drug administration validated: it secures the medication circuit during the stay.",
      },
      {
        titre: 'Track vital signs during the stay',
        texte: "Vital signs taken during the stay are stored and let you follow the patient's evolution (blood pressure, temperature, heart rate, SpO₂).",
        astuce: "A rapid deterioration of vitals must alert the team: record it immediately to trigger medical reassessment.",
      },
      {
        titre: 'Transfer or change bed',
        texte: "A patient can be moved to another bed or ward as their condition evolves. The movement is tracked and the old bed freed.",
        astuce: "After a transfer, the old bed goes to « Cleaning »: it becomes available again once cleaning is validated.",
      },
      {
        titre: 'Organise patient discharge',
        texte: "Discharge closes the stay, frees the bed and lets you produce discharge documents (hospitalisation report, discharge prescription).",
        etapes: [
          'Open the relevant stay.',
          'Click « Discharge » and enter the date and reason (recovery, transfer, discharge against advice…).',
          'Produce the discharge report and prescription if needed.',
          'Confirm: the bed moves to « Cleaning » then « Available ».',
        ],
      },
      {
        titre: 'Bill the stay',
        texte: "The stay aggregates services (hospital days, acts, medicines, tests) that feed the patient's overall invoice.",
        astuce: "Check all stay services are billed before discharge: a forgotten service is hard to recover after the patient leaves.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  9. URGENCES  (NOUVEAU)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'urgences', icon: <Siren size={ICON} />, color: '#B91C1C', bg: '#FEE2E2', border: '#FCA5A5',
    fr: { titre: 'Urgences', desc: 'Accueil et prise en charge des urgences' },
    en: { titre: 'Emergency', desc: 'Emergency intake and management' },
    fr_content: [
      {
        titre: 'Enregistrer une arrivée aux urgences',
        texte: "L'admission aux urgences doit être rapide. Un patient inconnu peut être enregistré en mode allégé, puis complété une fois stabilisé.",
        etapes: [
          'Menu › Urgences › « Nouvelle arrivée ».',
          'Recherchez le patient ; s\'il est inconnu, créez une fiche minimale (nom, sexe, âge estimé).',
          'Renseignez le mode d\'arrivée (ambulance, moyen personnel, transfert) et l\'heure d\'arrivée.',
          'Validez : le patient entre dans la file des urgences.',
        ],
        astuce: "Pour un patient inconscient et non identifié, utilisez une identité provisoire (« Inconnu + horodatage ») puis régularisez dès que possible.",
      },
      {
        titre: 'Effectuer le tri (triage)',
        texte: "Le tri attribue un niveau de gravité qui détermine l'ordre de prise en charge, indépendamment de l'ordre d'arrivée.",
        etapes: [
          'Relevez les constantes vitales à l\'accueil.',
          'Attribuez un niveau de tri (ex. rouge = vital, orange = urgent, vert = non urgent).',
          'Validez : la file de soins se réorganise par priorité.',
        ],
        astuce: "Le niveau de tri prime sur l'heure d'arrivée : un « rouge » arrivé après un « vert » passe avant lui.",
      },
      {
        titre: 'Suivre la file d\'attente',
        texte: "Le tableau des urgences affiche les patients en cours, triés par gravité et durée d'attente. Chaque patient montre son niveau de tri et son statut (en attente, en soins, en observation).",
        astuce: "Surveillez les temps d'attente des patients « orange » : leur état peut se dégrader et justifier une réévaluation du tri.",
      },
      {
        titre: 'Prendre en charge et tracer les soins',
        texte: "La prise en charge aux urgences enchaîne examen, gestes, prescriptions et surveillance, tracés dans le dossier du passage.",
        astuce: "Consignez l'heure de chaque geste : la chronologie est déterminante dans l'évaluation d'une urgence.",
      },
      {
        titre: 'Orienter le patient',
        texte: "À l'issue de la prise en charge, le patient est orienté : retour à domicile, hospitalisation (admission), transfert vers un autre établissement ou passage au bloc.",
        astuce: "En cas d'hospitalisation, l'admission reprend les données du passage aux urgences sans ressaisie complète.",
      },
      {
        titre: 'Gérer les constantes et la surveillance',
        texte: "Les constantes relevées aux urgences s'historisent comme en hospitalisation, permettant de suivre l'évolution pendant l'observation.",
        astuce: "Répétez la mesure des constantes selon le niveau de gravité : plus la situation est critique, plus la surveillance est rapprochée.",
      },
    ],
    en_content: [
      {
        titre: 'Register an emergency arrival',
        texte: "Emergency admission must be fast. An unknown patient can be registered in a lightweight mode, then completed once stabilised.",
        etapes: [
          'Menu › Emergency › « New arrival ».',
          'Search for the patient; if unknown, create a minimal record (name, gender, estimated age).',
          'Enter the arrival mode (ambulance, own means, transfer) and arrival time.',
          'Confirm: the patient enters the emergency queue.',
        ],
        astuce: "For an unconscious, unidentified patient, use a temporary identity (« Unknown + timestamp ») then regularise as soon as possible.",
      },
      {
        titre: 'Perform triage',
        texte: "Triage assigns a severity level that determines the order of care, independently of arrival order.",
        etapes: [
          'Take vital signs at intake.',
          'Assign a triage level (e.g. red = life-threatening, orange = urgent, green = non-urgent).',
          'Confirm: the care queue reorders by priority.',
        ],
        astuce: "Triage level overrides arrival time: a « red » arriving after a « green » is seen first.",
      },
      {
        titre: 'Track the queue',
        texte: "The emergency board shows current patients, sorted by severity and waiting time. Each patient shows their triage level and status (waiting, in care, under observation).",
        astuce: "Watch the waiting times of « orange » patients: their condition may deteriorate and warrant re-triage.",
      },
      {
        titre: 'Deliver and trace care',
        texte: "Emergency care chains exam, procedures, prescriptions and monitoring, all traced in the visit record.",
        astuce: "Record the time of each procedure: chronology is decisive in evaluating an emergency.",
      },
      {
        titre: 'Route the patient',
        texte: "After care, the patient is routed: discharge home, admission, transfer to another facility, or to the operating theatre.",
        astuce: "In case of admission, the admission reuses the emergency visit data without full re-entry.",
      },
      {
        titre: 'Manage vitals and monitoring',
        texte: "Vitals taken in the ED are stored as in hospitalisation, letting you follow evolution during observation.",
        astuce: "Repeat vitals according to severity: the more critical the situation, the closer the monitoring.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  10. BLOC OPÉRATOIRE  (NOUVEAU)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'bloc', icon: <Scissors size={ICON} />, color: '#9333EA', bg: '#F3E8FF', border: '#D8B4FE',
    fr: { titre: 'Bloc opératoire', desc: 'Programmation et suivi des interventions' },
    en: { titre: 'Operating Theatre', desc: 'Surgery scheduling and tracking' },
    fr_content: [
      {
        titre: 'Programmer une intervention',
        texte: "La programmation réserve une salle, un créneau et l'équipe (chirurgien, anesthésiste, personnel). Elle relie l'intervention au patient et à son indication.",
        etapes: [
          'Menu › Bloc opératoire › « Nouvelle programmation ».',
          'Sélectionnez le patient et l\'intervention prévue.',
          'Choisissez la salle, la date, l\'heure et la durée estimée.',
          'Affectez le chirurgien, l\'anesthésiste et l\'équipe.',
          'Validez : l\'intervention apparaît au planning du bloc.',
        ],
        astuce: "Prévoyez une marge entre deux interventions dans la même salle pour le nettoyage et la préparation.",
      },
      {
        titre: 'Vérifier la check-list de sécurité',
        texte: "Avant l'incision, une check-list de sécurité (identité du patient, site opératoire, consentement, matériel, allergies) doit être renseignée. C'est une étape de sécurité incontournable.",
        astuce: "Ne validez jamais la check-list « par avance » : elle se remplit au moment réel des vérifications, en équipe.",
      },
      {
        titre: 'Suivre le déroulé de l\'intervention',
        texte: "Le suivi trace les horaires clés : entrée en salle, induction anesthésique, incision, fermeture, sortie de salle. Ces temps alimentent les statistiques du bloc.",
        astuce: "Des temps précis permettent d'analyser l'occupation des salles et d'optimiser le programme opératoire.",
      },
      {
        titre: 'Rédiger le compte rendu opératoire',
        texte: "Le compte rendu opératoire (CRO) décrit le geste réalisé, les constatations et les suites immédiates. Il est rattaché au dossier du patient.",
        astuce: "Rédigez le CRO au plus tôt après l'intervention : c'est un document médico-légal de référence.",
      },
      {
        titre: 'Gérer la salle de réveil (SSPI)',
        texte: "Après l'intervention, le patient passe en salle de surveillance post-interventionnelle. Les constantes y sont surveillées jusqu'à autorisation de sortie.",
        astuce: "La sortie de SSPI doit être validée selon des critères objectifs (constantes, conscience, douleur) et non uniquement au temps écoulé.",
      },
      {
        titre: 'Facturer l\'intervention',
        texte: "L'intervention agrège les actes (chirurgie, anesthésie), le matériel et les consommables utilisés, qui alimentent la facturation du patient.",
        astuce: "Tracez les consommables et implants posés : ils représentent une part importante du coût et doivent être facturés.",
      },
    ],
    en_content: [
      {
        titre: 'Schedule a procedure',
        texte: "Scheduling books a room, a slot and the team (surgeon, anaesthetist, staff). It links the procedure to the patient and its indication.",
        etapes: [
          'Menu › Operating theatre › « New schedule ».',
          'Select the patient and the planned procedure.',
          'Choose the room, date, time and estimated duration.',
          'Assign the surgeon, anaesthetist and team.',
          'Confirm: the procedure appears on the theatre schedule.',
        ],
        astuce: "Allow a margin between two procedures in the same room for cleaning and preparation.",
      },
      {
        titre: 'Check the safety checklist',
        texte: "Before incision, a safety checklist (patient identity, surgical site, consent, equipment, allergies) must be completed. It is an essential safety step.",
        astuce: "Never validate the checklist « in advance »: it is filled at the actual time of the checks, as a team.",
      },
      {
        titre: 'Track the procedure flow',
        texte: "Tracking records key times: room entry, anaesthetic induction, incision, closure, room exit. These times feed theatre statistics.",
        astuce: "Precise times let you analyse room utilisation and optimise the operating schedule.",
      },
      {
        titre: 'Write the operative report',
        texte: "The operative report describes the procedure performed, findings and immediate follow-up. It is attached to the patient record.",
        astuce: "Write the report as soon as possible after the procedure: it is a key medico-legal document.",
      },
      {
        titre: 'Manage the recovery room (PACU)',
        texte: "After the procedure, the patient goes to the post-anaesthesia care unit. Vitals are monitored there until discharge is authorised.",
        astuce: "PACU discharge must be validated on objective criteria (vitals, consciousness, pain), not just elapsed time.",
      },
      {
        titre: 'Bill the procedure',
        texte: "The procedure aggregates acts (surgery, anaesthesia), equipment and consumables used, which feed the patient's billing.",
        astuce: "Track consumables and implants placed: they are a major part of the cost and must be billed.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  11. IMAGERIE MÉDICALE  (NOUVEAU)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'imagerie', icon: <ScanLine size={ICON} />, color: '#0E7490', bg: '#CFFAFE', border: '#67E8F9',
    fr: { titre: 'Imagerie médicale', desc: 'Examens radiologiques et comptes rendus' },
    en: { titre: 'Medical Imaging', desc: 'Radiology exams and reports' },
    fr_content: [
      {
        titre: 'Recevoir une demande d\'imagerie',
        texte: "Les demandes d'imagerie proviennent des consultations, des urgences ou de l'hospitalisation. Elles arrivent avec le patient, l'examen demandé et l'indication clinique.",
        astuce: "Une indication clinique claire conditionne le choix du protocole : relancez le prescripteur si elle est absente ou ambiguë.",
      },
      {
        titre: 'Planifier l\'examen',
        texte: "L'examen est programmé sur la modalité concernée (radiographie, échographie, scanner, IRM) en fonction de la disponibilité de l'équipement et du manipulateur.",
        etapes: [
          'Ouvrez la demande d\'imagerie.',
          'Sélectionnez la modalité et le créneau disponible.',
          'Vérifiez la préparation requise (à jeun, produit de contraste…).',
          'Confirmez le rendez-vous d\'examen.',
        ],
        astuce: "Informez le patient de la préparation à l'avance (ex. à jeun pour une échographie abdominale) pour éviter les examens reportés.",
      },
      {
        titre: 'Réaliser l\'examen',
        texte: "Le manipulateur réalise l'acquisition selon le protocole. Le statut de l'examen passe de « Planifié » à « Réalisé ».",
        astuce: "Contrôlez la qualité des images avant de libérer le patient : une acquisition ratée impose de le rappeler.",
      },
      {
        titre: 'Interpréter et rédiger le compte rendu',
        texte: "Le radiologue interprète les images et rédige un compte rendu structuré (technique, résultats, conclusion). Le compte rendu est rattaché au DME du patient.",
        astuce: "Une conclusion claire et actionnable aide le clinicien : mentionnez explicitement toute urgence ou anomalie critique.",
      },
      {
        titre: 'Publier et transmettre les résultats',
        texte: "Le compte rendu validé devient visible pour le prescripteur et exportable en PDF pour remise au patient.",
        astuce: "Le compte rendu peut porter un QR code de vérification attestant de son authenticité.",
      },
      {
        titre: 'Facturer l\'acte d\'imagerie',
        texte: "L'examen réalisé génère une ligne de facturation selon le tarif de l'acte, avec application de la prise en charge assurance.",
        astuce: "Les examens avec produit de contraste ou reconstruction peuvent avoir un tarif spécifique : vérifiez le bon code d'acte.",
      },
    ],
    en_content: [
      {
        titre: 'Receive an imaging request',
        texte: "Imaging requests come from consultations, emergencies or hospitalisation. They arrive with the patient, the requested exam and the clinical indication.",
        astuce: "A clear clinical indication drives protocol choice: query the prescriber if it is missing or ambiguous.",
      },
      {
        titre: 'Schedule the exam',
        texte: "The exam is scheduled on the relevant modality (X-ray, ultrasound, CT, MRI) based on equipment and technologist availability.",
        etapes: [
          'Open the imaging request.',
          'Select the modality and an available slot.',
          'Check the required preparation (fasting, contrast agent…).',
          'Confirm the exam appointment.',
        ],
        astuce: "Inform the patient of the preparation in advance (e.g. fasting for an abdominal ultrasound) to avoid rescheduled exams.",
      },
      {
        titre: 'Perform the exam',
        texte: "The technologist acquires images per protocol. The exam status moves from « Scheduled » to « Performed ».",
        astuce: "Check image quality before releasing the patient: a failed acquisition means calling them back.",
      },
      {
        titre: 'Interpret and write the report',
        texte: "The radiologist interprets the images and writes a structured report (technique, findings, conclusion). The report is attached to the patient's EMR.",
        astuce: "A clear, actionable conclusion helps the clinician: explicitly flag any emergency or critical abnormality.",
      },
      {
        titre: 'Publish and transmit results',
        texte: "The validated report becomes visible to the prescriber and exportable to PDF to hand to the patient.",
        astuce: "The report can carry a verification QR code attesting to its authenticity.",
      },
      {
        titre: 'Bill the imaging act',
        texte: "The performed exam generates a billing line based on the act tariff, applying insurance coverage.",
        astuce: "Exams with contrast or reconstruction may have a specific tariff: check the correct act code.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  12. COMPTABILITÉ (OHADA / SYSCOHADA)  (NOUVEAU)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'comptabilite', icon: <Calculator size={ICON} />, color: '#1E3A8A', bg: '#DBEAFE', border: '#93C5FD',
    fr: { titre: 'Comptabilité (OHADA)', desc: 'Comptabilité SYSCOHADA et états financiers' },
    en: { titre: 'Accounting (OHADA)', desc: 'SYSCOHADA accounting and financials' },
    fr_content: [
      {
        titre: 'Comprendre le cadre SYSCOHADA',
        texte: "La comptabilité de SANTAREX s'appuie sur le référentiel SYSCOHADA révisé, applicable dans les 17 pays de la zone OHADA. Le plan de comptes est structuré en classes (1 à 9) et la monnaie de tenue est le FCFA.",
        astuce: "Familiarisez-vous avec les classes : 6 = charges, 7 = produits, 4 = tiers (clients / fournisseurs), 5 = trésorerie. C'est la base de toute imputation.",
      },
      {
        titre: 'Consulter le plan comptable',
        texte: "Le plan comptable liste les comptes disponibles pour l'imputation des écritures. Il est conforme au plan SYSCOHADA et peut être adapté aux besoins de l'établissement.",
        astuce: "N'ajoutez de sous-comptes que si nécessaire : un plan trop détaillé complique le lettrage et les états.",
      },
      {
        titre: 'Saisir une écriture comptable',
        texte: "Une écriture respecte le principe de la partie double : le total des débits égale le total des crédits. Chaque écriture est datée, imputée sur des comptes et rattachée à un journal.",
        etapes: [
          'Menu › Comptabilité › « Nouvelle écriture ».',
          'Choisissez le journal (ventes, achats, banque, caisse, opérations diverses).',
          'Saisissez la date et le libellé.',
          'Ajoutez les lignes de débit et de crédit sur les comptes concernés.',
          'Vérifiez l\'équilibre (débit = crédit), puis validez.',
        ],
        astuce: "Le système refuse une écriture déséquilibrée : si la validation est bloquée, vérifiez qu'aucune ligne n'a été oubliée.",
      },
      {
        titre: 'Utiliser les journaux',
        texte: "Les écritures sont regroupées par journal selon leur nature : journal des ventes (facturation patients), des achats (fournisseurs), de banque, de caisse et des opérations diverses.",
        astuce: "La facturation et la caisse peuvent générer automatiquement les écritures de vente et d'encaissement : contrôlez-les plutôt que de tout ressaisir.",
      },
      {
        titre: 'Lettrer et rapprocher',
        texte: "Le lettrage associe une facture à son règlement pour solder les comptes de tiers. Le rapprochement bancaire compare les écritures de banque au relevé.",
        astuce: "Un rapprochement bancaire régulier révèle rapidement les écarts (chèques non débités, frais bancaires oubliés).",
      },
      {
        titre: 'Consulter le grand livre et la balance',
        texte: "Le grand livre détaille les mouvements de chaque compte ; la balance récapitule les soldes de tous les comptes. Ce sont les états de contrôle de base.",
        astuce: "Une balance équilibrée (total débits = total crédits) est le premier contrôle de cohérence avant d'éditer les états financiers.",
      },
      {
        titre: 'Éditer les états financiers',
        texte: "SANTAREX permet d'éditer les états SYSCOHADA : bilan, compte de résultat et, selon le système appliqué, l'état annexé. Ils synthétisent la situation financière de l'établissement.",
        astuce: "Le système normal et le système minimal de trésorerie (SMT) diffèrent selon la taille : vérifiez le système applicable à votre structure.",
      },
      {
        titre: 'Clôturer un exercice',
        texte: "La clôture d'exercice fige les écritures de la période, calcule le résultat et prépare l'ouverture de l'exercice suivant.",
        astuce: "Ne clôturez qu'après tous les contrôles (rapprochements, lettrage, inventaire) : une clôture est difficile à annuler.",
      },
    ],
    en_content: [
      {
        titre: 'Understand the SYSCOHADA framework',
        texte: "SANTAREX accounting is based on the revised SYSCOHADA standard, applicable across the 17 OHADA-zone countries. The chart of accounts is organised in classes (1 to 9) and the reporting currency is FCFA.",
        astuce: "Get familiar with the classes: 6 = expenses, 7 = income, 4 = third parties (customers / suppliers), 5 = cash. It underpins every posting.",
      },
      {
        titre: 'View the chart of accounts',
        texte: "The chart of accounts lists the accounts available for posting entries. It follows the SYSCOHADA plan and can be tailored to the facility's needs.",
        astuce: "Only add sub-accounts when needed: an over-detailed chart complicates matching and statements.",
      },
      {
        titre: 'Post an accounting entry',
        texte: "An entry follows double-entry principle: total debits equal total credits. Each entry is dated, posted to accounts and attached to a journal.",
        etapes: [
          'Menu › Accounting › « New entry ».',
          'Choose the journal (sales, purchases, bank, cash, miscellaneous).',
          'Enter the date and description.',
          'Add debit and credit lines on the relevant accounts.',
          'Check the balance (debit = credit), then validate.',
        ],
        astuce: "The system rejects an unbalanced entry: if validation is blocked, check that no line was forgotten.",
      },
      {
        titre: 'Use journals',
        texte: "Entries are grouped by journal by nature: sales journal (patient billing), purchases (suppliers), bank, cash and miscellaneous operations.",
        astuce: "Billing and the till can auto-generate sales and collection entries: review them rather than re-entering everything.",
      },
      {
        titre: 'Match and reconcile',
        texte: "Matching links an invoice to its payment to clear third-party accounts. Bank reconciliation compares bank entries to the statement.",
        astuce: "Regular bank reconciliation quickly reveals gaps (uncleared cheques, forgotten bank fees).",
      },
      {
        titre: 'View the ledger and trial balance',
        texte: "The general ledger details each account's movements; the trial balance summarises all account balances. These are the basic control statements.",
        astuce: "A balanced trial balance (total debits = total credits) is the first consistency check before producing financial statements.",
      },
      {
        titre: 'Produce financial statements',
        texte: "SANTAREX produces SYSCOHADA statements: balance sheet, income statement and, depending on the system, the notes. They summarise the facility's financial position.",
        astuce: "The normal system and the minimal cash system (SMT) differ by size: check which system applies to your facility.",
      },
      {
        titre: 'Close a financial year',
        texte: "Year-end closing freezes the period's entries, computes the result and prepares the next year's opening.",
        astuce: "Only close after all controls (reconciliations, matching, stock take): a closing is hard to reverse.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  13. RH & PAIE  (NOUVEAU)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'rh', icon: <Users2 size={ICON} />, color: '#B45309', bg: '#FEF3C7', border: '#FCD34D',
    fr: { titre: 'RH & Paie', desc: 'Personnel, congés et bulletins de paie' },
    en: { titre: 'HR & Payroll', desc: 'Staff, leave and payslips' },
    fr_content: [
      {
        titre: 'Créer un dossier employé',
        texte: "Le dossier employé centralise les informations administratives et contractuelles du personnel : identité, poste, service, type de contrat, salaire de base et coordonnées.",
        etapes: [
          'Menu › RH › « Nouvel employé ».',
          'Renseignez l\'identité, le poste et le service d\'affectation.',
          'Précisez le type de contrat (CDI, CDD, stage) et la date d\'embauche.',
          'Saisissez le salaire de base et les éléments de rémunération.',
          'Enregistrez le dossier.',
        ],
        astuce: "Rattachez l'employé au bon service : cela conditionne les statistiques d'effectif et la répartition des charges de personnel.",
      },
      {
        titre: 'Gérer les congés et absences',
        texte: "Le module suit les demandes de congés, leur validation et le solde de congés de chaque employé, ainsi que les absences (maladie, permission).",
        etapes: [
          'Ouvrez le dossier de l\'employé ou le module Congés.',
          'Saisissez la demande (type, dates de début et de fin).',
          'Le responsable valide ou refuse la demande.',
          'Le solde de congés est mis à jour automatiquement.',
        ],
        astuce: "Vérifiez le solde disponible avant de valider un congé : un solde négatif doit faire l'objet d'un accord explicite.",
      },
      {
        titre: 'Suivre les présences',
        texte: "Le suivi des présences alimente la paie (heures travaillées, absences, heures supplémentaires) et le pilotage des effectifs.",
        astuce: "Un suivi rigoureux des présences évite les litiges de paie en fin de mois.",
      },
      {
        titre: 'Préparer la paie',
        texte: "La préparation de la paie agrège le salaire de base, les primes, les heures supplémentaires, puis calcule les cotisations sociales et les retenues pour produire le net à payer.",
        astuce: "Vérifiez les éléments variables (primes, absences) avant de lancer le calcul : ils changent chaque mois.",
      },
      {
        titre: 'Éditer les bulletins de paie',
        texte: "Chaque employé reçoit un bulletin détaillant la rémunération brute, les cotisations, les retenues et le net à payer. Le bulletin est exportable en PDF.",
        astuce: "Conservez l'historique des bulletins : ils sont exigés lors des contrôles sociaux et pour les démarches administratives des employés.",
      },
      {
        titre: 'Suivre la masse salariale',
        texte: "Le module fournit une vue de la masse salariale et de sa répartition par service, utile pour le pilotage budgétaire.",
        astuce: "Comparez la masse salariale d'un mois à l'autre pour détecter les variations anormales (oubli, double paiement).",
      },
    ],
    en_content: [
      {
        titre: 'Create an employee file',
        texte: "The employee file centralises staff administrative and contractual information: identity, position, department, contract type, base salary and contact details.",
        etapes: [
          'Menu › HR › « New employee ».',
          'Enter the identity, position and assigned department.',
          'Specify the contract type (permanent, fixed-term, internship) and hire date.',
          'Enter the base salary and pay components.',
          'Save the file.',
        ],
        astuce: "Attach the employee to the right department: it drives headcount statistics and payroll cost allocation.",
      },
      {
        titre: 'Manage leave and absences',
        texte: "The module tracks leave requests, their approval and each employee's leave balance, as well as absences (sick, permission).",
        etapes: [
          'Open the employee file or the Leave module.',
          'Enter the request (type, start and end dates).',
          'The manager approves or rejects the request.',
          'The leave balance updates automatically.',
        ],
        astuce: "Check the available balance before approving leave: a negative balance requires explicit agreement.",
      },
      {
        titre: 'Track attendance',
        texte: "Attendance tracking feeds payroll (hours worked, absences, overtime) and headcount management.",
        astuce: "Rigorous attendance tracking prevents payroll disputes at month-end.",
      },
      {
        titre: 'Prepare payroll',
        texte: "Payroll preparation aggregates base salary, bonuses and overtime, then computes social contributions and deductions to produce net pay.",
        astuce: "Check variable items (bonuses, absences) before running the calculation: they change every month.",
      },
      {
        titre: 'Produce payslips',
        texte: "Each employee receives a payslip detailing gross pay, contributions, deductions and net pay. The payslip is exportable to PDF.",
        astuce: "Keep the payslip history: it is required during labour audits and for employees' administrative procedures.",
      },
      {
        titre: 'Track the payroll cost',
        texte: "The module provides a view of the payroll cost and its breakdown by department, useful for budget steering.",
        astuce: "Compare the payroll cost month over month to spot anomalies (omission, double payment).",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  14. REPORTING & STATISTIQUES  (NOUVEAU)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'reporting', icon: <BarChart3 size={ICON} />, color: '#0F766E', bg: '#CCFBF1', border: '#5EEAD4',
    fr: { titre: 'Reporting & Statistiques', desc: 'Tableaux de bord et indicateurs' },
    en: { titre: 'Reporting & Statistics', desc: 'Dashboards and indicators' },
    fr_content: [
      {
        titre: 'Explorer les tableaux de bord',
        texte: "Le module Reporting agrège les données de tous les autres modules en indicateurs de pilotage : activité médicale, occupation des lits, recettes, consommations et effectifs.",
        astuce: "Les tableaux de bord sont un outil de décision : consultez-les régulièrement pour piloter l'activité, pas seulement en fin de mois.",
      },
      {
        titre: 'Choisir la période d\'analyse',
        texte: "La plupart des indicateurs se calculent sur une période paramétrable (jour, semaine, mois, trimestre, année) que vous sélectionnez en haut du tableau de bord.",
        astuce: "Comparez deux périodes équivalentes (ex. ce mois vs le même mois l'an dernier) pour neutraliser la saisonnalité.",
      },
      {
        titre: 'Suivre les indicateurs d\'activité',
        texte: "Les indicateurs d'activité couvrent le nombre de consultations, d'admissions, d'actes de laboratoire et d'imagerie, ainsi que le taux d'occupation des lits.",
        astuce: "Un pic d'activité inhabituel peut révéler un phénomène épidémique : croisez-le avec les diagnostics CIM-10 les plus fréquents.",
      },
      {
        titre: 'Analyser les indicateurs financiers',
        texte: "Le reporting financier synthétise le chiffre d'affaires, la répartition par mode de paiement, la part assurance et les créances en cours.",
        astuce: "Surveillez l'évolution des créances : une hausse continue signale un problème de recouvrement à traiter avec la caisse et la comptabilité.",
      },
      {
        titre: 'Produire des statistiques épidémiologiques',
        texte: "Les diagnostics codés en CIM-10 permettent de produire des statistiques de morbidité, utiles pour les déclarations sanitaires et la veille épidémiologique.",
        astuce: "La qualité de ces statistiques dépend directement de la rigueur du codage lors des consultations.",
      },
      {
        titre: 'Exporter les rapports',
        texte: "Les tableaux et statistiques peuvent être exportés (PDF, XLSX) pour diffusion à la direction, aux tutelles ou aux partenaires.",
        astuce: "Utilisez l'export XLSX pour retravailler les données dans un tableur, et le PDF pour une diffusion figée et présentable.",
      },
    ],
    en_content: [
      {
        titre: 'Explore the dashboards',
        texte: "The Reporting module aggregates data from all other modules into steering indicators: medical activity, bed occupancy, revenue, consumption and staffing.",
        astuce: "Dashboards are a decision tool: check them regularly to steer activity, not only at month-end.",
      },
      {
        titre: 'Choose the analysis period',
        texte: "Most indicators are computed over a configurable period (day, week, month, quarter, year) that you select at the top of the dashboard.",
        astuce: "Compare two equivalent periods (e.g. this month vs the same month last year) to neutralise seasonality.",
      },
      {
        titre: 'Track activity indicators',
        texte: "Activity indicators cover the number of consultations, admissions, lab and imaging acts, and the bed occupancy rate.",
        astuce: "An unusual activity spike may reveal an epidemic: cross it with the most frequent ICD-10 diagnoses.",
      },
      {
        titre: 'Analyse financial indicators',
        texte: "Financial reporting summarises turnover, breakdown by payment method, insurer share and outstanding receivables.",
        astuce: "Watch receivables trends: a continuous rise signals a collection issue to address with the till and accounting.",
      },
      {
        titre: 'Produce epidemiological statistics',
        texte: "ICD-10 coded diagnoses allow morbidity statistics, useful for health declarations and epidemiological surveillance.",
        astuce: "The quality of these statistics depends directly on coding rigour during consultations.",
      },
      {
        titre: 'Export reports',
        texte: "Tables and statistics can be exported (PDF, XLSX) for distribution to management, authorities or partners.",
        astuce: "Use XLSX export to rework data in a spreadsheet, and PDF for a fixed, presentable distribution.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  15. SUPPORT & ACADÉMIE  (NOUVEAU)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'support', icon: <LifeBuoy size={ICON} />, color: '#4338CA', bg: '#E0E7FF', border: '#A5B4FC',
    fr: { titre: 'Support & Académie', desc: 'Assistance, FAQ, SARA et quiz' },
    en: { titre: 'Support & Academy', desc: 'Assistance, FAQ, SARA and quizzes' },
    fr_content: [
      {
        titre: 'Ouvrir un ticket d\'assistance',
        texte: "Le support intégré permet de signaler un problème ou de poser une question à l'équipe SANTAREX sans quitter l'application.",
        etapes: [
          'Menu › Support › « Nouveau ticket ».',
          'Choisissez la catégorie (bug, question, demande d\'évolution).',
          'Décrivez le problème le plus précisément possible (écran, message d\'erreur, étapes pour reproduire).',
          'Joignez une capture d\'écran si utile, puis envoyez.',
        ],
        astuce: "Plus votre description est précise (module, heure, message exact), plus la résolution est rapide.",
      },
      {
        titre: 'Suivre vos tickets',
        texte: "Chaque ticket a un statut (ouvert, en cours, résolu) et un fil d'échange avec le support. Vous êtes notifié à chaque réponse.",
        astuce: "Répondez dans le fil du ticket plutôt que d'en ouvrir un nouveau : cela conserve tout le contexte au même endroit.",
      },
      {
        titre: 'Consulter la FAQ',
        texte: "La FAQ regroupe les réponses aux questions les plus fréquentes, classées par thème. C'est souvent le moyen le plus rapide de se débloquer.",
        astuce: "Avant d'ouvrir un ticket, cherchez dans la FAQ : votre question y a peut-être déjà une réponse immédiate.",
      },
      {
        titre: 'Dialoguer avec l\'assistant SARA',
        texte: "SARA est l'assistant intelligent de SANTAREX. Posez-lui vos questions en langage naturel sur l'utilisation de l'ERP ; il vous guide vers la bonne fonctionnalité.",
        astuce: "Formulez une question précise (« comment enregistrer un paiement mobile money ? ») plutôt que vague pour obtenir une réponse actionnable.",
      },
      {
        titre: 'Se former avec l\'Académie',
        texte: "L'Académie propose des contenus de formation par module pour monter en compétence sur SANTAREX, à votre rythme.",
        astuce: "Faites suivre les parcours de l'Académie aux nouveaux arrivants : c'est un gain de temps par rapport à une formation improvisée.",
      },
      {
        titre: 'Valider ses acquis par quiz',
        texte: "Des quiz permettent de vérifier la maîtrise d'un module. Ils identifient les points à revoir et attestent la montée en compétence.",
        astuce: "Refaites un quiz après avoir revu un module : la progression du score confirme que les notions sont acquises.",
      },
    ],
    en_content: [
      {
        titre: 'Open a support ticket',
        texte: "Built-in support lets you report a problem or ask the SANTAREX team a question without leaving the app.",
        etapes: [
          'Menu › Support › « New ticket ».',
          'Choose the category (bug, question, feature request).',
          'Describe the problem as precisely as possible (screen, error message, steps to reproduce).',
          'Attach a screenshot if useful, then send.',
        ],
        astuce: "The more precise your description (module, time, exact message), the faster the resolution.",
      },
      {
        titre: 'Track your tickets',
        texte: "Each ticket has a status (open, in progress, resolved) and a conversation thread with support. You are notified on each reply.",
        astuce: "Reply within the ticket thread rather than opening a new one: it keeps all the context in one place.",
      },
      {
        titre: 'Browse the FAQ',
        texte: "The FAQ gathers answers to the most frequent questions, organised by topic. It is often the quickest way to unblock yourself.",
        astuce: "Before opening a ticket, search the FAQ: your question may already have an instant answer.",
      },
      {
        titre: 'Chat with the SARA assistant',
        texte: "SARA is SANTAREX's intelligent assistant. Ask questions in natural language about using the ERP; it guides you to the right feature.",
        astuce: "Ask a precise question (« how do I record a mobile money payment? ») rather than a vague one to get an actionable answer.",
      },
      {
        titre: 'Learn with the Academy',
        texte: "The Academy offers training content per module to build up your SANTAREX skills at your own pace.",
        astuce: "Have new joiners follow the Academy paths: it saves time compared with improvised training.",
      },
      {
        titre: 'Validate knowledge with quizzes',
        texte: "Quizzes let you check mastery of a module. They pinpoint areas to review and attest to skill progression.",
        astuce: "Retake a quiz after reviewing a module: an improving score confirms the concepts are acquired.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  16. ABONNEMENT & LICENCE  (NOUVEAU)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'abonnement', icon: <CreditCard size={ICON} />, color: '#7C2D12', bg: '#FFEDD5', border: '#FDBA74',
    fr: { titre: 'Abonnement & Licence', desc: 'Formule, licence et facturation SaaS' },
    en: { titre: 'Subscription & License', desc: 'Plan, license and SaaS billing' },
    fr_content: [
      {
        titre: 'Consulter votre abonnement',
        texte: "L'espace Abonnement affiche votre formule active, les modules inclus, le nombre d'utilisateurs autorisés et la date d'échéance de la licence.",
        astuce: "Vérifiez régulièrement la date d'échéance : une licence expirée peut restreindre l'accès à certaines fonctions.",
      },
      {
        titre: 'Comprendre les formules',
        texte: "SANTAREX est proposé sous forme d'abonnement (SaaS). Chaque formule détermine les modules disponibles, la limite d'utilisateurs et le niveau de support.",
        astuce: "Choisissez la formule selon vos besoins réels : il est possible de faire évoluer l'abonnement à mesure que l'établissement se développe.",
      },
      {
        titre: 'Suivre l\'état de la licence',
        texte: "L'état de la licence (active, bientôt expirée, expirée) est visible dans l'espace Abonnement. Une alerte apparaît à l'approche de l'échéance.",
        astuce: "Anticipez le renouvellement avant l'échéance pour éviter toute interruption de service en pleine activité.",
      },
      {
        titre: 'Gérer les utilisateurs sous licence',
        texte: "Le nombre d'utilisateurs actifs est plafonné par la formule. Désactivez les comptes des employés partis pour libérer des places.",
        astuce: "Faites le ménage des comptes inactifs avant de commander des utilisateurs supplémentaires : vous éviterez peut-être un surcoût.",
      },
      {
        titre: 'Consulter la facturation de l\'abonnement',
        texte: "Les factures de l'abonnement SANTAREX (distinctes de la facturation patients) sont accessibles dans l'espace Abonnement, avec leur statut de paiement.",
        astuce: "Conservez les justificatifs de paiement de l'abonnement : ils peuvent être demandés en cas de réactivation.",
      },
      {
        titre: 'Renouveler ou faire évoluer',
        texte: "Le renouvellement ou le changement de formule se fait depuis l'espace Abonnement ou en contactant l'équipe commerciale IBIG Softwares.",
        astuce: "Pour toute évolution majeure (nouveaux modules, hausse d'effectif), rapprochez-vous du support commercial afin d'ajuster la formule au plus juste.",
      },
    ],
    en_content: [
      {
        titre: 'View your subscription',
        texte: "The Subscription area shows your active plan, included modules, the number of allowed users and the license expiry date.",
        astuce: "Check the expiry date regularly: an expired license may restrict access to some features.",
      },
      {
        titre: 'Understand the plans',
        texte: "SANTAREX is offered as a subscription (SaaS). Each plan determines the available modules, the user limit and the support level.",
        astuce: "Choose the plan based on real needs: the subscription can grow as the facility develops.",
      },
      {
        titre: 'Track the license status',
        texte: "The license status (active, expiring soon, expired) is visible in the Subscription area. An alert appears as the expiry nears.",
        astuce: "Anticipate renewal before expiry to avoid any service interruption during operations.",
      },
      {
        titre: 'Manage licensed users',
        texte: "The number of active users is capped by the plan. Deactivate accounts of departed employees to free seats.",
        astuce: "Clean up inactive accounts before ordering extra users: you may avoid an added cost.",
      },
      {
        titre: 'View subscription billing',
        texte: "SANTAREX subscription invoices (distinct from patient billing) are available in the Subscription area, with their payment status.",
        astuce: "Keep subscription payment receipts: they may be requested in case of reactivation.",
      },
      {
        titre: 'Renew or upgrade',
        texte: "Renewal or plan change is done from the Subscription area or by contacting the IBIG Softwares sales team.",
        astuce: "For any major change (new modules, headcount increase), reach out to sales support to right-size the plan.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  17. PARAMÈTRES
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'parametres', icon: <Settings size={ICON} />, color: '#374151', bg: '#F3F4F6', border: '#D1D5DB',
    fr: { titre: 'Paramètres', desc: 'Configuration de la clinique' },
    en: { titre: 'Settings', desc: 'Clinic configuration' },
    fr_content: [
      {
        titre: 'Renseigner les informations de l\'établissement',
        texte: "Les informations de l'établissement (nom, ville, pays, téléphone, email, logo) apparaissent sur tous les documents générés : factures, ordonnances, comptes rendus.",
        etapes: [
          'Menu › Paramètres › onglet « Établissement ».',
          'Renseignez le nom de la clinique, la ville, le pays, le téléphone et l\'email.',
          'Ajoutez le logo si disponible.',
          'Enregistrez : les documents reprennent automatiquement ces informations.',
        ],
        astuce: "Vérifiez l'orthographe et les coordonnées : elles figurent sur des documents officiels remis aux patients et partenaires.",
      },
      {
        titre: 'Gérer les utilisateurs et les rôles',
        texte: "L'administrateur crée les comptes des employés, leur attribue un rôle et gère leur activation / désactivation.",
        etapes: [
          'Menu › Paramètres › onglet « Utilisateurs ».',
          'Cliquez sur « Nouvel utilisateur » et renseignez email, nom et rôle.',
          'Le compte est créé ; l\'utilisateur définit son mot de passe à la première connexion.',
          'Désactivez un compte plutôt que de le supprimer lorsqu\'un employé quitte l\'établissement.',
        ],
        astuce: "Attribuez le rôle le plus restreint suffisant pour la fonction : c'est le principe du moindre privilège, essentiel en milieu hospitalier.",
      },
      {
        titre: 'Configurer la sécurité',
        texte: "Renforcez la sécurité en activant la double authentification (2FA) et en réglant le délai d'expiration de session (15 à 480 minutes). Ces réglages s'appliquent à toute la clinique.",
        astuce: "Un délai de session court (ex. 30 min) est recommandé sur les postes partagés pour limiter les accès non autorisés.",
      },
      {
        titre: 'Paramétrer les notifications',
        texte: "Configurez les alertes automatiques : stock faible, nouveaux rendez-vous, résultats de laboratoire, nouvelles factures. Les notifications apparaissent dans la cloche en haut à droite.",
        astuce: "N'activez que les notifications utiles à chaque rôle : trop d'alertes finissent par être ignorées.",
      },
      {
        titre: 'Gérer les catalogues et tarifs',
        texte: "Les catalogues (actes, analyses, médicaments) et leurs tarifs se paramètrent pour alimenter la facturation. Une tarification à jour évite les erreurs de facture.",
        astuce: "Centralisez les mises à jour de tarifs : une modification faite ici se répercute sur toutes les nouvelles factures.",
      },
      {
        titre: 'Consulter le journal d\'audit',
        texte: "Le journal d'audit trace les actions sensibles (création, modification, suppression) avec l'auteur et l'horodatage. C'est un outil de sécurité et de conformité.",
        astuce: "En cas d'anomalie sur un dossier, le journal d'audit permet de reconstituer qui a fait quoi et quand.",
      },
      {
        titre: 'Sauvegarde et confidentialité des données',
        texte: "Les données patients sont confidentielles. SANTAREX assure leur hébergement sécurisé ; les paramètres définissent les accès et la rétention selon les règles de l'établissement.",
        astuce: "La meilleure sauvegarde technique ne remplace pas la vigilance : ne partagez jamais vos identifiants et déconnectez-vous des postes partagés.",
      },
    ],
    en_content: [
      {
        titre: 'Set the establishment information',
        texte: "The establishment information (name, city, country, phone, email, logo) appears on all generated documents: invoices, prescriptions, reports.",
        etapes: [
          'Menu › Settings › « Establishment » tab.',
          'Enter the clinic name, city, country, phone and email.',
          'Add the logo if available.',
          'Save: documents automatically pick up this information.',
        ],
        astuce: "Check spelling and contact details: they appear on official documents given to patients and partners.",
      },
      {
        titre: 'Manage users and roles',
        texte: "The administrator creates employee accounts, assigns them a role and manages their activation / deactivation.",
        etapes: [
          'Menu › Settings › « Users » tab.',
          'Click « New user » and enter email, name and role.',
          'The account is created; the user sets their password on first login.',
          'Deactivate an account rather than delete it when an employee leaves.',
        ],
        astuce: "Assign the most restrictive role sufficient for the job: this is least-privilege, essential in a hospital setting.",
      },
      {
        titre: 'Configure security',
        texte: "Strengthen security by enabling two-factor authentication (2FA) and setting the session timeout (15 to 480 minutes). These settings apply clinic-wide.",
        astuce: "A short session timeout (e.g. 30 min) is recommended on shared workstations to limit unauthorised access.",
      },
      {
        titre: 'Set up notifications',
        texte: "Configure automatic alerts: low stock, new appointments, lab results, new invoices. Notifications appear in the bell icon at the top right.",
        astuce: "Only enable notifications useful to each role: too many alerts end up ignored.",
      },
      {
        titre: 'Manage catalogs and tariffs',
        texte: "Catalogs (acts, tests, medicines) and their tariffs are configured to feed billing. Up-to-date pricing avoids invoice errors.",
        astuce: "Centralise tariff updates: a change made here applies to all new invoices.",
      },
      {
        titre: 'Review the audit log',
        texte: "The audit log tracks sensitive actions (create, edit, delete) with author and timestamp. It is a security and compliance tool.",
        astuce: "In case of an anomaly on a record, the audit log lets you reconstruct who did what and when.",
      },
      {
        titre: 'Data backup and confidentiality',
        texte: "Patient data is confidential. SANTAREX ensures secure hosting; settings define access and retention per the facility's rules.",
        astuce: "The best technical backup does not replace vigilance: never share your credentials and sign out of shared workstations.",
      },
    ],
  },
];
