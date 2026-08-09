import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;
  private readonly fromName = 'SANTAREX ERP — IBIG SOFT';

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.fromEmail = this.configService.get<string>('SMTP_FROM', 'contact@ibigsoft.com');
  }

  private async send(to: string | string[], subject: string, template: string, context: Record<string, any>): Promise<void> {
    // `lang` (défaut 'fr') est propagé au contexte pour préparer le bilinguisme.
    // Les templates EN ne sont pas encore fournis : le rendu reste FR pour l'instant.
    if (!('lang' in context)) context.lang = 'fr';
    try {
      const info = await this.mailerService.sendMail({
        to,
        from: `"${this.fromName}" <${this.fromEmail}>`,
        subject,
        template,
        context,
      });
      // Succès : on trace messageId + destinataires acceptés par le serveur SMTP
      // (sinon les envois réussis sont muets et impossibles à auditer).
      const accepted = Array.isArray(info?.accepted) ? info.accepted.join(', ') : to;
      this.logger.log(`Email envoyé [${template}] → ${accepted} (id: ${info?.messageId ?? 'n/a'})`);
    } catch (err) {
      this.logger.error(`Échec envoi email [${template}] → ${to}: ${err.message}`);
    }
  }

  async envoyerBienvenue(opts: {
    to: string; prenom: string; email: string; nomEtablissement: string;
    tenantSlug: string; role: string; urlConnexion: string;
  }) {
    return this.send(opts.to, `Bienvenue sur SANTAREX ERP — ${opts.nomEtablissement}`, 'bienvenue', opts);
  }

  async envoyerLicenceActivee(opts: {
    to: string; prenom: string; nomEtablissement: string; cleLicence: string;
    offreNom: string; dateDebut: string; dateExpiration: string;
    maxUtilisateurs: number; montant: number; urlConnexion: string;
  }) {
    return this.send(opts.to, `Licence SANTAREX activée — ${opts.nomEtablissement}`, 'licence-activee', opts);
  }

  async envoyerLicenceEssai(opts: {
    to: string; prenom: string; nomEtablissement: string; offreNom: string;
    joursEssai: number; dateExpiration: string; maxUtilisateurs: number; urlConnexion: string;
  }) {
    return this.send(opts.to, `Votre période d'essai SANTAREX a démarré`, 'licence-essai', opts);
  }

  async envoyerExpirationProche(opts: {
    to: string; prenom: string; nomEtablissement: string; offreNom: string;
    dateExpiration: string; joursRestants: number; urlRenouvellement: string;
  }) {
    return this.send(opts.to, `⚠️ Votre licence expire dans ${opts.joursRestants} jours`, 'licence-expiration-proche', opts);
  }

  async envoyerLicenceExpiree(opts: {
    to: string; prenom: string; nomEtablissement: string; dateExpiration: string; urlRenouvellement: string;
  }) {
    return this.send(opts.to, `❌ Licence expirée — ${opts.nomEtablissement}`, 'licence-expiree', opts);
  }

  async envoyerLicenceRenouvelee(opts: {
    to: string; prenom: string; nomEtablissement: string; offreNom: string;
    dateExpiration: string; modePaiement: string; refTransaction: string;
    montant: number; urlConnexion: string;
  }) {
    return this.send(opts.to, `✅ Licence renouvelée — ${opts.nomEtablissement}`, 'licence-renouvelee', opts);
  }

  async envoyerCompteSuspendu(opts: {
    to: string; prenom: string; nomEtablissement: string; raisonSuspension: string;
  }) {
    return this.send(opts.to, `⛔ Accès suspendu — ${opts.nomEtablissement}`, 'compte-suspendu', opts);
  }

  async envoyerReinitialisationMdp(opts: {
    to: string; prenom: string; urlReset: string; dureeValidite: string;
  }) {
    return this.send(opts.to, 'Réinitialisation de votre mot de passe SANTAREX', 'reinitialisation-mdp', opts);
  }

  async envoyerNouvelUtilisateurAdmin(opts: {
    to: string; prenomAdmin: string; nomEtablissement: string; nomUtilisateur: string;
    emailUtilisateur: string; roleUtilisateur: string; creePar: string;
    dateCreation: string; urlGestionUtilisateurs: string;
  }) {
    return this.send(opts.to, `Nouveau compte créé — ${opts.nomEtablissement}`, 'nouveau-utilisateur-admin', opts);
  }

  async envoyerPaiementRecu(opts: {
    to: string; prenom: string; nomEtablissement: string; refTransaction: string;
    datePaiement: string; montant: number; modePaiement: string;
    offreNom: string; delaiActivation: string;
  }) {
    return this.send(opts.to, `Paiement reçu — ${opts.refTransaction}`, 'paiement-recu', opts);
  }

  async envoyerConfirmationRdv(opts: {
    to: string; prenomPatient: string; nomEtablissement: string; dateRdv: string;
    heureRdv: string; nomMedecin: string; specialite: string; motif: string;
    adresseEtablissement: string; telephoneEtablissement: string; emailEtablissement: string;
  }) {
    return this.send(opts.to, `Rendez-vous confirmé — ${opts.nomEtablissement}`, 'confirmation-rdv', opts);
  }

  async envoyerAlerteSecurite(opts: {
    to: string; prenom: string; dateConnexion: string; adresseIp: string;
    navigateur: string; tenantSlug: string; urlChangerMdp: string;
  }) {
    return this.send(opts.to, '🔐 Alerte sécurité — Connexion à votre compte SANTAREX', 'alerte-securite', opts);
  }

  async envoyerDemoRecue(opts: {
    to: string; prenom: string; logiciel: string; lang?: 'fr' | 'en';
  }) {
    return this.send(opts.to, 'Votre demande de démonstration a été reçue', 'demo-recue', opts);
  }

  async envoyerOffreEnvoyee(opts: {
    to: string; clientNom: string; numero: string; url: string; lang?: 'fr' | 'en';
  }) {
    return this.send(opts.to, 'Votre offre personnalisée est disponible', 'offre-envoyee', opts);
  }

  async envoyerTicketCree(opts: {
    to: string; prenom: string; numero: string; objet: string; lang?: 'fr' | 'en';
  }) {
    return this.send(opts.to, `Votre demande a été enregistrée — ${opts.numero}`, 'ticket-cree', opts);
  }

  async envoyerTicketResolu(opts: {
    to: string; prenom: string; numero: string; lang?: 'fr' | 'en';
  }) {
    return this.send(opts.to, `Votre demande a été traitée — ${opts.numero}`, 'ticket-resolu', opts);
  }

  async envoyerRapportMensuel(opts: {
    to: string; prenom: string; nomEtablissement: string; mois: string; annee: string;
    patientsTotal: number; patientsPrecedent: number;
    consultationsTotal: number; consultationsPrecedent: number;
    hospitalisationsTotal: number; hospitalisationsPrecedent: number;
    chiffreAffaires: string; chiffreAffairesPrecedent: string;
    facturesTotal: number; facturesPrecedent: number;
    tauxRecouvrement: number; tauxRecouvrementPrecedent: number;
    urlDashboard: string;
  }) {
    return this.send(opts.to, `Rapport mensuel SANTAREX — ${opts.mois} ${opts.annee}`, 'rapport-mensuel', opts);
  }

  // ── Cycle d'emails commerciaux & relances ──────────────────────────────────

  /** Relance automatique d'un prospect dont la date de relance est échue. */
  async envoyerRelanceProspect(opts: {
    to: string; prenom: string; entreprise: string; logiciel: string; urlContact: string;
  }) {
    return this.send(opts.to, `${opts.logiciel} — Reprenons contact`, 'relance-prospect', opts);
  }

  /** Relance automatique d'un devis (offre commerciale) envoyé mais non accepté. */
  async envoyerRelanceDevis(opts: {
    to: string; clientNom: string; numero: string; url: string; dateValidite?: string;
  }) {
    return this.send(opts.to, `Votre offre ${opts.numero} vous attend`, 'relance-devis', opts);
  }

  /** Confirmation au client de l'acceptation en ligne de son devis. */
  async envoyerOffreAcceptee(opts: {
    to: string; clientNom: string; numero: string; logiciel: string;
    formule?: string; montantTTC: string; dateAcceptation: string;
  }) {
    return this.send(opts.to, `Offre ${opts.numero} acceptée — merci`, 'offre-acceptee', opts);
  }

  /**
   * Notification interne à l'équipe commerciale (nouvelle demande de démo,
   * acceptation d'un devis, etc.). Destinataire = boîte commerciale interne.
   */
  async envoyerNouvelleDemandeInterne(opts: {
    to: string | string[]; titre: string; typeDemande: string; reference: string;
    contactNom: string; contactEmail: string; telephone: string;
    entreprise: string; pays: string; message: string;
  }) {
    return this.send(opts.to, `[Commercial] ${opts.titre}`, 'nouvelle-demande-interne', opts);
  }

  // ── Séquence d'e-mails du cycle de licence (cahier IBIG v1.1 §5.4/§8.6/§8.8) ──
  //
  //  Ces 7 e-mails accompagnent la vie d'un essai puis, le cas échéant, la
  //  purge d'une licence expirée. Ils sont envoyés par `LicenceEmailsScheduler`
  //  (backend/src/mail/licence-emails.scheduler.ts) à l'admin du tenant.
  //
  //  Contrairement aux e-mails transactionnels ci-dessus (qui utilisent un
  //  template Handlebars), ceux-ci embarquent une mise en page HTML simple
  //  auto-portante : aucune dépendance à un fichier de template. Ils restent
  //  best-effort — jamais d'exception propagée (log warn en cas d'échec SMTP).

  /**
   * Enveloppe HTML minimaliste et bilingue-ready (FR par défaut) partagée par
   * les 7 e-mails du cycle. `corps` = contenu HTML déjà échappé côté appelant.
   */
  private gabaritCycle(titre: string, corps: string, cta?: { url: string; libelle: string }): string {
    const bouton = cta
      ? `<p style="margin:28px 0 8px"><a href="${cta.url}" style="background:#0d6efd;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;display:inline-block;font-weight:600">${cta.libelle}</a></p>`
      : '';
    return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2933">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#fff;border-radius:10px;padding:32px 28px;border:1px solid #e4e7eb">
      <h1 style="font-size:20px;margin:0 0 18px;color:#0b2545">${titre}</h1>
      ${corps}
      ${bouton}
      <hr style="border:none;border-top:1px solid #eceff1;margin:28px 0 16px">
      <p style="font-size:12px;color:#7b8794;margin:0">SANTAREX ERP — IBIG SOFT<br>Cet e-mail vous est adressé au titre de la gestion de votre compte.</p>
    </div>
  </div>
</body></html>`;
  }

  /**
   * Envoi best-effort d'un e-mail HTML auto-porté (sans template Handlebars).
   * Ne throw jamais : en cas d'échec SMTP, log warn et retour silencieux.
   */
  private async sendHtml(to: string | string[], subject: string, html: string): Promise<void> {
    try {
      const info = await this.mailerService.sendMail({
        to,
        from: `"${this.fromName}" <${this.fromEmail}>`,
        subject,
        html,
      });
      const accepted = Array.isArray(info?.accepted) ? info.accepted.join(', ') : to;
      this.logger.log(`Email cycle envoyé [${subject}] → ${accepted} (id: ${info?.messageId ?? 'n/a'})`);
    } catch (err) {
      this.logger.warn(`Échec envoi email cycle [${subject}] → ${to}: ${(err as Error).message}`);
    }
  }

  /** ESSAI J+1 — Prise en main : premiers pas guidés. */
  async envoyerEssaiJ1(opts: {
    to: string; prenom: string; nomEtablissement: string; urlConnexion: string;
  }) {
    const corps = `
      <p>Bonjour ${opts.prenom},</p>
      <p>Votre essai de <strong>SANTAREX ERP</strong> pour <strong>${opts.nomEtablissement}</strong> est actif depuis hier. Prenons deux minutes pour bien démarrer.</p>
      <p>Nos trois premiers pas recommandés :</p>
      <ol style="padding-left:18px;line-height:1.6">
        <li>Créez votre premier patient et sa fiche.</li>
        <li>Enregistrez une consultation et une facture.</li>
        <li>Invitez un collègue pour tester le travail à plusieurs.</li>
      </ol>
      <p>Vous avez accès à toutes les fonctionnalités pendant l'essai — profitez-en pour vous faire une idée complète.</p>`;
    return this.sendHtml(
      opts.to,
      `Bien démarrer avec SANTAREX — ${opts.nomEtablissement}`,
      this.gabaritCycle('Bienvenue, faisons vos premiers pas', corps, { url: opts.urlConnexion, libelle: 'Ouvrir mon espace' }),
    );
  }

  /** ESSAI J-3 — Ce qui se ferme bientôt vs. ce qui reste. */
  async envoyerEssaiJ3(opts: {
    to: string; prenom: string; nomEtablissement: string; urlRenouvellement: string;
  }) {
    const corps = `
      <p>Bonjour ${opts.prenom},</p>
      <p>Il vous reste 3 jours d'essai complet sur <strong>SANTAREX ERP</strong>. Voici ce qui change à la fin de l'essai si vous ne souscrivez pas :</p>
      <p style="margin:16px 0 6px"><strong>Ce qui se ferme</strong> (fonctions avancées) :</p>
      <ul style="padding-left:18px;line-height:1.6">
        <li>Export de vos données</li>
        <li>Comptes multi-utilisateurs</li>
        <li>Accès API</li>
        <li>SARA, votre assistant intelligent</li>
      </ul>
      <p style="margin:16px 0 6px"><strong>Ce qui reste</strong> : vos données.</p>
      <p>Rien n'est perdu — vous conservez l'accès aux fonctions de base (palier Découverte). Pour garder l'ensemble des fonctionnalités, souscrivez dès maintenant.</p>`;
    return this.sendHtml(
      opts.to,
      `Plus que 3 jours d'essai complet — ${opts.nomEtablissement}`,
      this.gabaritCycle('Votre essai complet se termine dans 3 jours', corps, { url: opts.urlRenouvellement, libelle: 'Choisir mon offre' }),
    );
  }

  /** ESSAI J-1 — Dernier jour : rassurer d'abord, puis proposer. */
  async envoyerEssaiJ1Final(opts: {
    to: string; prenom: string; nomEtablissement: string; dateExpiration: string; urlRenouvellement: string;
  }) {
    const corps = `
      <p>Bonjour ${opts.prenom},</p>
      <p>C'est le dernier jour de votre essai complet (fin le <strong>${opts.dateExpiration}</strong>). Avant tout, soyez rassuré :</p>
      <p><strong>Vos données restent en sécurité.</strong> Elles ne sont ni supprimées ni bloquées : vous continuerez d'y accéder via le palier gratuit Découverte.</p>
      <p>Si SANTAREX ERP vous a convaincu pour <strong>${opts.nomEtablissement}</strong>, souscrivez aujourd'hui pour conserver sans interruption l'export, le multi-utilisateur, l'API et SARA.</p>`;
    return this.sendHtml(
      opts.to,
      `Dernier jour d'essai — vos données sont en sécurité`,
      this.gabaritCycle('Votre essai complet se termine aujourd\'hui', corps, { url: opts.urlRenouvellement, libelle: 'Continuer avec toutes les fonctions' }),
    );
  }

  /** ESSAI J0 — Passage en Découverte : état du compte. */
  async envoyerEssaiJ0(opts: {
    to: string; prenom: string; nomEtablissement: string; urlRenouvellement: string; urlConnexion: string;
  }) {
    const corps = `
      <p>Bonjour ${opts.prenom},</p>
      <p>Votre période d'essai complète est terminée. Le compte de <strong>${opts.nomEtablissement}</strong> est désormais sur le palier gratuit <strong>Découverte</strong>.</p>
      <p><strong>État de votre compte :</strong></p>
      <ul style="padding-left:18px;line-height:1.6">
        <li>Vos données sont conservées et accessibles.</li>
        <li>Les fonctions de base restent gratuites, sans limite de durée.</li>
        <li>Les fonctions avancées (export, multi-utilisateur, API, SARA) sont en pause.</li>
      </ul>
      <p>Vous pouvez réactiver l'ensemble à tout moment en souscrivant à une offre.</p>`;
    return this.sendHtml(
      opts.to,
      `Votre compte est passé en Découverte — ${opts.nomEtablissement}`,
      this.gabaritCycle('Bienvenue sur le palier Découverte', corps, { url: opts.urlRenouvellement, libelle: 'Passer à une offre complète' }),
    );
  }

  /** ESSAI J+7 — Relance commerciale UNIQUE après bascule. */
  async envoyerEssaiJ7(opts: {
    to: string; prenom: string; nomEtablissement: string; urlRenouvellement: string;
  }) {
    const corps = `
      <p>Bonjour ${opts.prenom},</p>
      <p>Une semaine s'est écoulée depuis la fin de votre essai. Nous espérons que <strong>SANTAREX ERP</strong> continue de vous être utile au quotidien.</p>
      <p>Si vous envisagez de débloquer à nouveau l'export, le travail à plusieurs, l'API et SARA pour <strong>${opts.nomEtablissement}</strong>, c'est le bon moment. Notre équipe reste disponible pour vous accompagner et répondre à vos questions.</p>
      <p>Ceci est notre unique relance : nous ne reviendrons pas vers vous à ce sujet sauf de votre initiative.</p>`;
    return this.sendHtml(
      opts.to,
      `Reprenons quand vous voulez — ${opts.nomEtablissement}`,
      this.gabaritCycle('Prêt à débloquer toutes les fonctions ?', corps, { url: opts.urlRenouvellement, libelle: 'Voir les offres' }),
    );
  }

  /** PURGE J+60 — Avertissement de suppression programmée. */
  async envoyerPurgeJ60(opts: {
    to: string; prenom: string; nomEtablissement: string; datePurge: string; urlRenouvellement: string;
  }) {
    const corps = `
      <p>Bonjour ${opts.prenom},</p>
      <p>La licence de <strong>${opts.nomEtablissement}</strong> est expirée depuis 60 jours. Conformément à notre politique de conservation, les données associées sont programmées pour suppression définitive le <strong>${opts.datePurge}</strong>.</p>
      <p><strong>Pour éviter la suppression</strong>, réactivez votre licence avant cette date. Toutes vos données seront alors immédiatement restaurées dans votre espace.</p>
      <p>Si vous souhaitez récupérer un export de vos données avant leur suppression, contactez-nous sans tarder.</p>`;
    return this.sendHtml(
      opts.to,
      `⚠️ Suppression de vos données prévue le ${opts.datePurge}`,
      this.gabaritCycle('Vos données seront supprimées prochainement', corps, { url: opts.urlRenouvellement, libelle: 'Réactiver ma licence' }),
    );
  }

  /** PURGE J+83 — Dernier rappel avant purge. */
  async envoyerPurgeJ83(opts: {
    to: string; prenom: string; nomEtablissement: string; datePurge: string; urlRenouvellement: string;
  }) {
    const corps = `
      <p>Bonjour ${opts.prenom},</p>
      <p><strong>Dernier rappel.</strong> Les données de <strong>${opts.nomEtablissement}</strong> seront définitivement supprimées le <strong>${opts.datePurge}</strong>. Cette action est irréversible.</p>
      <p>Il vous reste quelques jours pour agir :</p>
      <ul style="padding-left:18px;line-height:1.6">
        <li>Réactivez votre licence pour tout conserver, ou</li>
        <li>Demandez-nous un export de vos données avant leur suppression.</li>
      </ul>
      <p>Passé le ${opts.datePurge}, aucune récupération ne sera possible.</p>`;
    return this.sendHtml(
      opts.to,
      `⏳ Dernier rappel — suppression définitive le ${opts.datePurge}`,
      this.gabaritCycle('Dernier rappel avant suppression définitive', corps, { url: opts.urlRenouvellement, libelle: 'Réactiver maintenant' }),
    );
  }
}
