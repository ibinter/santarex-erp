/**
 * Parseur HL7 v2 MINIMAL fait maison (aucune dépendance externe).
 *
 * Objectif : extraire l'essentiel d'un message ORU^R01 (résultats de labo) —
 * l'en-tête MSH, l'identification patient (PID) et les observations (OBX).
 * Ce n'est PAS un parseur HL7 conforme complet : il couvre le sous-ensemble
 * nécessaire à l'ingestion des résultats d'automates de laboratoire.
 *
 * Séparateurs HL7 standard : champ `|`, composant `^`, répétition `~`.
 * Les segments sont séparés par CR (`\r`), tolérance ajoutée pour `\n`.
 */

export interface Hl7Observation {
  /** OBX-3 : identifiant de l'analyse (ex. GLU^Glucose). */
  code: string;
  libelle: string;
  /** OBX-5 : valeur. */
  valeur: string;
  /** OBX-6 : unité. */
  unite: string;
  /** OBX-7 : intervalle de référence. */
  intervalleReference: string;
  /** OBX-8 : indicateur d'anormalité (N, H, L, HH, LL…). */
  drapeauAnormal: string;
}

export interface Hl7ParsedMessage {
  typeMessage: string; // MSH-9 (ex. ORU^R01)
  controlId: string; // MSH-10
  version: string; // MSH-12
  patient: {
    identifiant?: string; // PID-3
    nom?: string; // PID-5
    prenom?: string;
  };
  observations: Hl7Observation[];
}

const COMPONENT_SEP = '^';

function splitSegments(raw: string): string[] {
  return raw
    .replace(/\n/g, '\r')
    .split('\r')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function component(field: string | undefined, index: number): string {
  if (!field) return '';
  return field.split(COMPONENT_SEP)[index] ?? '';
}

/**
 * Parse un message HL7 v2 texte. Lève une Error si le message n'a pas de
 * segment MSH valide.
 */
export function parseHl7(raw: string): Hl7ParsedMessage {
  const segments = splitSegments(raw);
  const msh = segments.find((s) => s.startsWith('MSH'));
  if (!msh) {
    throw new Error('Message HL7 invalide : segment MSH introuvable');
  }

  // MSH est particulier : MSH-1 est le séparateur de champ lui-même.
  const mshFields = msh.split('|');
  const typeMessage = mshFields[8] ?? '';
  const controlId = mshFields[9] ?? '';
  const version = mshFields[11] ?? '';

  const patient: Hl7ParsedMessage['patient'] = {};
  const pid = segments.find((s) => s.startsWith('PID'));
  if (pid) {
    const f = pid.split('|');
    patient.identifiant = component(f[3], 0) || f[3] || undefined;
    patient.nom = component(f[5], 0) || undefined;
    patient.prenom = component(f[5], 1) || undefined;
  }

  const observations: Hl7Observation[] = segments
    .filter((s) => s.startsWith('OBX'))
    .map((seg) => {
      const f = seg.split('|');
      const id = f[3] ?? '';
      return {
        code: component(id, 0),
        libelle: component(id, 1),
        valeur: f[5] ?? '',
        unite: f[6] ?? '',
        intervalleReference: f[7] ?? '',
        drapeauAnormal: f[8] ?? '',
      };
    });

  return { typeMessage, controlId, version, patient, observations };
}
