import { BadRequestException } from '@nestjs/common';
import { AnnoncesService } from '../annonces.service';
import { MailService } from '../mail.service';

function creerService(licences: any[], admins: any[], envoi: jest.Mock = jest.fn().mockResolvedValue(true)) {
  const licenceRepo: any = { find: jest.fn().mockResolvedValue(licences) };
  const userRepo: any = { find: jest.fn().mockResolvedValue(admins) };
  const mail: any = { envoyerAnnonce: envoi };
  const config: any = { get: (_k: string, d: string) => d };
  return { svc: new AnnoncesService(licenceRepo, userRepo, mail, config), envoi, userRepo };
}

describe('AnnoncesService', () => {
  const lic = (slug: string) => ({ tenantSlug: slug, statut: 'active' });
  const admin = (tenant: string, email: string, prenom = 'Awa') => ({ tenantId: tenant, email, firstName: prenom });

  it('exclut les comptes de démonstration et ne cible que les établissements abonnés', async () => {
    const { svc, userRepo } = creerService([lic('clinique-a'), lic('demo-pharmacie')], [admin('clinique-a', 'a@x.ci')]);
    const r = await svc.destinataires();
    expect(r).toHaveLength(1);
    const requete = userRepo.find.mock.calls[0][0].where;
    expect(JSON.stringify(requete.tenantId)).toContain('clinique-a');
    expect(JSON.stringify(requete.tenantId)).not.toContain('demo-pharmacie');
  });

  it('retire les doublons d’adresse (même en majuscules)', async () => {
    const { svc } = creerService([lic('a'), lic('b')], [admin('a', 'Doc@X.ci'), admin('b', 'doc@x.ci')]);
    expect(await svc.destinataires()).toHaveLength(1);
  });

  it('refuse d’envoyer quand il n’y a aucun destinataire', async () => {
    const { svc } = creerService([], []);
    await expect(svc.envoyerATous('Sujet', 'Message')).rejects.toThrow(BadRequestException);
  });

  it('compte les envois réussis et liste les échecs', async () => {
    const envoi = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const { svc } = creerService([lic('a'), lic('b')], [admin('a', 'a@x.ci'), admin('b', 'b@x.ci')], envoi);
    const r = await svc.envoyerATous('Sujet', 'Message');
    expect(r).toEqual({ cibles: 2, envoyes: 1, echecs: ['b@x.ci'] });
  });

  it('le test part vers une seule adresse et marque le sujet [TEST]', async () => {
    const { svc, envoi } = creerService([], []);
    await svc.envoyerTest('Nouveautés', 'Texte', 'moi@x.ci');
    expect(envoi).toHaveBeenCalledTimes(1);
    expect(envoi.mock.calls[0][0]).toMatchObject({ to: 'moi@x.ci', sujet: '[TEST] Nouveautés' });
  });
});

describe('MailService.envoyerAnnonce', () => {
  function creerMail() {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'id' });
    const mailer: any = { sendMail };
    const config: any = { get: (_k: string, d: string) => d };
    return { mail: new MailService(mailer, config), sendMail };
  }

  it('échappe le HTML saisi : aucune balise injectée dans l’e-mail', async () => {
    const { mail, sendMail } = creerMail();
    await mail.envoyerAnnonce({ to: 'a@x.ci', prenom: '<b>Awa</b>', sujet: 'Sujet <script>', message: '<img src=x onerror=alert(1)>', urlApp: 'https://app.ci/login' });
    const html: string = sendMail.mock.calls[0][0].html;
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('transforme les lignes « • » en liste à puces', async () => {
    const { mail, sendMail } = creerMail();
    await mail.envoyerAnnonce({ to: 'a@x.ci', prenom: 'Awa', sujet: 'S', message: 'Intro\n\n• Premier\n• Second', urlApp: 'https://app.ci/login' });
    const html: string = sendMail.mock.calls[0][0].html;
    expect(html).toContain('<li>Premier</li>');
    expect(html).toContain('<li>Second</li>');
  });

  it('renvoie false quand le serveur SMTP refuse', async () => {
    const { mail, sendMail } = creerMail();
    sendMail.mockRejectedValueOnce(new Error('refusé'));
    expect(await mail.envoyerAnnonce({ to: 'a@x.ci', prenom: 'Awa', sujet: 'S', message: 'M', urlApp: 'u' })).toBe(false);
  });
});
