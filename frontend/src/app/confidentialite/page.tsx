import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — SANTAREX ERP',
  description: 'Comment SANTAREX ERP collecte, traite et protège vos données personnelles et médicales.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3" style={{ color: '#0D47A1' }}>{title}</h2>
      <div className="text-gray-600 text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-3xl mx-auto px-5 py-16">
        <Link href="/" className="text-sm text-blue-700 hover:underline mb-6 inline-block">← Retour à l'accueil</Link>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 12 juillet 2026</p>

        <Section title="1. Responsable du traitement">
          <p><strong>IBIG SOFT (IBIG SARL)</strong> — Abidjan, Côte d'Ivoire<br />
          Contact DPO : <a href="mailto:contact@ibigsoft.com" className="text-blue-700 underline">contact@ibigsoft.com</a></p>
        </Section>

        <Section title="2. Données collectées">
          <p><strong>Données d'établissement :</strong> nom, adresse, coordonnées de contact, informations de facturation.</p>
          <p><strong>Données utilisateurs :</strong> nom, prénom, email professionnel, rôle dans l'établissement.</p>
          <p><strong>Données patients (hébergées pour le compte de l'établissement) :</strong> identité, coordonnées, données médicales, consultations, prescriptions, résultats d'analyses.</p>
          <p><strong>Données techniques :</strong> logs de connexion, adresses IP, user-agents, journaux d'audit.</p>
        </Section>

        <Section title="3. Finalités du traitement">
          <ul className="list-disc list-inside space-y-1">
            <li>Fourniture et amélioration du service SANTAREX ERP</li>
            <li>Gestion des abonnements et de la facturation</li>
            <li>Sécurité et prévention des fraudes</li>
            <li>Communication sur les évolutions du service</li>
            <li>Respect des obligations légales et réglementaires</li>
          </ul>
        </Section>

        <Section title="4. Base légale">
          <p>Le traitement des données est fondé sur :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>L'exécution du contrat (CGU et accord de service) pour les données de compte</li>
            <li>L'obligation légale pour certains traitements de données de santé</li>
            <li>L'intérêt légitime pour la sécurité et les logs techniques</li>
          </ul>
        </Section>

        <Section title="5. Hébergement et sécurité des données">
          <p>Les données sont hébergées sur des serveurs sécurisés. IBIG SOFT met en œuvre des mesures techniques et organisationnelles appropriées : chiffrement TLS, authentification JWT, contrôle d'accès par rôle, journal d'audit complet.</p>
          <p>Les données médicales des patients restent sous la responsabilité de l'établissement de santé. IBIG SOFT agit en qualité de sous-traitant pour ces données.</p>
        </Section>

        <Section title="6. Durée de conservation">
          <ul className="list-disc list-inside space-y-1">
            <li>Données de compte : durée du contrat + 3 ans</li>
            <li>Données médicales : selon les exigences légales applicables à l'établissement de santé (minimum 10 ans en Côte d'Ivoire)</li>
            <li>Logs techniques : 12 mois glissants</li>
          </ul>
        </Section>

        <Section title="7. Vos droits">
          <p>Vous disposez des droits suivants sur vos données personnelles :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Droit d'accès et de rectification</li>
            <li>Droit à l'effacement (dans les limites légales)</li>
            <li>Droit à la portabilité des données</li>
            <li>Droit d'opposition au traitement</li>
          </ul>
          <p>Pour exercer ces droits, contactez : <a href="mailto:contact@ibigsoft.com" className="text-blue-700 underline">contact@ibigsoft.com</a></p>
        </Section>

        <Section title="8. Cookies">
          <p>Consultez notre <Link href="/cookies" className="text-blue-700 underline">politique cookies</Link> pour les informations sur l'utilisation des cookies sur SANTAREX ERP.</p>
        </Section>
      </div>
    </div>
  );
}
