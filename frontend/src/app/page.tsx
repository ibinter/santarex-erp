import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SANTAREX ERP — Logiciel de Gestion Hospitalière pour l\'Afrique',
  description: 'SANTAREX ERP est le logiciel SaaS de gestion hospitalière conçu pour les établissements de santé africains. Patients, consultations, pharmacie, facturation, laboratoire — tout en un.',
  openGraph: {
    title: 'SANTAREX ERP — Gestion hospitalière intelligente',
    description: 'La solution SaaS complète pour cliniques, hôpitaux et cabinets médicaux en Afrique.',
    url: 'https://santarex.ibigsoft.com',
    siteName: 'SANTAREX ERP',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'fr_CI',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'SANTAREX ERP', description: 'Gestion hospitalière SaaS pour l\'Afrique' },
  alternates: { canonical: 'https://santarex.ibigsoft.com' },
};

const MODULES = [
  { icon: '👤', title: 'Patients & DME', desc: 'Dossiers médicaux électroniques complets, IPP automatique, historique patient.' },
  { icon: '📅', title: 'Rendez-Vous', desc: 'Agenda médecin, créneaux disponibles, confirmations automatiques.' },
  { icon: '🩺', title: 'Consultations', desc: 'CIM-10, constantes vitales, ordonnances numériques, plan de soins.' },
  { icon: '💊', title: 'Pharmacie', desc: 'Stock en temps réel, alertes rupture, gestion des lots et péremptions.' },
  { icon: '🔬', title: 'Laboratoire', desc: 'Demandes d\'analyses, saisie des résultats, validation biologiste.' },
  { icon: '🛏️', title: 'Hospitalisation', desc: 'Gestion des lits, prescriptions, notes médicales, soins infirmiers.' },
  { icon: '🚨', title: 'Urgences', desc: 'Triage Manchester, suivi temps réel des passages aux urgences.' },
  { icon: '🧾', title: 'Facturation', desc: 'Devis, factures, tiers-payant, paiement mobile money.' },
  { icon: '📊', title: 'Tableau de bord', desc: 'KPIs en temps réel, taux d\'occupation, recettes journalières.' },
];

const PLANS = [
  {
    code: 'STARTER', prix: '49 000', cycle: 'mois', users: 5, desc: 'Petites structures',
    modules: ['Patients & DME', 'Consultations', 'Rendez-vous', 'Facturation'],
    highlight: false,
  },
  {
    code: 'PROFESSIONNEL', prix: '99 000', cycle: 'mois', users: 15, desc: 'Cliniques & polycliniques',
    modules: ['Tous les modules STARTER', 'Pharmacie', 'Laboratoire', 'Urgences', 'Rapports avancés'],
    highlight: true,
  },
  {
    code: 'ENTERPRISE', prix: 'Sur devis', cycle: '', users: 999, desc: 'Hôpitaux & groupes',
    modules: ['Tous les modules', 'Multi-sites', 'API dédiée', 'Support prioritaire 24/7', 'Formation sur site'],
    highlight: false,
  },
];

const TEMOIGNAGES = [
  { nom: 'Dr. Konan A.', poste: 'Directeur médical, Abidjan', texte: 'SANTAREX a transformé notre gestion. La pharmacie est enfin synchronisée avec les prescriptions des médecins.' },
  { nom: 'Mme Traoré F.', poste: 'Responsable admin, Clinique Espoir', texte: 'Le tableau de bord nous donne une visibilité complète sur nos recettes et notre taux d\'occupation en temps réel.' },
  { nom: 'Dr. Coulibaly M.', poste: 'Médecin généraliste', texte: 'Les ordonnances numériques et le DME m\'économisent 2 heures de paperasse par jour. Indispensable !' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="SANTAREX ERP" className="h-9 w-auto object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            <a href="#modules" className="hover:text-blue-700 transition-colors">Modules</a>
            <a href="#tarifs" className="hover:text-blue-700 transition-colors">Tarifs</a>
            <a href="#contact" className="hover:text-blue-700 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors hidden sm:block">
              Connexion
            </Link>
            <a href="#contact" className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}>
              Demander une démo
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-28 pb-20 px-5" style={{ background: 'linear-gradient(135deg,#0D47A1 0%,#00838F 60%,#00BCD4 100%)' }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Disponible en Côte d'Ivoire, Sénégal, Mali, Burkina Faso
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            La gestion hospitalière<br />
            <span style={{ color: '#00BCD4' }}>pensée pour l'Afrique</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            SANTAREX ERP est le logiciel SaaS complet pour cliniques, hôpitaux et cabinets médicaux.
            Patients, consultations, pharmacie, facturation — tout en un, accessible depuis n'importe où.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact" className="px-7 py-3.5 rounded-xl font-bold bg-white hover:bg-blue-50 transition-colors text-base" style={{ color: '#0D47A1' }}>
              Essai gratuit 30 jours →
            </a>
            <a href="#modules" className="px-7 py-3.5 rounded-xl font-semibold text-white border-2 border-white/40 hover:border-white/70 transition-colors text-base">
              Voir les modules
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
            {[
              { v: '9', l: 'Modules cliniques' },
              { v: '30j', l: 'Essai gratuit' },
              { v: '100%', l: 'Made for Africa' },
              { v: '24/7', l: 'Support inclus' },
            ].map(({ v, l }) => (
              <div key={l} className="bg-white/10 backdrop-blur rounded-xl py-4 px-3">
                <div className="text-2xl font-extrabold">{v}</div>
                <div className="text-xs text-blue-200 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MODULES ─── */}
      <section id="modules" className="py-20 px-5 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">9 modules intégrés</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Une seule plateforme pour tous les services de votre établissement de santé.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((m) => (
              <div key={m.title} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="text-3xl mb-3">{m.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1.5">{m.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POURQUOI SANTAREX ─── */}
      <section className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Pourquoi choisir SANTAREX ?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🌍', t: 'Adapté à l\'Afrique', d: 'FCFA, mobile money, fonctionnement hors ligne partiel, interface pensée pour les réalités locales.' },
              { icon: '☁️', t: 'Cloud & SaaS', d: 'Aucune installation. Accessible depuis un navigateur, une tablette ou un smartphone.' },
              { icon: '🔒', t: 'Sécurité médicale', d: 'Données chiffrées, accès par rôle, journal d\'audit complet, conformité RGPD.' },
              { icon: '📈', t: 'Évolutif', d: 'De 5 à des centaines d\'utilisateurs. Ajoutez des modules à mesure que vous grandissez.' },
            ].map(({ icon, t, d }) => (
              <div key={t} className="text-center p-6 rounded-xl" style={{ background: '#F0F7FF' }}>
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TARIFS ─── */}
      <section id="tarifs" className="py-20 px-5 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Tarifs transparents</h2>
            <p className="text-gray-500 mt-2">Tous les prix en FCFA, HT. Essai gratuit 30 jours sans carte bancaire.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((p) => (
              <div key={p.code} className={`bg-white rounded-2xl overflow-hidden border transition-all ${
                p.highlight ? 'border-blue-700 ring-2 shadow-lg md:scale-105' : 'border-gray-100'
              }`} style={p.highlight ? { borderColor: '#0D47A1', '--tw-ring-color': '#0D47A115' } as any : {}}>
                {p.highlight && (
                  <div className="py-2 text-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}>
                    ★ LE PLUS POPULAIRE
                  </div>
                )}
                <div className="p-6">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{p.desc}</div>
                  <div className="text-xl font-extrabold text-gray-900">{p.code}</div>
                  <div className="mt-3 mb-5">
                    <span className="text-3xl font-extrabold" style={{ color: '#0D47A1' }}>{p.prix}</span>
                    {p.cycle && <span className="text-gray-400 text-sm ml-1">FCFA/{p.cycle}</span>}
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-teal-500 font-bold">✓</span>
                      Jusqu'à {p.users === 999 ? 'illimité' : p.users} utilisateurs
                    </li>
                    {p.modules.map((m) => (
                      <li key={m} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-teal-500 font-bold">✓</span> {m}
                      </li>
                    ))}
                  </ul>
                  <a href="#contact"
                    className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${
                      p.highlight ? 'text-white hover:opacity-90' : 'border-2 text-blue-700 hover:text-white hover:bg-blue-700'
                    }`}
                    style={p.highlight ? { background: 'linear-gradient(135deg,#0D47A1,#00838F)', borderColor: '#0D47A1' } : { borderColor: '#0D47A1' }}>
                    {p.code === 'ENTERPRISE' ? 'Nous contacter' : 'Démarrer l\'essai gratuit'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TÉMOIGNAGES ─── */}
      <section className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Ils nous font confiance</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TEMOIGNAGES.map((t) => (
              <div key={t.nom} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.texte}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}>
                    {t.nom.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.nom}</div>
                    <div className="text-xs text-gray-400">{t.poste}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT / CTA ─── */}
      <section id="contact" className="py-20 px-5" style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}>
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl font-extrabold mb-4">Prêt à moderniser votre établissement ?</h2>
          <p className="text-blue-100 mb-8">
            Contactez notre équipe pour une démo personnalisée ou démarrez votre essai gratuit de 30 jours maintenant.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <a href="mailto:contact@ibigsoft.com"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white hover:bg-blue-50 transition-colors" style={{ color: '#0D47A1' }}>
              ✉ contact@ibigsoft.com
            </a>
            <a href="tel:+2252722276014"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-white/50 text-white hover:border-white transition-colors">
              📞 +225 27 22 27 60 14
            </a>
          </div>
          <div className="text-blue-200 text-sm">
            WhatsApp : +225 05 55 05 99 01 —{' '}
            <a href="https://ibigsoft.com" className="underline hover:text-white">ibigsoft.com</a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <img src="/logo.png" alt="SANTAREX ERP" className="h-8 w-auto object-contain mb-3 brightness-200" />
              <p className="text-sm leading-relaxed">
                SANTAREX ERP est un produit de <strong className="text-white">IBIG SOFT</strong><br />
                (Intermark Business International Group)
              </p>
            </div>
            <div>
              <div className="font-semibold text-white mb-3">Liens rapides</div>
              <ul className="space-y-1.5 text-sm">
                <li><a href="#modules" className="hover:text-white transition-colors">Modules</a></li>
                <li><a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
                <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-white mb-3">Contact</div>
              <ul className="space-y-1.5 text-sm">
                <li>contact@ibigsoft.com</li>
                <li>+225 27 22 27 60 14</li>
                <li>+225 05 55 05 99 01</li>
                <li className="text-gray-500">Abidjan, Côte d'Ivoire</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span>© {new Date().getFullYear()} IBIG SOFT — Tous droits réservés</span>
            <span>SANTAREX ERP v2.0 · Made with ❤️ for Africa</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
