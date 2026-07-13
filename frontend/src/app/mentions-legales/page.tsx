import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Mentions légales — SANTAREX ERP',
  description: 'Mentions légales de SANTAREX ERP, édité par IBIG Soft.',
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout
      title="Mentions légales"
      subtitle="Informations légales concernant l'éditeur et l'hébergeur de SANTAREX ERP."
      updatedAt="13 juillet 2026"
      currentPath="/mentions-legales"
    >
      <h2>1. Éditeur du logiciel</h2>
      <p>
        <strong>SANTAREX ERP</strong> est édité par la société <strong>IBIG SARL</strong>,
        opérant sous la marque commerciale <strong>IBIG Soft</strong> (Intermark Business International Group).
      </p>
      <ul>
        <li><strong>Raison sociale :</strong> IBIG SARL</li>
        <li><strong>Forme juridique :</strong> Société à Responsabilité Limitée (SARL)</li>
        <li><strong>Siège social :</strong> Abidjan, Côte d'Ivoire</li>
        <li><strong>Téléphone :</strong> +225 27 22 27 60 14</li>
        <li><strong>WhatsApp :</strong> +225 07 78 88 25 92</li>
        <li><strong>Email :</strong> <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a></li>
        <li><strong>Site web :</strong> <a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer">ibigsoft.com</a></li>
      </ul>

      <h2>2. Directeur de la publication</h2>
      <p>
        Le directeur de la publication est le représentant légal d'IBIG SARL.
        Pour toute question éditoriale, contactez : <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a>.
      </p>

      <h2>3. Hébergement</h2>
      <p>
        SANTAREX ERP est hébergé sur des serveurs sécurisés en Europe.
        Les données des établissements de santé sont stockées de manière isolée et chiffrée.
      </p>
      <ul>
        <li><strong>Prestataire d'infrastructure :</strong> LWS (serveurs dédiés)</li>
        <li><strong>Localisation des données :</strong> Europe</li>
        <li><strong>Disponibilité garantie :</strong> 99,9 % (SLA)</li>
      </ul>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments constituant SANTAREX ERP — code source, interfaces, bases de données,
        logos, marques, contenus textuels et visuels — est la propriété exclusive d'IBIG SARL.
        Toute reproduction, représentation, modification ou exploitation non autorisée est strictement interdite
        et constitue une contrefaçon sanctionnée par la loi.
      </p>
      <p>
        Les marques <strong>SANTAREX</strong>, <strong>IBIG Soft</strong>, <strong>IBIG PARTNERS</strong> et <strong>SARA</strong>
        sont des marques déposées ou en cours de dépôt par IBIG SARL.
      </p>

      <h2>5. Limitation de responsabilité</h2>
      <p>
        IBIG SARL met tout en œuvre pour assurer la disponibilité et l'exactitude des informations
        publiées sur ce site. Toutefois, l'éditeur ne saurait être tenu responsable des erreurs,
        omissions ou résultats qui pourraient être obtenus par un usage inapproprié de ces informations.
      </p>
      <p>
        SANTAREX ERP est un logiciel de gestion administrative et opérationnelle pour les établissements
        de santé. Il ne constitue pas un outil de diagnostic médical et ne remplace en aucun cas
        le jugement clinique des professionnels de santé.
      </p>

      <h2>6. Droit applicable</h2>
      <p>
        Les présentes mentions légales sont régies par le droit ivoirien.
        Tout litige relatif à l'utilisation du site ou du logiciel relève de la compétence exclusive
        des tribunaux d'Abidjan, Côte d'Ivoire.
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute réclamation ou question relative aux présentes mentions légales :<br />
        <a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a> · +225 27 22 27 60 14
      </p>
    </LegalLayout>
  );
}
