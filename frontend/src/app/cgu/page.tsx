import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — SANTAREX ERP",
  description: "Conditions générales d'utilisation de SANTAREX ERP.",
};

export default function CguPage() {
  return (
    <LegalLayout
      title="Conditions Générales d'Utilisation"
      subtitle="En accédant à SANTAREX ERP, vous acceptez les présentes conditions. Lisez-les attentivement."
      updatedAt="13 juillet 2026"
      currentPath="/cgu"
    >
      <div className="highlight">
        <p>Ces CGU s'appliquent à tous les utilisateurs de SANTAREX ERP, qu'ils accèdent à la plateforme via le web, une application mobile ou une API. L'utilisation de SANTAREX ERP implique l'acceptation pleine et entière des présentes conditions.</p>
      </div>

      <h2>1. Définitions</h2>
      <ul>
        <li><strong>Éditeur :</strong> IBIG SARL, opérant sous la marque IBIG Soft.</li>
        <li><strong>Client :</strong> tout établissement de santé ayant souscrit un abonnement SANTAREX ERP.</li>
        <li><strong>Utilisateur :</strong> toute personne physique autorisée par le Client à accéder au Logiciel.</li>
        <li><strong>Logiciel :</strong> la plateforme SaaS SANTAREX ERP et tous ses modules.</li>
        <li><strong>Données de santé :</strong> toute information relative à l'état de santé d'un patient.</li>
      </ul>

      <h2>2. Accès au logiciel</h2>
      <p>
        L'accès à SANTAREX ERP est subordonné à la création d'un compte établissement et au paiement
        de l'abonnement correspondant à la formule choisie. L'Éditeur consent au Client un droit
        d'accès non exclusif, non transférable et révocable au Logiciel, pour la durée de l'abonnement.
      </p>
      <p>
        Chaque Utilisateur est responsable de la confidentialité de ses identifiants de connexion.
        Tout accès effectué à l'aide des identifiants d'un Utilisateur est réputé effectué par cet Utilisateur.
        Le Client s'engage à signaler sans délai toute utilisation non autorisée.
      </p>

      <h2>3. Obligations du Client</h2>
      <p>Le Client s'engage à :</p>
      <ul>
        <li>Utiliser le Logiciel exclusivement à des fins légales et dans le cadre de son activité de santé.</li>
        <li>Ne pas tenter de décompiler, modifier, reverse-engineer ou copier le Logiciel.</li>
        <li>Ne pas revendre, sous-licencier ou mettre à disposition le Logiciel à des tiers non autorisés.</li>
        <li>Maintenir à jour les informations de son compte établissement.</li>
        <li>Respecter la réglementation applicable en matière de données de santé.</li>
        <li>Former ses utilisateurs à l'utilisation correcte du Logiciel.</li>
      </ul>

      <h2>4. Abonnements et facturation</h2>
      <p>
        SANTAREX ERP est proposé sous forme d'abonnement mensuel ou annuel.
        Les tarifs en vigueur sont affichés sur <a href="/#pricing">santarex.ibigsoft.com</a>.
        L'abonnement est renouvelé automatiquement à chaque échéance, sauf résiliation par le Client
        au moins 15 jours avant la date d'échéance.
      </p>
      <p>
        Le forfait annuel correspond à 10 mois facturés pour 12 mois d'utilisation (2 mois offerts).
        En cas de résiliation anticipée d'un forfait annuel, les mois non consommés ne sont pas remboursés.
      </p>
      <p>
        Tout retard de paiement supérieur à 15 jours peut entraîner la suspension de l'accès au Logiciel.
      </p>

      <h2>5. Disponibilité et maintenance</h2>
      <p>
        L'Éditeur s'engage à maintenir une disponibilité de 99,9 % (SLA) pour les formules Clinique
        et Hôpital. Des interruptions planifiées peuvent survenir pour maintenance, avec un préavis
        de 48 heures communiqué par email.
      </p>
      <p>
        L'Éditeur ne saurait être tenu responsable des interruptions dues à des causes extérieures
        (coupures réseau de l'opérateur, force majeure, cyberattaques externes).
      </p>

      <h2>6. Données et confidentialité</h2>
      <p>
        Le Client reste propriétaire de l'ensemble de ses données, y compris les données de santé
        de ses patients. L'Éditeur agit en qualité de sous-traitant au sens du RGPD.
        Le traitement des données est décrit dans la <a href="/confidentialite">Politique de confidentialité</a>.
      </p>
      <p>
        À la résiliation du contrat, le Client dispose de 30 jours pour exporter ses données.
        Passé ce délai, les données sont supprimées de manière sécurisée.
      </p>

      <h2>7. Responsabilité</h2>
      <p>
        La responsabilité de l'Éditeur est limitée au montant des abonnements versés par le Client
        au cours des 12 derniers mois. L'Éditeur ne saurait être tenu responsable des préjudices
        indirects, pertes d'exploitation, pertes de données ou décisions médicales prises sur la
        base des informations affichées dans le Logiciel.
      </p>

      <h2>8. Résiliation</h2>
      <p>
        Chaque partie peut résilier le contrat à tout moment. Le Client peut résilier depuis son
        espace administration ou par email à <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a>.
        L'Éditeur peut résilier en cas de manquement grave aux présentes CGU, après mise en demeure
        restée sans effet pendant 15 jours.
      </p>

      <h2>9. Modifications des CGU</h2>
      <p>
        L'Éditeur se réserve le droit de modifier les présentes CGU. Le Client sera informé par email
        au moins 30 jours avant l'entrée en vigueur de toute modification substantielle.
        La poursuite de l'utilisation du Logiciel après cette période vaut acceptation des nouvelles conditions.
      </p>

      <h2>10. Droit applicable et juridiction</h2>
      <p>
        Les présentes CGU sont régies par le droit ivoirien. En cas de litige, les parties s'engagent
        à rechercher une solution amiable avant tout recours judiciaire. À défaut d'accord amiable,
        les tribunaux compétents d'Abidjan seront exclusivement compétents.
      </p>
    </LegalLayout>
  );
}
