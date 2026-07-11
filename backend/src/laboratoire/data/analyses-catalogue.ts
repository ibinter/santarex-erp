import { CategorieAnalyse, ParametreAnalyse } from '../entities/type-analyse.entity';

export interface AnalyseCatalogueEntry {
  code: string;
  nom: string;
  categorie: CategorieAnalyse;
  delaiResultatsHeures: number;
  prixUnitaire: number;
  parametres: ParametreAnalyse[];
  instructions?: string;
}

export const ANALYSES_CATALOGUE: AnalyseCatalogueEntry[] = [
  {
    code: 'NFS',
    nom: 'Numération Formule Sanguine',
    categorie: CategorieAnalyse.HEMATOLOGIE,
    delaiResultatsHeures: 4,
    prixUnitaire: 5000,
    parametres: [
      { nom: 'Hématies (GR)', unite: 'T/L', valeursNormalesMin: 4.2, valeursNormalesMax: 5.4 },
      { nom: 'Hémoglobine', unite: 'g/dL', valeursNormalesMin: 12, valeursNormalesMax: 16 },
      { nom: 'Hématocrite', unite: '%', valeursNormalesMin: 37, valeursNormalesMax: 47 },
      { nom: 'VGM', unite: 'fL', valeursNormalesMin: 80, valeursNormalesMax: 100 },
      { nom: 'TCMH', unite: 'pg', valeursNormalesMin: 27, valeursNormalesMax: 32 },
      { nom: 'CCMH', unite: 'g/dL', valeursNormalesMin: 32, valeursNormalesMax: 36 },
      { nom: 'Leucocytes (GB)', unite: 'G/L', valeursNormalesMin: 4, valeursNormalesMax: 10 },
      { nom: 'Polynucléaires Neutrophiles', unite: 'G/L', valeursNormalesMin: 1.8, valeursNormalesMax: 7 },
      { nom: 'Lymphocytes', unite: 'G/L', valeursNormalesMin: 1, valeursNormalesMax: 4 },
      { nom: 'Monocytes', unite: 'G/L', valeursNormalesMin: 0.2, valeursNormalesMax: 1 },
      { nom: 'Éosinophiles', unite: 'G/L', valeursNormalesMin: 0.05, valeursNormalesMax: 0.5 },
      { nom: 'Plaquettes', unite: 'G/L', valeursNormalesMin: 150, valeursNormalesMax: 400 },
    ],
    instructions: 'Tube EDTA (bouchon violet). Prélèvement veineux. Pas de jeûne requis.',
  },
  {
    code: 'GLYC',
    nom: 'Glycémie à jeun',
    categorie: CategorieAnalyse.BIOCHIMIE,
    delaiResultatsHeures: 2,
    prixUnitaire: 2500,
    parametres: [
      { nom: 'Glucose', unite: 'g/L', valeursNormalesMin: 0.70, valeursNormalesMax: 1.10 },
    ],
    instructions: 'Tube sec ou fluorure (bouchon gris). Jeûne strict de 8 à 12 heures obligatoire.',
  },
  {
    code: 'CREAT',
    nom: 'Créatininémie',
    categorie: CategorieAnalyse.BIOCHIMIE,
    delaiResultatsHeures: 2,
    prixUnitaire: 3000,
    parametres: [
      { nom: 'Créatinine', unite: 'mg/L', valeursNormalesMin: 6, valeursNormalesMax: 12 },
      { nom: 'DFG estimé (CKD-EPI)', unite: 'mL/min/1.73m²', valeursNormalesMin: 60, valeursNormalesMax: 120 },
    ],
    instructions: 'Tube sec. Pas de jeûne requis. Éviter effort physique intense la veille.',
  },
  {
    code: 'URIC',
    nom: 'Uricémie',
    categorie: CategorieAnalyse.BIOCHIMIE,
    delaiResultatsHeures: 2,
    prixUnitaire: 3000,
    parametres: [
      { nom: 'Acide urique', unite: 'mg/L', valeursNormalesMin: 30, valeursNormalesMax: 70 },
    ],
    instructions: 'Tube sec. Jeûne de 4 heures conseillé. Régime sans purines 24h avant.',
  },
  {
    code: 'TRANSAM',
    nom: 'Transaminases (ASAT / ALAT)',
    categorie: CategorieAnalyse.BIOCHIMIE,
    delaiResultatsHeures: 3,
    prixUnitaire: 4000,
    parametres: [
      { nom: 'ASAT (GOT)', unite: 'UI/L', valeursNormalesMin: 10, valeursNormalesMax: 40 },
      { nom: 'ALAT (GPT)', unite: 'UI/L', valeursNormalesMin: 10, valeursNormalesMax: 40 },
    ],
    instructions: 'Tube sec. Pas de jeûne requis. Éviter effort physique intense 24h avant.',
  },
  {
    code: 'BILIP',
    nom: 'Bilan lipidique',
    categorie: CategorieAnalyse.BIOCHIMIE,
    delaiResultatsHeures: 3,
    prixUnitaire: 6000,
    parametres: [
      { nom: 'Cholestérol total', unite: 'g/L', valeursNormalesMin: 1.5, valeursNormalesMax: 2.0 },
      { nom: 'HDL-Cholestérol', unite: 'g/L', valeursNormalesMin: 0.40, valeursNormalesMax: 0.60 },
      { nom: 'LDL-Cholestérol', unite: 'g/L', valeursNormalesMin: 0.5, valeursNormalesMax: 1.30 },
      { nom: 'Triglycérides', unite: 'g/L', valeursNormalesMin: 0.5, valeursNormalesMax: 1.50 },
    ],
    instructions: 'Tube sec. Jeûne strict de 12 heures obligatoire. Régime normal les 3 jours précédents.',
  },
  {
    code: 'CRP',
    nom: 'Protéine C Réactive (CRP)',
    categorie: CategorieAnalyse.BIOCHIMIE,
    delaiResultatsHeures: 2,
    prixUnitaire: 3500,
    parametres: [
      { nom: 'CRP', unite: 'mg/L', valeursNormalesMin: 0, valeursNormalesMax: 6 },
    ],
    instructions: 'Tube sec. Pas de jeûne requis.',
  },
  {
    code: 'GRPSANG',
    nom: 'Groupage Sanguin ABO Rhésus',
    categorie: CategorieAnalyse.HEMATOLOGIE,
    delaiResultatsHeures: 2,
    prixUnitaire: 3000,
    parametres: [
      { nom: 'Groupe ABO', unite: '', valeursNormalesTexte: 'A, B, AB ou O' },
      { nom: 'Rhésus (Rh)', unite: '', valeursNormalesTexte: 'Positif (+) ou Négatif (-)' },
    ],
    instructions: 'Tube EDTA (bouchon violet). Double détermination obligatoire sur 2 prélèvements.',
  },
  {
    code: 'BHCG',
    nom: 'Test de grossesse (β-HCG)',
    categorie: CategorieAnalyse.HORMONOLOGIE,
    delaiResultatsHeures: 3,
    prixUnitaire: 5000,
    parametres: [
      { nom: 'β-HCG', unite: 'mUI/mL', valeursNormalesMin: 0, valeursNormalesMax: 5, valeursNormalesTexte: '<5 mUI/mL = non enceinte' },
    ],
    instructions: 'Tube sec. Prélèvement de préférence le matin (urine ou sang). Pas de jeûne requis.',
  },
  {
    code: 'PALU',
    nom: 'Paludisme (Frottis + TDR)',
    categorie: CategorieAnalyse.PARASITOLOGIE,
    delaiResultatsHeures: 2,
    prixUnitaire: 4000,
    parametres: [
      { nom: 'TDR Paludisme', unite: '', valeursNormalesTexte: 'Négatif' },
      { nom: 'Frottis sanguin - Plasmodium', unite: '', valeursNormalesTexte: 'Négatif' },
      { nom: 'Parasitémie', unite: '%', valeursNormalesMin: 0, valeursNormalesMax: 0 },
    ],
    instructions: 'Piqûre au bout du doigt (sang capillaire) ou tube EDTA. Prélèvement pendant les accès fébriles.',
  },
  {
    code: 'ECBU',
    nom: 'Examen Cytobactériologique des Urines (ECBU)',
    categorie: CategorieAnalyse.MICROBIOLOGIE,
    delaiResultatsHeures: 48,
    prixUnitaire: 7000,
    parametres: [
      { nom: 'Leucocytes', unite: 'éléments/mm³', valeursNormalesMin: 0, valeursNormalesMax: 10000 },
      { nom: 'Hématies', unite: 'éléments/mm³', valeursNormalesMin: 0, valeursNormalesMax: 10000 },
      { nom: 'Bactériurie', unite: 'UFC/mL', valeursNormalesMin: 0, valeursNormalesMax: 100000 },
      { nom: 'Germe identifié', unite: '', valeursNormalesTexte: 'Absence de germe' },
      { nom: 'Antibiogramme', unite: '', valeursNormalesTexte: 'Non applicable si culture négative' },
    ],
    instructions: 'Flacon stérile. Urines du milieu du jet (2ème urine du matin). Toilette intime soigneuse. Analyser dans les 2 heures.',
  },
  {
    code: 'HIV',
    nom: 'Sérologie HIV 1 & 2',
    categorie: CategorieAnalyse.SEROLOGIE,
    delaiResultatsHeures: 4,
    prixUnitaire: 8000,
    parametres: [
      { nom: 'Anticorps Anti-HIV 1', unite: '', valeursNormalesTexte: 'Négatif' },
      { nom: 'Anticorps Anti-HIV 2', unite: '', valeursNormalesTexte: 'Négatif' },
      { nom: 'Antigène p24', unite: '', valeursNormalesTexte: 'Non détecté' },
    ],
    instructions: 'Tube sec. Pas de jeûne requis. Consentement éclairé du patient requis. Résultat remis avec counseling.',
  },
  {
    code: 'AGHBS',
    nom: 'Hépatite B (Antigène HBs)',
    categorie: CategorieAnalyse.SEROLOGIE,
    delaiResultatsHeures: 4,
    prixUnitaire: 5000,
    parametres: [
      { nom: 'AgHBs', unite: '', valeursNormalesTexte: 'Négatif' },
    ],
    instructions: 'Tube sec. Pas de jeûne requis.',
  },
  {
    code: 'HEPC',
    nom: 'Hépatite C (Ac Anti-VHC)',
    categorie: CategorieAnalyse.SEROLOGIE,
    delaiResultatsHeures: 4,
    prixUnitaire: 6000,
    parametres: [
      { nom: 'Anticorps Anti-VHC', unite: '', valeursNormalesTexte: 'Négatif' },
    ],
    instructions: 'Tube sec. Pas de jeûne requis.',
  },
  {
    code: 'INR_TP',
    nom: 'INR / Taux de Prothrombine (TP)',
    categorie: CategorieAnalyse.HEMATOLOGIE,
    delaiResultatsHeures: 3,
    prixUnitaire: 4500,
    parametres: [
      { nom: 'TP (Taux de Prothrombine)', unite: '%', valeursNormalesMin: 70, valeursNormalesMax: 100 },
      { nom: 'INR', unite: '', valeursNormalesMin: 0.8, valeursNormalesMax: 1.2 },
    ],
    instructions: 'Tube citrate (bouchon bleu). Remplir exactement jusqu\'au trait. Acheminer rapidement au laboratoire.',
  },
  {
    code: 'IONO',
    nom: 'Ionogramme sanguin',
    categorie: CategorieAnalyse.BIOCHIMIE,
    delaiResultatsHeures: 3,
    prixUnitaire: 7500,
    parametres: [
      { nom: 'Sodium (Na+)', unite: 'mEq/L', valeursNormalesMin: 135, valeursNormalesMax: 145 },
      { nom: 'Potassium (K+)', unite: 'mEq/L', valeursNormalesMin: 3.5, valeursNormalesMax: 5.0 },
      { nom: 'Chlorures (Cl-)', unite: 'mEq/L', valeursNormalesMin: 95, valeursNormalesMax: 107 },
      { nom: 'Bicarbonates (HCO3-)', unite: 'mEq/L', valeursNormalesMin: 22, valeursNormalesMax: 29 },
      { nom: 'Calcium (Ca++)', unite: 'mg/L', valeursNormalesMin: 85, valeursNormalesMax: 105 },
      { nom: 'Phosphore', unite: 'mg/L', valeursNormalesMin: 25, valeursNormalesMax: 50 },
    ],
    instructions: 'Tube sec. Pas de jeûne requis.',
  },
  {
    code: 'HBA1C',
    nom: 'Hémoglobine glyquée (HbA1c)',
    categorie: CategorieAnalyse.BIOCHIMIE,
    delaiResultatsHeures: 6,
    prixUnitaire: 8000,
    parametres: [
      { nom: 'HbA1c', unite: '%', valeursNormalesMin: 4.0, valeursNormalesMax: 5.7, valeursNormalesTexte: '<5.7% normal; 5.7-6.4% prédiabète; ≥6.5% diabète' },
    ],
    instructions: 'Tube EDTA (bouchon violet). Pas de jeûne requis. Reflet de la glycémie sur les 3 derniers mois.',
  },
  {
    code: 'TSH',
    nom: 'TSH (Thyroid Stimulating Hormone)',
    categorie: CategorieAnalyse.HORMONOLOGIE,
    delaiResultatsHeures: 6,
    prixUnitaire: 10000,
    parametres: [
      { nom: 'TSH ultrasensible', unite: 'mUI/L', valeursNormalesMin: 0.27, valeursNormalesMax: 4.20 },
    ],
    instructions: 'Tube sec. Prélèvement le matin de préférence. Pas de jeûne requis.',
  },
  {
    code: 'PSA',
    nom: 'PSA Total (Antigène Prostatique Spécifique)',
    categorie: CategorieAnalyse.HORMONOLOGIE,
    delaiResultatsHeures: 6,
    prixUnitaire: 12000,
    parametres: [
      { nom: 'PSA Total', unite: 'ng/mL', valeursNormalesMin: 0, valeursNormalesMax: 4.0, valeursNormalesTexte: '<4 ng/mL normal (varie avec l\'âge)' },
    ],
    instructions: 'Tube sec. Éviter toucher rectal, rapport sexuel et vélo 48h avant. Patient masculin uniquement.',
  },
  {
    code: 'SYPHILIS',
    nom: 'TPHA / VDRL (Syphilis)',
    categorie: CategorieAnalyse.SEROLOGIE,
    delaiResultatsHeures: 4,
    prixUnitaire: 6000,
    parametres: [
      { nom: 'TPHA', unite: '', valeursNormalesTexte: 'Négatif' },
      { nom: 'VDRL', unite: '', valeursNormalesTexte: 'Non réactif' },
    ],
    instructions: 'Tube sec. Pas de jeûne requis. Résultat positif confirmé par test de validation.',
  },
];
