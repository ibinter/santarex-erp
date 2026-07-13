import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Politique de sécurité — SANTAREX ERP',
  description: 'Politique de sécurité informatique et protection des données de santé dans SANTAREX ERP.',
};

export default function SecuritePage() {
  return (
    <LegalLayout
      title={{ fr: 'Politique de sécurité', en: 'Security policy' }}
      subtitle={{ fr: 'SANTAREX ERP applique des standards de sécurité stricts pour protéger les données de santé de vos patients.', en: 'SANTAREX ERP applies strict security standards to protect your patients\' health data.' }}
      updatedAt="13 juillet 2026 / July 13, 2026"
      currentPath="/securite"
      childrenEn={<>
        <div className="highlight">
          <p><strong>Health data deserves maximum protection.</strong> SANTAREX ERP is designed from the ground up according to <em>Security by Design</em> and <em>Privacy by Default</em> principles. Every feature integrates security from the design phase.</p>
        </div>
        <h2>1. Data encryption</h2>
        <h3>1.1 Data at rest</h3>
        <ul>
          <li>AES-256 encryption of all databases and storage volumes.</li>
          <li>Backup encryption with separate keys stored in a secure vault.</li>
          <li>Physical data isolation between facilities (secure multi-tenant architecture).</li>
        </ul>
        <h3>1.2 Data in transit</h3>
        <ul>
          <li>All communications encrypted via TLS 1.3 (minimum TLS 1.2).</li>
          <li>SSL/TLS certificates issued and renewed automatically.</li>
          <li>HSTS (HTTP Strict Transport Security) enabled with preloading.</li>
          <li>No data transmitted in clear text over the network.</li>
        </ul>
        <h2>2. Access control</h2>
        <h3>2.1 Authentication</h3>
        <ul>
          <li>Strong authentication by email and password (bcrypt hashing, cost 12).</li>
          <li>Two-factor authentication (2FA) available and recommended for admin accounts.</li>
          <li>Automatic lockout after 5 failed login attempts.</li>
          <li>Sessions with automatic expiry after 8 hours of inactivity.</li>
          <li>Immediate session invalidation upon password change.</li>
        </ul>
        <h3>2.2 Role-based access control (RBAC)</h3>
        <ul>
          <li>Each user has only the rights necessary for their role (principle of least privilege).</li>
          <li>Predefined roles: Administrator, Doctor, Nurse, Pharmacist, Lab Technician, Cashier, Receptionist.</li>
          <li>Patient record access limited to authorized healthcare staff designated by the facility.</li>
          <li>No cross-facility access: one facility&apos;s data is invisible to others.</li>
        </ul>
        <h2>3. Traceability and audit</h2>
        <ul>
          <li>Complete, tamper-proof audit log of all user actions (view, edit, delete).</li>
          <li>Precise timestamping with timezone for each action.</li>
          <li>Audit logs retained for a minimum of 5 years.</li>
          <li>Automatic alerts for suspicious activity (unusual logins, abnormal export volumes).</li>
          <li>Audit reports available to facility administrators.</li>
        </ul>
        <h2>4. Infrastructure and hosting</h2>
        <ul>
          <li>Hosting on dedicated servers in Europe (LWS), ISO 27001 certified.</li>
          <li>Web application firewall (WAF) filtering OWASP Top 10 attacks.</li>
          <li>Network-level anti-DDoS protection.</li>
          <li>Network segmentation: database not directly accessible from the Internet.</li>
          <li>24/7 monitoring of availability and performance.</li>
          <li>Production server access restricted to authorized engineers, via VPN and SSH keys.</li>
        </ul>
        <h2>5. Backups and business continuity</h2>
        <ul>
          <li>Automatic full daily backups.</li>
          <li>Incremental backups every hour.</li>
          <li>Backup retention: 30 days for daily backups, 1 year for monthly backups.</li>
          <li>Restoration test performed monthly.</li>
          <li>Recovery point objective (RPO): maximum 1 hour.</li>
          <li>Recovery time objective (RTO): maximum 4 hours.</li>
        </ul>
        <h2>6. Secure development</h2>
        <ul>
          <li>Mandatory code reviews before any production deployment.</li>
          <li>Static security analysis (SAST) integrated into the CI/CD pipeline.</li>
          <li>Software dependencies audited and regularly updated.</li>
          <li>Penetration tests conducted annually by an independent external provider.</li>
          <li>Mandatory security training for all developers.</li>
          <li>Development, testing, and production environments strictly separated.</li>
        </ul>
        <h2>7. Protection against common attacks</h2>
        <ul>
          <li><strong>SQL injection:</strong> parameterized queries and secure ORM.</li>
          <li><strong>XSS (Cross-Site Scripting):</strong> systematic output escaping, strict CSP.</li>
          <li><strong>CSRF:</strong> anti-CSRF tokens on all mutating forms.</li>
          <li><strong>Clickjacking:</strong> X-Frame-Options and CSP frame-ancestors headers.</li>
          <li><strong>Brute force:</strong> rate limiting, CAPTCHA, and account lockout.</li>
          <li><strong>Secrets:</strong> no keys, passwords, or tokens hardcoded in source code.</li>
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
        <h2>9. Regulatory compliance</h2>
        <ul>
          <li><strong>GDPR:</strong> health data processing compliant with the General Data Protection Regulation.</li>
          <li><strong>HDS:</strong> alignment with Health Data Hosting requirements (certification in progress).</li>
          <li><strong>ISO 27001:</strong> security management processes aligned with the ISO 27001 standard.</li>
          <li><strong>OWASP:</strong> protection against OWASP Top 10 vulnerabilities applied to all developments.</li>
        </ul>
        <h2>10. Shared responsibilities</h2>
        <p>SANTAREX ERP security is a shared responsibility:</p>
        <ul>
          <li><strong>IBIG Soft commits to:</strong> maintaining the security of the infrastructure, code, and hosted data.</li>
          <li><strong>The Client commits to:</strong> managing user access, maintaining strong passwords, reporting any incident, training staff in IT security.</li>
        </ul>
        <h2>11. Security contact</h2>
        <p>For any question or vulnerability report:<br /><a href="mailto:securite@ibigsoft.com">securite@ibigsoft.com</a><br />For emergencies: +225 07 78 88 25 92 (WhatsApp)</p>
      </>}
    >
      <div className="highlight">
        <p><strong>Les données de santé méritent une protection maximale.</strong> SANTAREX ERP est conçu dès sa conception selon les principes de <em>Security by Design</em> et <em>Privacy by Default</em>. Chaque fonctionnalité intègre la sécurité dès la phase de conception.</p>
      </div>
      <h2>1. Chiffrement des données</h2>
      <h3>1.1 Données au repos</h3>
      <ul>
        <li>Chiffrement AES-256 de toutes les bases de données et volumes de stockage.</li>
        <li>Chiffrement des sauvegardes avec des clés séparées, stockées dans un coffre sécurisé.</li>
        <li>Isolation physique des données entre établissements (architecture multi-tenant sécurisée).</li>
      </ul>
      <h3>1.2 Données en transit</h3>
      <ul>
        <li>Toutes les communications chiffrées via TLS 1.3 (minimum TLS 1.2).</li>
        <li>Certificats SSL/TLS émis et renouvelés automatiquement.</li>
        <li>HSTS (HTTP Strict Transport Security) activé avec préchargement.</li>
        <li>Aucune donnée transmise en clair sur le réseau.</li>
      </ul>
      <h2>2. Contrôle d&apos;accès</h2>
      <h3>2.1 Authentification</h3>
      <ul>
        <li>Authentification forte par email et mot de passe (hachage bcrypt, coût 12).</li>
        <li>Authentification à deux facteurs (2FA) disponible et recommandée pour les comptes administrateurs.</li>
        <li>Verrouillage automatique après 5 tentatives de connexion infructueuses.</li>
        <li>Sessions avec expiration automatique après 8 heures d&apos;inactivité.</li>
        <li>Invalidation immédiate des sessions en cas de changement de mot de passe.</li>
      </ul>
      <h3>2.2 Contrôle d&apos;accès basé sur les rôles (RBAC)</h3>
      <ul>
        <li>Chaque utilisateur dispose uniquement des droits nécessaires à son rôle (principe du moindre privilège).</li>
        <li>Rôles prédéfinis : Administrateur, Médecin, Infirmier, Pharmacien, Laborantin, Caissier, Agent d&apos;accueil.</li>
        <li>Accès aux dossiers patients limité aux personnels soignants autorisés par l&apos;établissement.</li>
        <li>Aucun accès inter-établissements : les données d&apos;un établissement sont invisibles aux autres.</li>
      </ul>
      <h2>3. Traçabilité et audit</h2>
      <ul>
        <li>Journal d&apos;audit complet et inaltérable de toutes les actions utilisateurs (consultation, modification, suppression).</li>
        <li>Horodatage précis avec fuseau horaire de chaque action.</li>
        <li>Conservation des journaux d&apos;audit pendant 5 ans minimum.</li>
        <li>Alertes automatiques en cas d&apos;activité suspecte (connexions inhabituelles, volume d&apos;exports anormal).</li>
        <li>Rapports d&apos;audit disponibles pour les administrateurs de l&apos;établissement.</li>
      </ul>
      <h2>4. Infrastructure et hébergement</h2>
      <ul>
        <li>Hébergement sur serveurs dédiés en Europe (LWS), certifiés ISO 27001.</li>
        <li>Pare-feu applicatif (WAF) filtrant les attaques OWASP Top 10.</li>
        <li>Protection anti-DDoS de niveau réseau.</li>
        <li>Segmentation réseau : base de données inaccessible directement depuis Internet.</li>
        <li>Monitoring 24/7 de la disponibilité et des performances.</li>
        <li>Accès aux serveurs de production réservé aux ingénieurs autorisés, via VPN et clés SSH.</li>
      </ul>
      <h2>5. Sauvegardes et continuité de service</h2>
      <ul>
        <li>Sauvegardes automatiques complètes quotidiennes.</li>
        <li>Sauvegardes incrémentielles toutes les heures.</li>
        <li>Rétention des sauvegardes : 30 jours pour les sauvegardes quotidiennes, 1 an pour les sauvegardes mensuelles.</li>
        <li>Test de restauration effectué mensuellement.</li>
        <li>Objectif de point de reprise (RPO) : 1 heure maximum.</li>
        <li>Objectif de temps de reprise (RTO) : 4 heures maximum.</li>
      </ul>
      <h2>6. Développement sécurisé</h2>
      <ul>
        <li>Revues de code obligatoires avant tout déploiement en production.</li>
        <li>Analyses statiques de sécurité (SAST) intégrées à la chaîne CI/CD.</li>
        <li>Dépendances logicielles auditées et mises à jour régulièrement.</li>
        <li>Tests de pénétration réalisés annuellement par un prestataire externe indépendant.</li>
        <li>Formation sécurité obligatoire pour tous les développeurs.</li>
        <li>Environnements de développement, de test et de production strictement séparés.</li>
      </ul>
      <h2>7. Protection contre les attaques courantes</h2>
      <ul>
        <li><strong>Injection SQL :</strong> requêtes paramétrées et ORM sécurisé.</li>
        <li><strong>XSS (Cross-Site Scripting) :</strong> échappement systématique des sorties, CSP strict.</li>
        <li><strong>CSRF :</strong> tokens anti-CSRF sur tous les formulaires mutants.</li>
        <li><strong>Clickjacking :</strong> en-têtes X-Frame-Options et CSP frame-ancestors.</li>
        <li><strong>Brute force :</strong> rate limiting, CAPTCHA et verrouillage de compte.</li>
        <li><strong>Secrets :</strong> aucune clé, mot de passe ou jeton en dur dans le code source.</li>
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
      <h2>9. Conformité réglementaire</h2>
      <ul>
        <li><strong>RGPD :</strong> traitement des données de santé conforme au Règlement Général sur la Protection des Données.</li>
        <li><strong>HDS :</strong> alignement sur les exigences d&apos;Hébergement de Données de Santé (certification en cours).</li>
        <li><strong>ISO 27001 :</strong> processus de management de la sécurité aligné sur la norme ISO 27001.</li>
        <li><strong>OWASP :</strong> protection contre les vulnérabilités OWASP Top 10 appliquée à tous les développements.</li>
      </ul>
      <h2>10. Responsabilités partagées</h2>
      <p>La sécurité de SANTAREX ERP est une responsabilité partagée :</p>
      <ul>
        <li><strong>IBIG Soft s&apos;engage à :</strong> maintenir la sécurité de l&apos;infrastructure, du code et des données hébergées.</li>
        <li><strong>Le Client s&apos;engage à :</strong> gérer les accès utilisateurs, maintenir des mots de passe robustes, signaler tout incident, former son personnel à la sécurité informatique.</li>
      </ul>
      <h2>11. Contact sécurité</h2>
      <p>Pour toute question ou signalement de vulnérabilité :<br /><a href="mailto:securite@ibigsoft.com">securite@ibigsoft.com</a><br />Pour les urgences : +225 07 78 88 25 92 (WhatsApp)</p>
    </LegalLayout>
  );
}
