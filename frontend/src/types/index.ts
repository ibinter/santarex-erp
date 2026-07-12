export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  isActive: boolean;
}

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MEDECIN = 'medecin',
  INFIRMIER = 'infirmier',
  CAISSIER = 'caissier',
  PHARMACIEN = 'pharmacien',
  LABORANTIN = 'laborantin',
  DRH = 'drh',
  DIRECTEUR = 'directeur',
}

// ──────────────────────────────────────────────────────
// SuperAdmin — Tenants, Licences, Offres
// ──────────────────────────────────────────────────────
export type TenantStatut = 'actif' | 'suspendu' | 'essai' | 'expire' | 'en_attente';
export type TenantType = 'clinique' | 'hopital' | 'cabinet' | 'polyclinique' | 'pharmacie' | 'laboratoire';

export interface Tenant {
  id: string;
  slug: string;
  nom: string;
  type?: TenantType;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  nomResponsable?: string;
  emailResponsable?: string;
  statut: TenantStatut;
  maxUtilisateurs?: number;
  createdAt: string;
  updatedAt: string;
}

export type LicenceStatut = 'active' | 'suspendue' | 'expiree' | 'essai' | 'annulee';
export type OffreCycle = 'mensuel' | 'trimestriel' | 'annuel' | 'unique';

export interface Licence {
  id: string;
  cle: string;
  tenantSlug: string;
  offreId: string;
  offreCode: string;
  statut: LicenceStatut;
  dateDebut: string;
  dateExpiration: string;
  maxUtilisateurs: number;
  montantPaye: number;
  modePaiement: string;
  refTransaction?: string;
  joursEssai: number;
  createdAt: string;
  updatedAt: string;
}

export interface OffreSaas {
  id: string;
  code: string;
  nom: string;
  description?: string;
  prix: number;
  cycle: OffreCycle;
  remiseAnnuelle: number;
  maxUtilisateurs: number;
  modulesInclus?: string;
  fonctionnalites?: string;
  estVisible: boolean;
  estMisEnAvant: boolean;
  ordre: number;
  estActif: boolean;
}

export interface SuperadminDashboard {
  tenants: { total: number; actifs: number; suspendus: number; essai: number };
  licences: { total: number; actives: number; essai: number; suspendues: number };
  offres: { id: string; code: string; nom: string; prix: number; cycle: string; estMisEnAvant: boolean }[];
  alertes: { niveau: 'danger' | 'warning' | 'info'; message: string }[];
  activiteRecente: {
    id: string; action: string; ressource: string;
    userEmail?: string; tenantId?: string; createdAt: string;
  }[];
}

export interface Patient {
  id: string;
  ipp: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: 'M' | 'F' | 'I';
  telephone?: string;
  telephoneUrgence?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  groupeSanguin?: string;
  photoUrl?: string;
  allergies?: string;
  antecedents?: string;
  assuranceNom?: string;
  assuranceNumero?: string;
  assuranceTiersPayant: boolean;
  statut: 'actif' | 'inactif' | 'decede';
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ModuleCard {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  href: string;
  stats: { label: string; value: string | number; alert?: boolean }[];
  roles: UserRole[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantId: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  read: boolean;
  createdAt: string;
}

// ──────────────────────────────────────────────────────
// DME — Dossier Médical Électronique
// ──────────────────────────────────────────────────────
export interface Antecedent {
  id: string;
  patientId: string;
  type: 'medical' | 'chirurgical' | 'familial' | 'allergie' | 'gynecologique' | 'autre';
  description: string;
  date?: string;
  gravite: 'leger' | 'modere' | 'grave';
  traitement?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Allergie {
  id: string;
  patientId: string;
  substance: string;
  type: 'medicament' | 'alimentaire' | 'environnementale' | 'autre';
  reaction: string;
  gravite: 'leger' | 'modere' | 'grave';
  active: boolean;
  createdAt: string;
}

export interface DocumentMedical {
  id: string;
  patientId: string;
  type: 'ordonnance' | 'analyse' | 'imagerie' | 'compte_rendu' | 'certificat' | 'autre';
  titre: string;
  url: string;
  dateDocument: string;
  medecinId?: string;
  createdAt: string;
}

// ──────────────────────────────────────────────────────
// Consultations
// ──────────────────────────────────────────────────────
export interface ConstantesVitales {
  tensionArterielle?: string;
  frequenceCardiaque?: number;
  temperature?: number;
  poids?: number;
  taille?: number;
  spo2?: number;
  frequenceRespiratoire?: number;
}

export interface Consultation {
  id: string;
  numero: string;
  patientId: string;
  patient?: Patient;
  medecinId: string;
  medecin?: { id: string; nom: string; prenom: string; specialite?: string };
  rendezVousId?: string;
  statut: 'en_cours' | 'terminee' | 'facturee' | 'annulee';
  motif: string;
  anamnese?: string;
  examenClinique?: string;
  diagnostic?: string;
  codeCIM10?: string;
  conclusion?: string;
  planSoins?: string;
  prochainRdvDans?: number;
  constantesVitales?: ConstantesVitales;
  ordonnances?: Ordonnance[];
  demandesAnalyses?: string[];
  dateConsultation: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Ordonnance {
  id: string;
  consultationId: string;
  patientId: string;
  medecinId: string;
  numero: string;
  statut: 'active' | 'dispensee' | 'expiree' | 'annulee';
  lignes: LigneOrdonnance[];
  dateEmission: string;
  dateExpiration?: string;
  createdAt: string;
}

export interface LigneOrdonnance {
  id: string;
  medicamentNom: string;
  dosage: string;
  posologie: string;
  duree: string;
  quantite: number;
}

// ──────────────────────────────────────────────────────
// Rendez-Vous
// ──────────────────────────────────────────────────────
export interface RendezVous {
  id: string;
  patientId: string;
  patient?: Patient;
  medecinId: string;
  medecin?: { id: string; nom: string; prenom: string; specialite?: string };
  date: string;
  heureDebut: string;
  heureFin: string;
  duree: 30 | 45 | 60 | 90;
  motif: string;
  type: 'consultation' | 'suivi' | 'urgence' | 'examen' | 'chirurgie';
  statut: 'planifie' | 'confirme' | 'annule' | 'absent' | 'honore';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ──────────────────────────────────────────────────────
// Pharmacie
// ──────────────────────────────────────────────────────
export type FormeMedicament =
  | 'comprime'
  | 'gelule'
  | 'sirop'
  | 'injectable'
  | 'pommade'
  | 'collyre'
  | 'suppositoire'
  | 'patch'
  | 'spray'
  | 'autre';

export type CategorieMedicament =
  | 'antibiotique'
  | 'antalgique'
  | 'antihypertenseur'
  | 'antipaludeen'
  | 'antiretroviral'
  | 'vaccin'
  | 'autre';

export interface Medicament {
  id: string;
  code: string;
  nom: string;
  nomCommercial?: string;
  dci?: string;
  forme: FormeMedicament;
  dosage: string;
  unite: string;
  categorie: CategorieMedicament;
  classeTherapeutique?: string;
  stockActuel: number;
  stockMinimum: number;
  stockMaximum: number;
  prixUnitaireAchat: number;
  prixVente: number;
  ordonnanceRequise: boolean;
  actif: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StockMedicament {
  id: string;
  medicamentId: string;
  medicament?: Medicament;
  numeroLot: string;
  datePeremption: string;
  quantite: number;
  quantiteRestante: number;
  fournisseur?: string;
  prixAchatUnitaire: number;
  localisation?: string;
  createdAt: string;
}

export interface MouvementStock {
  id: string;
  medicamentId: string;
  medicament?: Medicament;
  type: 'entree' | 'sortie' | 'ajustement' | 'peremption';
  quantite: number;
  stockAvant: number;
  stockApres: number;
  motif?: string;
  reference?: string;
  userId: string;
  createdAt: string;
}

// ──────────────────────────────────────────────────────
// Laboratoire
// ──────────────────────────────────────────────────────
export interface TypeAnalyse {
  id: string;
  code: string;
  nom: string;
  categorie: 'hematologie' | 'biochimie' | 'serologie' | 'microbiologie' | 'hormonologie' | 'autre';
  prix: number;
  parametres: ParametreAnalyse[];
  delaiResultat?: number; // en heures
  actif: boolean;
}

export interface ParametreAnalyse {
  id: string;
  nom: string;
  unite: string;
  valeurNormaleMin?: number;
  valeurNormaleMax?: number;
  valeurNormaleTexte?: string;
}

export type StatutDemandeAnalyse = 'attente_prelevement' | 'preleve' | 'en_analyse' | 'termine' | 'annule';
export type InterpretationResultat = 'NORMAL' | 'ELEVE' | 'BAS' | 'CRITIQUE';

export interface ResultatParametre {
  parametreId: string;
  parametre?: ParametreAnalyse;
  valeur: string;
  interpretation?: InterpretationResultat;
  commentaire?: string;
}

export interface ResultatAnalyse {
  id: string;
  demandeId: string;
  typeAnalyseId: string;
  typeAnalyse?: TypeAnalyse;
  resultats: ResultatParametre[];
  interpretationBiologiste?: string;
  valide: boolean;
  biologisteId?: string;
  dateValidation?: string;
  createdAt: string;
}

export interface DemandeAnalyse {
  id: string;
  numero: string;
  patientId: string;
  patient?: Patient;
  medecinId: string;
  medecin?: { id: string; nom: string; prenom: string; specialite?: string };
  consultationId?: string;
  urgence: boolean;
  statut: StatutDemandeAnalyse;
  typesAnalyse: TypeAnalyse[];
  resultats?: ResultatAnalyse[];
  notes?: string;
  datePrelevement?: string;
  dateResultats?: string;
  createdAt: string;
  updatedAt?: string;
}

// ──────────────────────────────────────────────────────
// Facturation
// ──────────────────────────────────────────────────────
export type StatutFacture = 'brouillon' | 'emise' | 'partiellement_payee' | 'payee' | 'annulee';
export type TypeLigneFacture = 'consultation' | 'medicament' | 'analyse' | 'acte_chirurgical' | 'hospitalisation' | 'materiel' | 'autre';
export type ModePaiement = 'especes' | 'carte' | 'mobile_money' | 'virement' | 'assurance';

export interface LigneFacture {
  id: string;
  factureId: string;
  type: TypeLigneFacture;
  libelle: string;
  quantite: number;
  prixUnitaire: number;
  remise: number; // pourcentage
  total: number;
}

export interface Facture {
  id: string;
  numero: string;
  patientId: string;
  patient?: Patient;
  statut: StatutFacture;
  lignes: LigneFacture[];
  sousTotal: number;
  tva: number;
  total: number;
  tiersPayant: boolean;
  assuranceNom?: string;
  partAssurance: number;
  partPatient: number;
  montantPaye: number;
  resteAPayer: number;
  paiements?: Paiement[];
  dateEmission?: string;
  dateEcheance?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Paiement {
  id: string;
  reference: string;
  factureId: string;
  facture?: Facture;
  patientId: string;
  patient?: Patient;
  montant: number;
  mode: ModePaiement;
  operateurMobileMoney?: string;
  referenceTransaction?: string;
  statut: 'en_attente' | 'valide' | 'annule';
  notes?: string;
  userId: string;
  createdAt: string;
}

// ──────────────────────────────────────────────────────
// Urgences
// ──────────────────────────────────────────────────────
export type CategorieManchester = 'ROUGE' | 'ORANGE' | 'JAUNE' | 'VERT' | 'NOIR';
export type StatutUrgence =
  | 'attente_triage'
  | 'en_triage'
  | 'en_soins'
  | 'en_observation'
  | 'sorti'
  | 'hospitalise'
  | 'decede';

export type ModeArrivee = 'ambulance' | 'propre_pied' | 'accompagne' | 'pompiers' | 'smur';

export interface ConstantesUrgence {
  tensionArterielle?: string;
  frequenceCardiaque?: number;
  temperature?: number;
  spo2?: number;
  glasgow?: number;
  douleur?: number; // 0-10
  frequenceRespiratoire?: number;
}

export interface PatientUrgence {
  id: string;
  numero: string; // URG-XXXXXXXX
  patientId?: string;
  patient?: Patient;
  nomProvisoire?: string; // si patient non identifié
  categorieManchester: CategorieManchester;
  statut: StatutUrgence;
  modeArrivee: ModeArrivee;
  motif: string;
  constantes?: ConstantesUrgence;
  medecinId?: string;
  medecin?: { id: string; nom: string; prenom: string; specialite?: string };
  infirmierId?: string;
  notes?: string;
  heureArrivee: string;
  heureTriageAt?: string;
  heureSoinsAt?: string;
  heureSortieAt?: string;
  diagnostic?: string;
  createdAt: string;
  updatedAt?: string;
}

// ──────────────────────────────────────────────────────
// Hospitalisation
// ──────────────────────────────────────────────────────
export type StatutLit = 'libre' | 'occupe' | 'nettoyage' | 'reserve';
export type ServiceHospitalisation =
  | 'Médecine Générale'
  | 'Chirurgie'
  | 'Maternité'
  | 'Pédiatrie'
  | 'Réanimation'
  | 'Orthopédie'
  | 'Ophtalmologie';

export type TypeHospitalisation = 'programmee' | 'urgente' | 'transfert_interne' | 'transfert_externe';
export type TypeSortie = 'gueri' | 'transfert' | 'deces' | 'contre_avis_medical';

export interface LitHospitalier {
  id: string;
  numero: string;
  service: ServiceHospitalisation;
  salle: string;
  statut: StatutLit;
  sejourActuelId?: string;
  patientNom?: string; // si occupé
  joursHospitalisation?: number;
  dateAdmissionPrevue?: string; // si réservé
  patientReserveNom?: string;
}

export interface NoteMedicale {
  id: string;
  sejourId: string;
  medecinId: string;
  medecin?: { id: string; nom: string; prenom: string };
  contenu: string;
  constantes?: ConstantesVitales;
  createdAt: string;
}

export interface PrescriptionHospitalisation {
  id: string;
  sejourId: string;
  medecinId: string;
  medicamentNom: string;
  dosage: string;
  posologie: string;
  duree: string;
  statut: 'en_attente' | 'dispense' | 'arrete';
  dateDebut: string;
  dateFin?: string;
  createdAt: string;
}

export interface SoinInfirmier {
  id: string;
  sejourId: string;
  description: string;
  effectue: boolean;
  equipe: 'matin' | 'apres_midi' | 'nuit';
  date: string;
  infirmierId?: string;
  infirmier?: { id: string; nom: string; prenom: string };
  heureEffectue?: string;
}

export interface SejourHospitalisation {
  id: string;
  numero: string;
  patientId: string;
  patient?: Patient;
  litId: string;
  lit?: LitHospitalier;
  service: ServiceHospitalisation;
  medecinId: string;
  medecin?: { id: string; nom: string; prenom: string; specialite?: string };
  typeHospitalisation: TypeHospitalisation;
  diagnosticEntree: string;
  dateAdmission: string;
  dateSortiePrevisionnelle?: string;
  dateSortie?: string;
  typeSortie?: TypeSortie;
  instructionsPostHospitalisation?: string;
  statut: 'actif' | 'sorti' | 'transfere';
  notesMedicales?: NoteMedicale[];
  prescriptions?: PrescriptionHospitalisation[];
  soinsInfirmiers?: SoinInfirmier[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
