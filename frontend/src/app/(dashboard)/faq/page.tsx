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
    id: 'rendezvous', label_fr: 'Rendez-vous', label_en: 'Appointments', color: '#6D28D9',
    items_fr: [
      { q: "Comment planifier un rendez-vous ?", a: "Allez dans Rendez-vous → + Nouveau RDV. Sélectionnez le patient, le médecin, la date, l'heure et le motif. Le système vérifie automatiquement la disponibilité du médecin sur le créneau choisi." },
      { q: "Comment voir l'agenda d'un médecin ?", a: "La vue calendrier hebdomadaire affiche les créneaux par médecin. Utilisez les boutons < et > pour naviguer entre les semaines et filtrez par praticien si nécessaire." },
      { q: "Que signifient les statuts d'un rendez-vous ?", a: "Planifié (bleu) = créé mais non confirmé, Confirmé (vert) = validé par le patient, Honoré = le patient s'est présenté, Annulé (rouge) et Absent = le patient ne s'est pas présenté." },
      { q: "Comment confirmer ou annuler un rendez-vous ?", a: "Ouvrez le détail du rendez-vous et changez son statut. Un rendez-vous annulé libère automatiquement le créneau pour un autre patient." },
      { q: "Peut-on transformer un rendez-vous en consultation ?", a: "Oui, lorsque le patient se présente, créez la consultation depuis le module Consultations. Le rendez-vous est marqué Honoré pour garder la traçabilité du parcours." },
      { q: "Le patient reçoit-il un rappel de son rendez-vous ?", a: "Les rappels dépendent de la configuration des notifications de l'établissement. Vérifiez avec votre administrateur si les rappels SMS ou email sont activés dans Paramètres → Notifications." },
    ],
    items_en: [
      { q: "How do I schedule an appointment?", a: "Go to Appointments → + New appointment. Select the patient, doctor, date, time and reason. The system automatically checks the doctor's availability for the chosen slot." },
      { q: "How do I view a doctor's agenda?", a: "The weekly calendar view shows slots per doctor. Use the < and > buttons to navigate between weeks and filter by practitioner if needed." },
      { q: "What do appointment statuses mean?", a: "Scheduled (blue) = created but not confirmed, Confirmed (green) = validated by the patient, Attended = the patient showed up, Cancelled (red) and No-show = the patient did not attend." },
      { q: "How do I confirm or cancel an appointment?", a: "Open the appointment detail and change its status. A cancelled appointment automatically frees the slot for another patient." },
      { q: "Can an appointment be turned into a consultation?", a: "Yes, when the patient arrives, create the consultation from the Consultations module. The appointment is marked Attended to keep the care pathway traceable." },
      { q: "Does the patient receive an appointment reminder?", a: "Reminders depend on the facility's notification configuration. Check with your administrator whether SMS or email reminders are enabled in Settings → Notifications." },
    ],
  },
  {
    id: 'urgences', label_fr: 'Urgences', label_en: 'Emergencies', color: '#D32F2F',
    items_fr: [
      { q: "Comment admettre un patient aux urgences ?", a: "Depuis le module Urgences, cliquez sur + Nouvelle admission. Enregistrez le patient (ou créez-le rapidement), le motif de recours et le niveau de triage. Le patient apparaît immédiatement dans la file d'attente." },
      { q: "Qu'est-ce que le triage Manchester ?", a: "Le triage classe les patients par degré d'urgence sur 5 niveaux, du rouge (prise en charge immédiate) au bleu (non urgent). Le niveau détermine l'ordre de passage, pas l'ordre d'arrivée." },
      { q: "Comment est ordonnée la file d'attente des urgences ?", a: "La file est triée par niveau de triage puis par heure d'arrivée. Les cas critiques (rouge/orange) remontent automatiquement en tête de liste." },
      { q: "Comment orienter un patient des urgences vers l'hospitalisation ?", a: "Depuis la fiche du passage aux urgences, choisissez la sortie « Hospitalisation » : le patient peut alors être admis sur un lit disponible dans le module Hospitalisation." },
      { q: "Peut-on facturer un passage aux urgences ?", a: "Oui, les actes réalisés aux urgences (consultation, soins, examens) sont facturables depuis le module Facturation, comme pour toute prise en charge." },
      { q: "Comment clôturer un passage aux urgences ?", a: "Renseignez le mode de sortie (domicile, hospitalisation, transfert, décès) dans la fiche du passage. La durée de passage est calculée automatiquement." },
    ],
    items_en: [
      { q: "How do I admit a patient to emergencies?", a: "From the Emergencies module, click + New admission. Record the patient (or quickly create them), the reason for visit and the triage level. The patient immediately appears in the waiting queue." },
      { q: "What is Manchester triage?", a: "Triage classifies patients by urgency across 5 levels, from red (immediate care) to blue (non-urgent). The level determines the order of care, not the order of arrival." },
      { q: "How is the emergency queue ordered?", a: "The queue is sorted by triage level then by arrival time. Critical cases (red/orange) automatically move to the top of the list." },
      { q: "How do I move an emergency patient to hospitalization?", a: "From the emergency visit record, choose the 'Hospitalization' discharge: the patient can then be admitted to an available bed in the Hospitalization module." },
      { q: "Can an emergency visit be billed?", a: "Yes, procedures performed in emergencies (consultation, care, exams) are billable from the Billing module, as with any care episode." },
      { q: "How do I close an emergency visit?", a: "Enter the discharge mode (home, hospitalization, transfer, death) in the visit record. The visit duration is calculated automatically." },
    ],
  },
  {
    id: 'bloc', label_fr: 'Bloc opératoire', label_en: 'Operating Theatre', color: '#00838F',
    items_fr: [
      { q: "Comment programmer une intervention chirurgicale ?", a: "Depuis le module Bloc opératoire, cliquez sur + Nouvelle intervention. Renseignez le patient, le chirurgien, le type d'intervention, la salle et le créneau horaire." },
      { q: "Comment éviter les conflits de salle d'opération ?", a: "Le planning du bloc affiche l'occupation des salles par créneau. Le système signale un chevauchement si deux interventions sont programmées dans la même salle au même moment." },
      { q: "Peut-on associer une équipe à une intervention ?", a: "Oui, l'intervention permet de préciser le chirurgien principal, l'anesthésiste et le personnel assistant afin de constituer la feuille de programmation opératoire." },
      { q: "Comment suivre l'état d'une intervention ?", a: "Chaque intervention a un statut (programmée, en cours, terminée, annulée) mis à jour depuis sa fiche. Cela permet de suivre le déroulement du programme opératoire de la journée." },
      { q: "L'intervention est-elle liée au dossier du patient ?", a: "Oui, l'intervention est rattachée au dossier du patient et apparaît dans son historique de prise en charge, avec le compte rendu opératoire s'il est saisi." },
    ],
    items_en: [
      { q: "How do I schedule a surgical procedure?", a: "From the Operating Theatre module, click + New procedure. Enter the patient, surgeon, procedure type, room and time slot." },
      { q: "How do I avoid operating room conflicts?", a: "The theatre schedule shows room occupancy per slot. The system flags an overlap if two procedures are scheduled in the same room at the same time." },
      { q: "Can a team be assigned to a procedure?", a: "Yes, the procedure lets you specify the lead surgeon, anaesthetist and assisting staff to build the operating schedule sheet." },
      { q: "How do I track the status of a procedure?", a: "Each procedure has a status (scheduled, in progress, completed, cancelled) updated from its record. This lets you follow the day's operating programme." },
      { q: "Is the procedure linked to the patient file?", a: "Yes, the procedure is attached to the patient file and appears in their care history, with the operative report if entered." },
    ],
  },
  {
    id: 'imagerie', label_fr: 'Imagerie', label_en: 'Imaging', color: '#5B21B6',
    items_fr: [
      { q: "Comment demander un examen d'imagerie ?", a: "Depuis le module Imagerie, créez une demande en sélectionnant le patient, le type d'examen (radiographie, échographie, scanner, IRM) et l'indication clinique." },
      { q: "Comment saisir le compte rendu d'un examen ?", a: "Ouvrez la demande d'imagerie et renseignez le compte rendu radiologique dans la fiche. Une fois validé, il devient consultable dans le dossier du patient." },
      { q: "Les résultats d'imagerie apparaissent-ils dans le DME ?", a: "Oui, les examens d'imagerie et leurs comptes rendus sont visibles dans le Dossier Médical Électronique du patient, avec les autres résultats et consultations." },
      { q: "Peut-on suivre le statut d'une demande d'imagerie ?", a: "Oui, une demande passe par les statuts demandée, réalisée puis interprétée. Le suivi permet de savoir quels examens sont en attente de réalisation ou de compte rendu." },
      { q: "L'imagerie peut-elle être facturée ?", a: "Oui, chaque examen d'imagerie constitue un acte facturable ajouté à la facture du patient depuis le module Facturation." },
    ],
    items_en: [
      { q: "How do I request an imaging exam?", a: "From the Imaging module, create a request by selecting the patient, exam type (X-ray, ultrasound, CT scan, MRI) and clinical indication." },
      { q: "How do I enter an exam report?", a: "Open the imaging request and fill in the radiology report in the record. Once validated, it becomes viewable in the patient file." },
      { q: "Do imaging results appear in the EMR?", a: "Yes, imaging exams and their reports are visible in the patient's Electronic Medical Record, alongside other results and consultations." },
      { q: "Can I track the status of an imaging request?", a: "Yes, a request moves through requested, performed then reported statuses. Tracking shows which exams are pending performance or reporting." },
      { q: "Can imaging be billed?", a: "Yes, each imaging exam is a billable procedure added to the patient's invoice from the Billing module." },
    ],
  },
  {
    id: 'rh', label_fr: 'RH & Paie', label_en: 'HR & Payroll', color: '#558B2F',
    items_fr: [
      { q: "Comment ajouter un employé ?", a: "Dans le module RH, cliquez sur + Nouvel employé. Renseignez l'identité, le poste, le service, la date d'embauche et le type de contrat. L'employé apparaît alors dans l'effectif." },
      { q: "Comment gérer les congés du personnel ?", a: "Les demandes de congés se saisissent depuis la fiche de l'employé ou le module RH. Le solde de congés et les dates sont suivis pour chaque salarié." },
      { q: "Comment fonctionne la paie ?", a: "Le module RH/Paie permet de générer les bulletins à partir du salaire de base, des primes et des retenues. Vérifiez toujours les montants avant de valider une période de paie." },
      { q: "Quelle est la différence entre un utilisateur et un employé ?", a: "Un employé est une fiche RH (contrat, paie, congés). Un utilisateur est un compte de connexion à l'ERP. Un employé n'a pas forcément de compte, et inversement." },
      { q: "Peut-on suivre les plannings du personnel ?", a: "Oui, le module RH permet d'organiser les affectations et plannings des équipes par service afin d'assurer la continuité des soins." },
      { q: "Comment exporter la liste du personnel ?", a: "Sur la page RH, utilisez le bouton d'export pour télécharger l'effectif au format Excel avec les informations contractuelles principales." },
    ],
    items_en: [
      { q: "How do I add an employee?", a: "In the HR module, click + New employee. Enter identity, position, department, hire date and contract type. The employee then appears in the workforce." },
      { q: "How do I manage staff leave?", a: "Leave requests are entered from the employee record or the HR module. The leave balance and dates are tracked for each staff member." },
      { q: "How does payroll work?", a: "The HR/Payroll module generates payslips from base salary, bonuses and deductions. Always check the amounts before validating a payroll period." },
      { q: "What is the difference between a user and an employee?", a: "An employee is an HR record (contract, payroll, leave). A user is an ERP login account. An employee does not necessarily have an account, and vice versa." },
      { q: "Can staff schedules be tracked?", a: "Yes, the HR module lets you organise team assignments and schedules per department to ensure continuity of care." },
      { q: "How do I export the staff list?", a: "On the HR page, use the export button to download the workforce in Excel format with the main contractual information." },
    ],
  },
  {
    id: 'comptabilite', label_fr: 'Comptabilité', label_en: 'Accounting', color: '#455A64',
    items_fr: [
      { q: "Quelle est la différence entre Caisse et Comptabilité ?", a: "La Caisse suit les encaissements quotidiens au comptoir. La Comptabilité consolide l'ensemble des flux financiers (recettes, dépenses, journal) pour la gestion de l'établissement." },
      { q: "Comment enregistrer une dépense ?", a: "Depuis le module Comptabilité, ajoutez une écriture de dépense avec la date, le libellé, la catégorie et le montant. Elle est prise en compte dans le journal et les totaux." },
      { q: "Comment consulter le journal comptable ?", a: "Le journal liste chronologiquement toutes les écritures (recettes et dépenses). Vous pouvez filtrer par période pour analyser l'activité financière." },
      { q: "Les factures alimentent-elles automatiquement la comptabilité ?", a: "Les encaissements issus de la facturation sont reflétés dans les recettes. Vérifiez avec votre comptable la configuration des catégories pour un rapprochement fiable." },
      { q: "Peut-on exporter les données comptables ?", a: "Oui, les écritures et synthèses peuvent être exportées au format Excel depuis le module Comptabilité pour transmission au cabinet comptable." },
    ],
    items_en: [
      { q: "What is the difference between Cashier and Accounting?", a: "The Cashier tracks daily counter collections. Accounting consolidates all financial flows (revenue, expenses, ledger) for managing the facility." },
      { q: "How do I record an expense?", a: "From the Accounting module, add an expense entry with date, label, category and amount. It is included in the ledger and totals." },
      { q: "How do I view the accounting ledger?", a: "The ledger lists all entries chronologically (revenue and expenses). You can filter by period to analyse financial activity." },
      { q: "Do invoices automatically feed accounting?", a: "Collections from billing are reflected in revenue. Check the category configuration with your accountant for reliable reconciliation." },
      { q: "Can accounting data be exported?", a: "Yes, entries and summaries can be exported to Excel from the Accounting module for transmission to the accounting firm." },
    ],
  },
  {
    id: 'abonnement', label_fr: 'Abonnement & Licence', label_en: 'Subscription & License', color: '#EF6C00',
    items_fr: [
      { q: "Comment fonctionne l'abonnement SANTAREX ?", a: "SANTAREX est une plateforme SaaS facturée par abonnement (mensuel ou annuel). Chaque établissement dispose de sa licence et paie selon l'offre choisie et les modules activés." },
      { q: "Où voir l'état de ma licence ?", a: "La page Licence affiche votre offre en cours, la date d'échéance et les modules activés pour votre établissement." },
      { q: "Que se passe-t-il à l'expiration de l'abonnement ?", a: "À l'échéance, l'accès peut être restreint jusqu'au renouvellement. Vos données restent conservées ; contactez votre gestionnaire de compte pour renouveler à temps." },
      { q: "Comment changer d'offre ou ajouter des modules ?", a: "Contactez votre gestionnaire de compte ou l'équipe commerciale IBIG pour faire évoluer votre offre. Les modules supplémentaires sont activés à distance après souscription." },
      { q: "Quels modes de paiement sont acceptés pour l'abonnement ?", a: "Selon votre pays, l'abonnement peut être réglé par virement, mobile money ou carte. Adressez-vous à l'équipe commerciale pour les modalités de facturation." },
      { q: "L'essai gratuit engage-t-il à souscrire ?", a: "Non, l'essai gratuit est sans engagement et sans carte bancaire. À la fin de la période, vous choisissez librement de souscrire une offre payante." },
    ],
    items_en: [
      { q: "How does the SANTAREX subscription work?", a: "SANTAREX is a SaaS platform billed by subscription (monthly or yearly). Each facility has its own license and pays according to the chosen plan and activated modules." },
      { q: "Where do I see my license status?", a: "The License page shows your current plan, expiry date and the modules activated for your facility." },
      { q: "What happens when the subscription expires?", a: "At expiry, access may be restricted until renewal. Your data remains stored; contact your account manager to renew in time." },
      { q: "How do I change plan or add modules?", a: "Contact your account manager or the IBIG sales team to upgrade your plan. Additional modules are activated remotely after subscription." },
      { q: "What payment methods are accepted for the subscription?", a: "Depending on your country, the subscription can be paid by transfer, mobile money or card. Contact the sales team for billing arrangements." },
      { q: "Does the free trial commit me to subscribe?", a: "No, the free trial is without commitment and without a bank card. At the end of the period, you freely choose whether to subscribe to a paid plan." },
    ],
  },
  {
    id: 'notifications', label_fr: 'Notifications', label_en: 'Notifications', color: '#0277BD',
    items_fr: [
      { q: "Où consulter mes notifications ?", a: "Cliquez sur l'icône cloche en haut à droite de l'écran. Le nombre de notifications non lues y est indiqué par une pastille." },
      { q: "Quels événements déclenchent une notification ?", a: "Par exemple : stock pharmacie faible, nouveaux rendez-vous, résultats de laboratoire disponibles, nouvelles factures. La liste dépend de la configuration de l'établissement." },
      { q: "Comment marquer les notifications comme lues ?", a: "Ouvrez le panneau des notifications et cliquez sur « Tout marquer lu », ou ouvrez une notification pour la marquer lue individuellement." },
      { q: "Puis-je configurer les alertes reçues ?", a: "La configuration des types d'alertes se fait dans Paramètres → Notifications, généralement par un administrateur, pour l'ensemble de l'établissement." },
      { q: "Pourquoi je ne reçois pas de notifications ?", a: "Vérifiez que les notifications concernées sont activées dans les paramètres et que votre rôle a accès au module source. Sinon, contactez votre administrateur." },
    ],
    items_en: [
      { q: "Where do I see my notifications?", a: "Click the bell icon at the top right of the screen. The number of unread notifications is shown by a badge." },
      { q: "What events trigger a notification?", a: "For example: low pharmacy stock, new appointments, available lab results, new invoices. The list depends on the facility configuration." },
      { q: "How do I mark notifications as read?", a: "Open the notifications panel and click 'Mark all read', or open a notification to mark it read individually." },
      { q: "Can I configure the alerts I receive?", a: "Alert types are configured in Settings → Notifications, usually by an administrator, for the whole facility." },
      { q: "Why am I not receiving notifications?", a: "Check that the relevant notifications are enabled in settings and that your role has access to the source module. Otherwise, contact your administrator." },
    ],
  },
  {
    id: 'mobile', label_fr: 'Mobile & PWA', label_en: 'Mobile & PWA', color: '#7B1FA2',
    items_fr: [
      { q: "Puis-je installer SANTAREX comme une application ?", a: "Oui, SANTAREX est une application web progressive (PWA). Depuis Chrome ou Safari, utilisez « Ajouter à l'écran d'accueil » pour l'installer comme une application sur votre téléphone ou tablette." },
      { q: "L'ERP fonctionne-t-il sans connexion internet ?", a: "SANTAREX nécessite une connexion internet pour accéder aux données à jour et synchroniser les actions. Une connexion stable est recommandée pour un usage fiable." },
      { q: "L'affichage s'adapte-t-il aux petits écrans ?", a: "Oui, l'interface est responsive et s'ajuste automatiquement aux smartphones et tablettes. Les menus se replient pour optimiser l'espace disponible." },
      { q: "Quels navigateurs sont recommandés sur mobile ?", a: "Chrome (Android) et Safari (iOS) en version récente offrent la meilleure expérience. Maintenez votre navigateur à jour pour bénéficier des dernières optimisations." },
      { q: "Comment mettre à jour l'application installée ?", a: "En tant que PWA, SANTAREX se met à jour automatiquement au chargement lorsque vous êtes connecté à internet. Aucune installation manuelle n'est nécessaire." },
    ],
    items_en: [
      { q: "Can I install SANTAREX as an app?", a: "Yes, SANTAREX is a progressive web app (PWA). From Chrome or Safari, use 'Add to home screen' to install it like an app on your phone or tablet." },
      { q: "Does the ERP work without internet?", a: "SANTAREX requires an internet connection to access up-to-date data and sync actions. A stable connection is recommended for reliable use." },
      { q: "Does the display adapt to small screens?", a: "Yes, the interface is responsive and adjusts automatically to smartphones and tablets. Menus collapse to optimise the available space." },
      { q: "Which browsers are recommended on mobile?", a: "Recent versions of Chrome (Android) and Safari (iOS) offer the best experience. Keep your browser updated to benefit from the latest optimisations." },
      { q: "How do I update the installed app?", a: "As a PWA, SANTAREX updates automatically on load when you are connected to the internet. No manual installation is required." },
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
