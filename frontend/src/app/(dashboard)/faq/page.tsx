'use client';

import { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

type Lang = 'fr' | 'en';
type FAQ = { q: string; a: string };
type Category = { id: string; label_fr: string; label_en: string; color: string; items_fr: FAQ[]; items_en: FAQ[] };

const CATEGORIES: Category[] = [
  {
    id: 'compte', label_fr: 'Compte & Connexion', label_en: 'Account & Login', color: '#1565C0',
    items_fr: [
      { q: "Comment me connecter à SANTAREX ERP ?", a: "Accédez à l'URL de votre clinique, saisissez votre email et mot de passe. En cas d'erreur, vérifiez que la touche Verr Maj n'est pas activée." },
      { q: "J'ai oublié mon mot de passe, que faire ?", a: "Contactez votre administrateur système qui peut réinitialiser votre mot de passe depuis la page Utilisateurs → Réinitialiser le mot de passe." },
      { q: "Puis-je utiliser l'ERP sur mobile ?", a: "Oui, l'interface est responsive et s'adapte aux smartphones et tablettes. Pour une expérience optimale, utilisez Chrome ou Safari en version récente." },
      { q: "Pourquoi ma session expire-t-elle automatiquement ?", a: "Pour des raisons de sécurité, la session expire après le délai défini dans les paramètres (15 à 480 minutes d'inactivité). Reconnectez-vous simplement." },
      { q: "Comment changer mon mot de passe ?", a: "Allez dans Mon profil (icône en haut à droite), section Sécurité, entrez votre mot de passe actuel puis le nouveau deux fois et cliquez Changer." },
      { q: "Puis-je avoir plusieurs comptes ?", a: "Non, chaque utilisateur dispose d'un seul compte par clinique. Un même professionnel travaillant dans plusieurs cliniques aura un compte distinct par établissement." },
      { q: "Comment activer la double authentification ?", a: "Allez dans Paramètres → Sécurité et activez le toggle «Double authentification (2FA)». Un code vous sera envoyé à chaque connexion." },
    ],
    items_en: [
      { q: "How do I log in to SANTAREX ERP?", a: "Access your clinic's URL, enter your email and password. If you get an error, check that Caps Lock is not enabled." },
      { q: "I forgot my password, what should I do?", a: "Contact your system administrator who can reset your password from the Users page → Reset password." },
      { q: "Can I use the ERP on mobile?", a: "Yes, the interface is responsive and adapts to smartphones and tablets. For optimal experience, use a recent version of Chrome or Safari." },
      { q: "Why does my session expire automatically?", a: "For security reasons, the session expires after the timeout defined in settings (15 to 480 minutes of inactivity). Simply reconnect." },
      { q: "How do I change my password?", a: "Go to My Profile (icon at top right), Security section, enter your current password then the new one twice and click Change." },
      { q: "Can I have multiple accounts?", a: "No, each user has a single account per clinic. A professional working in multiple clinics will have a separate account per facility." },
      { q: "How do I enable two-factor authentication?", a: "Go to Settings → Security and enable the 'Two-factor authentication (2FA)' toggle. A code will be sent to you at each login." },
    ],
  },
  {
    id: 'patients', label_fr: 'Patients', label_en: 'Patients', color: '#0D47A1',
    items_fr: [
      { q: "Comment créer un nouveau dossier patient ?", a: "Allez dans Patients → Nouveau patient. Remplissez au minimum nom, prénom, date de naissance et sexe. Les autres champs sont optionnels mais recommandés." },
      { q: "Qu'est-ce que l'IPP ?", a: "L'IPP (Identifiant Permanent du Patient) est un numéro unique attribué automatiquement à chaque patient lors de sa création. Il permet de l'identifier sans ambiguïté." },
      { q: "Comment fusionner deux dossiers doublons ?", a: "La fusion de doublons doit être effectuée par un administrateur depuis la console de gestion. Contactez votre administrateur avec les deux numéros IPP concernés." },
      { q: "Les données patients sont-elles sécurisées ?", a: "Oui, toutes les données sont chiffrées en base de données et transmises via HTTPS. L'accès est contrôlé par rôle et toutes les actions sont tracées dans le journal d'audit." },
      { q: "Comment archiver un patient décédé ?", a: "Dans la fiche patient, l'administrateur peut modifier le statut. Les données sont conservées conformément aux obligations légales de conservation des dossiers médicaux." },
      { q: "Puis-je importer une liste de patients depuis Excel ?", a: "Oui, contactez votre administrateur pour l'import en masse depuis un fichier Excel. La structure du fichier doit respecter le modèle fourni par SANTAREX." },
      { q: "Comment exporter la liste des patients ?", a: "Sur la page Patients, cliquez sur le bouton XLSX en haut à droite pour télécharger la liste complète au format Excel." },
      { q: "Qu'est-ce que le DME ?", a: "Le DME (Dossier Médical Électronique) centralise toutes les informations médicales d'un patient : antécédents, consultations, ordonnances, résultats d'analyses, hospitalisations." },
    ],
    items_en: [
      { q: "How do I create a new patient file?", a: "Go to Patients → New patient. Fill in at minimum name, date of birth and gender. Other fields are optional but recommended." },
      { q: "What is the IPP?", a: "The IPP (Permanent Patient Identifier) is a unique number automatically assigned to each patient upon creation. It allows unambiguous identification." },
      { q: "How do I merge two duplicate files?", a: "Duplicate merging must be done by an administrator from the management console. Contact your admin with the two IPP numbers involved." },
      { q: "Is patient data secure?", a: "Yes, all data is encrypted in the database and transmitted via HTTPS. Access is role-controlled and all actions are tracked in the audit log." },
      { q: "How do I archive a deceased patient?", a: "In the patient file, an administrator can modify the status. Data is retained in accordance with legal medical record retention obligations." },
      { q: "Can I import a patient list from Excel?", a: "Yes, contact your administrator for bulk import from an Excel file. The file structure must follow the template provided by SANTAREX." },
      { q: "How do I export the patient list?", a: "On the Patients page, click the XLSX button at the top right to download the complete list in Excel format." },
      { q: "What is the EMR?", a: "The EMR (Electronic Medical Record) centralizes all medical information for a patient: history, consultations, prescriptions, lab results, hospitalizations." },
    ],
  },
  {
    id: 'consultations', label_fr: 'Consultations', label_en: 'Consultations', color: '#00695C',
    items_fr: [
      { q: "Qui peut créer une consultation ?", a: "Les rôles médecin, infirmier et admin peuvent créer des consultations. Le rôle caissier ne peut pas créer de consultation." },
      { q: "Peut-on modifier une consultation après création ?", a: "Oui, un médecin ou administrateur peut modifier une consultation existante. Toutes les modifications sont tracées avec horodatage." },
      { q: "Comment associer une ordonnance à une consultation ?", a: "Depuis le détail d'une consultation, la section Ordonnances permet d'en créer une directement liée à cette consultation." },
      { q: "Les constantes vitales sont-elles obligatoires ?", a: "Non, les constantes vitales sont optionnelles mais fortement recommandées. Elles apparaissent dans le DME du patient pour le suivi longitudinal." },
      { q: "Comment annuler une consultation par erreur ?", a: "Contactez votre administrateur qui peut modifier le statut d'une consultation. Une consultation ne peut pas être supprimée (traçabilité)." },
    ],
    items_en: [
      { q: "Who can create a consultation?", a: "The doctor, nurse and admin roles can create consultations. The cashier role cannot create consultations." },
      { q: "Can a consultation be modified after creation?", a: "Yes, a doctor or administrator can modify an existing consultation. All modifications are tracked with timestamps." },
      { q: "How do I attach a prescription to a consultation?", a: "From a consultation detail, the Prescriptions section allows creating one directly linked to that consultation." },
      { q: "Are vital signs mandatory?", a: "No, vital signs are optional but strongly recommended. They appear in the patient EMR for longitudinal monitoring." },
      { q: "How do I cancel a consultation made by mistake?", a: "Contact your administrator who can modify the status. A consultation cannot be deleted (traceability requirement)." },
    ],
  },
  {
    id: 'pharmacie', label_fr: 'Pharmacie', label_en: 'Pharmacy', color: '#2E7D32',
    items_fr: [
      { q: "Comment gérer les alertes de stock faible ?", a: "Les médicaments sous le seuil minimum apparaissent en rouge dans la liste. Modifiez le seuil minimum dans la fiche médicament. Une notification est envoyée automatiquement." },
      { q: "Peut-on gérer plusieurs unités pour un même médicament ?", a: "Oui, le champ «Dosage» permet de préciser la concentration (500mg, 250mg/5mL). Chaque présentation est gérée comme un médicament distinct." },
      { q: "Comment enregistrer une réception de stock ?", a: "Depuis la fiche médicament, une entrée de stock se fait via le module de réception. Contactez votre administrateur si cette fonctionnalité n'est pas visible dans votre rôle." },
      { q: "Les périmés sont-ils gérés automatiquement ?", a: "La date d'expiration est enregistrée. Le système ne bloque pas automatiquement les médicaments périmés mais ils apparaissent avec une alerte dans la liste." },
      { q: "Comment exporter l'inventaire de la pharmacie ?", a: "Sur la page Pharmacie, cliquez sur le bouton XLSX pour télécharger l'inventaire complet au format Excel avec tous les stocks et prix." },
    ],
    items_en: [
      { q: "How do I manage low stock alerts?", a: "Medicines below the minimum threshold appear in red in the list. Edit the minimum threshold in the medicine record. A notification is automatically sent." },
      { q: "Can multiple units be managed for the same medicine?", a: "Yes, the Dosage field allows specifying concentration (500mg, 250mg/5mL). Each presentation is managed as a separate medicine." },
      { q: "How do I record a stock receipt?", a: "From the medicine record, a stock entry is done via the reception module. Contact your administrator if this feature is not visible in your role." },
      { q: "Are expired medicines managed automatically?", a: "Expiry dates are recorded. The system does not automatically block expired medicines but they appear with an alert in the list." },
      { q: "How do I export the pharmacy inventory?", a: "On the Pharmacy page, click the XLSX button to download the complete inventory in Excel format with all stocks and prices." },
    ],
  },
  {
    id: 'facturation', label_fr: 'Facturation', label_en: 'Billing', color: '#0D47A1',
    items_fr: [
      { q: "Comment générer une facture ?", a: "Allez dans Facturation → Nouvelle facture. Sélectionnez le patient, ajoutez les lignes de prestation avec leurs montants et cliquez sur Créer la facture." },
      { q: "Peut-on faire un paiement partiel ?", a: "Oui, plusieurs paiements partiels peuvent être enregistrés sur une même facture. La barre de progression montre le pourcentage payé." },
      { q: "Les factures peuvent-elles être modifiées après émission ?", a: "Pour intégrité comptable, une facture émise ne peut être modifiée. En cas d'erreur, contactez votre administrateur pour un avoir ou une annulation." },
      { q: "Comment télécharger une facture en PDF ?", a: "Depuis le détail d'une facture, cliquez sur le bouton PDF pour télécharger le document. Vous pouvez aussi cliquer sur Imprimer pour impression directe." },
      { q: "Comment gérer la prise en charge par assurance ?", a: "Lors de la création du patient, activez «Tiers payant» et renseignez le nom de l'assurance. À la facturation, le système sépare automatiquement la part patient et la part assurance." },
      { q: "Qu'est-ce que la page Caisse ?", a: "La page Caisse affiche tous les encaissements du jour avec le total par mode de paiement (espèces, mobile money, carte, assurance, virement). C'est le rapport journalier de caisse." },
    ],
    items_en: [
      { q: "How do I generate an invoice?", a: "Go to Billing → New invoice. Select the patient, add service lines with their amounts and click Create invoice." },
      { q: "Can partial payment be made?", a: "Yes, multiple partial payments can be recorded on the same invoice. The progress bar shows the percentage paid." },
      { q: "Can invoices be modified after issuance?", a: "For accounting integrity, an issued invoice cannot be modified. In case of error, contact your administrator for a credit note or cancellation." },
      { q: "How do I download an invoice as PDF?", a: "From an invoice detail, click the PDF button to download the document. You can also click Print for direct printing." },
      { q: "How do I handle insurance coverage?", a: "When creating the patient, enable 'Third-party payment' and enter the insurance name. At billing, the system automatically separates the patient and insurance portions." },
      { q: "What is the Cashier page?", a: "The Cashier page displays all collections for the day with totals per payment method (cash, mobile money, card, insurance, transfer). It is the daily cashier report." },
    ],
  },
  {
    id: 'labo', label_fr: 'Laboratoire', label_en: 'Laboratory', color: '#6A1B9A',
    items_fr: [
      { q: "Comment créer une demande d'analyse urgente ?", a: "Lors de la création d'une demande, activez le toggle «Urgente». La demande apparaît en tête de liste avec un badge rouge URGENT pour le laborantin." },
      { q: "Les résultats d'analyse sont-ils visibles dans le DME ?", a: "Oui, les demandes d'analyses et leurs résultats apparaissent dans l'onglet «Analyses» du DME du patient, triés par date." },
      { q: "Peut-on imprimer les résultats d'analyse ?", a: "Depuis le détail d'une demande, les résultats peuvent être imprimés via la fonction d'impression du navigateur (Ctrl+P)." },
      { q: "Comment interpréter les codes couleur des résultats ?", a: "Vert = normal, Orange = élevé, Bleu = bas, Rouge = critique (valeur dangereuse nécessitant une action immédiate)." },
    ],
    items_en: [
      { q: "How do I create an urgent analysis request?", a: "When creating a request, enable the 'Urgent' toggle. The request appears at the top of the list with a red URGENT badge for the lab technician." },
      { q: "Are lab results visible in the EMR?", a: "Yes, lab requests and their results appear in the 'Analyses' tab of the patient EMR, sorted by date." },
      { q: "Can lab results be printed?", a: "From a request detail, results can be printed using the browser print function (Ctrl+P)." },
      { q: "How do I interpret result color codes?", a: "Green = normal, Orange = high, Blue = low, Red = critical (dangerous value requiring immediate action)." },
    ],
  },
  {
    id: 'hospit', label_fr: 'Hospitalisation', label_en: 'Hospitalization', color: '#1565C0',
    items_fr: [
      { q: "Comment admettre un patient en hospitalisation ?", a: "Depuis la page Hospitalisation, cliquez sur un lit disponible (vert) et remplissez le formulaire d'admission avec le patient, le service et le médecin référent." },
      { q: "Comment calculer la durée de séjour ?", a: "La durée est calculée automatiquement depuis la date d'admission. Elle est visible dans le résumé du séjour en jours." },
      { q: "Que signifient les couleurs des lits ?", a: "Vert = disponible, Bleu = occupé, Orange = en nettoyage/désinfection, Rouge = hors service. Les lits hors service sont configurés par l'administrateur." },
    ],
    items_en: [
      { q: "How do I admit a patient for hospitalization?", a: "From the Hospitalization page, click on an available bed (green) and fill in the admission form with the patient, service and referring doctor." },
      { q: "How is length of stay calculated?", a: "The duration is automatically calculated from the admission date. It is visible in the stay summary in days." },
      { q: "What do bed colors mean?", a: "Green = available, Blue = occupied, Orange = being cleaned/disinfected, Red = out of service. Out-of-service beds are configured by the administrator." },
    ],
  },
  {
    id: 'admin', label_fr: 'Administration', label_en: 'Administration', color: '#37474F',
    items_fr: [
      { q: "Comment créer un nouvel utilisateur ?", a: "Allez dans Utilisateurs → + Nouvel utilisateur. Renseignez le prénom, nom, email, rôle et mot de passe. L'utilisateur peut se connecter immédiatement." },
      { q: "Quels sont les rôles disponibles ?", a: "Superadmin, Admin, Médecin, Infirmier, Caissier, Pharmacien, Laborantin, DRH/Directeur. Chaque rôle a accès à des modules spécifiques." },
      { q: "Comment désactiver un compte utilisateur ?", a: "Dans la liste des utilisateurs, cliquez sur le toggle à côté d'un utilisateur pour le désactiver. Il ne pourra plus se connecter mais son historique est conservé." },
      { q: "Qu'est-ce que le journal d'audit ?", a: "Le journal d'audit enregistre toutes les actions effectuées dans le système (création, modification, suppression) avec l'utilisateur, la date et l'heure. Il est accessible aux administrateurs." },
      { q: "Comment configurer les paramètres de la clinique ?", a: "Allez dans Paramètres pour modifier les informations de l'établissement, les paramètres de sécurité, les délais de session et les notifications." },
      { q: "Comment sauvegarder les données ?", a: "Les sauvegardes sont automatiques côté serveur. Contactez votre administrateur système pour la politique de sauvegarde et la restauration en cas d'incident." },
    ],
    items_en: [
      { q: "How do I create a new user?", a: "Go to Users → + New user. Enter first name, last name, email, role and password. The user can log in immediately." },
      { q: "What roles are available?", a: "Superadmin, Admin, Doctor, Nurse, Cashier, Pharmacist, Lab technician, HR/Director. Each role has access to specific modules." },
      { q: "How do I deactivate a user account?", a: "In the user list, click the toggle next to a user to deactivate them. They will no longer be able to log in but their history is preserved." },
      { q: "What is the audit log?", a: "The audit log records all actions performed in the system (create, modify, delete) with user, date and time. It is accessible to administrators." },
      { q: "How do I configure clinic settings?", a: "Go to Settings to modify establishment information, security settings, session timeouts and notifications." },
      { q: "How do I back up data?", a: "Backups are automatic on the server side. Contact your system administrator for the backup policy and restoration procedure in case of incident." },
    ],
  },
  {
    id: 'technique', label_fr: 'Technique & Support', label_en: 'Technical & Support', color: '#C62828',
    items_fr: [
      { q: "L'application ne répond plus, que faire ?", a: "Actualisez la page (F5 ou Ctrl+R). Si le problème persiste, effacez le cache du navigateur (Ctrl+Shift+Del) et reconnectez-vous. Contactez le support si nécessaire." },
      { q: "Les données ne se chargent pas, pourquoi ?", a: "Vérifiez votre connexion internet. Si la connexion est bonne, le serveur peut être temporairement indisponible. Réessayez dans quelques minutes ou contactez le support." },
      { q: "Comment contacter le support SANTAREX ?", a: "Utilisez la page Support dans le menu pour soumettre un ticket. Précisez le module concerné, le message d'erreur et les étapes pour reproduire le problème." },
      { q: "L'application est-elle compatible avec tous les navigateurs ?", a: "L'ERP est optimisé pour Chrome, Edge et Firefox en version récente. Internet Explorer n'est pas supporté. Safari fonctionne mais avec quelques limitations mineures." },
      { q: "Comment vider le cache de l'application ?", a: "Dans votre navigateur : Ctrl+Shift+Del (Windows) ou Cmd+Shift+Del (Mac). Sélectionnez «Images et fichiers en cache» et validez. Reconnectez-vous ensuite." },
    ],
    items_en: [
      { q: "The application is not responding, what should I do?", a: "Refresh the page (F5 or Ctrl+R). If the problem persists, clear the browser cache (Ctrl+Shift+Del) and reconnect. Contact support if needed." },
      { q: "Data is not loading, why?", a: "Check your internet connection. If the connection is fine, the server may be temporarily unavailable. Try again in a few minutes or contact support." },
      { q: "How do I contact SANTAREX support?", a: "Use the Support page in the menu to submit a ticket. Specify the module involved, the error message and steps to reproduce the problem." },
      { q: "Is the application compatible with all browsers?", a: "The ERP is optimized for recent versions of Chrome, Edge and Firefox. Internet Explorer is not supported. Safari works but with some minor limitations." },
      { q: "How do I clear the application cache?", a: "In your browser: Ctrl+Shift+Del (Windows) or Cmd+Shift+Del (Mac). Select 'Cached images and files' and confirm. Then reconnect." },
    ],
  },
];

export default function FAQPage() {
  const [lang, setLang] = useState<Lang>('fr');
  const [search, setSearch] = useState('');
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CATEGORIES.map(cat => {
      const items = lang === 'fr' ? cat.items_fr : cat.items_en;
      const label = lang === 'fr' ? cat.label_fr : cat.label_en;
      if (activeCategory !== 'all' && cat.id !== activeCategory) return null;
      if (!q) return { ...cat, label, items };
      const matched = items.filter(i => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q));
      if (matched.length === 0) return null;
      return { ...cat, label, items: matched };
    }).filter(Boolean) as (Category & { label: string; items: FAQ[] })[];
  }, [lang, search, activeCategory]);

  const totalItems = filtered.reduce((s, c) => s + c.items.length, 0);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HelpCircle size={22} color="#1565C0" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1A2332' }}>
              {lang === 'fr' ? 'Foire aux questions' : 'Frequently Asked Questions'}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#546E7A' }}>
              {lang === 'fr' ? `${totalItems} réponse(s) disponible(s)` : `${totalItems} answer(s) available`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['fr', 'en'] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: lang === l ? '#1565C0' : '#F0F4F8', color: lang === l ? '#fff' : '#546E7A' }}>
              {l === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={lang === 'fr' ? 'Rechercher dans la FAQ…' : 'Search the FAQ…'}
          style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#FAFAFA', color: '#37474F', boxSizing: 'border-box' }} />
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button onClick={() => setActiveCategory('all')}
          style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: activeCategory === 'all' ? '#1565C0' : '#F0F4F8', color: activeCategory === 'all' ? '#fff' : '#546E7A' }}>
          {lang === 'fr' ? 'Toutes' : 'All'}
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: activeCategory === cat.id ? cat.color : '#F0F4F8', color: activeCategory === cat.id ? '#fff' : '#546E7A' }}>
            {lang === 'fr' ? cat.label_fr : cat.label_en}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      {filtered.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: 12, color: '#90A4AE', fontSize: 14 }}>
          {lang === 'fr' ? 'Aucune réponse trouvée pour votre recherche.' : 'No answer found for your search.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {filtered.map(cat => (
            <div key={cat.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ height: 2, width: 20, background: cat.color, borderRadius: 2 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{cat.label}</span>
                <div style={{ flex: 1, height: 1, background: '#F0F4F8' }} />
                <span style={{ fontSize: 11, color: '#90A4AE' }}>{cat.items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cat.items.map((item, i) => {
                  const key = `${cat.id}-${i}`;
                  const open = openItem === key;
                  return (
                    <div key={key} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', border: open ? `1px solid ${cat.color}44` : '1px solid transparent', transition: 'border-color 0.15s' }}>
                      <button onClick={() => setOpenItem(open ? null : key)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: open ? cat.color : '#1A2332', flex: 1, lineHeight: 1.4 }}>{item.q}</span>
                        <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: open ? cat.color : '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                          {open ? <ChevronUp size={14} color="#fff" /> : <ChevronDown size={14} color="#90A4AE" />}
                        </div>
                      </button>
                      {open && (
                        <div style={{ padding: '0 18px 16px', fontSize: 13, color: '#37474F', lineHeight: 1.7, borderTop: `1px solid ${cat.color}22` }}>
                          <div style={{ paddingTop: 12 }}>{item.a}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
