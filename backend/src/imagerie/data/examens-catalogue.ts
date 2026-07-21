import { ModaliteImagerie } from '../entities/type-examen-imagerie.entity';

export interface ExamenCatalogueEntry {
  code: string;
  nom: string;
  modalite: ModaliteImagerie;
  regionAnatomique: string;
  delaiResultatsHeures: number;
  prixUnitaire: number;
  instructions?: string;
}

/**
 * Catalogue d'examens d'imagerie semé automatiquement pour chaque tenant à la
 * première consultation du module. Les libellés `nom` contiennent les mots-clés
 * reconnus par le mapping d'icônes du frontend (Radiographie, Scanner, IRM,
 * Échographie, Mammographie…).
 */
export const EXAMENS_IMAGERIE_CATALOGUE: ExamenCatalogueEntry[] = [
  {
    code: 'RX-THORAX',
    nom: 'Radiographie thoracique (Face/Profil)',
    modalite: ModaliteImagerie.RADIO,
    regionAnatomique: 'Thorax',
    delaiResultatsHeures: 2,
    prixUnitaire: 15000,
    instructions: 'Retirer bijoux et vêtements métalliques. Inspiration bloquée.',
  },
  {
    code: 'RX-MEMBRE',
    nom: 'Radiographie de membre (os / articulation)',
    modalite: ModaliteImagerie.RADIO,
    regionAnatomique: 'Membre',
    delaiResultatsHeures: 2,
    prixUnitaire: 12000,
    instructions: 'Immobiliser le membre. Retirer tout objet métallique.',
  },
  {
    code: 'RX-ASP',
    nom: 'Radiographie Abdomen Sans Préparation (ASP)',
    modalite: ModaliteImagerie.RADIO,
    regionAnatomique: 'Abdomen',
    delaiResultatsHeures: 2,
    prixUnitaire: 14000,
    instructions: 'Debout et couché. Vessie de préférence pleine.',
  },
  {
    code: 'TDM-CRANE',
    nom: 'Scanner cérébral (TDM crâne)',
    modalite: ModaliteImagerie.SCANNER,
    regionAnatomique: 'Crâne / Encéphale',
    delaiResultatsHeures: 6,
    prixUnitaire: 60000,
    instructions: 'À jeun 4h si injection de produit de contraste. Créatininémie récente.',
  },
  {
    code: 'TDM-TAP',
    nom: 'Scanner thoraco-abdomino-pelvien (TDM TAP)',
    modalite: ModaliteImagerie.SCANNER,
    regionAnatomique: 'Thorax / Abdomen / Pelvis',
    delaiResultatsHeures: 8,
    prixUnitaire: 90000,
    instructions: 'À jeun 4h. Bilan rénal requis avant injection de contraste iodé.',
  },
  {
    code: 'IRM-CEREB',
    nom: 'IRM cérébrale',
    modalite: ModaliteImagerie.IRM,
    regionAnatomique: 'Encéphale',
    delaiResultatsHeures: 12,
    prixUnitaire: 120000,
    instructions: 'Contre-indication : pacemaker, corps étranger métallique. Retirer tout métal.',
  },
  {
    code: 'IRM-RACHIS',
    nom: 'IRM du rachis (lombaire / cervical)',
    modalite: ModaliteImagerie.IRM,
    regionAnatomique: 'Rachis',
    delaiResultatsHeures: 12,
    prixUnitaire: 130000,
    instructions: 'Contre-indication : matériel ferromagnétique. Prévoir 30 à 45 minutes.',
  },
  {
    code: 'ECHO-ABDO',
    nom: 'Échographie abdominale',
    modalite: ModaliteImagerie.ECHO,
    regionAnatomique: 'Abdomen',
    delaiResultatsHeures: 2,
    prixUnitaire: 25000,
    instructions: 'À jeun de 6 heures. Vessie pleine pour exploration pelvienne.',
  },
  {
    code: 'ECHO-PELV',
    nom: 'Échographie pelvienne',
    modalite: ModaliteImagerie.ECHO,
    regionAnatomique: 'Pelvis',
    delaiResultatsHeures: 2,
    prixUnitaire: 25000,
    instructions: 'Vessie pleine : boire 1 litre d\'eau 1h avant et ne pas uriner.',
  },
  {
    code: 'ECHO-OBST',
    nom: 'Échographie obstétricale',
    modalite: ModaliteImagerie.ECHO,
    regionAnatomique: 'Utérus / Fœtus',
    delaiResultatsHeures: 2,
    prixUnitaire: 30000,
    instructions: 'Apporter le carnet de grossesse. Vessie modérément pleine.',
  },
  {
    code: 'ECHO-CARD',
    nom: 'Échographie cardiaque (Échocardiographie)',
    modalite: ModaliteImagerie.ECHO,
    regionAnatomique: 'Cœur',
    delaiResultatsHeures: 4,
    prixUnitaire: 40000,
    instructions: 'Aucune préparation particulière.',
  },
  {
    code: 'MAMMO',
    nom: 'Mammographie bilatérale',
    modalite: ModaliteImagerie.MAMMOGRAPHIE,
    regionAnatomique: 'Seins',
    delaiResultatsHeures: 6,
    prixUnitaire: 45000,
    instructions: 'Éviter déodorant/talc le jour de l\'examen. De préférence après les règles.',
  },
  {
    code: 'OSTEO',
    nom: 'Ostéodensitométrie (DMO)',
    modalite: ModaliteImagerie.AUTRE,
    regionAnatomique: 'Rachis / Hanche',
    delaiResultatsHeures: 6,
    prixUnitaire: 35000,
    instructions: 'Pas d\'examen avec produit de contraste dans les 7 jours précédents.',
  },
];
