import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique cookies — SANTAREX ERP',
  description: 'Utilisation des cookies et technologies similaires sur la plateforme SANTAREX ERP.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3" style={{ color: '#0D47A1' }}>{title}</h2>
      <div className="text-gray-600 text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-3xl mx-auto px-5 py-16">
        <Link href="/" className="text-sm text-blue-700 hover:underline mb-6 inline-block">← Retour à l'accueil</Link>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Politique cookies</h1>
        <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 12 juillet 2026</p>

        <Section title="1. Qu'est-ce qu'un cookie ?">
          <p>Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette, smartphone) lorsque vous visitez un site web. Il permet de mémoriser des informations relatives à votre navigation.</p>
        </Section>

        <Section title="2. Cookies utilisés par SANTAREX ERP">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-200 p-2 text-left font-semibold">Nom</th>
                <th className="border border-gray-200 p-2 text-left font-semibold">Type</th>
                <th className="border border-gray-200 p-2 text-left font-semibold">Durée</th>
                <th className="border border-gray-200 p-2 text-left font-semibold">Finalité</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 p-2">santarex_token</td>
                <td className="border border-gray-200 p-2">Essentiel</td>
                <td className="border border-gray-200 p-2">Session</td>
                <td className="border border-gray-200 p-2">Authentification sécurisée (JWT)</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 p-2">santarex_user</td>
                <td className="border border-gray-200 p-2">Essentiel</td>
                <td className="border border-gray-200 p-2">Session</td>
                <td className="border border-gray-200 p-2">Informations de session utilisateur</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2">santarex_prefs</td>
                <td className="border border-gray-200 p-2">Fonctionnel</td>
                <td className="border border-gray-200 p-2">30 jours</td>
                <td className="border border-gray-200 p-2">Préférences d'interface (langue, thème)</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="3. Cookies essentiels">
          <p>Les cookies essentiels sont indispensables au fonctionnement de l'application. Ils permettent notamment la gestion de votre session authentifiée. Ils ne peuvent pas être désactivés sans empêcher l'utilisation du service.</p>
        </Section>

        <Section title="4. Cookies fonctionnels">
          <p>Ces cookies mémorisent vos préférences (langue, paramètres d'affichage) pour améliorer votre expérience. Ils ne sont pas nécessaires au fonctionnement du service et peuvent être refusés.</p>
        </Section>

        <Section title="5. Absence de cookies tiers à des fins publicitaires">
          <p>SANTAREX ERP est une application professionnelle. Nous n'utilisons aucun cookie publicitaire, aucun outil de tracking comportemental cross-site, et aucun réseau publicitaire.</p>
        </Section>

        <Section title="6. Gestion des cookies">
          <p>Vous pouvez configurer votre navigateur pour refuser tout ou partie des cookies. Notez que la désactivation des cookies essentiels rendra le service inaccessible.</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies</li>
            <li><strong>Firefox :</strong> Options → Vie privée et sécurité</li>
            <li><strong>Safari :</strong> Préférences → Confidentialité</li>
            <li><strong>Edge :</strong> Paramètres → Cookies et autorisations de site</li>
          </ul>
        </Section>

        <Section title="7. Contact">
          <p>Pour toute question relative aux cookies, contactez : <a href="mailto:contact@ibigsoft.com" className="text-blue-700 underline">contact@ibigsoft.com</a></p>
          <p>Voir aussi notre <Link href="/confidentialite" className="text-blue-700 underline">Politique de confidentialité</Link> et nos <Link href="/cgu" className="text-blue-700 underline">CGU</Link>.</p>
        </Section>
      </div>
    </div>
  );
}
