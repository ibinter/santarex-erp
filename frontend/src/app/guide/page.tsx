import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Guide utilisateur — SANTAREX ERP',
  description: 'Documentation complète pour utiliser SANTAREX ERP.',
};

const SECTIONS = [
  {
    id: 'demarrage',
    titre: 'Prise en main rapide',
    emoji: '🚀',
    contenu: [
      { q: 'Comment me connecter ?', r: 'Rendez-vous sur votre URL SANTAREX et saisissez votre email et mot de passe fournis par votre administrateur.' },
      { q: 'Comment changer mon mot de passe ?', r: 'Menu Profil (en haut à droite) → Sécurité → Changer le mot de passe.' },
      { q: 'Comment naviguer dans le menu ?', r: 'La barre latérale gauche donne accès à tous les modules. Sur mobile, appuyez sur l\'icône menu en haut.' },
    ],
  },
  {
    id: 'patients',
    titre: 'Patients & DME',
    emoji: '🏥',
    contenu: [
      { q: 'Comment créer un dossier patient ?', r: 'Module Patients → bouton "+ Nouveau patient" → remplir les informations obligatoires (nom, prénom, date de naissance, sexe). Un IPP est généré automatiquement.' },
      { q: 'Comment accéder au dossier médical ?', r: 'Depuis la liste des patients, cliquez sur le nom du patient. Le DME s\'ouvre avec les onglets : Consultations, Ordonnances, Analyses, Hospitalisation.' },
      { q: 'Comment rechercher un patient ?', r: 'Utilisez la barre de recherche globale (Ctrl+K) ou la barre de recherche dans le module Patients — par nom, IPP ou téléphone.' },
    ],
  },
  {
    id: 'consultations',
    titre: 'Consultations',
    emoji: '🩺',
    contenu: [
      { q: 'Comment créer une consultation ?', r: 'Ouvrez le DME du patient → onglet Consultations → "+ Nouvelle consultation" → renseigner le motif, l\'examen clinique et le diagnostic.' },
      { q: 'Comment rédiger une ordonnance ?', r: 'Depuis la consultation → section Ordonnances → ajouter les médicaments avec posologie. L\'ordonnance est automatiquement liée au DME.' },
    ],
  },
  {
    id: 'pharmacie',
    titre: 'Pharmacie',
    emoji: '💊',
    contenu: [
      { q: 'Comment gérer les stocks ?', r: 'Module Pharmacie → Médicaments. Vous pouvez voir les niveaux de stock, définir les seuils d\'alerte et enregistrer les entrées/sorties.' },
      { q: 'Comment dispenser un médicament ?', r: 'Module Pharmacie → Dispensations → sélectionner l\'ordonnance → valider la dispensation. Le stock est mis à jour automatiquement.' },
    ],
  },
  {
    id: 'facturation',
    titre: 'Facturation',
    emoji: '🧾',
    contenu: [
      { q: 'Comment créer une facture ?', r: 'Module Facturation → "+ Nouvelle facture" → sélectionner le patient → ajouter les prestations → générer. La facture est numérotée automatiquement.' },
      { q: 'Comment exporter une facture en PDF ?', r: 'Ouvrir la facture → bouton "Exporter PDF" en haut à droite. Le PDF est généré avec l\'en-tête de votre établissement.' },
    ],
  },
  {
    id: 'laboratoire',
    titre: 'Laboratoire',
    emoji: '🔬',
    contenu: [
      { q: 'Comment enregistrer une demande d\'analyse ?', r: 'Module Laboratoire → "+ Nouvelle analyse" → sélectionner le patient et le type d\'examen → valider la prescription.' },
      { q: 'Comment saisir les résultats ?', r: 'Module Laboratoire → liste des analyses en attente → cliquer sur une analyse → saisir les valeurs → valider. Les résultats apparaissent dans le DME.' },
    ],
  },
  {
    id: 'parametres',
    titre: 'Paramètres & Administration',
    emoji: '⚙️',
    contenu: [
      { q: 'Comment créer un utilisateur ?', r: 'Accessible uniquement aux rôles Admin et Directeur. Menu Paramètres → Utilisateurs → "+ Ajouter". Choisissez le rôle parmi : Médecin, Infirmier, Pharmacien, Laborantin, Caissier, DRH.' },
      { q: 'Comment configurer l\'assistant IA ?', r: 'Menu Paramètres → Intelligence Artificielle → choisir le fournisseur (Groq recommandé pour la rapidité) et le modèle. Groq est gratuit jusqu\'à 14 400 requêtes/jour.' },
      { q: 'Comment contacter le support ?', r: 'Menu Support (dans la navigation) → Nouveau ticket. Notre équipe répond sous 24h ouvrées.' },
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-4xl mx-auto px-5 py-16">
        <Link href="/" className="text-sm text-blue-700 hover:underline mb-6 inline-block">← Accueil</Link>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Guide utilisateur SANTAREX ERP</h1>
        <p className="text-gray-500 mb-10">Retrouvez ici les réponses aux questions les plus fréquentes.</p>

        {/* Navigation rapide */}
        <div className="flex flex-wrap gap-2 mb-10">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}
              className="text-xs px-3 py-1.5 rounded-full border font-medium hover:border-blue-500 hover:text-blue-700 transition-colors"
              style={{ borderColor: '#d1d5db', color: '#374151' }}>
              {s.emoji} {s.titre}
            </a>
          ))}
        </div>

        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0D47A1' }}>
                <span>{section.emoji}</span> {section.titre}
              </h2>
              <div className="space-y-3">
                {section.contenu.map((item, i) => (
                  <details key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm group">
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-sm text-gray-800 list-none">
                      {item.q}
                      <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </summary>
                    <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">{item.r}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl p-6 text-center text-white" style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)' }}>
          <h3 className="font-bold text-lg mb-2">Vous ne trouvez pas votre réponse ?</h3>
          <p className="text-sm opacity-90 mb-4">Notre équipe support est disponible du lundi au vendredi, 8h–18h (GMT).</p>
          <a href="/support" className="inline-block px-5 py-2.5 bg-white rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ color: '#0D47A1' }}>
            Ouvrir un ticket support
          </a>
        </div>
      </div>
    </div>
  );
}
