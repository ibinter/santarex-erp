import { SeveriteInteraction, GraviteContreIndication } from './interactions.enums';
import { normaliserDci } from './interactions.normalize';

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  RÉFÉRENTIEL SEED — interactions médicamenteuses CLINIQUES RÉELLES.
 *
 *  Contenu médical établi (thésaurus type ANSM / références de pharmacologie),
 *  conforme à la règle du projet : AUCUNE donnée fictive — ce sont des
 *  interactions documentées. Les libellés `dciA`/`dciB` sont des CLASSES ou
 *  des DCI ; ils sont normalisés à l'insertion. Le service élargit chaque
 *  médicament saisi vers ses classes (cf. `CLASSES_PAR_DCI`) pour la détection.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface InteractionSeed {
  a: string;
  b: string;
  severite: SeveriteInteraction;
  mecanisme: string;
  effet: string;
  conduiteATenir: string;
  source?: string;
}

const SRC = 'Thésaurus des interactions médicamenteuses (référence ANSM)';

export const SEED_INTERACTIONS: InteractionSeed[] = [
  // ── Risque hémorragique ────────────────────────────────────────────────────
  {
    a: 'anticoagulant oral', b: 'ains',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Addition des effets sur l\'hémostase et agression de la muqueuse gastro-duodénale.',
    effet: 'Majoration importante du risque hémorragique, notamment digestif.',
    conduiteATenir: 'Association déconseillée. Si indispensable, surveillance clinique et de l\'INR renforcée ; protection gastrique.',
    source: SRC,
  },
  {
    a: 'anticoagulant oral', b: 'aspirine',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Inhibition de l\'agrégation plaquettaire s\'ajoutant à l\'anticoagulation.',
    effet: 'Risque hémorragique fortement augmenté.',
    conduiteATenir: 'Association à éviter sauf indication cardiologique précise ; surveillance étroite.',
    source: SRC,
  },
  {
    a: 'warfarine', b: 'amiodarone',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Inhibition du métabolisme hépatique (CYP2C9) de la warfarine par l\'amiodarone.',
    effet: 'Augmentation de l\'effet anticoagulant, risque hémorragique.',
    conduiteATenir: 'Réduire la posologie d\'AVK et contrôler l\'INR fréquemment (effet prolongé plusieurs semaines).',
    source: SRC,
  },
  {
    a: 'anticoagulant oral', b: 'miconazole',
    severite: SeveriteInteraction.CONTRE_INDICATION,
    mecanisme: 'Inhibition puissante du métabolisme de l\'AVK (y compris voie buccale/gel).',
    effet: 'Hémorragies parfois graves.',
    conduiteATenir: 'Association contre-indiquée avec les AVK, y compris le gel buccal et la voie vaginale.',
    source: SRC,
  },
  {
    a: 'anticoagulant oral', b: 'fluconazole',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Inhibition du CYP2C9 potentialisant l\'AVK.',
    effet: 'Augmentation de l\'INR, risque hémorragique.',
    conduiteATenir: 'Surveillance rapprochée de l\'INR et adaptation posologique.',
    source: SRC,
  },
  {
    a: 'warfarine', b: 'cotrimoxazole',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Inhibition enzymatique et déplacement de la liaison protéique de l\'AVK.',
    effet: 'Potentialisation de l\'anticoagulation, risque hémorragique.',
    conduiteATenir: 'Surveillance de l\'INR ; envisager une alternative antibiotique.',
    source: SRC,
  },
  {
    a: 'ains', b: 'aspirine',
    severite: SeveriteInteraction.MODEREE,
    mecanisme: 'Addition des effets ulcérogènes et antiagrégants.',
    effet: 'Majoration du risque d\'ulcère et d\'hémorragie digestive ; l\'AINS peut réduire l\'effet antiagrégant cardioprotecteur de l\'aspirine.',
    conduiteATenir: 'Éviter l\'association ; respecter un délai de prise et protéger la muqueuse gastrique.',
    source: SRC,
  },
  {
    a: 'ains', b: 'isrs',
    severite: SeveriteInteraction.MODEREE,
    mecanisme: 'Diminution de l\'agrégation plaquettaire par les ISRS s\'ajoutant à l\'effet gastro-toxique des AINS.',
    effet: 'Augmentation du risque d\'hémorragie digestive.',
    conduiteATenir: 'Prudence ; protection gastrique si association nécessaire.',
    source: SRC,
  },
  {
    a: 'ains', b: 'corticoide',
    severite: SeveriteInteraction.MODEREE,
    mecanisme: 'Addition des effets délétères sur la muqueuse digestive.',
    effet: 'Risque accru d\'ulcère et d\'hémorragie gastro-duodénale.',
    conduiteATenir: 'Éviter l\'association prolongée ; protection gastrique si nécessaire.',
    source: SRC,
  },

  // ── Fonction rénale / hyperkaliémie ─────────────────────────────────────────
  {
    a: 'ains', b: 'iec',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Réduction de la filtration glomérulaire (les AINS diminuent la synthèse des prostaglandines vasodilatatrices).',
    effet: 'Insuffisance rénale aiguë, notamment chez le sujet âgé ou déshydraté ; réduction de l\'effet antihypertenseur.',
    conduiteATenir: 'Éviter l\'association ; hydratation et surveillance de la fonction rénale si indispensable.',
    source: SRC,
  },
  {
    a: 'ains', b: 'sartan',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Réduction de la filtration glomérulaire (baisse des prostaglandines).',
    effet: 'Insuffisance rénale aiguë et baisse de l\'effet antihypertenseur.',
    conduiteATenir: 'Éviter l\'association ; surveiller la fonction rénale et la kaliémie.',
    source: SRC,
  },
  {
    a: 'ains', b: 'diuretique',
    severite: SeveriteInteraction.MODEREE,
    mecanisme: 'Les AINS réduisent l\'effet natriurétique et la perfusion rénale.',
    effet: 'Diminution de l\'effet diurétique et risque d\'insuffisance rénale (triple association AINS + diurétique + bloqueur du SRAA).',
    conduiteATenir: 'Hydrater, surveiller la fonction rénale ; éviter la triple association.',
    source: SRC,
  },
  {
    a: 'iec', b: 'diuretique epargneur de potassium',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Addition des effets hyperkaliémiants (rétention de potassium).',
    effet: 'Hyperkaliémie potentiellement grave (troubles du rythme).',
    conduiteATenir: 'Surveillance étroite de la kaliémie et de la fonction rénale ; association à éviter en cas d\'insuffisance rénale.',
    source: SRC,
  },
  {
    a: 'sartan', b: 'diuretique epargneur de potassium',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Addition des effets hyperkaliémiants.',
    effet: 'Hyperkaliémie potentiellement grave.',
    conduiteATenir: 'Surveiller la kaliémie ; prudence chez l\'insuffisant rénal.',
    source: SRC,
  },
  {
    a: 'iec', b: 'potassium',
    severite: SeveriteInteraction.MODEREE,
    mecanisme: 'Apport potassique s\'ajoutant à la rétention de potassium induite par l\'IEC.',
    effet: 'Risque d\'hyperkaliémie.',
    conduiteATenir: 'Éviter les suppléments potassiques sauf hypokaliémie documentée ; surveiller la kaliémie.',
    source: SRC,
  },
  {
    a: 'spironolactone', b: 'potassium',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Addition des effets hyperkaliémiants.',
    effet: 'Hyperkaliémie sévère possible.',
    conduiteATenir: 'Association déconseillée ; surveillance de la kaliémie.',
    source: SRC,
  },

  // ── Risque musculaire (rhabdomyolyse) ───────────────────────────────────────
  {
    a: 'macrolide', b: 'statine',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Inhibition du CYP3A4 augmentant l\'exposition à la statine.',
    effet: 'Risque de myopathie et de rhabdomyolyse.',
    conduiteATenir: 'Suspendre la statine pendant le traitement par macrolide, ou choisir une statine peu dépendante du CYP3A4.',
    source: SRC,
  },
  {
    a: 'statine', b: 'fibrate',
    severite: SeveriteInteraction.MODEREE,
    mecanisme: 'Addition des effets toxiques musculaires (surtout avec le gemfibrozil).',
    effet: 'Risque accru de myopathie et de rhabdomyolyse.',
    conduiteATenir: 'Association déconseillée avec le gemfibrozil ; surveiller les CPK et les signes musculaires.',
    source: SRC,
  },

  // ── Toxicité digitalique / rythme ───────────────────────────────────────────
  {
    a: 'digoxine', b: 'diuretique hypokaliemiant',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'L\'hypokaliémie induite par le diurétique majore la fixation et la toxicité de la digoxine.',
    effet: 'Troubles du rythme, toxicité digitalique.',
    conduiteATenir: 'Corriger et surveiller la kaliémie ; surveiller la digoxinémie.',
    source: SRC,
  },
  {
    a: 'digoxine', b: 'amiodarone',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Réduction de la clairance de la digoxine par l\'amiodarone.',
    effet: 'Augmentation de la digoxinémie, risque de surdosage.',
    conduiteATenir: 'Réduire la posologie de digoxine (~50 %) et surveiller la digoxinémie.',
    source: SRC,
  },
  {
    a: 'macrolide', b: 'digoxine',
    severite: SeveriteInteraction.MODEREE,
    mecanisme: 'Augmentation de la biodisponibilité de la digoxine.',
    effet: 'Risque de surdosage digitalique.',
    conduiteATenir: 'Surveiller la digoxinémie et les signes de surdosage.',
    source: SRC,
  },

  // ── Syndrome sérotoninergique ───────────────────────────────────────────────
  {
    a: 'tramadol', b: 'isrs',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Addition des effets sérotoninergiques ; le tramadol abaisse aussi le seuil épileptogène.',
    effet: 'Syndrome sérotoninergique, risque convulsif.',
    conduiteATenir: 'Prudence, surveillance clinique ; éviter les fortes doses.',
    source: SRC,
  },
  {
    a: 'isrs', b: 'imao',
    severite: SeveriteInteraction.CONTRE_INDICATION,
    mecanisme: 'Excès de sérotonine par double action sérotoninergique.',
    effet: 'Syndrome sérotoninergique potentiellement mortel.',
    conduiteATenir: 'Association contre-indiquée ; respecter un délai d\'arrêt (au moins 2 semaines, 5 semaines pour la fluoxétine).',
    source: SRC,
  },
  {
    a: 'tramadol', b: 'imao',
    severite: SeveriteInteraction.CONTRE_INDICATION,
    mecanisme: 'Potentialisation sérotoninergique majeure.',
    effet: 'Syndrome sérotoninergique.',
    conduiteATenir: 'Association contre-indiquée.',
    source: SRC,
  },
  {
    a: 'triptan', b: 'isrs',
    severite: SeveriteInteraction.MODEREE,
    mecanisme: 'Addition des effets sérotoninergiques.',
    effet: 'Risque de syndrome sérotoninergique.',
    conduiteATenir: 'Surveillance clinique ; informer le patient des signes d\'alerte.',
    source: SRC,
  },

  // ── Effet antabuse ──────────────────────────────────────────────────────────
  {
    a: 'metronidazole', b: 'alcool',
    severite: SeveriteInteraction.CONTRE_INDICATION,
    mecanisme: 'Effet antabuse (inhibition de l\'aldéhyde déshydrogénase).',
    effet: 'Bouffées vasomotrices, nausées, vomissements, tachycardie.',
    conduiteATenir: 'Éviter toute prise d\'alcool pendant le traitement et 48 h après.',
    source: SRC,
  },
  {
    a: 'metronidazole', b: 'anticoagulant oral',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Inhibition du métabolisme de l\'AVK.',
    effet: 'Potentialisation de l\'anticoagulation, risque hémorragique.',
    conduiteATenir: 'Surveiller l\'INR et adapter la posologie de l\'AVK.',
    source: SRC,
  },

  // ── Divers majeures / contre-indications ────────────────────────────────────
  {
    a: 'inhibiteur pde5', b: 'derives nitres',
    severite: SeveriteInteraction.CONTRE_INDICATION,
    mecanisme: 'Potentialisation de l\'effet vasodilatateur (voie du NO / GMPc).',
    effet: 'Hypotension sévère, potentiellement fatale.',
    conduiteATenir: 'Association contre-indiquée ; respecter un délai de 24 h (48 h pour le tadalafil).',
    source: SRC,
  },
  {
    a: 'lithium', b: 'diuretique',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Réduction de l\'excrétion rénale du lithium.',
    effet: 'Augmentation de la lithémie, risque de surdosage.',
    conduiteATenir: 'Surveiller la lithémie et adapter la posologie ; prudence avec les thiazidiques.',
    source: SRC,
  },
  {
    a: 'lithium', b: 'ains',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Diminution de l\'élimination rénale du lithium.',
    effet: 'Augmentation de la lithémie, toxicité.',
    conduiteATenir: 'Éviter l\'association ; surveiller la lithémie.',
    source: SRC,
  },
  {
    a: 'methotrexate', b: 'ains',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Réduction de l\'élimination rénale du méthotrexate.',
    effet: 'Toxicité hématologique du méthotrexate (surtout à forte dose).',
    conduiteATenir: 'Surveillance hématologique et de la fonction rénale ; prudence même à faible dose.',
    source: SRC,
  },
  {
    a: 'methotrexate', b: 'cotrimoxazole',
    severite: SeveriteInteraction.CONTRE_INDICATION,
    mecanisme: 'Addition des effets antifoliques et déplacement de la liaison protéique.',
    effet: 'Toxicité hématologique grave (pancytopénie).',
    conduiteATenir: 'Association contre-indiquée à forte dose ; déconseillée à faible dose.',
    source: SRC,
  },
  {
    a: 'allopurinol', b: 'azathioprine',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Inhibition de la xanthine oxydase qui dégrade la 6-mercaptopurine (métabolite de l\'azathioprine).',
    effet: 'Toxicité médullaire majeure.',
    conduiteATenir: 'Réduire fortement la dose d\'azathioprine (au quart) et surveiller l\'hémogramme.',
    source: SRC,
  },
  {
    a: 'clarithromycine', b: 'colchicine',
    severite: SeveriteInteraction.CONTRE_INDICATION,
    mecanisme: 'Inhibition du CYP3A4 et de la P-gp augmentant l\'exposition à la colchicine.',
    effet: 'Toxicité de la colchicine, potentiellement fatale (surtout si insuffisance rénale ou hépatique).',
    conduiteATenir: 'Association contre-indiquée chez l\'insuffisant rénal/hépatique ; sinon adapter la dose et surveiller.',
    source: SRC,
  },
  {
    a: 'fluoroquinolone', b: 'theophylline',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Inhibition du métabolisme de la théophylline (surtout ciprofloxacine).',
    effet: 'Surdosage en théophylline (convulsions, troubles du rythme).',
    conduiteATenir: 'Surveiller la théophyllinémie et adapter la posologie.',
    source: SRC,
  },
  {
    a: 'carbamazepine', b: 'macrolide',
    severite: SeveriteInteraction.MAJEURE,
    mecanisme: 'Inhibition du CYP3A4 par le macrolide.',
    effet: 'Surdosage en carbamazépine (ataxie, somnolence, troubles de conscience).',
    conduiteATenir: 'Éviter l\'association ; surveiller la carbamazépinémie.',
    source: SRC,
  },
  {
    a: 'imao', b: 'sympathomimetique',
    severite: SeveriteInteraction.CONTRE_INDICATION,
    mecanisme: 'Potentialisation des effets vasopresseurs (libération de noradrénaline).',
    effet: 'Poussée hypertensive sévère.',
    conduiteATenir: 'Association contre-indiquée (y compris vasoconstricteurs nasaux).',
    source: SRC,
  },
];

/**
 * Contre-indications liées au terrain patient (référentiel complémentaire).
 */
export interface ContreIndicationSeed {
  dci: string;
  condition: string;
  gravite: GraviteContreIndication;
  description: string;
  source?: string;
}

export const SEED_CONTRE_INDICATIONS: ContreIndicationSeed[] = [
  {
    dci: 'ains', condition: 'grossesse',
    gravite: GraviteContreIndication.ABSOLUE,
    description: 'Contre-indiqués à partir du 6e mois : risque de fermeture prématurée du canal artériel et de toxicité rénale fœtale.',
    source: SRC,
  },
  {
    dci: 'iec', condition: 'grossesse',
    gravite: GraviteContreIndication.ABSOLUE,
    description: 'Contre-indiqués aux 2e et 3e trimestres : toxicité rénale fœtale, oligoamnios, malformations.',
    source: SRC,
  },
  {
    dci: 'sartan', condition: 'grossesse',
    gravite: GraviteContreIndication.ABSOLUE,
    description: 'Contre-indiqués aux 2e et 3e trimestres (fœtotoxicité comparable aux IEC).',
    source: SRC,
  },
  {
    dci: 'ains', condition: 'insuffisance renale',
    gravite: GraviteContreIndication.RELATIVE,
    description: 'Aggravation de l\'insuffisance rénale par réduction de la perfusion rénale.',
    source: SRC,
  },
  {
    dci: 'metformine', condition: 'insuffisance renale',
    gravite: GraviteContreIndication.ABSOLUE,
    description: 'Contre-indiquée en cas d\'insuffisance rénale sévère (DFG < 30) : risque d\'acidose lactique.',
    source: SRC,
  },
  {
    dci: 'betabloquant', condition: 'asthme',
    gravite: GraviteContreIndication.RELATIVE,
    description: 'Les bêtabloquants non cardiosélectifs peuvent déclencher un bronchospasme.',
    source: SRC,
  },
  {
    dci: 'ains', condition: 'ulcere gastroduodenal',
    gravite: GraviteContreIndication.ABSOLUE,
    description: 'Contre-indiqués en cas d\'ulcère évolutif : risque d\'hémorragie et de perforation.',
    source: SRC,
  },
  {
    dci: 'metronidazole', condition: 'allaitement',
    gravite: GraviteContreIndication.PRECAUTION,
    description: 'Passage dans le lait maternel ; suspendre l\'allaitement en cas de traitement par forte dose.',
    source: SRC,
  },
];

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  EXPANSION MÉDICAMENT → CLASSES
 *
 *  Permet au vérificateur de détecter une interaction seedée au niveau d\'une
 *  CLASSE (ex. « ains ») lorsque l\'utilisateur saisit une DCI précise
 *  (ex. « ibuprofène »). Chaque DCI connue s\'élargit à ses classes.
 * ════════════════════════════════════════════════════════════════════════════
 */
export const CLASSES_PAR_DCI: Record<string, string[]> = {
  // AINS
  ibuprofene: ['ains'], ketoprofene: ['ains'], diclofenac: ['ains'],
  naproxene: ['ains'], piroxicam: ['ains'], celecoxib: ['ains'],
  meloxicam: ['ains'], indometacine: ['ains'], 'acide niflumique': ['ains'],
  aspirine: ['ains', 'antiagregant plaquettaire'], 'acide acetylsalicylique': ['ains', 'antiagregant plaquettaire'],
  // Anticoagulants oraux
  warfarine: ['anticoagulant oral'], acenocoumarol: ['anticoagulant oral'],
  fluindione: ['anticoagulant oral'], coumadine: ['anticoagulant oral'],
  dabigatran: ['anticoagulant oral'], rivaroxaban: ['anticoagulant oral'],
  apixaban: ['anticoagulant oral'], edoxaban: ['anticoagulant oral'],
  // IEC
  enalapril: ['iec'], lisinopril: ['iec'], ramipril: ['iec'],
  perindopril: ['iec'], captopril: ['iec'], benazepril: ['iec'], quinapril: ['iec'],
  // Sartans (ARA II)
  losartan: ['sartan'], valsartan: ['sartan'], candesartan: ['sartan'],
  irbesartan: ['sartan'], telmisartan: ['sartan'], olmesartan: ['sartan'],
  // Diurétiques épargneurs de potassium
  spironolactone: ['diuretique epargneur de potassium', 'diuretique'],
  eplerenone: ['diuretique epargneur de potassium', 'diuretique'],
  amiloride: ['diuretique epargneur de potassium', 'diuretique'],
  triamterene: ['diuretique epargneur de potassium', 'diuretique'],
  // Diurétiques hypokaliémiants (anse, thiazidiques)
  furosemide: ['diuretique hypokaliemiant', 'diuretique'],
  bumetanide: ['diuretique hypokaliemiant', 'diuretique'],
  hydrochlorothiazide: ['diuretique hypokaliemiant', 'diuretique'],
  indapamide: ['diuretique hypokaliemiant', 'diuretique'],
  // Statines
  simvastatine: ['statine'], atorvastatine: ['statine'], rosuvastatine: ['statine'],
  pravastatine: ['statine'], fluvastatine: ['statine'],
  // Fibrates
  gemfibrozil: ['fibrate'], fenofibrate: ['fibrate'], bezafibrate: ['fibrate'],
  // Macrolides
  erythromycine: ['macrolide'], clarithromycine: ['macrolide'],
  azithromycine: ['macrolide'], josamycine: ['macrolide'], roxithromycine: ['macrolide'],
  // ISRS
  fluoxetine: ['isrs'], paroxetine: ['isrs'], sertraline: ['isrs'],
  citalopram: ['isrs'], escitalopram: ['isrs'], fluvoxamine: ['isrs'],
  // IMAO
  iproniazide: ['imao'], moclobemide: ['imao'], selegiline: ['imao'], phenelzine: ['imao'],
  // Triptans
  sumatriptan: ['triptan'], zolmitriptan: ['triptan'], rizatriptan: ['triptan'],
  // Corticoïdes
  prednisone: ['corticoide'], prednisolone: ['corticoide'],
  methylprednisolone: ['corticoide'], dexamethasone: ['corticoide'],
  hydrocortisone: ['corticoide'], betamethasone: ['corticoide'],
  // Fluoroquinolones
  ciprofloxacine: ['fluoroquinolone'], levofloxacine: ['fluoroquinolone'],
  ofloxacine: ['fluoroquinolone'], norfloxacine: ['fluoroquinolone'],
  moxifloxacine: ['fluoroquinolone'],
  // Dérivés nitrés
  trinitrine: ['derives nitres'], nitroglycerine: ['derives nitres'],
  'isosorbide dinitrate': ['derives nitres'], molsidomine: ['derives nitres'],
  // Inhibiteurs de la PDE5
  sildenafil: ['inhibiteur pde5'], tadalafil: ['inhibiteur pde5'], vardenafil: ['inhibiteur pde5'],
  // Bêtabloquants
  propranolol: ['betabloquant'], atenolol: ['betabloquant'], bisoprolol: ['betabloquant'],
  metoprolol: ['betabloquant'], nebivolol: ['betabloquant'], carvedilol: ['betabloquant'],
  // Sympathomimétiques
  pseudoephedrine: ['sympathomimetique'], ephedrine: ['sympathomimetique'],
  phenylephrine: ['sympathomimetique'],
  // Cotrimoxazole (synonymes)
  bactrim: ['cotrimoxazole'], 'sulfamethoxazole trimethoprime': ['cotrimoxazole'],
};

/**
 * Suffixes de DCI permettant une expansion heuristique vers une classe
 * (utile pour les molécules non listées explicitement ci-dessus).
 */
export const SUFFIXES_CLASSE: Array<{ suffixe: string; classes: string[] }> = [
  { suffixe: 'pril', classes: ['iec'] },
  { suffixe: 'sartan', classes: ['sartan'] },
  { suffixe: 'statine', classes: ['statine'] },
  { suffixe: 'mycine', classes: ['macrolide'] },
  { suffixe: 'floxacine', classes: ['fluoroquinolone'] },
  { suffixe: 'triptan', classes: ['triptan'] },
];

/**
 * Élargit un terme (DCI/médicament) normalisé vers l'ensemble des tokens
 * pertinents pour la détection : le terme lui-même + ses classes connues
 * (map explicite) + classes déduites par suffixe.
 */
export function expandreTokens(terme: string): string[] {
  const t = normaliserDci(terme);
  if (!t) return [];
  const tokens = new Set<string>([t]);
  for (const c of CLASSES_PAR_DCI[t] ?? []) tokens.add(c);
  for (const { suffixe, classes } of SUFFIXES_CLASSE) {
    if (t.endsWith(suffixe)) classes.forEach(c => tokens.add(c));
  }
  return Array.from(tokens);
}
