/**
 * SOURCE UNIQUE DE VÉRITÉ — paramètres de licence de SANTAREX ERP.
 * Cahier IBIG-LICENCE-UNIVERSEL v1.1, §6 (fiche santarex) + §12.1.
 *
 * RÈGLE : aucune durée, aucun plafond, aucun prix ne doit être écrit en dur
 * ailleurs dans le code ou les contenus — tout est lu ici (ou injecté depuis
 * ce fichier vers le frontend via l'endpoint /licence/etat).
 */
export const LICENCE_CONFIG = {
  solution: 'santarex',
  nom: 'SANTAREX ERP',
  essai_jours: 30,
  grace_jours: 7,
  retention_jours: 90,
  compteur: 'patients' as const,

  /** Palier gratuit à vie « Découverte » (état FREE / DECOUVERTE). */
  gratuit: {
    nom: 'Découverte',
    max_utilisateurs: 1,
    quotas: { patients: 10 },
    resume: '10 patients',
    // Fonctions de base incluses (modules). Le vrai frein est le plafond patients.
    modules: [
      'patients',
      'consultations',
      'dme',
      'rendez-vous',
      'facturation',
      'caisse-sessions',
      'pharmacie',
    ] as string[],
    // Leviers de conversion — fermés au palier gratuit (§3.3).
    exclus: [
      'export',
      'api',
      'sara',
      'multi_utilisateur',
      'whatsapp',
      'sms',
      'support_prioritaire',
    ] as string[],
  },
} as const;

export type LicenceConfig = typeof LICENCE_CONFIG;

/** Plafond du compteur métier au palier Découverte (10 patients). */
export const PLAFOND_PATIENTS_DECOUVERTE = LICENCE_CONFIG.gratuit.quotas.patients;
