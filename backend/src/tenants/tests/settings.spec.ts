import { TenantsService } from '../tenants.service';

function build(initial: any = {}) {
  const tenant: any = { slug: 'clinique-a', nom: 'Clinique A', ville: 'Abidjan', pays: 'CI', telephone: '', email: 'a@x.ci', parametresJson: null, ...initial };
  const repo: any = {
    findOne: jest.fn(async () => tenant),
    save: jest.fn(async (t) => t),
  };
  return { service: new TenantsService(repo), tenant, repo };
}

describe('TenantsService — paramètres de l’établissement', () => {
  it('renvoie les vraies valeurs de l’établissement, avec des préférences par défaut', async () => {
    const { service } = build();
    const s = await service.getSettings('clinique-a');
    expect(s.nomEtablissement).toBe('Clinique A');
    expect(s.ville).toBe('Abidjan');
    expect(s.notifStock).toBe(true);
    expect(s.notifFacture).toBe(false);
    expect(s.sessionTimeoutMinutes).toBe(60);
  });

  it('enregistre coordonnées et préférences, et les relit', async () => {
    const { service, tenant, repo } = build();
    const s = await service.updateSettings('clinique-a', { nomEtablissement: 'Clinique B', notifFacture: true, sessionTimeoutMinutes: 30 });
    expect(repo.save).toHaveBeenCalled();
    expect(tenant.nom).toBe('Clinique B');
    expect(s.notifFacture).toBe(true);
    expect(s.sessionTimeoutMinutes).toBe(30);
  });

  it('un JSON de paramètres corrompu ne fait pas planter la lecture', async () => {
    const { service } = build({ parametresJson: '{pas du json' });
    const s = await service.getSettings('clinique-a');
    expect(s.notifRdv).toBe(true);
  });
});
