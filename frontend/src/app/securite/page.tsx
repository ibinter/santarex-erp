import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Politique de sécurité — SANTAREX ERP',
  description: 'Politique de sécurité informatique et protection des données de santé dans SANTAREX ERP.',
};

export default function SecuritePage() {
  return (
    <LegalLayout
      title="Politique de sécurité"
      subtitle="SANTAREX ERP applique des standards de sécurité stricts pour protéger les données de santé de vos patients."
      updatedAt="13 juillet 2026"
      currentPath="/securite"
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
        <li>Hébergement sur serveurs dédiés en Europe (OVH / Hetzner), certifiés ISO 27001.</li>
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
      <p>
        En cas d&apos;incident de sécurité avéré affectant des données personnelles ou de santé,
        IBIG Soft s&apos;engage à :
      </p>
      <ul>
        <li>Notifier les établissements concernés dans un délai de <strong>72 heures</strong> suivant la découverte de l&apos;incident.</li>
        <li>Fournir une analyse détaillée de l&apos;incident, de son étendue et des mesures correctives prises.</li>
        <li>Assister le Client dans les démarches de notification aux autorités compétentes si requis.</li>
        <li>Mettre en place les mesures correctives nécessaires dans les meilleurs délais.</li>
      </ul>
      <p>
        Pour signaler un incident ou une vulnérabilité de sécurité (responsible disclosure) :
        <a href="mailto:securite@ibigsoft.com">securite@ibigsoft.com</a>
      </p>

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
      <p>
        Pour toute question ou signalement de vulnérabilité :<br />
        <a href="mailto:securite@ibigsoft.com">securite@ibigsoft.com</a><br />
        Pour les urgences : +225 07 78 88 25 92 (WhatsApp)
      </p>
    </LegalLayout>
  );
}
