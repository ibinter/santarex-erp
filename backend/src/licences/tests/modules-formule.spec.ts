import { LicencesService } from '../licences.service';
import { moduleForPath } from '../../common/guards/module.guard';

describe('Modules de la formule', () => {
  it('lit la liste JSON des modules en minuscules', () => {
    expect(LicencesService.lireModules('["Patients","pharmacie"]')).toEqual(['patients', 'pharmacie']);
  });

  it('accepte une liste séparée par des virgules', () => {
    expect(LicencesService.lireModules('patients, Pharmacie')).toEqual(['patients', 'pharmacie']);
  });

  it('vide, absent ou illisible = aucune restriction (null), jamais une liste vide', () => {
    expect(LicencesService.lireModules(null)).toBeNull();
    expect(LicencesService.lireModules('')).toBeNull();
    expect(LicencesService.lireModules('[]')).toBeNull();
  });

  it('le garde relie /interactions au module interactions-medicamenteuses', () => {
    expect(moduleForPath('/interactions/verifier')).toBe('interactions-medicamenteuses');
  });

  it('le garde reconnaît les modules d’une formule Pharmacie et ceux qui lui sont fermés', () => {
    expect(moduleForPath('/pharmacie/medicaments')).toBe('pharmacie');
    expect(moduleForPath('/urgences/actifs')).toBe('urgences');
    expect(moduleForPath('/dashboard')).toBeNull();
  });
});
