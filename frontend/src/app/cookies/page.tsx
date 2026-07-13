import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Politique de cookies — SANTAREX ERP',
  description: "Politique d'utilisation des cookies sur SANTAREX ERP.",
};

export default function CookiesPage() {
  return (
    <LegalLayout
      title={{ fr: 'Politique de cookies', en: 'Cookie policy' }}
      subtitle={{ fr: 'Informations sur les cookies utilisés par SANTAREX ERP et la manière de les gérer.', en: 'Information about the cookies used by SANTAREX ERP and how to manage them.' }}
      updatedAt="13 juillet 2026 / July 13, 2026"
      currentPath="/cookies"
      childrenEn={<>
        <h2>1. What is a cookie?</h2>
        <p>A cookie is a small text file stored on your device (computer, tablet, smartphone) when you visit SANTAREX ERP. It allows information about your session and preferences to be remembered, in order to improve your experience.</p>
        <h2>2. Cookies used by SANTAREX ERP</h2>
        <h3>2.1 Essential cookies (no consent required)</h3>
        <p>These cookies are essential for the service to function. Without them, you cannot log in.</p>
        <ul>
          <li><strong>session_token:</strong> maintains your secure login session. Duration: session (deleted when browser is closed).</li>
          <li><strong>csrf_token:</strong> protection against CSRF attacks. Duration: session.</li>
          <li><strong>tenant_id:</strong> identifies the facility you belong to. Duration: session.</li>
        </ul>
        <h3>2.2 Functional cookies (consent required)</h3>
        <p>These cookies improve your experience by remembering your preferences.</p>
        <ul>
          <li><strong>lp_cookie_consent:</strong> remembers your cookie choice. Duration: 1 year.</li>
          <li><strong>user_lang:</strong> remembers your language preference (FR/EN). Duration: 1 year.</li>
          <li><strong>theme_pref:</strong> remembers your theme preference (light/dark). Duration: 1 year.</li>
          <li><strong>sidebar_state:</strong> remembers the collapsed or expanded state of the navigation bar. Duration: 1 year.</li>
        </ul>
        <h3>2.3 Analytics cookies (consent required)</h3>
        <p>These cookies help us understand how the service is used, in an anonymized manner.</p>
        <ul>
          <li><strong>Anonymized usage analysis:</strong> pages visited, session duration, modules used. No health data is included. Duration: 13 months.</li>
        </ul>
        <h3>2.4 Third-party cookies</h3>
        <p>SANTAREX ERP may use third-party services that set their own cookies:</p>
        <ul>
          <li><strong>Groq (SARA AI):</strong> processing conversational requests. No persistent client-side cookies.</li>
          <li><strong>Orange Money / MTN MoMo / Wave:</strong> during online payment transactions. Subject to these providers&apos; policies.</li>
        </ul>
        <h2>3. Managing your cookies</h2>
        <p>On your first visit to the SANTAREX ERP homepage, a banner offers you the option to accept or decline non-essential cookies. You can change your preferences at any time from your facility settings.</p>
        <p>You can also manage cookies directly from your browser:</p>
        <ul>
          <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
          <li><strong>Firefox:</strong> Options → Privacy &amp; Security → Cookies</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
          <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
        </ul>
        <p>Disabling essential cookies will prevent you from logging in to SANTAREX ERP. Disabling functional cookies will remove your saved preferences.</p>
        <h2>4. Retention period</h2>
        <p>Session cookies are deleted when you close your browser. Persistent cookies have a maximum lifespan of 13 months, in accordance with the recommendations of data protection authorities.</p>
        <h2>5. Contact</h2>
        <p>For any question about our cookie policy:<br /><a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a></p>
      </>}
    >
      <h2>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de votre visite sur SANTAREX ERP. Il permet de mémoriser des informations sur votre session et vos préférences, afin d&apos;améliorer votre expérience.</p>
      <h2>2. Cookies utilisés par SANTAREX ERP</h2>
      <h3>2.1 Cookies essentiels (non soumis au consentement)</h3>
      <p>Ces cookies sont indispensables au fonctionnement du service. Sans eux, vous ne pouvez pas vous connecter.</p>
      <ul>
        <li><strong>session_token :</strong> maintient votre session de connexion sécurisée. Durée : session (effacé à la fermeture du navigateur).</li>
        <li><strong>csrf_token :</strong> protection contre les attaques CSRF. Durée : session.</li>
        <li><strong>tenant_id :</strong> identifie l&apos;établissement auquel vous appartenez. Durée : session.</li>
      </ul>
      <h3>2.2 Cookies fonctionnels (soumis au consentement)</h3>
      <p>Ces cookies améliorent votre expérience en mémorisant vos préférences.</p>
      <ul>
        <li><strong>lp_cookie_consent :</strong> mémorise votre choix relatif aux cookies. Durée : 1 an.</li>
        <li><strong>user_lang :</strong> mémorise votre préférence de langue (FR/EN). Durée : 1 an.</li>
        <li><strong>theme_pref :</strong> mémorise votre préférence de thème (clair/sombre). Durée : 1 an.</li>
        <li><strong>sidebar_state :</strong> mémorise l&apos;état réduit ou développé de la barre de navigation. Durée : 1 an.</li>
      </ul>
      <h3>2.3 Cookies analytiques (soumis au consentement)</h3>
      <p>Ces cookies nous aident à comprendre comment le service est utilisé, de manière anonymisée.</p>
      <ul>
        <li><strong>Analyse d&apos;usage anonymisée :</strong> pages visitées, durée de session, modules utilisés. Aucune donnée de santé n&apos;est incluse. Durée : 13 mois.</li>
      </ul>
      <h3>2.4 Cookies tiers</h3>
      <p>SANTAREX ERP peut utiliser des services tiers qui déposent leurs propres cookies :</p>
      <ul>
        <li><strong>Groq (SARA IA) :</strong> traitement des requêtes conversationnelles. Aucun cookie persistant côté client.</li>
        <li><strong>Orange Money / MTN MoMo / Wave :</strong> lors des transactions de paiement en ligne. Soumis aux politiques de ces prestataires.</li>
      </ul>
      <h2>3. Gestion de vos cookies</h2>
      <p>Lors de votre première visite sur la page d&apos;accueil de SANTAREX ERP, une bannière vous propose d&apos;accepter ou de refuser les cookies non essentiels. Vous pouvez modifier vos préférences à tout moment depuis les paramètres de votre établissement.</p>
      <p>Vous pouvez également gérer les cookies directement depuis votre navigateur :</p>
      <ul>
        <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies</li>
        <li><strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies</li>
        <li><strong>Safari :</strong> Préférences → Confidentialité → Gestion des données</li>
        <li><strong>Edge :</strong> Paramètres → Cookies et autorisations du site</li>
      </ul>
      <p>La désactivation des cookies essentiels empêchera votre connexion à SANTAREX ERP. La désactivation des cookies fonctionnels supprimera vos préférences enregistrées.</p>
      <h2>4. Durée de conservation</h2>
      <p>Les cookies de session sont supprimés à la fermeture de votre navigateur. Les cookies persistants ont une durée de vie maximale de 13 mois, conformément aux recommandations de la CNIL et des autorités de protection des données.</p>
      <h2>5. Contact</h2>
      <p>Pour toute question sur notre politique de cookies :<br /><a href="mailto:contact@ibigsoft.com">contact@ibigsoft.com</a></p>
    </LegalLayout>
  );
}
