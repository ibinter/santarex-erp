import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Contrat de licence — SANTAREX ERP',
  description: 'Contrat de licence d\'utilisation du logiciel SaaS SANTAREX ERP.',
};

export default function LicencePage() {
  return (
    <LegalLayout
      title="Contrat de licence"
      subtitle="Ce contrat définit les droits et obligations liés à l'utilisation de SANTAREX ERP en tant que service (SaaS)."
      updatedAt="13 juillet 2026"
      currentPath="/licence"
    >
      <div className="highlight">
        <p><strong>SANTAREX ERP est un logiciel SaaS.</strong> Vous n&apos;achetez pas une licence perpétuelle — vous souscrivez un droit d&apos;accès au service pour la durée de votre abonnement. Les données que vous saisissez restent votre propriété.</p>
      </div>

      <h2>1. Objet du contrat</h2>
      <p>
        Le présent contrat de licence (ci-après le <strong>« Contrat »</strong>) est conclu entre
        IBIG SARL, opérant sous la marque IBIG Soft (ci-après l&apos;<strong>« Éditeur »</strong>),
        et tout établissement de santé souscrivant un abonnement SANTAREX ERP (ci-après le <strong>« Client »</strong>).
      </p>
      <p>
        Il définit les conditions dans lesquelles le Client est autorisé à utiliser le logiciel
        SaaS SANTAREX ERP et tous ses modules (ci-après le <strong>« Logiciel »</strong>).
      </p>

      <h2>2. Octroi de la licence</h2>
      <p>
        Sous réserve du paiement de l&apos;abonnement en vigueur et du respect des présentes conditions,
        l&apos;Éditeur accorde au Client un droit d&apos;accès et d&apos;utilisation du Logiciel qui est :
      </p>
      <ul>
        <li><strong>Non exclusif :</strong> l&apos;Éditeur peut concéder les mêmes droits à d&apos;autres clients.</li>
        <li><strong>Non transférable :</strong> le Client ne peut pas céder ce droit à un tiers.</li>
        <li><strong>Limité dans le temps :</strong> le droit d&apos;accès est valide pour la durée de l&apos;abonnement souscrit.</li>
        <li><strong>Limité en périmètre :</strong> le droit d&apos;accès est limité aux utilisateurs et modules inclus dans la formule choisie.</li>
      </ul>

      <h2>3. Formules d&apos;abonnement</h2>
      <p>SANTAREX ERP est disponible en cinq formules adaptées aux besoins des établissements :</p>
      <ul>
        <li><strong>Pharmacie autonome :</strong> jusqu&apos;à 3 utilisateurs, modules pharmacie.</li>
        <li><strong>Cabinet médical :</strong> jusqu&apos;à 5 utilisateurs, modules soins ambulatoires.</li>
        <li><strong>Centre de santé :</strong> jusqu&apos;à 15 utilisateurs, modules intermédiaires.</li>
        <li><strong>Clinique :</strong> jusqu&apos;à 50 utilisateurs, 12 modules cliniques complets.</li>
        <li><strong>Hôpital :</strong> utilisateurs illimités, tous les 12 modules cliniques.</li>
      </ul>
      <p>
        Le forfait annuel correspond à 10 mois facturés pour 12 mois de service (2 mois offerts).
        Les tarifs en vigueur sont consultables sur la page Tarification du site SANTAREX ERP.
      </p>

      <h2>4. Restrictions d&apos;utilisation</h2>
      <p>Il est strictement interdit au Client de :</p>
      <ul>
        <li>Décompiler, désassembler ou tenter de reconstituer le code source du Logiciel.</li>
        <li>Reproduire, copier ou distribuer le Logiciel ou toute partie de celui-ci.</li>
        <li>Sous-licencier, louer ou mettre à disposition le Logiciel à des tiers non autorisés.</li>
        <li>Modifier, adapter ou créer des œuvres dérivées du Logiciel.</li>
        <li>Utiliser le Logiciel à des fins illégales ou contraires à la déontologie médicale.</li>
        <li>Tenter de contourner les mécanismes de sécurité, d&apos;authentification ou de facturation.</li>
        <li>Supprimer ou modifier les mentions de propriété intellectuelle ou les marques de l&apos;Éditeur.</li>
      </ul>

      <h2>5. Propriété intellectuelle</h2>
      <p>
        SANTAREX ERP, son code source, son architecture, ses interfaces utilisateur, ses bases de données,
        ses algorithmes et toute innovation afférente sont et demeurent la propriété exclusive d&apos;IBIG SARL.
        Le présent contrat ne transfère au Client aucun droit de propriété sur le Logiciel.
      </p>
      <p>
        Les marques <strong>SANTAREX</strong>, <strong>IBIG Soft</strong>, <strong>SARA</strong> et
        <strong>IBIG PARTNERS</strong> sont des marques de l&apos;Éditeur. Leur utilisation sans autorisation
        écrite préalable est interdite.
      </p>

      <h2>6. Données du Client</h2>
      <p>
        Les données saisies dans SANTAREX ERP par le Client (données patients, dossiers médicaux,
        données administratives) restent la propriété exclusive du Client.
        L&apos;Éditeur agit en qualité de sous-traitant au sens du RGPD et ne peut pas utiliser ces
        données à d&apos;autres fins que la fourniture du service.
      </p>
      <p>
        À l&apos;expiration ou résiliation du contrat, le Client dispose d&apos;un délai de 30 jours
        pour exporter l&apos;intégralité de ses données. Passé ce délai, les données sont supprimées
        de manière sécurisée et irréversible.
      </p>

      <h2>7. Mises à jour et évolutions</h2>
      <p>
        L&apos;Éditeur se réserve le droit de modifier, améliorer ou faire évoluer le Logiciel à tout moment,
        y compris en modifiant les fonctionnalités, l&apos;interface ou les modules disponibles.
        Les mises à jour sont incluses dans l&apos;abonnement et déployées automatiquement.
      </p>
      <p>
        Les modifications substantielles pouvant affecter les flux de travail du Client seront
        communiquées avec un préavis de 30 jours.
      </p>

      <h2>8. Garanties et limitation de responsabilité</h2>
      <p>
        Le Logiciel est fourni en l&apos;état. L&apos;Éditeur garantit une disponibilité de 99,9 %
        (SLA) pour les formules Clinique et Hôpital. Pour les autres formules, l&apos;Éditeur s&apos;engage
        à mettre tous les moyens en œuvre pour assurer la continuité du service.
      </p>
      <p>
        La responsabilité de l&apos;Éditeur est en tout état de cause limitée au montant des abonnements
        versés par le Client au cours des 12 derniers mois. L&apos;Éditeur ne saurait être tenu responsable
        de tout préjudice indirect, perte de données, perte d&apos;exploitation ou décision médicale
        prise sur la base des informations fournies par le Logiciel.
      </p>
      <div className="highlight">
        <p><strong>Important :</strong> SANTAREX ERP est un outil de gestion administrative et opérationnelle. Il ne constitue pas un système de décision médicale et ne remplace en aucun cas le jugement clinique des professionnels de santé.</p>
      </div>

      <h2>9. Résiliation</h2>
      <p>
        Le Client peut résilier son abonnement à tout moment depuis son espace administration,
        avec effet à la fin de la période d&apos;abonnement en cours.
      </p>
      <p>
        L&apos;Éditeur peut résilier le présent contrat de plein droit en cas de manquement grave
        du Client à l&apos;une des obligations du présent Contrat, après mise en demeure adressée par
        email et restée sans effet pendant 15 jours.
      </p>

      <h2>10. Droit applicable et juridiction</h2>
      <p>
        Le présent contrat est régi par le droit ivoirien. En cas de litige, les parties s&apos;engagent
        à tenter de le résoudre à l&apos;amiable avant tout recours judiciaire.
        À défaut d&apos;accord amiable dans un délai de 60 jours, le litige sera soumis à la compétence
        exclusive des tribunaux d&apos;Abidjan, Côte d&apos;Ivoire.
      </p>

      <h2>11. Contact</h2>
      <p>
        Pour toute question relative au présent contrat de licence :<br />
        <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a> · +225 27 22 27 60 14
      </p>
    </LegalLayout>
  );
}
