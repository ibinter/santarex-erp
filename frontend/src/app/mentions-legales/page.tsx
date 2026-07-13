import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Mentions légales — SANTAREX ERP',
  description: 'Mentions légales de SANTAREX ERP, édité par IBIG Soft.',
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout
      title={{ fr: 'Mentions légales', en: 'Legal notice' }}
      subtitle={{ fr: "Informations légales concernant l'éditeur et l'hébergeur de SANTAREX ERP.", en: 'Legal information about the publisher and host of SANTAREX ERP.' }}
      updatedAt="13 juillet 2026 / July 13, 2026"
      currentPath="/mentions-legales"
      childrenEn={<>
        <h2>1. Software publisher</h2>
        <p><strong>SANTAREX ERP</strong> is published by <strong>IBIG SARL</strong>, operating under the commercial brand <strong>IBIG Soft</strong> (Intermark Business International Group).</p>
        <ul>
          <li><strong>Company name:</strong> IBIG SARL</li>
          <li><strong>Legal form:</strong> Limited Liability Company (SARL)</li>
          <li><strong>Registered office:</strong> Abidjan, Côte d&apos;Ivoire</li>
          <li><strong>Phone:</strong> +225 27 22 27 60 14</li>
          <li><strong>WhatsApp:</strong> +225 07 78 88 25 92</li>
          <li><strong>Email:</strong> <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a></li>
          <li><strong>Website:</strong> <a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer">ibigsoft.com</a></li>
        </ul>
        <h2>2. Publication director</h2>
        <p>The publication director is the legal representative of IBIG SARL. For any editorial question, contact: <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a>.</p>
        <h2>3. Hosting</h2>
        <p>SANTAREX ERP is hosted on secure servers in Europe. Healthcare facility data is stored in an isolated and encrypted environment.</p>
        <ul>
          <li><strong>Infrastructure provider:</strong> LWS (dedicated servers)</li>
          <li><strong>Data location:</strong> Europe</li>
          <li><strong>Guaranteed availability:</strong> 99.9% (SLA)</li>
        </ul>
        <h2>4. Intellectual property</h2>
        <p>All elements constituting SANTAREX ERP — source code, interfaces, databases, logos, trademarks, textual and visual content — are the exclusive property of IBIG SARL. Any unauthorized reproduction, representation, modification or exploitation is strictly prohibited and constitutes an infringement punishable by law.</p>
        <p>The trademarks <strong>SANTAREX</strong>, <strong>IBIG Soft</strong>, <strong>IBIG PARTNERS</strong> and <strong>SARA</strong> are registered or pending trademarks of IBIG SARL.</p>
        <h2>5. Limitation of liability</h2>
        <p>IBIG SARL makes every effort to ensure the availability and accuracy of the information published on this site. However, the publisher cannot be held liable for errors, omissions or results obtained from inappropriate use of this information.</p>
        <p>SANTAREX ERP is an administrative and operational management software for healthcare facilities. It does not constitute a medical diagnosis tool and in no way replaces the clinical judgment of healthcare professionals.</p>
        <h2>6. Applicable law</h2>
        <p>These legal notices are governed by Ivorian law. Any dispute relating to the use of the site or the software falls under the exclusive jurisdiction of the courts of Abidjan, Côte d&apos;Ivoire.</p>
        <h2>7. Contact</h2>
        <p>For any complaint or question regarding these legal notices:<br /><a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a> · +225 27 22 27 60 14</p>
      </>}
    >
      <h2>1. Éditeur du logiciel</h2>
      <p><strong>SANTAREX ERP</strong> est édité par la société <strong>IBIG SARL</strong>, opérant sous la marque commerciale <strong>IBIG Soft</strong> (Intermark Business International Group).</p>
      <ul>
        <li><strong>Raison sociale :</strong> IBIG SARL</li>
        <li><strong>Forme juridique :</strong> Société à Responsabilité Limitée (SARL)</li>
        <li><strong>Siège social :</strong> Abidjan, Côte d&apos;Ivoire</li>
        <li><strong>Téléphone :</strong> +225 27 22 27 60 14</li>
        <li><strong>WhatsApp :</strong> +225 07 78 88 25 92</li>
        <li><strong>Email :</strong> <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a></li>
        <li><strong>Site web :</strong> <a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer">ibigsoft.com</a></li>
      </ul>
      <h2>2. Directeur de la publication</h2>
      <p>Le directeur de la publication est le représentant légal d&apos;IBIG SARL. Pour toute question éditoriale, contactez : <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a>.</p>
      <h2>3. Hébergement</h2>
      <p>SANTAREX ERP est hébergé sur des serveurs sécurisés en Europe. Les données des établissements de santé sont stockées de manière isolée et chiffrée.</p>
      <ul>
        <li><strong>Prestataire d&apos;infrastructure :</strong> LWS (serveurs dédiés)</li>
        <li><strong>Localisation des données :</strong> Europe</li>
        <li><strong>Disponibilité garantie :</strong> 99,9 % (SLA)</li>
      </ul>
      <h2>4. Propriété intellectuelle</h2>
      <p>L&apos;ensemble des éléments constituant SANTAREX ERP — code source, interfaces, bases de données, logos, marques, contenus textuels et visuels — est la propriété exclusive d&apos;IBIG SARL. Toute reproduction, représentation, modification ou exploitation non autorisée est strictement interdite et constitue une contrefaçon sanctionnée par la loi.</p>
      <p>Les marques <strong>SANTAREX</strong>, <strong>IBIG Soft</strong>, <strong>IBIG PARTNERS</strong> et <strong>SARA</strong> sont des marques déposées ou en cours de dépôt par IBIG SARL.</p>
      <h2>5. Limitation de responsabilité</h2>
      <p>IBIG SARL met tout en œuvre pour assurer la disponibilité et l&apos;exactitude des informations publiées sur ce site. Toutefois, l&apos;éditeur ne saurait être tenu responsable des erreurs, omissions ou résultats qui pourraient être obtenus par un usage inapproprié de ces informations.</p>
      <p>SANTAREX ERP est un logiciel de gestion administrative et opérationnelle pour les établissements de santé. Il ne constitue pas un outil de diagnostic médical et ne remplace en aucun cas le jugement clinique des professionnels de santé.</p>
      <h2>6. Droit applicable</h2>
      <p>Les présentes mentions légales sont régies par le droit ivoirien. Tout litige relatif à l&apos;utilisation du site ou du logiciel relève de la compétence exclusive des tribunaux d&apos;Abidjan, Côte d&apos;Ivoire.</p>
      <h2>7. Contact</h2>
      <p>Pour toute réclamation ou question relative aux présentes mentions légales :<br /><a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a> · +225 27 22 27 60 14</p>
    </LegalLayout>
  );
}
