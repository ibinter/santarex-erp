import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation — SANTAREX ERP',
  description: 'Conditions générales d\'utilisation du logiciel SaaS SANTAREX ERP, produit par IBIG SOFT.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3" style={{ color: '#0D47A1' }}>{title}</h2>
      <div className="text-gray-600 text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function CGUPage() {
  const date = '12 juillet 2026';
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-3xl mx-auto px-5 py-16">
        <Link href="/" className="text-sm text-blue-700 hover:underline mb-6 inline-block">← Retour à l'accueil</Link>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : {date}</p>

        <Section title="1. Présentation du service">
          <p>SANTAREX ERP est un logiciel SaaS de gestion hospitalière édité par <strong>IBIG SOFT (IBIG SARL — Intermark Business International Group)</strong>, société de droit ivoirien, dont le siège social est à Abidjan, Côte d'Ivoire.</p>
          <p>Contact : <a href="mailto:contact@ibigsoft.com" className="text-blue-700 underline">contact@ibigsoft.com</a> — +225 27 22 27 60 14 — <a href="https://ibigsoft.com" className="text-blue-700 underline">ibigsoft.com</a></p>
        </Section>

        <Section title="2. Acceptation des conditions">
          <p>L'accès et l'utilisation du logiciel SANTAREX ERP impliquent l'acceptation pleine et entière des présentes CGU. Tout établissement de santé ou utilisateur qui accède au service reconnaît avoir lu et accepté ces conditions.</p>
        </Section>

        <Section title="3. Description du service">
          <p>SANTAREX ERP est une plateforme SaaS multi-tenant permettant la gestion informatisée des établissements de santé : dossiers patients, consultations, pharmacie, laboratoire, facturation, urgences et hospitalisation.</p>
          <p>Le service est accessible via Internet depuis un navigateur web, sans installation locale requise.</p>
        </Section>

        <Section title="4. Accès et compte utilisateur">
          <p>L'accès au service est conditionné à la souscription d'une licence valide et à la création d'un compte administrateur par l'établissement. Chaque utilisateur est responsable de la confidentialité de ses identifiants.</p>
          <p>Tout accès non autorisé doit être immédiatement signalé à IBIG SOFT.</p>
        </Section>

        <Section title="5. Licences et abonnements">
          <p>Le service est fourni sur abonnement mensuel ou annuel selon l'offre souscrite (STARTER, PROFESSIONNEL, ENTERPRISE). Les tarifs sont exprimés en FCFA HT.</p>
          <p>Un essai gratuit de 30 jours peut être accordé sans engagement. À l'issue de l'essai, la poursuite du service nécessite la souscription d'un plan payant.</p>
        </Section>

        <Section title="6. Obligations de l'utilisateur">
          <p>L'utilisateur s'engage à :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Utiliser le service conformément à sa destination médicale et légale</li>
            <li>Ne pas partager ses identifiants avec des tiers non autorisés</li>
            <li>Respecter la confidentialité des données médicales des patients</li>
            <li>Signaler tout dysfonctionnement à IBIG SOFT dans les meilleurs délais</li>
            <li>S'assurer de la conformité de l'usage avec la réglementation sanitaire applicable</li>
          </ul>
        </Section>

        <Section title="7. Données médicales et confidentialité">
          <p>Les données des patients hébergées sur SANTAREX ERP constituent des données personnelles de santé. IBIG SOFT s'engage à assurer leur protection conformément aux réglementations applicables en matière de protection des données personnelles.</p>
          <p>Consultez notre <Link href="/confidentialite" className="text-blue-700 underline">Politique de confidentialité</Link> pour les détails.</p>
        </Section>

        <Section title="8. Disponibilité du service">
          <p>IBIG SOFT s'efforce de maintenir le service disponible 24h/24, 7j/7, mais ne peut garantir une disponibilité sans interruption. Des maintenances planifiées seront notifiées par email avec un préavis minimum de 48 heures.</p>
        </Section>

        <Section title="9. Responsabilité">
          <p>IBIG SOFT ne saurait être tenu responsable des préjudices résultant d'une utilisation non conforme du service, d'une interruption de la connectivité Internet, ou de données incorrectement saisies par les utilisateurs.</p>
          <p>La responsabilité médicale des actes effectués reste entièrement à la charge des professionnels de santé utilisateurs du service.</p>
        </Section>

        <Section title="10. Modifications des CGU">
          <p>IBIG SOFT se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification significative par email au moins 30 jours avant son entrée en vigueur.</p>
        </Section>

        <Section title="11. Droit applicable">
          <p>Les présentes CGU sont régies par le droit ivoirien. Tout litige relatif à leur interprétation ou exécution sera soumis aux tribunaux compétents d'Abidjan, Côte d'Ivoire.</p>
        </Section>
      </div>
    </div>
  );
}
