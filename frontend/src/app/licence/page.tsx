import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Contrat de licence — SANTAREX ERP',
  description: "Contrat de licence d'utilisation du logiciel SaaS SANTAREX ERP.",
};

export default function LicencePage() {
  return (
    <LegalLayout
      title={{ fr: 'Contrat de licence', en: 'License agreement' }}
      subtitle={{ fr: "Ce contrat définit les droits et obligations liés à l'utilisation de SANTAREX ERP en tant que service (SaaS).", en: 'This agreement defines the rights and obligations related to the use of SANTAREX ERP as a service (SaaS).' }}
      updatedAt="13 juillet 2026 / July 13, 2026"
      currentPath="/licence"
      childrenEn={<>
        <div className="highlight">
          <p><strong>SANTAREX ERP is SaaS software.</strong> You are not purchasing a perpetual license — you are subscribing to access the service for the duration of your subscription. The data you enter remains your property.</p>
        </div>
        <h2>1. Purpose of the agreement</h2>
        <p>This license agreement (the <strong>"Agreement"</strong>) is entered into between IBIG SARL, operating under the IBIG Soft brand (the <strong>"Publisher"</strong>), and any healthcare facility subscribing to SANTAREX ERP (the <strong>"Client"</strong>).</p>
        <p>It defines the conditions under which the Client is authorized to use the SANTAREX ERP SaaS software and all its modules (the <strong>"Software"</strong>).</p>
        <h2>2. License grant</h2>
        <p>Subject to payment of the applicable subscription and compliance with these terms, the Publisher grants the Client a right of access and use of the Software that is:</p>
        <ul>
          <li><strong>Non-exclusive:</strong> the Publisher may grant the same rights to other clients.</li>
          <li><strong>Non-transferable:</strong> the Client may not transfer this right to a third party.</li>
          <li><strong>Time-limited:</strong> the right of access is valid for the duration of the subscribed plan.</li>
          <li><strong>Scope-limited:</strong> the right of access is limited to the users and modules included in the chosen plan.</li>
        </ul>
        <h2>3. Subscription plans</h2>
        <p>SANTAREX ERP is available in five plans tailored to facility needs:</p>
        <ul>
          <li><strong>Standalone pharmacy:</strong> up to 3 users, pharmacy modules.</li>
          <li><strong>Medical practice:</strong> up to 5 users, outpatient care modules.</li>
          <li><strong>Health center:</strong> up to 15 users, intermediate modules.</li>
          <li><strong>Clinic:</strong> up to 50 users, 12 full clinical modules.</li>
          <li><strong>Hospital:</strong> unlimited users, all 12 clinical modules.</li>
        </ul>
        <p>The annual plan corresponds to 10 months billed for 12 months of service (2 months free). Current pricing is available on the SANTAREX ERP pricing page.</p>
        <h2>4. Use restrictions</h2>
        <p>The Client is strictly prohibited from:</p>
        <ul>
          <li>Decompiling, disassembling, or attempting to reconstruct the Software&apos;s source code.</li>
          <li>Reproducing, copying, or distributing the Software or any part thereof.</li>
          <li>Sublicensing, renting, or making the Software available to unauthorized third parties.</li>
          <li>Modifying, adapting, or creating derivative works of the Software.</li>
          <li>Using the Software for illegal purposes or contrary to medical ethics.</li>
          <li>Attempting to circumvent security, authentication, or billing mechanisms.</li>
          <li>Removing or modifying intellectual property notices or Publisher trademarks.</li>
        </ul>
        <h2>5. Intellectual property</h2>
        <p>SANTAREX ERP, its source code, architecture, user interfaces, databases, algorithms, and any related innovation are and remain the exclusive property of IBIG SARL. This agreement transfers no ownership rights in the Software to the Client.</p>
        <p>The trademarks <strong>SANTAREX</strong>, <strong>IBIG Soft</strong>, <strong>SARA</strong>, and <strong>IBIG PARTNERS</strong> are the Publisher&apos;s trademarks. Their use without prior written authorization is prohibited.</p>
        <h2>6. Client data</h2>
        <p>Data entered into SANTAREX ERP by the Client (patient data, medical records, administrative data) remains the exclusive property of the Client. The Publisher acts as a data processor under GDPR and may not use this data for any purpose other than providing the service.</p>
        <p>Upon expiry or termination of the agreement, the Client has 30 days to export all their data. After this period, data is securely and irreversibly deleted.</p>
        <h2>7. Updates and evolution</h2>
        <p>The Publisher reserves the right to modify, improve, or evolve the Software at any time, including by modifying features, interface, or available modules. Updates are included in the subscription and deployed automatically.</p>
        <p>Substantial changes that may affect the Client&apos;s workflows will be communicated with 30 days&apos; notice.</p>
        <h2>8. Warranties and limitation of liability</h2>
        <p>The Software is provided as-is. The Publisher guarantees 99.9% availability (SLA) for Clinic and Hospital plans. For other plans, the Publisher commits to making every effort to ensure service continuity.</p>
        <p>The Publisher&apos;s liability is in any event limited to the subscription fees paid by the Client over the last 12 months. The Publisher cannot be held liable for any indirect damages, data loss, loss of business, or medical decisions made based on information provided by the Software.</p>
        <div className="highlight">
          <p><strong>Important:</strong> SANTAREX ERP is an administrative and operational management tool. It does not constitute a medical decision system and in no way replaces the clinical judgment of healthcare professionals.</p>
        </div>
        <h2>9. Termination</h2>
        <p>The Client may cancel their subscription at any time from their admin panel, effective at the end of the current subscription period.</p>
        <p>The Publisher may terminate this agreement by operation of law in case of a serious breach by the Client of any obligation under this Agreement, after formal notice sent by email and remaining unaddressed for 15 days.</p>
        <h2>10. Applicable law and jurisdiction</h2>
        <p>This agreement is governed by Ivorian law. In case of dispute, the parties agree to attempt to resolve it amicably before any legal action. Failing amicable resolution within 60 days, the dispute shall be submitted to the exclusive jurisdiction of the courts of Abidjan, Côte d&apos;Ivoire.</p>
        <h2>11. Contact</h2>
        <p>For any question regarding this license agreement:<br /><a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a> · +225 27 22 27 60 14</p>
      </>}
    >
      <div className="highlight">
        <p><strong>SANTAREX ERP est un logiciel SaaS.</strong> Vous n&apos;achetez pas une licence perpétuelle — vous souscrivez un droit d&apos;accès au service pour la durée de votre abonnement. Les données que vous saisissez restent votre propriété.</p>
      </div>
      <h2>1. Objet du contrat</h2>
      <p>Le présent contrat de licence (ci-après le <strong>« Contrat »</strong>) est conclu entre IBIG SARL, opérant sous la marque IBIG Soft (ci-après l&apos;<strong>« Éditeur »</strong>), et tout établissement de santé souscrivant un abonnement SANTAREX ERP (ci-après le <strong>« Client »</strong>).</p>
      <p>Il définit les conditions dans lesquelles le Client est autorisé à utiliser le logiciel SaaS SANTAREX ERP et tous ses modules (ci-après le <strong>« Logiciel »</strong>).</p>
      <h2>2. Octroi de la licence</h2>
      <p>Sous réserve du paiement de l&apos;abonnement en vigueur et du respect des présentes conditions, l&apos;Éditeur accorde au Client un droit d&apos;accès et d&apos;utilisation du Logiciel qui est :</p>
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
      <p>Le forfait annuel correspond à 10 mois facturés pour 12 mois de service (2 mois offerts). Les tarifs en vigueur sont consultables sur la page Tarification du site SANTAREX ERP.</p>
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
      <p>SANTAREX ERP, son code source, son architecture, ses interfaces utilisateur, ses bases de données, ses algorithmes et toute innovation afférente sont et demeurent la propriété exclusive d&apos;IBIG SARL. Le présent contrat ne transfère au Client aucun droit de propriété sur le Logiciel.</p>
      <p>Les marques <strong>SANTAREX</strong>, <strong>IBIG Soft</strong>, <strong>SARA</strong> et <strong>IBIG PARTNERS</strong> sont des marques de l&apos;Éditeur. Leur utilisation sans autorisation écrite préalable est interdite.</p>
      <h2>6. Données du Client</h2>
      <p>Les données saisies dans SANTAREX ERP par le Client (données patients, dossiers médicaux, données administratives) restent la propriété exclusive du Client. L&apos;Éditeur agit en qualité de sous-traitant au sens du RGPD et ne peut pas utiliser ces données à d&apos;autres fins que la fourniture du service.</p>
      <p>À l&apos;expiration ou résiliation du contrat, le Client dispose d&apos;un délai de 30 jours pour exporter l&apos;intégralité de ses données. Passé ce délai, les données sont supprimées de manière sécurisée et irréversible.</p>
      <h2>7. Mises à jour et évolutions</h2>
      <p>L&apos;Éditeur se réserve le droit de modifier, améliorer ou faire évoluer le Logiciel à tout moment, y compris en modifiant les fonctionnalités, l&apos;interface ou les modules disponibles. Les mises à jour sont incluses dans l&apos;abonnement et déployées automatiquement.</p>
      <p>Les modifications substantielles pouvant affecter les flux de travail du Client seront communiquées avec un préavis de 30 jours.</p>
      <h2>8. Garanties et limitation de responsabilité</h2>
      <p>Le Logiciel est fourni en l&apos;état. L&apos;Éditeur garantit une disponibilité de 99,9 % (SLA) pour les formules Clinique et Hôpital. Pour les autres formules, l&apos;Éditeur s&apos;engage à mettre tous les moyens en œuvre pour assurer la continuité du service.</p>
      <p>La responsabilité de l&apos;Éditeur est en tout état de cause limitée au montant des abonnements versés par le Client au cours des 12 derniers mois. L&apos;Éditeur ne saurait être tenu responsable de tout préjudice indirect, perte de données, perte d&apos;exploitation ou décision médicale prise sur la base des informations fournies par le Logiciel.</p>
      <div className="highlight">
        <p><strong>Important :</strong> SANTAREX ERP est un outil de gestion administrative et opérationnelle. Il ne constitue pas un système de décision médicale et ne remplace en aucun cas le jugement clinique des professionnels de santé.</p>
      </div>
      <h2>9. Résiliation</h2>
      <p>Le Client peut résilier son abonnement à tout moment depuis son espace administration, avec effet à la fin de la période d&apos;abonnement en cours.</p>
      <p>L&apos;Éditeur peut résilier le présent contrat de plein droit en cas de manquement grave du Client à l&apos;une des obligations du présent Contrat, après mise en demeure adressée par email et restée sans effet pendant 15 jours.</p>
      <h2>10. Droit applicable et juridiction</h2>
      <p>Le présent contrat est régi par le droit ivoirien. En cas de litige, les parties s&apos;engagent à tenter de le résoudre à l&apos;amiable avant tout recours judiciaire. À défaut d&apos;accord amiable dans un délai de 60 jours, le litige sera soumis à la compétence exclusive des tribunaux d&apos;Abidjan, Côte d&apos;Ivoire.</p>
      <h2>11. Contact</h2>
      <p>Pour toute question relative au présent contrat de licence :<br /><a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a> · +225 27 22 27 60 14</p>
    </LegalLayout>
  );
}
