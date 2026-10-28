import { FORMULES, PHARMACIE, CABINET, CENTRE, CLINIQUE, HOPITAL } from '../formules';
import { moduleForPath } from '../../common/guards/module.guard';

describe('Formules commerciales', () => {
  it('sont cumulatives : chaque formule contient toute la précédente', () => {
    const ordre = [PHARMACIE, CABINET, CENTRE, CLINIQUE, HOPITAL];
    for (let i = 1; i < ordre.length; i++) {
      for (const m of ordre[i - 1]) expect(ordre[i]).toContain(m);
      expect(ordre[i].length).toBeGreaterThan(ordre[i - 1].length);
    }
  });

  it('n’ont aucun module en double', () => {
    for (const mods of Object.values(FORMULES)) expect(new Set(mods).size).toBe(mods.length);
  });

  it('ne contiennent que des modules que le garde sait faire respecter', () => {
    // « reporting » n'a pas de route serveur propre : il ne contrôle que l'affichage du menu.
    for (const m of HOPITAL.filter((x) => x !== 'reporting')) expect(moduleForPath(`/${m}`)).toBe(m);
  });

  it('messagerie, portail patient et reporting : réservés à Clinique et au-dessus', () => {
    for (const m of ['messagerie', 'portail-patient', 'reporting']) {
      expect(CENTRE).not.toContain(m);
      expect(CLINIQUE).toContain(m);
    }
  });

  it('Pharmacie : uniquement stock, vente et caisse — rien de clinique', () => {
    expect(PHARMACIE).toEqual(['patients', 'pharmacie', 'approvisionnement', 'facturation', 'caisse-sessions', 'paiements']);
    for (const ferme of ['consultations', 'laboratoire', 'urgences', 'hospitalisation', 'bloc-operatoire']) {
      expect(PHARMACIE).not.toContain(ferme);
    }
  });

  it('les modules « HÔPITAL+ » de la page de vente ne sont pas dans les formules inférieures', () => {
    const hopitalPlus = ['bloc-operatoire', 'had', 'imagerie', 'banque-sang', 'sterilisation', 'equipements',
      'dechets-medicaux', 'budget', 'incidents-qualite', 'indicateurs-qualite', 'declarations-sanitaires',
      'transport', 'morgue', 'rh', 'sites'];
    for (const m of hopitalPlus) {
      expect(CLINIQUE).not.toContain(m);
      expect(HOPITAL).toContain(m);
    }
  });

  it('les modules « CLINIQUE+ » ne sont pas dans Cabinet ni Centre', () => {
    for (const m of ['hospitalisation', 'urgences', 'tiers-payant', 'prise-en-charge']) {
      expect(CENTRE).not.toContain(m);
      expect(CLINIQUE).toContain(m);
    }
  });

  it('Centre de santé : soins infirmiers, maternité, pédiatrie et consentements (pas un Cabinet à peine enrichi)', () => {
    for (const m of ['soins-infirmiers', 'maternite', 'pediatrie', 'consentements']) {
      expect(CENTRE).toContain(m);
      expect(CABINET).not.toContain(m);
    }
    expect(CENTRE.length - CABINET.length).toBeGreaterThanOrEqual(4);
  });

  it('Hôpital contient tous les modules (44 codes, 41 + 3 transverses)', () => {
    expect(HOPITAL).toHaveLength(44);
  });
});
