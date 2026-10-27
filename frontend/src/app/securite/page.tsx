import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Politique de sécurité — SANTAREX ERP',
  description: 'Politique de sécurité informatique et protection des données de santé dans SANTAREX ERP.',
};

// Cette page décrit les mesures RÉELLEMENT en place. N'y ajouter une mesure qu'après
// l'avoir mise en œuvre et vérifiée : un client peut en demander la preuve.
export default function SecuritePage() {
  return (
    <LegalLayout
      title={{ fr: 'Politique de sécurité', en: 'Security policy' }}
      subtitle={{ fr: 'Les mesures de sécurité en place dans SANTAREX ERP pour protéger les données de santé de vos patients.', en: 'The security measures in place in SANTAREX ERP to protect your patients\' health data.' }}
      updatedAt="27 octobre 2026 / October 27, 2026"
      currentPath="/securite"
      childrenEn={<>
        <div className="highlight">
          <p><strong>Health data deserves strong protection.</strong> This page lists the measures that are actually in place today. We prefer to state what we do, and what we do not do yet, rather than promise more than we deliver.</p>
        </div>
        <h2>1. Protection of data</h2>
        <ul>
          <li>All communications go through an encrypted HTTPS connection. The HTTPS certificate is monitored automatically.</li>
          <li>Passwords are never stored in clear text: they are hashed (bcrypt, cost 12).</li>
          <li>Payment secrets and two-factor authentication secrets are stored encrypted (AES-256-GCM).</li>
          <li>Each facility&apos;s data is isolated from the others. This isolation is checked automatically at every software release.</li>
        </ul>
        <h2>2. Access control</h2>
        <h3>2.1 Authentication</h3>
        <ul>
          <li>Sign-in with email and password.</li>
          <li>App-based two-factor authentication (Google Authenticator, Microsoft Authenticator, Authy…) with single-use recovery codes. It can be enabled by every user and required by a facility for its administrators and directors.</li>
          <li>Sign-in attempts are rate-limited to slow down guessing attacks.</li>
          <li>Access sessions last 15 minutes and are renewed automatically; a session ends after 7 days at most. Resetting a password ends the existing sessions.</li>
          <li>Email address confirmation at sign-up.</li>
        </ul>
        <h3>2.2 Role-based access control</h3>
        <ul>
          <li>Each user only has the rights of their role (administrator, director, doctor, nurse, pharmacist, lab technician, cashier…).</li>
          <li>Modules not included in a facility&apos;s plan are refused by the server, not only hidden on screen.</li>
          <li>No cross-facility access: one facility&apos;s data is not visible to another.</li>
        </ul>
        <h2>3. Audit trail</h2>
        <ul>
          <li>Sign-ins (successful and failed) and sensitive actions are recorded in an audit log.</li>
          <li>The audit log can be consulted by the facility&apos;s administrators.</li>
        </ul>
        <h2>4. Infrastructure and hosting</h2>
        <ul>
          <li>Hosted on a virtual private server (VPS) at LWS, in France.</li>
          <li>The database is not directly reachable from the Internet.</li>
          <li>Automatic monitoring every minute (website, API, database, services, disk space, backups, HTTPS certificate) with an immediate email alert.</li>
          <li>Production server access is restricted to IBIG Soft&apos;s technical team.</li>
          <li>Production and demonstration environments are separate.</li>
        </ul>
        <h2>5. Backups and continuity</h2>
        <ul>
          <li>An automatic backup of the database is made every day.</li>
          <li>Every night, a copy is sent off the server, encrypted (AES-256) with a key kept separately, and retained for 30 days.</li>
          <li>Restoring from the off-server copy has been tested.</li>
          <li>In case of a disaster, the data loss is at most the activity since the last daily backup (up to 24 hours).</li>
        </ul>
        <h2>6. Development</h2>
        <ul>
          <li>Automatic tests run at every code change: unit tests plus a full journey on a real server and a disposable database (sign-up, sign-in, patient, invoice, payments, isolation between facilities, two-factor authentication).</li>
          <li>Secrets (keys, passwords) are kept outside the source code, in environment variables.</li>
        </ul>
        <h2>7. Protection against common attacks</h2>
        <ul>
          <li><strong>SQL injection:</strong> parameterized queries through the ORM.</li>
          <li><strong>XSS:</strong> output escaping by the display framework, security headers enabled.</li>
          <li><strong>Clickjacking:</strong> framing protection headers.</li>
          <li><strong>Brute force:</strong> rate limiting on sign-in.</li>
        </ul>
        <h2>8. Security incident management</h2>
        <p>In the event of a confirmed security incident affecting personal or health data, IBIG Soft commits to:</p>
        <ul>
          <li>Notify affected facilities within <strong>72 hours</strong> of discovering the incident.</li>
          <li>Provide a detailed analysis of the incident, its scope, and the corrective measures taken.</li>
          <li>Assist the Client in reporting to competent authorities if required.</li>
          <li>Implement necessary corrective measures as quickly as possible.</li>
        </ul>
        <p>To report an incident or security vulnerability (responsible disclosure): <a href="mailto:securite@ibigsoft.com">securite@ibigsoft.com</a></p>
        <h2>9. Certifications and compliance</h2>
        <ul>
          <li>SANTAREX ERP does not hold its own security certification (ISO 27001, HDS) to date.</li>
          <li>The Client is the data controller for its patients&apos; data; IBIG Soft acts as data processor (see the <a href="/confidentialite">Privacy Policy</a>).</li>
          <li>Hosting is provided by LWS, in France.</li>
        </ul>
        <h2>10. Shared responsibilities</h2>
        <p>SANTAREX ERP security is a shared responsibility:</p>
        <ul>
          <li><strong>IBIG Soft commits to:</strong> maintaining the security of the infrastructure, code, and hosted data.</li>
          <li><strong>The Client commits to:</strong> managing user access, maintaining strong passwords, enabling two-factor authentication for administrators, reporting any incident, training staff in IT security.</li>
        </ul>
        <h2>11. Security contact</h2>
        <p>For any question or vulnerability report:<br /><a href="mailto:securite@ibigsoft.com">securite@ibigsoft.com</a><br />For emergencies: +225 07 78 88 25 92 (WhatsApp)</p>
      </>}
    >
      <div className="highlight">
        <p><strong>Les données de santé méritent une protection solide.</strong> Cette page décrit les mesures réellement en place aujourd&apos;hui. Nous préférons dire ce que nous faisons, et ce que nous ne faisons pas encore, plutôt que promettre plus que nous ne tenons.</p>
      </div>
      <h2>1. Protection des données</h2>
      <ul>
        <li>Toutes les communications passent par une connexion HTTPS chiffrée. Le certificat HTTPS est surveillé automatiquement.</li>
        <li>Les mots de passe ne sont jamais stockés en clair : ils sont hachés (bcrypt, coût 12).</li>
        <li>Les secrets de paiement et les secrets de la double authentification sont stockés chiffrés (AES-256-GCM).</li>
        <li>Les données de chaque établissement sont isolées de celles des autres. Cette isolation est vérifiée automatiquement à chaque mise à jour du logiciel.</li>
      </ul>
      <h2>2. Contrôle d&apos;accès</h2>
      <h3>2.1 Authentification</h3>
      <ul>
        <li>Connexion par adresse e-mail et mot de passe.</li>
        <li>Double authentification par application (Google Authenticator, Microsoft Authenticator, Authy…) avec codes de secours à usage unique. Chaque utilisateur peut l&apos;activer, et un établissement peut l&apos;exiger pour ses administrateurs et directeurs.</li>
        <li>Le nombre de tentatives de connexion est limité pour freiner les attaques par devinette.</li>
        <li>Les sessions d&apos;accès durent 15 minutes et se renouvellent automatiquement ; une session prend fin au bout de 7 jours au plus. La réinitialisation d&apos;un mot de passe met fin aux sessions en cours.</li>
        <li>Confirmation de l&apos;adresse e-mail à l&apos;inscription.</li>
      </ul>
      <h3>2.2 Contrôle d&apos;accès par rôle</h3>
      <ul>
        <li>Chaque utilisateur n&apos;a que les droits de son rôle (administrateur, directeur, médecin, infirmier, pharmacien, laborantin, caissier…).</li>
        <li>Les modules non inclus dans la formule d&apos;un établissement sont refusés par le serveur, pas seulement masqués à l&apos;écran.</li>
        <li>Aucun accès entre établissements : les données d&apos;un établissement ne sont pas visibles par un autre.</li>
      </ul>
      <h2>3. Journal d&apos;audit</h2>
      <ul>
        <li>Les connexions (réussies et échouées) et les actions sensibles sont enregistrées dans un journal d&apos;audit.</li>
        <li>Le journal d&apos;audit est consultable par les administrateurs de l&apos;établissement.</li>
      </ul>
      <h2>4. Infrastructure et hébergement</h2>
      <ul>
        <li>Hébergement sur un serveur privé virtuel (VPS) chez LWS, en France.</li>
        <li>La base de données n&apos;est pas directement accessible depuis Internet.</li>
        <li>Surveillance automatique chaque minute (site, API, base de données, services, espace disque, sauvegardes, certificat HTTPS) avec alerte immédiate par e-mail.</li>
        <li>L&apos;accès au serveur de production est réservé à l&apos;équipe technique d&apos;IBIG Soft.</li>
        <li>Les environnements de production et de démonstration sont séparés.</li>
      </ul>
      <h2>5. Sauvegardes et continuité</h2>
      <ul>
        <li>Une sauvegarde automatique de la base de données est réalisée chaque jour.</li>
        <li>Chaque nuit, une copie est envoyée hors du serveur, chiffrée (AES-256) avec une clé conservée séparément, et conservée 30 jours.</li>
        <li>La restauration à partir de la copie hors serveur a été testée.</li>
        <li>En cas de sinistre, la perte de données correspond au plus à l&apos;activité depuis la dernière sauvegarde quotidienne (jusqu&apos;à 24 heures).</li>
      </ul>
      <h2>6. Développement</h2>
      <ul>
        <li>Des tests automatiques s&apos;exécutent à chaque modification du code : tests unitaires et parcours complet sur un vrai serveur et une base jetable (inscription, connexion, patient, facture, paiements, isolation entre établissements, double authentification).</li>
        <li>Les secrets (clés, mots de passe) sont conservés hors du code source, dans des variables d&apos;environnement.</li>
      </ul>
      <h2>7. Protection contre les attaques courantes</h2>
      <ul>
        <li><strong>Injection SQL :</strong> requêtes paramétrées via l&apos;ORM.</li>
        <li><strong>XSS :</strong> échappement des sorties par le framework d&apos;affichage, en-têtes de sécurité activés.</li>
        <li><strong>Clickjacking :</strong> en-têtes de protection contre l&apos;intégration dans un cadre.</li>
        <li><strong>Force brute :</strong> limitation du nombre de tentatives de connexion.</li>
      </ul>
      <h2>8. Gestion des incidents de sécurité</h2>
      <p>En cas d&apos;incident de sécurité avéré affectant des données personnelles ou de santé, IBIG Soft s&apos;engage à :</p>
      <ul>
        <li>Notifier les établissements concernés dans un délai de <strong>72 heures</strong> suivant la découverte de l&apos;incident.</li>
        <li>Fournir une analyse détaillée de l&apos;incident, de son étendue et des mesures correctives prises.</li>
        <li>Assister le Client dans les démarches de notification aux autorités compétentes si requis.</li>
        <li>Mettre en place les mesures correctives nécessaires dans les meilleurs délais.</li>
      </ul>
      <p>Pour signaler un incident ou une vulnérabilité de sécurité (responsible disclosure) : <a href="mailto:securite@ibigsoft.com">securite@ibigsoft.com</a></p>
      <h2>9. Certifications et conformité</h2>
      <ul>
        <li>SANTAREX ERP ne détient pas, à ce jour, de certification de sécurité qui lui soit propre (ISO 27001, HDS).</li>
        <li>Le Client est responsable de traitement pour les données de ses patients ; IBIG Soft intervient en qualité de sous-traitant (voir la <a href="/confidentialite">Politique de confidentialité</a>).</li>
        <li>L&apos;hébergement est assuré par LWS, en France.</li>
      </ul>
      <h2>10. Responsabilités partagées</h2>
      <p>La sécurité de SANTAREX ERP est une responsabilité partagée :</p>
      <ul>
        <li><strong>IBIG Soft s&apos;engage à :</strong> maintenir la sécurité de l&apos;infrastructure, du code et des données hébergées.</li>
        <li><strong>Le Client s&apos;engage à :</strong> gérer les accès utilisateurs, maintenir des mots de passe robustes, activer la double authentification pour les administrateurs, signaler tout incident, former son personnel à la sécurité informatique.</li>
      </ul>
      <h2>11. Contact sécurité</h2>
      <p>Pour toute question ou signalement de vulnérabilité :<br /><a href="mailto:securite@ibigsoft.com">securite@ibigsoft.com</a><br />Pour les urgences : +225 07 78 88 25 92 (WhatsApp)</p>
    </LegalLayout>
  );
}
