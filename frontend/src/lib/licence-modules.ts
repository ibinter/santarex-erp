'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

const CACHE_KEY = 'santarex_licence_modules';

/**
 * Page du menu → code de module de la formule (mêmes codes que le serveur :
 * `OffreSaas.modulesInclus`). Une page absente de cette table (tableau de bord,
 * messagerie, paramètres, aide…) est toujours visible.
 */
const HREF_TO_MODULE: Record<string, string> = {
  '/patients': 'patients',
  '/consultations': 'consultations',
  '/rendez-vous': 'rendez-vous',
  '/dme': 'dme',
  '/hospitalisation': 'hospitalisation',
  '/had': 'had',
  '/bloc-operatoire': 'bloc-operatoire',
  '/urgences': 'urgences',
  '/imagerie': 'imagerie',
  '/maternite': 'maternite',
  '/pediatrie': 'pediatrie',
  '/vaccination': 'vaccination',
  '/soins-infirmiers': 'soins-infirmiers',
  '/consentements': 'consentements',
  '/laboratoire': 'laboratoire',
  '/pharmacie': 'pharmacie',
  '/banque-sang': 'banque-sang',
  '/sterilisation': 'sterilisation',
  '/approvisionnement': 'approvisionnement',
  '/interactions': 'interactions-medicamenteuses',
  '/facturation': 'facturation',
  '/caisse': 'paiements',
  '/caisse-sessions': 'caisse-sessions',
  '/devis': 'devis',
  '/prise-en-charge': 'prise-en-charge',
  '/tiers-payant': 'tiers-payant',
  '/comptabilite': 'comptabilite',
  '/budget': 'budget',
  '/equipements': 'equipements',
  '/transport': 'transport',
  '/dechets-medicaux': 'dechets-medicaux',
  '/morgue': 'morgue',
  '/sites': 'sites',
  '/incidents-qualite': 'incidents-qualite',
  '/indicateurs-qualite': 'indicateurs-qualite',
  '/satisfaction': 'satisfaction',
  '/declarations-sanitaires': 'declarations-sanitaires',
  '/messages-sortants': 'messages-sortants',
  '/rh': 'rh',
  '/plannings-gardes': 'plannings-gardes',
  '/messagerie': 'messagerie',
  '/reporting': 'reporting',
  '/services-personnalises': 'services-personnalises',
};

/** `modules === null` : aucune restriction connue → tout est affiché. */
export function moduleAllowed(href: string, modules: string[] | null): boolean {
  if (!modules) return true;
  const code = HREF_TO_MODULE[href];
  if (!code) return true;
  return modules.includes(code);
}

function lire(): string[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    const v = raw ? JSON.parse(raw) : null;
    return Array.isArray(v) ? v : null;
  } catch { return null; }
}

/**
 * Modules inclus dans la formule du tenant (GET /licence/etat). Le dernier
 * résultat est gardé pour la session : pas de clignotement du menu au
 * changement de page. En cas d'échec réseau, aucune restriction n'est
 * appliquée à l'écran (le serveur, lui, refuse toujours les modules non inclus).
 */
export function useLicenceModules(): string[] | null {
  const [modules, setModules] = useState<string[] | null>(null);

  useEffect(() => {
    setModules(lire());
    let vivant = true;
    apiClient<any>('/licence/etat')
      .then((r) => {
        if (!vivant) return;
        const d = r?.data ?? r;
        const m: string[] | null = Array.isArray(d?.modules) ? d.modules : null;
        setModules(m);
        try {
          if (m) sessionStorage.setItem(CACHE_KEY, JSON.stringify(m));
          else sessionStorage.removeItem(CACHE_KEY);
        } catch { /* ignore */ }
      })
      .catch(() => { /* garde la valeur en cache */ });
    return () => { vivant = false; };
  }, []);

  return modules;
}
