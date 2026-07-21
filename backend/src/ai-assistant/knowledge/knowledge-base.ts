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
];

/** Base de connaissances statique complète (FAQ + modules). */
export const STATIC_KNOWLEDGE: KnowledgeEntry[] = [...FAQ_ENTRIES, ...MODULE_ENTRIES];
