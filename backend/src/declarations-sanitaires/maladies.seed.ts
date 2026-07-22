import { CategorieMaladie } from './entities/maladie-declarable.entity';

export interface MaladieSeed {
  nom: string;
  codeCIM10: string;
  categorie: CategorieMaladie;
  delaiDeclarationHeures: number;
  description: string;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  RÉFÉRENTIEL SEED — Maladies à déclaration obligatoire (MDO) courantes en
 *  Afrique de l'Ouest (surveillance épidémiologique, RSI/OMS & directives
 *  nationales type IDSR — Integrated Disease Surveillance and Response).
 *
 *  AUCUNE donnée fictive : maladies réellement à déclaration obligatoire, codes
 *  CIM-10 et délais réglementaires usuels (potentiel épidémique = urgence 24 h).
 * ════════════════════════════════════════════════════════════════════════════
 */
export const SEED_MALADIES: MaladieSeed[] = [
  {
    nom: 'Choléra',
    codeCIM10: 'A00',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 24,
    description: 'Diarrhée aiguë aqueuse, potentiel épidémique majeur. Notification immédiate.',
  },
  {
    nom: 'Fièvre jaune',
    codeCIM10: 'A95',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 24,
    description: 'Arbovirose à potentiel épidémique. Investigation et confirmation labo obligatoires.',
  },
  {
    nom: 'Méningite à méningocoque',
    codeCIM10: 'A39',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 24,
    description: 'Méningite bactérienne, surveillance renforcée en ceinture méningitique.',
  },
  {
    nom: 'Rougeole',
    codeCIM10: 'B05',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 48,
    description: 'Maladie éruptive fébrile, cible d\'élimination. Tout cas suspect est notifiable.',
  },
  {
    nom: 'Paludisme grave',
    codeCIM10: 'B50',
    categorie: CategorieMaladie.ENDEMIQUE,
    delaiDeclarationHeures: 72,
    description: 'Forme sévère à Plasmodium falciparum. Surveillance de la charge endémique.',
  },
  {
    nom: 'Tuberculose',
    codeCIM10: 'A15',
    categorie: CategorieMaladie.ENDEMIQUE,
    delaiDeclarationHeures: 168,
    description: 'Tuberculose (toutes formes). Notification au programme national (PNLT).',
  },
  {
    nom: 'COVID-19',
    codeCIM10: 'U07.1',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 24,
    description: 'Infection à SARS-CoV-2, notification des cas confirmés / clusters.',
  },
  {
    nom: 'Maladie à virus Ebola / fièvre hémorragique virale',
    codeCIM10: 'A98.4',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 24,
    description: 'FHV à haut risque. Alerte immédiate, isolement et mesures barrières renforcées.',
  },
  {
    nom: 'Tétanos néonatal',
    codeCIM10: 'A33',
    categorie: CategorieMaladie.AUTRE,
    delaiDeclarationHeures: 48,
    description: 'Tétanos du nouveau-né, indicateur de couverture vaccinale (élimination).',
  },
  {
    nom: 'Poliomyélite / PFA',
    codeCIM10: 'A80',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 24,
    description: 'Paralysie flasque aiguë. Notification immédiate, prélèvements de selles.',
  },
  {
    nom: 'Diphtérie',
    codeCIM10: 'A36',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 24,
    description: 'Infection à Corynebacterium diphtheriae, potentiel épidémique.',
  },
  {
    nom: 'Coqueluche',
    codeCIM10: 'A37',
    categorie: CategorieMaladie.AUTRE,
    delaiDeclarationHeures: 72,
    description: 'Infection respiratoire à Bordetella pertussis, surveillance vaccinale.',
  },
  {
    nom: 'Tétanos (autre que néonatal)',
    codeCIM10: 'A35',
    categorie: CategorieMaladie.AUTRE,
    delaiDeclarationHeures: 72,
    description: 'Tétanos de l\'enfant / adulte, indicateur vaccinal.',
  },
  {
    nom: 'Peste',
    codeCIM10: 'A20',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 24,
    description: 'Zoonose à Yersinia pestis, maladie soumise au RSI. Alerte immédiate.',
  },
  {
    nom: 'Fièvre de Lassa',
    codeCIM10: 'A96.2',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 24,
    description: 'Fièvre hémorragique virale endémo-épidémique en Afrique de l\'Ouest.',
  },
  {
    nom: 'Dengue',
    codeCIM10: 'A90',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 48,
    description: 'Arbovirose transmise par Aedes, surveillance des flambées.',
  },
  {
    nom: 'Hépatite virale aiguë',
    codeCIM10: 'B17',
    categorie: CategorieMaladie.ENDEMIQUE,
    delaiDeclarationHeures: 168,
    description: 'Hépatites virales aiguës (A/B/C/E), surveillance et investigation des cas groupés.',
  },
  {
    nom: 'Rage humaine',
    codeCIM10: 'A82',
    categorie: CategorieMaladie.AUTRE,
    delaiDeclarationHeures: 24,
    description: 'Zoonose mortelle après exposition. Notification et prophylaxie post-exposition.',
  },
  {
    nom: 'Typhoïde / fièvre entérique',
    codeCIM10: 'A01',
    categorie: CategorieMaladie.ENDEMIQUE,
    delaiDeclarationHeures: 72,
    description: 'Infection à Salmonella Typhi, surveillance des cas groupés d\'origine hydrique.',
  },
  {
    nom: 'Variole du singe (Mpox)',
    codeCIM10: 'B04',
    categorie: CategorieMaladie.EPIDEMIQUE,
    delaiDeclarationHeures: 24,
    description: 'Orthopoxvirose émergente, notification et recherche des contacts.',
  },
];
