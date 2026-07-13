import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — SANTAREX ERP',
  description: 'Politique de confidentialité et traitement des données personnelles et de santé dans SANTAREX ERP.',
};

export default function ConfidentialitePage() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      subtitle="SANTAREX ERP traite des données de santé. Nous prenons la protection de ces données très au sérieux."
      updatedAt="13 juillet 2026"
      currentPath="/confidentialite"
    >
      <div className="highlight">
        <p><strong>SANTAREX ERP opère en tant que sous-traitant</strong> pour le compte des établissements de santé (responsables de traitement). Les données des patients appartiennent à l&apos;établissement, pas à IBIG Soft.</p>
      </div>

      <h2>1. Responsable du traitement</h2>
      <p>
        Les données collectées dans SANTAREX ERP sont traitées pour le compte de l&apos;établissement de santé
        abonné (le <strong>Client</strong>), qui en est le responsable de traitement au sens du RGPD.
        IBIG SARL (IBIG Soft) intervient en qualité de sous-traitant.
      </p>
      <p>
        Pour toute question : <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a> · +225 27 22 27 60 14
      </p>

      <h2>2. Données collectées</h2>

      <h3>2.1 Données des établissements (Clients)</h3>
      <ul>
        <li>Informations d&apos;identification de l&apos;établissement (raison sociale, adresse, type de structure)</li>
        <li>Coordonnées du responsable administratif</li>
        <li>Données de facturation et de paiement</li>
        <li>Journaux d&apos;utilisation et d&apos;accès à la plateforme</li>
      </ul>

      <h3>2.2 Données des utilisateurs (personnel médical et administratif)</h3>
      <ul>
        <li>Nom, prénom, email, numéro de téléphone</li>
        <li>Rôle et droits d&apos;accès dans le système</li>
        <li>Journaux d&apos;actions (audit trail) pour la traçabilité médicale</li>
      </ul>

      <h3>2.3 Données de santé des patients</h3>
      <ul>
        <li>Identité du patient (nom, prénom, date de naissance, adresse)</li>
        <li>Dossier Médical Électronique (DME) : antécédents, allergies, pathologies</li>
        <li>Comptes rendus de consultations, ordonnances, résultats d&apos;analyses</li>
        <li>Données d&apos;hospitalisation (chambre, diagnostics, traitements)</li>
        <li>Données de facturation liées aux soins</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <ul>
        <li>Fourniture du service SANTAREX ERP et de ses modules</li>
        <li>Gestion administrative et médicale des patients</li>
        <li>Facturation et paiement des actes médicaux</li>
        <li>Maintenance, amélioration et sécurité de la plateforme</li>
        <li>Support technique et assistance aux utilisateurs</li>
        <li>Obligations légales et réglementaires</li>
      </ul>

      <h2>4. Bases légales du traitement</h2>
      <ul>
        <li><strong>Exécution du contrat :</strong> pour la fourniture du service SaaS</li>
        <li><strong>Obligation légale :</strong> conservation des dossiers médicaux</li>
        <li><strong>Intérêt légitime :</strong> sécurité de la plateforme et prévention de la fraude</li>
        <li><strong>Consentement du patient :</strong> recueilli par l&apos;établissement de santé</li>
      </ul>

      <h2>5. Sécurité des données</h2>
      <ul>
        <li>Chiffrement AES-256 de toutes les données au repos</li>
        <li>Chiffrement TLS 1.3 pour toutes les communications</li>
        <li>Isolation stricte des données entre établissements (multi-tenant sécurisé)</li>
        <li>Contrôle d&apos;accès basé sur les rôles (RBAC)</li>
        <li>Journal d&apos;audit complet de toutes les actions utilisateurs</li>
        <li>Sauvegardes automatiques chiffrées quotidiennes (rétention 30 jours)</li>
      </ul>

      <h2>6. Durée de conservation</h2>
      <ul>
        <li><strong>Données de santé des patients :</strong> 10 ans minimum (réglementation sanitaire)</li>
        <li><strong>Journaux d&apos;audit :</strong> 5 ans</li>
        <li><strong>Données de facturation :</strong> 10 ans (obligation fiscale)</li>
        <li><strong>Données des utilisateurs :</strong> durée de l&apos;abonnement + 30 jours</li>
      </ul>

      <h2>7. Vos droits</h2>
      <ul>
        <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles</li>
        <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
        <li><strong>Droit à l&apos;effacement :</strong> demander la suppression (sous réserve des obligations légales)</li>
        <li><strong>Droit à la portabilité :</strong> exporter vos données dans un format structuré</li>
        <li><strong>Droit d&apos;opposition :</strong> s&apos;opposer à certains traitements</li>
      </ul>
      <p>Pour exercer vos droits : <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a>. Réponse sous 30 jours.</p>

      <h2>8. Transferts de données</h2>
      <p>
        Les données sont hébergées en Europe (UE/EEE). IBIG SARL ne vend jamais les données
        des Clients ou des patients à des tiers.
      </p>

      <h2>9. Cookies</h2>
      <p>L&apos;utilisation des cookies est décrite dans notre <a href="/cookies">Politique de cookies</a>.</p>

      <h2>10. Modifications</h2>
      <p>
        En cas de modification substantielle, les Clients seront informés par email 30 jours avant
        l&apos;entrée en vigueur des changements.
      </p>
    </LegalLayout>
  );
}
