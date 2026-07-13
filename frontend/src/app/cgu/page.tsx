import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — SANTAREX ERP",
  description: "Conditions générales d'utilisation de SANTAREX ERP.",
};

export default function CguPage() {
  return (
    <LegalLayout
      title={{ fr: "Conditions Générales d'Utilisation", en: 'Terms of Use' }}
      subtitle={{ fr: "En accédant à SANTAREX ERP, vous acceptez les présentes conditions. Lisez-les attentivement.", en: 'By accessing SANTAREX ERP, you accept these terms. Please read them carefully.' }}
      updatedAt="13 juillet 2026 / July 13, 2026"
      currentPath="/cgu"
      childrenEn={<>
        <div className="highlight">
          <p>These Terms of Use apply to all users of SANTAREX ERP, whether they access the platform via the web, a mobile app, or an API. Using SANTAREX ERP implies full acceptance of these terms.</p>
        </div>
        <h2>1. Definitions</h2>
        <ul>
          <li><strong>Publisher:</strong> IBIG SARL, operating under the IBIG Soft brand.</li>
          <li><strong>Client:</strong> any healthcare facility that has subscribed to SANTAREX ERP.</li>
          <li><strong>User:</strong> any individual authorized by the Client to access the Software.</li>
          <li><strong>Software:</strong> the SANTAREX ERP SaaS platform and all its modules.</li>
          <li><strong>Health data:</strong> any information relating to a patient&apos;s state of health.</li>
        </ul>
        <h2>2. Access to the software</h2>
        <p>Access to SANTAREX ERP requires creating a facility account and paying the subscription fee for the chosen plan. The Publisher grants the Client a non-exclusive, non-transferable, revocable right of access to the Software for the duration of the subscription.</p>
        <p>Each User is responsible for keeping their login credentials confidential. Any access made using a User&apos;s credentials is deemed to have been made by that User. The Client agrees to immediately report any unauthorized use.</p>
        <h2>3. Client obligations</h2>
        <p>The Client agrees to:</p>
        <ul>
          <li>Use the Software exclusively for lawful purposes within their healthcare activity.</li>
          <li>Not attempt to decompile, modify, reverse-engineer, or copy the Software.</li>
          <li>Not resell, sublicense, or make the Software available to unauthorized third parties.</li>
          <li>Keep their facility account information up to date.</li>
          <li>Comply with applicable health data regulations.</li>
          <li>Train their users in the correct use of the Software.</li>
        </ul>
        <h2>4. Subscriptions and billing</h2>
        <p>SANTAREX ERP is offered as a monthly or annual subscription. Current pricing is displayed at <a href="/#pricing">santarex.ibigsoft.com</a>. The subscription renews automatically at each due date, unless the Client cancels at least 15 days before the renewal date.</p>
        <p>The annual plan corresponds to 10 months billed for 12 months of use (2 months free). In case of early termination of an annual plan, unused months are not refunded.</p>
        <p>Any payment delay exceeding 15 days may result in suspension of access to the Software.</p>
        <h2>5. Availability and maintenance</h2>
        <p>The Publisher commits to maintaining 99.9% availability (SLA) for Clinic and Hospital plans. Planned interruptions may occur for maintenance, with 48 hours&apos; notice communicated by email.</p>
        <p>The Publisher cannot be held responsible for interruptions due to external causes (network outages, force majeure, external cyberattacks).</p>
        <h2>6. Data and confidentiality</h2>
        <p>The Client retains ownership of all their data, including their patients&apos; health data. The Publisher acts as a data processor under GDPR. Data processing is described in the <a href="/confidentialite">Privacy Policy</a>.</p>
        <p>Upon termination, the Client has 30 days to export their data. After this period, data is securely deleted.</p>
        <h2>7. Liability</h2>
        <p>The Publisher&apos;s liability is limited to the subscription fees paid by the Client over the last 12 months. The Publisher cannot be held liable for indirect damages, loss of business, data loss, or medical decisions made based on information displayed in the Software.</p>
        <h2>8. Termination</h2>
        <p>Either party may terminate the contract at any time. The Client may terminate from their admin panel or by email to <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a>. The Publisher may terminate in case of a serious breach of these Terms, after formal notice remaining unaddressed for 15 days.</p>
        <h2>9. Amendments</h2>
        <p>The Publisher reserves the right to amend these Terms. The Client will be notified by email at least 30 days before any substantial amendment takes effect. Continued use of the Software after this period constitutes acceptance of the new terms.</p>
        <h2>10. Applicable law and jurisdiction</h2>
        <p>These Terms are governed by Ivorian law. In case of dispute, the parties agree to seek an amicable solution before any legal action. Failing an amicable agreement, the competent courts of Abidjan shall have exclusive jurisdiction.</p>
      </>}
    >
      <div className="highlight">
        <p>Ces CGU s&apos;appliquent à tous les utilisateurs de SANTAREX ERP, qu&apos;ils accèdent à la plateforme via le web, une application mobile ou une API. L&apos;utilisation de SANTAREX ERP implique l&apos;acceptation pleine et entière des présentes conditions.</p>
      </div>
      <h2>1. Définitions</h2>
      <ul>
        <li><strong>Éditeur :</strong> IBIG SARL, opérant sous la marque IBIG Soft.</li>
        <li><strong>Client :</strong> tout établissement de santé ayant souscrit un abonnement SANTAREX ERP.</li>
        <li><strong>Utilisateur :</strong> toute personne physique autorisée par le Client à accéder au Logiciel.</li>
        <li><strong>Logiciel :</strong> la plateforme SaaS SANTAREX ERP et tous ses modules.</li>
        <li><strong>Données de santé :</strong> toute information relative à l&apos;état de santé d&apos;un patient.</li>
      </ul>
      <h2>2. Accès au logiciel</h2>
      <p>L&apos;accès à SANTAREX ERP est subordonné à la création d&apos;un compte établissement et au paiement de l&apos;abonnement correspondant à la formule choisie. L&apos;Éditeur consent au Client un droit d&apos;accès non exclusif, non transférable et révocable au Logiciel, pour la durée de l&apos;abonnement.</p>
      <p>Chaque Utilisateur est responsable de la confidentialité de ses identifiants de connexion. Tout accès effectué à l&apos;aide des identifiants d&apos;un Utilisateur est réputé effectué par cet Utilisateur. Le Client s&apos;engage à signaler sans délai toute utilisation non autorisée.</p>
      <h2>3. Obligations du Client</h2>
      <p>Le Client s&apos;engage à :</p>
      <ul>
        <li>Utiliser le Logiciel exclusivement à des fins légales et dans le cadre de son activité de santé.</li>
        <li>Ne pas tenter de décompiler, modifier, reverse-engineer ou copier le Logiciel.</li>
        <li>Ne pas revendre, sous-licencier ou mettre à disposition le Logiciel à des tiers non autorisés.</li>
        <li>Maintenir à jour les informations de son compte établissement.</li>
        <li>Respecter la réglementation applicable en matière de données de santé.</li>
        <li>Former ses utilisateurs à l&apos;utilisation correcte du Logiciel.</li>
      </ul>
      <h2>4. Abonnements et facturation</h2>
      <p>SANTAREX ERP est proposé sous forme d&apos;abonnement mensuel ou annuel. Les tarifs en vigueur sont affichés sur <a href="/#pricing">santarex.ibigsoft.com</a>. L&apos;abonnement est renouvelé automatiquement à chaque échéance, sauf résiliation par le Client au moins 15 jours avant la date d&apos;échéance.</p>
      <p>Le forfait annuel correspond à 10 mois facturés pour 12 mois d&apos;utilisation (2 mois offerts). En cas de résiliation anticipée d&apos;un forfait annuel, les mois non consommés ne sont pas remboursés.</p>
      <p>Tout retard de paiement supérieur à 15 jours peut entraîner la suspension de l&apos;accès au Logiciel.</p>
      <h2>5. Disponibilité et maintenance</h2>
      <p>L&apos;Éditeur s&apos;engage à maintenir une disponibilité de 99,9 % (SLA) pour les formules Clinique et Hôpital. Des interruptions planifiées peuvent survenir pour maintenance, avec un préavis de 48 heures communiqué par email.</p>
      <p>L&apos;Éditeur ne saurait être tenu responsable des interruptions dues à des causes extérieures (coupures réseau de l&apos;opérateur, force majeure, cyberattaques externes).</p>
      <h2>6. Données et confidentialité</h2>
      <p>Le Client reste propriétaire de l&apos;ensemble de ses données, y compris les données de santé de ses patients. L&apos;Éditeur agit en qualité de sous-traitant au sens du RGPD. Le traitement des données est décrit dans la <a href="/confidentialite">Politique de confidentialité</a>.</p>
      <p>À la résiliation du contrat, le Client dispose de 30 jours pour exporter ses données. Passé ce délai, les données sont supprimées de manière sécurisée.</p>
      <h2>7. Responsabilité</h2>
      <p>La responsabilité de l&apos;Éditeur est limitée au montant des abonnements versés par le Client au cours des 12 derniers mois. L&apos;Éditeur ne saurait être tenu responsable des préjudices indirects, pertes d&apos;exploitation, pertes de données ou décisions médicales prises sur la base des informations affichées dans le Logiciel.</p>
      <h2>8. Résiliation</h2>
      <p>Chaque partie peut résilier le contrat à tout moment. Le Client peut résilier depuis son espace administration ou par email à <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a>. L&apos;Éditeur peut résilier en cas de manquement grave aux présentes CGU, après mise en demeure restée sans effet pendant 15 jours.</p>
      <h2>9. Modifications des CGU</h2>
      <p>L&apos;Éditeur se réserve le droit de modifier les présentes CGU. Le Client sera informé par email au moins 30 jours avant l&apos;entrée en vigueur de toute modification substantielle. La poursuite de l&apos;utilisation du Logiciel après cette période vaut acceptation des nouvelles conditions.</p>
      <h2>10. Droit applicable et juridiction</h2>
      <p>Les présentes CGU sont régies par le droit ivoirien. En cas de litige, les parties s&apos;engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d&apos;accord amiable, les tribunaux compétents d&apos;Abidjan seront exclusivement compétents.</p>
    </LegalLayout>
  );
}
