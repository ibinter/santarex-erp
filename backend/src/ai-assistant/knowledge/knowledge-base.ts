/**
 * Base de connaissances statique de SARA (assistante IA interne SANTAREX).
 *
 * Contenu porté depuis le contenu produit existant du frontend
 * (`(dashboard)/faq` et `(dashboard)/guide`) afin d'alimenter le RAG léger
 * sans dépendance externe ni embeddings. Chaque extrait porte une `source`
 * citable ("FAQ · Patients", "Guide · Facturation", ...) que SARA peut
 * référencer dans ses réponses.
 *
 * Les offres commerciales NE sont PAS ici : elles sont récupérées en direct
 * depuis la table `offres_saas` par le KnowledgeService (contenu dynamique).
 */

export interface KnowledgeEntry {
  /** Source citable affichée dans le contexte injecté. */
  source: string;
  /** Titre court de l'extrait. */
  titre: string;
  /** Corps de l'extrait (utilisé pour le scoring et l'injection). */
  contenu: string;
}

/**
 * Extraits de la FAQ (questions/réponses les plus utiles au support),
 * portés depuis `frontend/src/app/(dashboard)/faq/page.tsx`.
 */
const FAQ_ENTRIES: KnowledgeEntry[] = [
  {
    source: 'FAQ · Compte & Connexion',
    titre: 'Connexion et mot de passe',
    contenu:
      "Pour se connecter, accéder à l'URL de la clinique puis saisir email et mot de passe. " +
      "Un mot de passe oublié est réinitialisé par l'administrateur depuis Utilisateurs → Réinitialiser le mot de passe. " +
      "Le changement de mot de passe se fait dans Mon profil → Sécurité. " +
      "La session expire après un délai d'inactivité (15 à 480 minutes) pour raisons de sécurité. " +
      "La double authentification (2FA) s'active dans Paramètres → Sécurité.",
  },
  {
    source: 'FAQ · Compte & Connexion',
    titre: 'Mobile et multi-comptes',
    contenu:
      "L'ERP est responsive et fonctionne sur smartphone et tablette (Chrome ou Safari récents recommandés). " +
      "Chaque utilisateur a un seul compte par clinique ; un professionnel exerçant dans plusieurs cliniques a un compte distinct par établissement.",
  },
  {
    source: 'FAQ · Patients',
    titre: 'Création et identification patient',
    contenu:
      "Créer un patient : Patients → Nouveau patient, avec au minimum nom, prénom, date de naissance et sexe. " +
      "L'IPP (Identifiant Permanent du Patient) est un numéro unique attribué automatiquement à la création. " +
      "La fusion de doublons est réservée à l'administrateur (fournir les deux IPP). " +
      "Un patient décédé est archivé par changement de statut ; les données sont conservées selon les obligations légales.",
  },
  {
    source: 'FAQ · Patients',
    titre: 'Sécurité, import et export des patients',
    contenu:
      "Les données patients sont chiffrées en base et transmises via HTTPS, avec accès par rôle et traçabilité complète dans le journal d'audit. " +
      "L'import en masse depuis Excel se fait via l'administrateur en respectant le modèle fourni. " +
      "L'export se fait avec le bouton XLSX en haut de la page Patients. " +
      "Le DME (Dossier Médical Électronique) centralise antécédents, consultations, ordonnances, résultats d'analyses et hospitalisations.",
  },
  {
    source: 'FAQ · Consultations',
    titre: 'Droits et modifications des consultations',
    contenu:
      "Les rôles médecin, infirmier et admin peuvent créer une consultation ; le caissier ne peut pas. " +
      "Un médecin ou admin peut modifier une consultation existante (modifications horodatées et tracées). " +
      "Une consultation ne peut pas être supprimée (traçabilité) ; l'administrateur peut en changer le statut. " +
      "Les constantes vitales sont optionnelles mais recommandées et apparaissent dans le DME.",
  },
  {
    source: 'FAQ · Pharmacie',
    titre: 'Stocks et alertes pharmacie',
    contenu:
      "Les médicaments sous le seuil minimum apparaissent en rouge et déclenchent une notification. " +
      "Le seuil se règle dans la fiche médicament. Le dosage distingue les présentations (500mg, 250mg/5mL). " +
      "Une réception de stock s'enregistre via le module d'entrée de stock de la fiche médicament. " +
      "Les dates d'expiration sont enregistrées ; les périmés sont signalés mais non bloqués. " +
      "L'inventaire s'exporte au format XLSX depuis la page Pharmacie.",
  },
  {
    source: 'FAQ · Facturation',
    titre: 'Factures, paiements et caisse',
    contenu:
      "Créer une facture : Facturation → Nouvelle facture, sélectionner le patient et ajouter les lignes de prestation. " +
      "Les paiements partiels multiples sont possibles sur une même facture (barre de progression du montant payé). " +
      "Une facture émise ne peut plus être modifiée (intégrité comptable) ; en cas d'erreur, avoir ou annulation par l'administrateur. " +
      "Le PDF se télécharge depuis le détail de la facture. " +
      "Le tiers payant sépare automatiquement part patient et part assurance. " +
      "La page Caisse affiche les encaissements du jour par mode de paiement (espèces, mobile money, carte, assurance, virement).",
  },
  {
    source: 'FAQ · Laboratoire',
    titre: 'Demandes et résultats de laboratoire',
    contenu:
      "Une demande d'analyse urgente s'active avec le toggle « Urgente » (badge rouge en tête de liste). " +
      "Les demandes et résultats apparaissent dans l'onglet Analyses du DME, triés par date. " +
      "Codes couleur des résultats : vert = normal, orange = élevé, bleu = bas, rouge = critique (action immédiate).",
  },
  {
    source: 'FAQ · Hospitalisation',
    titre: 'Admission et lits',
    contenu:
      "Admettre un patient : page Hospitalisation, cliquer sur un lit disponible (vert) et remplir le formulaire (patient, service, médecin référent). " +
      "La durée de séjour est calculée automatiquement depuis la date d'admission. " +
      "Couleurs des lits : vert = disponible, bleu = occupé, orange = nettoyage/désinfection, rouge = hors service.",
  },
  {
    source: 'FAQ · Administration',
    titre: 'Utilisateurs, rôles et audit',
    contenu:
      "Créer un utilisateur : Utilisateurs → + Nouvel utilisateur (prénom, nom, email, rôle, mot de passe). " +
      "Rôles disponibles : Superadmin, Admin, Médecin, Infirmier, Caissier, Pharmacien, Laborantin, DRH/Directeur. " +
      "Désactiver un compte via le toggle (historique conservé). " +
      "Le journal d'audit enregistre toutes les actions (création, modification, suppression) avec utilisateur, date et heure. " +
      "Les paramètres de la clinique (établissement, sécurité, session, notifications) se règlent dans Paramètres.",
  },
  {
    source: 'FAQ · Technique & Support',
    titre: 'Dépannage et support',
    contenu:
      "Si l'application ne répond plus : actualiser (F5), puis vider le cache (Ctrl+Shift+Del) et se reconnecter. " +
      "Si les données ne se chargent pas : vérifier la connexion internet, réessayer, sinon contacter le support. " +
      "Contacter le support SANTAREX via la page Support (préciser le module, le message d'erreur et les étapes). " +
      "Navigateurs recommandés : Chrome, Edge, Firefox récents (Internet Explorer non supporté).",
  },
  {
    source: 'FAQ · Rendez-vous',
    titre: 'Planification et suivi des rendez-vous',
    contenu:
      "Planifier un rendez-vous : Rendez-vous → + Nouveau RDV (patient, médecin, date, heure, motif) ; la disponibilité du médecin est vérifiée automatiquement. " +
      "La vue calendrier hebdomadaire affiche les créneaux par médecin (navigation avec < et >). " +
      "Statuts : Planifié (bleu), Confirmé (vert), Honoré, Annulé (rouge), Absent. " +
      "Annuler un rendez-vous libère le créneau. Quand le patient se présente, créer la consultation ; le rendez-vous passe à Honoré.",
  },
  {
    source: 'FAQ · Urgences',
    titre: 'Admission et triage aux urgences',
    contenu:
      "Admettre un patient : module Urgences → + Nouvelle admission (patient, motif de recours, niveau de triage). " +
      "Le triage Manchester classe les patients sur 5 niveaux, du rouge (immédiat) au bleu (non urgent) ; la file est triée par niveau puis par heure d'arrivée. " +
      "Un passage peut être orienté vers l'hospitalisation (admission sur un lit disponible). " +
      "Clôture du passage : renseigner le mode de sortie (domicile, hospitalisation, transfert, décès) ; la durée est calculée automatiquement.",
  },
  {
    source: 'FAQ · Bloc opératoire',
    titre: 'Programmation des interventions',
    contenu:
      "Programmer une intervention : module Bloc opératoire → + Nouvelle intervention (patient, chirurgien, type, salle, créneau). " +
      "Le planning affiche l'occupation des salles et signale les chevauchements. " +
      "On peut préciser l'équipe (chirurgien principal, anesthésiste, assistants). " +
      "Statuts : programmée, en cours, terminée, annulée. L'intervention est rattachée au dossier du patient avec le compte rendu opératoire éventuel.",
  },
  {
    source: 'FAQ · Imagerie',
    titre: 'Demandes et comptes rendus d\'imagerie',
    contenu:
      "Demander un examen : module Imagerie (patient, type d'examen — radiographie, échographie, scanner, IRM — et indication clinique). " +
      "Le compte rendu radiologique se saisit dans la demande ; une fois validé, il est consultable dans le DME du patient. " +
      "Statuts d'une demande : demandée, réalisée, interprétée. Chaque examen d'imagerie est un acte facturable.",
  },
  {
    source: 'FAQ · RH & Paie',
    titre: 'Personnel, congés et paie',
    contenu:
      "Ajouter un employé : module RH → + Nouvel employé (identité, poste, service, date d'embauche, type de contrat). " +
      "Les congés se saisissent depuis la fiche employé (solde et dates suivis). " +
      "La paie génère les bulletins à partir du salaire de base, des primes et des retenues. " +
      "Un employé est une fiche RH (contrat, paie, congés) ; un utilisateur est un compte de connexion à l'ERP — les deux sont distincts.",
  },
  {
    source: 'FAQ · Comptabilité',
    titre: 'Comptabilité et journal financier',
    contenu:
      "La Caisse suit les encaissements quotidiens ; la Comptabilité consolide l'ensemble des flux (recettes, dépenses, journal). " +
      "Enregistrer une dépense : écriture avec date, libellé, catégorie et montant. " +
      "Le journal liste chronologiquement les écritures (filtrage par période). " +
      "Les écritures et synthèses s'exportent au format Excel.",
  },
  {
    source: 'FAQ · Abonnement & Licence',
    titre: 'Abonnement SaaS et licence',
    contenu:
      "SANTAREX est une plateforme SaaS facturée par abonnement (mensuel ou annuel) ; chaque établissement a sa licence et ses modules activés. " +
      "La page Licence affiche l'offre en cours, la date d'échéance et les modules actifs. " +
      "À l'expiration, l'accès peut être restreint jusqu'au renouvellement, mais les données sont conservées. " +
      "Changer d'offre ou ajouter des modules : contacter le gestionnaire de compte / l'équipe commerciale IBIG. " +
      "L'essai gratuit est sans engagement et sans carte bancaire.",
  },
  {
    source: 'FAQ · Notifications',
    titre: 'Notifications et alertes',
    contenu:
      "Les notifications se consultent via l'icône cloche en haut à droite (pastille des non lues). " +
      "Événements typiques : stock pharmacie faible, nouveaux rendez-vous, résultats de laboratoire, nouvelles factures. " +
      "« Tout marquer lu » vide le compteur ; la configuration des types d'alertes se fait dans Paramètres → Notifications (par un administrateur).",
  },
  {
    source: 'FAQ · Mobile & PWA',
    titre: 'Usage mobile et installation PWA',
    contenu:
      "SANTAREX est une application web progressive (PWA) : depuis Chrome ou Safari, « Ajouter à l'écran d'accueil » l'installe comme une application. " +
      "Une connexion internet est nécessaire pour accéder aux données à jour et synchroniser. " +
      "L'interface est responsive (smartphones et tablettes) ; la PWA se met à jour automatiquement au chargement.",
  },
  {
    source: 'FAQ · Account & Login',
    titre: 'Login and password (EN)',
    contenu:
      "To log in, open the clinic URL and enter email and password. " +
      "A forgotten password is reset by the administrator (Users → Reset password). " +
      "Password change is done in My Profile → Security. " +
      "Sessions expire after inactivity (15 to 480 minutes) for security. Two-factor authentication (2FA) is enabled in Settings → Security. " +
      "The ERP is responsive and works on smartphone and tablet (recent Chrome or Safari).",
  },
  {
    source: 'FAQ · Patients',
    titre: 'Patient records and EMR (EN)',
    contenu:
      "Create a patient: Patients → New patient (at least name, date of birth, gender). " +
      "The IPP (Permanent Patient Identifier) is a unique number assigned automatically. " +
      "Patient data is encrypted and transmitted over HTTPS, with role-based access and full audit traceability. " +
      "The EMR (Electronic Medical Record) centralises history, consultations, prescriptions, lab results and hospitalisations. " +
      "Export the patient list with the XLSX button.",
  },
  {
    source: 'FAQ · Billing',
    titre: 'Invoices, payments and cashier (EN)',
    contenu:
      "Create an invoice: Billing → New invoice, select the patient and add service lines. " +
      "Multiple partial payments are allowed on one invoice (progress bar of the amount paid). " +
      "An issued invoice cannot be modified (accounting integrity); use a credit note or cancellation via the administrator. " +
      "Third-party payment automatically splits patient and insurance portions. " +
      "The Cashier page shows the day's collections per payment method (cash, mobile money, card, insurance, transfer).",
  },
  {
    source: 'FAQ · Appointments',
    titre: 'Appointments (EN)',
    contenu:
      "Schedule: Appointments → + New appointment (patient, doctor, date, time, reason); the doctor's availability is checked automatically. " +
      "Statuses: Scheduled (blue), Confirmed (green), Attended, Cancelled (red), No-show. " +
      "Cancelling frees the slot. When the patient arrives, create the consultation and the appointment becomes Attended.",
  },
  {
    source: 'FAQ · Emergencies',
    titre: 'Emergencies and triage (EN)',
    contenu:
      "Admit to emergencies: Emergencies → + New admission (patient, reason, triage level). " +
      "Manchester triage sorts patients across 5 levels, from red (immediate) to blue (non-urgent); the queue is ordered by level then arrival time. " +
      "A visit can be routed to hospitalisation. Close the visit with the discharge mode (home, hospitalisation, transfer, death); duration is computed automatically.",
  },
  {
    source: 'FAQ · Subscription & License',
    titre: 'Subscription and license (EN)',
    contenu:
      "SANTAREX is a SaaS platform billed by subscription (monthly or yearly); each facility has its own license and activated modules. " +
      "The License page shows the current plan, expiry date and active modules. " +
      "At expiry, access may be restricted until renewal, but data is kept. " +
      "To change plan or add modules, contact the IBIG account manager / sales team. The free trial has no commitment and needs no bank card.",
  },
];

/**
 * Descriptions des modules fonctionnels, portées depuis le guide utilisateur
 * (`frontend/src/app/(dashboard)/guide/page.tsx`).
 */
const MODULE_ENTRIES: KnowledgeEntry[] = [
  {
    source: 'Guide · Démarrage',
    titre: 'Démarrage rapide',
    contenu:
      "Après connexion, le tableau de bord affiche les indicateurs clés (patients du jour, consultations en attente, alertes stock, recettes) et se recharge toutes les 5 minutes. " +
      "Le menu latéral gauche donne accès aux modules ; les éléments visibles dépendent du rôle.",
  },
  {
    source: 'Guide · Patients',
    titre: 'Gestion des patients et DME',
    contenu:
      "Le module Patients gère l'enregistrement (nom, prénom, date de naissance, sexe obligatoires ; téléphone, adresse, groupe sanguin, allergies, assurance optionnels), la recherche temps réel par nom/prénom/IPP, et le Dossier Médical Électronique (antécédents, consultations, ordonnances, analyses, hospitalisations).",
  },
  {
    source: 'Guide · Consultations',
    titre: 'Module Consultations',
    contenu:
      "Nouvelle consultation via un wizard en 5 étapes : sélection patient, sélection médecin, motif et anamnèse, examen clinique et diagnostic, récapitulatif. " +
      "Les constantes vitales (tension, fréquence cardiaque, température, poids, taille, saturation O₂) sont saisies à l'étape 3. " +
      "Le diagnostic accepte le code CIM-10 et/ou un libellé en clair.",
  },
  {
    source: 'Guide · Modules cliniques',
    titre: 'Rendez-vous, urgences et bloc opératoire',
    contenu:
      "SANTAREX couvre les rendez-vous (agenda, créneaux disponibles par médecin), les urgences (admission, triage, sortie), l'hospitalisation (lits, séjours, notes médicales, prescriptions), le bloc opératoire (planification des interventions) et l'imagerie médicale.",
  },
  {
    source: 'Guide · Modules support',
    titre: 'Pharmacie, laboratoire, facturation',
    contenu:
      "Modules transverses : Pharmacie (stocks, mouvements, ruptures, inventaire XLSX), Laboratoire (demandes d'analyses, prélèvements, saisie et validation des résultats), Facturation et Paiements (factures, encaissements, caisse journalière), Comptabilité et RH/Paie.",
  },
  {
    source: 'Guide · Plateforme',
    titre: 'Nature de la plateforme SANTAREX',
    contenu:
      "SANTAREX ERP est une plateforme SaaS multi-établissements (multi-tenant) de gestion hospitalière conçue pour l'Afrique. " +
      "Chaque établissement (tenant) dispose de ses données isolées, de licences par module et d'une configuration propre. " +
      "L'accès est contrôlé par rôle et toutes les actions sensibles sont tracées.",
  },
  {
    source: 'Guide · Hospitalisation',
    titre: 'Séjours et lits',
    contenu:
      "Le module Hospitalisation affiche l'état temps réel des lits : disponible (vert), occupé (bleu), en nettoyage (orange), hors service (rouge), avec le taux d'occupation. " +
      "Depuis un séjour, on accède aux notes médicales (avec constantes vitales), prescriptions et soins infirmiers, chaque note étant horodatée et attribuée à son auteur.",
  },
  {
    source: 'Guide · Paramètres',
    titre: 'Configuration de la clinique',
    contenu:
      "Dans Paramètres : informations de l'établissement (nom, ville, pays, téléphone, email) reportées sur les documents générés ; " +
      "sécurité (2FA, délai d'expiration de session 15-480 min) appliquée à tous les utilisateurs ; " +
      "notifications automatiques (stock faible, rendez-vous, résultats de laboratoire, factures) visibles dans la cloche en haut à droite.",
  },
  {
    source: 'Guide · Support',
    titre: 'Ouvrir un ticket de support',
    contenu:
      "La page Support permet d'ouvrir un ticket (catégorie, sujet, message) ; l'équipe répond sous 24h. " +
      "Préciser le module concerné, le message d'erreur et les étapes de reproduction accélère la résolution. " +
      "Les tickets suivent des statuts : ouvert, en cours, résolu, fermé.",
  },
  {
    source: 'Guide · Getting started',
    titre: 'Quick start (EN)',
    contenu:
      "After login, the dashboard shows key indicators (today's patients, pending consultations, pharmacy stock alerts, revenue) and refreshes every 5 minutes. " +
      "The left sidebar gives access to modules; visible items depend on the role (doctor, nurse, cashier, pharmacist, lab technician, HR, admin).",
  },
  {
    source: 'Guide · Consultations',
    titre: 'Consultations module (EN)',
    contenu:
      "New consultation via a 5-step wizard: patient selection, doctor selection, complaint & history, clinical exam & diagnosis, summary. " +
      "Vital signs (blood pressure, heart rate, temperature, weight, height, O₂ saturation) are entered at step 3. " +
      "The diagnosis accepts an ICD-10 code and/or a free-text label.",
  },
  {
    source: 'Guide · Pharmacy',
    titre: 'Pharmacy and stock (EN)',
    contenu:
      "The Pharmacy page shows the full inventory; medicines out of stock or below the minimum threshold appear in red/orange. " +
      "Add a medicine with brand name, INN, form, dosage, category, price, current and minimum stock; enable 'Prescription required' when relevant. " +
      "Export the inventory with the XLSX button; low-stock alerts also appear on the dashboard.",
  },
  {
    source: 'Guide · Laboratory',
    titre: 'Laboratory module (EN)',
    contenu:
      "New request: Laboratory → New request, select the patient and check tests in the catalog (hematology, biochemistry, serology, bacteriology); enable Urgent mode if needed. " +
      "Results display with a color code: normal (green), high (orange), low (blue), critical (red). Critical values trigger an alert and the lab technician must contact the prescribing doctor immediately.",
  },
  {
    source: 'Guide · Platform',
    titre: 'SANTAREX platform (EN)',
    contenu:
      "SANTAREX ERP is a multi-tenant SaaS hospital-management platform designed for Africa. " +
      "Each facility (tenant) has isolated data, per-module licensing and its own configuration. " +
      "Access is role-controlled and all sensitive actions are traced. SARA is the built-in assistant that helps navigate the software.",
  },
  {
    source: 'Guide · Assistante SARA',
    titre: 'Rôle et limites de SARA',
    contenu:
      "SARA est l'assistante intelligente intégrée à SANTAREX ERP : elle aide à la navigation, aux procédures administratives, à la compréhension des tableaux de bord et des rapports. " +
      "SARA ne donne jamais de conseils médicaux directs et oriente vers le médecin compétent pour toute décision clinique. " +
      "Si SARA ne peut pas répondre, l'utilisateur peut ouvrir un ticket via la page Support.",
  },
];

/** Base de connaissances statique complète (FAQ + modules). */
export const STATIC_KNOWLEDGE: KnowledgeEntry[] = [...FAQ_ENTRIES, ...MODULE_ENTRIES];
