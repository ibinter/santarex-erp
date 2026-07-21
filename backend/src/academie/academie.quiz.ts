// ════════════════════════════════════════════════════════════════════════════
//  ACADÉMIE — Moteur de quiz : types & contenu réel seedé.
//
//  Un quiz est stocké dans la colonne JSON `quizJson` d'une ressource de type
//  `quiz` (option la plus simple : pas de table dédiée). Le contenu est RÉEL
//  (questions authentiques sur l'usage de SANTAREX) — conforme à la règle CDC
//  « jamais de fausse vidéo / fausse URL » : un quiz n'est pas une vidéo, c'est
//  du contenu pédagogique réel, donc `contenuDisponible = true` est légitime.
// ════════════════════════════════════════════════════════════════════════════

/** Seuil de réussite par défaut d'un quiz (pourcentage). */
export const QUIZ_SEUIL_DEFAUT = 70;

/**
 * Une question de quiz telle que stockée côté serveur (contient les bonnes
 * réponses et l'explication — NE JAMAIS renvoyer tel quel au client avant
 * soumission).
 */
export interface QuizQuestion {
  /** Identifiant stable de la question au sein du quiz. */
  id: string;
  question: string;
  /** Libellés des options proposées. */
  options: string[];
  /** Indices (0-based) des options correctes. Plusieurs => sélection multiple. */
  bonnesReponses: number[];
  /** Explication affichée dans le corrigé. */
  explication: string;
}

/** Contenu complet d'un quiz stocké dans `ressource.quizJson`. */
export interface QuizContenu {
  /** Pourcentage minimum pour valider la ressource (marquée « terminé »). */
  seuilReussite: number;
  questions: QuizQuestion[];
}

/** Question exposée au client AVANT soumission (sans les bonnes réponses). */
export interface QuizQuestionPublique {
  id: string;
  question: string;
  options: string[];
  /** true si plusieurs bonnes réponses sont attendues (sélection multiple). */
  multiple: boolean;
}

/** Payload public d'un quiz (pour le passage). */
export interface QuizPublic {
  ressourceId: string;
  titre: string;
  description: string | null;
  seuilReussite: number;
  nombreQuestions: number;
  questions: QuizQuestionPublique[];
}

/** Corrigé d'une question renvoyé après soumission. */
export interface QuizCorrectionQuestion {
  questionId: string;
  question: string;
  options: string[];
  /** Indices choisis par l'utilisateur. */
  reponseUtilisateur: number[];
  /** Indices corrects. */
  bonnesReponses: number[];
  correct: boolean;
  explication: string;
}

/** Résultat complet d'une soumission de quiz. */
export interface QuizResultat {
  ressourceId: string;
  score: number;
  total: number;
  pourcentage: number;
  seuilReussite: number;
  reussi: boolean;
  /** Statut de progression enregistré (`termine` si réussi, sinon `en_cours`). */
  statut: string;
  corrige: QuizCorrectionQuestion[];
}

/**
 * Définition d'un quiz réel rattaché à un parcours global via sa CATÉGORIE et
 * le TITRE de la ressource quiz. Utilisé par le seed idempotent : la ressource
 * quiz est créée/complétée sous le parcours global correspondant.
 */
export interface QuizSeed {
  categorie: string;          // ParcoursCategorie (valeur string)
  ressourceTitre: string;     // titre de la ressource quiz
  description: string;
  duree: number;              // minutes indicatives
  moduleAssocie: string | null;
  seuilReussite: number;
  questions: QuizQuestion[];
}

/**
 * Contenu RÉEL des quiz Académie (au moins 3 parcours couverts).
 * Questions authentiques sur l'usage du logiciel SANTAREX.
 */
export const QUIZ_SEEDS: QuizSeed[] = [
  // ── 1. DÉMARRAGE — bases & navigation ─────────────────────────────────────
  {
    categorie: 'demarrage',
    ressourceTitre: 'Quiz : les bases de SANTAREX',
    description: 'Validez vos réflexes de navigation et de prise en main.',
    duree: 5,
    moduleAssocie: 'dashboard',
    seuilReussite: QUIZ_SEUIL_DEFAUT,
    questions: [
      {
        id: 'dem-q1',
        question: 'Où retrouve-t-on la vue d\'ensemble de l\'activité (statistiques, raccourcis) après la connexion ?',
        options: ['Le tableau de bord', 'La page de facturation', 'Les paramètres du compte', 'La corbeille'],
        bonnesReponses: [0],
        explication: 'Le tableau de bord (dashboard) est la page d\'accueil : il regroupe les indicateurs clés et les raccourcis vers les modules.',
      },
      {
        id: 'dem-q2',
        question: 'Quel est le bon réflexe si vous ne retrouvez pas un module dans le menu ?',
        options: [
          'Réinstaller l\'application',
          'Vérifier vos droits d\'accès / rôle auprès de l\'administrateur',
          'Créer un nouveau compte',
          'Supprimer le cache du navigateur en boucle',
        ],
        bonnesReponses: [1],
        explication: 'La visibilité des modules dépend du rôle et des permissions. Un module masqué signifie le plus souvent un droit manquant, à vérifier avec l\'administrateur.',
      },
      {
        id: 'dem-q3',
        question: 'SANTAREX est disponible en français et en anglais. Comment change-t-on la langue de l\'interface ?',
        options: [
          'En réinstallant le logiciel dans l\'autre langue',
          'Via le sélecteur de langue de l\'interface',
          'Ce n\'est pas possible',
          'En contactant le support à chaque fois',
        ],
        bonnesReponses: [1],
        explication: 'L\'interface est bilingue (FR par défaut, EN disponible) : le changement se fait directement via le sélecteur de langue, sans réinstallation.',
      },
      {
        id: 'dem-q4',
        question: 'Quelles bonnes pratiques adopter dès la première connexion ? (plusieurs réponses)',
        options: [
          'Personnaliser / sécuriser son mot de passe',
          'Vérifier les informations de son établissement',
          'Partager ses identifiants avec ses collègues',
          'Se déconnecter en quittant un poste partagé',
        ],
        bonnesReponses: [0, 1, 3],
        explication: 'On sécurise son mot de passe, on vérifie les informations de l\'établissement et on se déconnecte des postes partagés. Les identifiants ne se partagent JAMAIS.',
      },
    ],
  },

  // ── 2. MODULES — patients & consultations ─────────────────────────────────
  {
    categorie: 'modules',
    ressourceTitre: 'Quiz : gestion des patients et consultations',
    description: 'Testez vos connaissances sur le dossier patient et la consultation.',
    duree: 7,
    moduleAssocie: 'patients',
    seuilReussite: QUIZ_SEUIL_DEFAUT,
    questions: [
      {
        id: 'mod-q1',
        question: 'Avant de créer un nouveau dossier patient, quelle vérification est recommandée ?',
        options: [
          'Aucune, on crée toujours un nouveau dossier',
          'Rechercher le patient pour éviter un doublon',
          'Demander une pièce d\'identité au médecin',
          'Redémarrer le module',
        ],
        bonnesReponses: [1],
        explication: 'On recherche d\'abord le patient (nom, date de naissance…) afin d\'éviter les doublons de dossiers, source d\'erreurs cliniques et de facturation.',
      },
      {
        id: 'mod-q2',
        question: 'Que regroupe le dossier médical électronique (DME) d\'un patient ?',
        options: [
          'Uniquement ses coordonnées',
          'L\'historique des consultations, antécédents et documents médicaux',
          'Seulement ses factures',
          'Les paramètres de l\'application',
        ],
        bonnesReponses: [1],
        explication: 'Le DME centralise l\'historique des consultations, les antécédents, prescriptions et documents médicaux du patient.',
      },
      {
        id: 'mod-q3',
        question: 'La consultation dans SANTAREX se déroule via un assistant guidé. Quel en est l\'intérêt ?',
        options: [
          'Ralentir la saisie',
          'Structurer la consultation étape par étape sans rien oublier',
          'Empêcher l\'accès au dossier',
          'Remplacer le médecin',
        ],
        bonnesReponses: [1],
        explication: 'L\'assistant (wizard) guide la consultation étape par étape (motif, examen, diagnostic, prescription…) pour une saisie complète et structurée.',
      },
      {
        id: 'mod-q4',
        question: 'Que peut-on générer à l\'issue d\'une consultation ? (plusieurs réponses)',
        options: [
          'Une ordonnance',
          'Une demande d\'examen (laboratoire / imagerie)',
          'Une facture',
          'Une suppression définitive du patient',
        ],
        bonnesReponses: [0, 1, 2],
        explication: 'Une consultation peut aboutir à une ordonnance, une demande d\'examen et une facturation. La suppression du patient n\'est pas une issue de consultation.',
      },
    ],
  },

  // ── 3. FINANCE — facturation & encaissement ───────────────────────────────
  {
    categorie: 'finance',
    ressourceTitre: 'Quiz : facturation et encaissement',
    description: 'Vérifiez votre maîtrise du cycle facture → caisse.',
    duree: 7,
    moduleAssocie: 'facturation',
    seuilReussite: QUIZ_SEUIL_DEFAUT,
    questions: [
      {
        id: 'fin-q1',
        question: 'Dans quel ordre se déroule le cycle financier standard ?',
        options: [
          'Encaissement puis facture',
          'Facture puis encaissement en caisse',
          'Ni l\'un ni l\'autre',
          'Comptabilité puis facture',
        ],
        bonnesReponses: [1],
        explication: 'On établit d\'abord la facture (prestations, montants), puis on procède à l\'encaissement en caisse.',
      },
      {
        id: 'fin-q2',
        question: 'Que permet la gestion de caisse de SANTAREX ?',
        options: [
          'Enregistrer les encaissements et suivre les paiements',
          'Uniquement imprimer des ordonnances',
          'Gérer les stocks de pharmacie',
          'Envoyer des e-mails marketing',
        ],
        bonnesReponses: [0],
        explication: 'La caisse enregistre les encaissements, suit les règlements (partiels ou totaux) et alimente les états financiers.',
      },
      {
        id: 'fin-q3',
        question: 'Un patient règle seulement une partie de sa facture. Comment le système traite-t-il ce cas ?',
        options: [
          'Il refuse le paiement',
          'Il enregistre un paiement partiel et conserve le solde dû',
          'Il supprime la facture',
          'Il double le montant',
        ],
        bonnesReponses: [1],
        explication: 'Un règlement partiel est enregistré : la facture reste ouverte avec un solde restant dû, jusqu\'au paiement complet.',
      },
      {
        id: 'fin-q4',
        question: 'À quoi servent les états comptables issus de la facturation ? (plusieurs réponses)',
        options: [
          'Suivre le chiffre d\'affaires',
          'Analyser les encaissements et impayés',
          'Modifier le dossier médical du patient',
          'Appuyer le pilotage financier de l\'établissement',
        ],
        bonnesReponses: [0, 1, 3],
        explication: 'Les états comptables servent au suivi du chiffre d\'affaires, à l\'analyse des encaissements/impayés et au pilotage financier — jamais à modifier un dossier médical.',
      },
    ],
  },

  // ── 4. ADMINISTRATION — utilisateurs & rôles ──────────────────────────────
  {
    categorie: 'administration',
    ressourceTitre: 'Quiz : utilisateurs, rôles et permissions',
    description: 'Contrôlez vos acquis sur la gestion des comptes et des droits.',
    duree: 6,
    moduleAssocie: 'utilisateurs',
    seuilReussite: QUIZ_SEUIL_DEFAUT,
    questions: [
      {
        id: 'adm-q1',
        question: 'À quoi sert le rôle attribué à un utilisateur ?',
        options: [
          'À définir la couleur de son interface',
          'À déterminer les modules et actions auxquels il a accès',
          'À rien de particulier',
          'À changer sa langue automatiquement',
        ],
        bonnesReponses: [1],
        explication: 'Le rôle conditionne les permissions : il détermine les modules visibles et les actions autorisées pour l\'utilisateur.',
      },
      {
        id: 'adm-q2',
        question: 'Quelle est la bonne pratique lors du départ d\'un employé ?',
        options: [
          'Partager son compte à un collègue',
          'Désactiver / révoquer son accès',
          'Ne rien faire',
          'Supprimer tous les dossiers patients',
        ],
        bonnesReponses: [1],
        explication: 'On désactive ou révoque l\'accès de l\'utilisateur qui part, afin de préserver la sécurité et la traçabilité des données.',
      },
      {
        id: 'adm-q3',
        question: 'Pourquoi appliquer le principe du moindre privilège ?',
        options: [
          'Pour compliquer le travail',
          'Pour n\'accorder que les droits strictement nécessaires à chaque rôle',
          'Pour donner tous les droits à tout le monde',
          'Ce principe n\'existe pas',
        ],
        bonnesReponses: [1],
        explication: 'Le moindre privilège consiste à n\'accorder que les droits nécessaires à la fonction, limitant les risques d\'erreur et de fuite de données.',
      },
    ],
  },

  // ── 5. SÉCURITÉ — confidentialité (parcours déjà présent en structure) ─────
  {
    categorie: 'securite',
    ressourceTitre: 'Quiz sécurité & confidentialité',
    description: 'Testez vos réflexes de protection des données patients.',
    duree: 6,
    moduleAssocie: null,
    seuilReussite: QUIZ_SEUIL_DEFAUT,
    questions: [
      {
        id: 'sec-q1',
        question: 'Que faire de son mot de passe SANTAREX ?',
        options: [
          'Le coller sur l\'écran',
          'Le garder confidentiel et ne jamais le partager',
          'Le communiquer au support par e-mail',
          'Utiliser « 1234 » pour aller plus vite',
        ],
        bonnesReponses: [1],
        explication: 'Le mot de passe est strictement personnel et confidentiel : il ne se partage, ne s\'affiche et ne s\'envoie jamais.',
      },
      {
        id: 'sec-q2',
        question: 'Vous quittez un poste partagé quelques minutes. Que faire ?',
        options: [
          'Laisser la session ouverte',
          'Se déconnecter ou verrouiller la session',
          'Éteindre le disjoncteur',
          'Donner son mot de passe au voisin',
        ],
        bonnesReponses: [1],
        explication: 'On se déconnecte ou on verrouille la session : une session ouverte sur un poste partagé expose les données patients.',
      },
      {
        id: 'sec-q3',
        question: 'Les données de santé sont sensibles. Quels principes s\'appliquent ? (plusieurs réponses)',
        options: [
          'Confidentialité (accès limité aux personnes autorisées)',
          'Traçabilité des accès et actions',
          'Diffusion libre des dossiers',
          'Accès selon le rôle (moindre privilège)',
        ],
        bonnesReponses: [0, 1, 3],
        explication: 'Confidentialité, traçabilité et accès selon le rôle protègent les données de santé. Leur diffusion libre est une faute grave.',
      },
    ],
  },
];
