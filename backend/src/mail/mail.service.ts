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
      await this.mailerService.sendMail({
        to,
        from: `"${this.fromName}" <${this.fromEmail}>`,
        subject,
        template,
        context,
      });
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
}
