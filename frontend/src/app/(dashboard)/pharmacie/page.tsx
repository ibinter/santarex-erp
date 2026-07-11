'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Package, AlertTriangle, TrendingDown, ArrowDownToLine } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import EntreeStockModal from '@/components/pharmacie/EntreeStockModal';
import type { Medicament } from '@/types';

// ─── Mock data ──────────────────────────────────────────────
const MOCK_MEDICAMENTS: Medicament[] = [
  {
    id: 'm1', code: 'MED-001', nom: 'Amoxicilline 500mg', nomCommercial: 'Clamoxyl',
    dci: 'Amoxicilline', forme: 'comprime', dosage: '500mg', unite: 'comprimé',
    categorie: 'antibiotique', stockActuel: 45, stockMinimum: 50, stockMaximum: 500,
    prixUnitaireAchat: 150, prixVente: 250, ordonnanceRequise: true, actif: true, createdAt: '2024-01-10',
  },
  {
    id: 'm2', code: 'MED-002', nom: 'Paracétamol 1g', nomCommercial: 'Efferalgan',
    dci: 'Paracétamol', forme: 'comprime', dosage: '1g', unite: 'comprimé',
    categorie: 'antalgique', stockActuel: 320, stockMinimum: 100, stockMaximum: 1000,
    prixUnitaireAchat: 50, prixVente: 100, ordonnanceRequise: false, actif: true, createdAt: '2024-01-10',
  },
  {
    id: 'm3', code: 'MED-003', nom: 'Amlodipine 5mg', nomCommercial: 'Amlor',
    dci: 'Amlodipine', forme: 'comprime', dosage: '5mg', unite: 'comprimé',
    categorie: 'antihypertenseur', stockActuel: 8, stockMinimum: 30, stockMaximum: 300,
    prixUnitaireAchat: 200, prixVente: 400, ordonnanceRequise: true, actif: true, createdAt: '2024-01-10',
  },
  {
    id: 'm4', code: 'MED-004', nom: 'Artéméther-Luméfantrine 20/120mg', nomCommercial: 'Coartem',
    dci: 'Artéméther + Luméfantrine', forme: 'comprime', dosage: '20/120mg', unite: 'comprimé',
    categorie: 'antipaludeen', stockActuel: 0, stockMinimum: 50, stockMaximum: 500,
    prixUnitaireAchat: 1200, prixVente: 1800, ordonnanceRequise: true, actif: true, createdAt: '2024-01-10',
  },
  {
    id: 'm5', code: 'MED-005', nom: 'Ibuprofène 400mg', nomCommercial: 'Advil',
    dci: 'Ibuprofène', forme: 'comprime', dosage: '400mg', unite: 'comprimé',
    categorie: 'antalgique', stockActuel: 180, stockMinimum: 80, stockMaximum: 800,
    prixUnitaireAchat: 80, prixVente: 150, ordonnanceRequise: false, actif: true, createdAt: '2024-01-10',
  },
  {
    id: 'm6', code: 'MED-006', nom: 'Metformine 500mg', nomCommercial: 'Glucophage',
    dci: 'Metformine', forme: 'comprime', dosage: '500mg', unite: 'comprimé',
    categorie: 'autre', stockActuel: 62, stockMinimum: 40, stockMaximum: 400,
    prixUnitaireAchat: 120, prixVente: 200, ordonnanceRequise: true, actif: true, createdAt: '2024-01-10',
  },
];

type TabId = 'tous' | 'rupture' | 'peremption' | 'mouvements';

function getStockStatut(m: Medicament): 'rupture' | 'alerte' | 'ok' {
  if (m.stockActuel <= 0) return 'rupture';
  if (m.stockActuel <= m.stockMinimum) return 'alerte';
  if (m.stockActuel <= m.stockMinimum * 1.5) return 'alerte';
  return 'ok';
}

function formatXOF(val: number) {
  return val.toLocaleString('fr-FR') + ' XOF';
}

export default function PharmaciePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('tous');
  const [search, setSearch] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [showEntreeModal, setShowEntreeModal] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<string | undefined>();

  const ruptures = MOCK_MEDICAMENTS.filter(m => m.stockActuel <= 0);
  const alertes = MOCK_MEDICAMENTS.filter(m => m.stockActuel > 0 && m.stockActuel <= m.stockMinimum * 1.5);
  const valeurTotale = MOCK_MEDICAMENTS.reduce((acc, m) => acc + m.stockActuel * m.prixUnitaireAchat, 0);

  const filtered = MOCK_MEDICAMENTS.filter(m => {
    const matchSearch = !search || m.nom.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase()) || (m.dci || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !categorieFilter || m.categorie === categorieFilter;
    const statut = getStockStatut(m);
    const matchStatut = !statutFilter || statut === statutFilter;
    const matchTab =
      activeTab === 'tous' ||
      (activeTab === 'rupture' && statut === 'rupture') ||
      (activeTab === 'peremption' && false); // à brancher
    return matchSearch && matchCat && matchStatut && (activeTab === 'tous' || activeTab === 'peremption' ? true : matchTab || activeTab !== 'rupture' || statut === 'rupture');
  }).filter(m => {
    if (activeTab === 'rupture') return getStockStatut(m) === 'rupture' || getStockStatut(m) === 'alerte';
    return true;
  });

  const displayList = activeTab === 'rupture'
    ? MOCK_MEDICAMENTS.filter(m => getStockStatut(m) !== 'ok')
    : MOCK_MEDICAMENTS.filter(m => {
        const matchSearch = !search || m.nom.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase());
        const matchCat = !categorieFilter || m.categorie === categorieFilter;
        const statut = getStockStatut(m);
        const matchStatut = !statutFilter || statut === statutFilter;
        return matchSearch && matchCat && matchStatut;
      });

  const openEntreeModal = (medId?: string) => {
    setSelectedMedId(medId);
    setShowEntreeModal(true);
  };

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: 'tous', label: 'Tous', count: MOCK_MEDICAMENTS.length },
    { id: 'rupture', label: 'En rupture / alerte', count: ruptures.length + alertes.length },
    { id: 'peremption', label: 'Péremption proche', count: 2 },
    { id: 'mouvements', label: 'Mouvements' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pharmacie</h1>
          <p className="text-sm text-text-secondary mt-0.5">Gestion des médicaments et du stock</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<ArrowDownToLine size={16} />}
            onClick={() => openEntreeModal()}
          >
            Entrée de stock
          </Button>
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => router.push('/pharmacie/medicaments/nouveau')}
          >
            Nouveau médicament
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Total médicaments</p>
              <p className="text-2xl font-bold text-text-primary">{MOCK_MEDICAMENTS.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <TrendingDown size={20} className="text-danger" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">En rupture</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-danger">{ruptures.length}</p>
                {ruptures.length > 0 && (
                  <Badge variant="danger">{ruptures.length}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Alertes stock</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-warning">{alertes.length}</p>
                {alertes.length > 0 && (
                  <Badge variant="warning">{alertes.length}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Package size={20} className="text-success" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Valeur du stock</p>
              <p className="text-lg font-bold text-success">{formatXOF(valeurTotale)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs rounded-full px-2 py-0.5 ${
                activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-text-secondary'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filtres */}
      {activeTab !== 'mouvements' && (
        <div className="bg-white border border-border rounded-card p-4 mb-5 flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Rechercher nom, code, DCI..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Catégorie</label>
            <select
              className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={categorieFilter}
              onChange={e => setCategorieFilter(e.target.value)}
            >
              <option value="">Toutes catégories</option>
              <option value="antibiotique">Antibiotique</option>
              <option value="antalgique">Antalgique</option>
              <option value="antihypertenseur">Antihypertenseur</option>
              <option value="antipaludeen">Antipaludéen</option>
              <option value="antiretroviral">Antirétroviral</option>
              <option value="vaccin">Vaccin</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Statut stock</label>
            <select
              className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={statutFilter}
              onChange={e => setStatutFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="rupture">Rupture</option>
              <option value="alerte">Alerte</option>
              <option value="ok">OK</option>
            </select>
          </div>
        </div>
      )}

      {/* Table médicaments */}
      {activeTab !== 'mouvements' && (
        <div className="bg-white border border-border rounded-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Nom / DCI</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Forme</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Dosage</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Stock actuel</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Stock min</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Prix vente</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayList.map(m => {
                const statut = getStockStatut(m);
                const rowClass =
                  statut === 'rupture'
                    ? 'bg-red-50 hover:bg-red-100/70'
                    : statut === 'alerte'
                    ? 'bg-amber-50 hover:bg-amber-100/70'
                    : 'hover:bg-gray-50';
                return (
                  <tr key={m.id} className={`transition-colors ${rowClass}`}>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{m.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{m.nom}</p>
                      {m.dci && <p className="text-xs text-text-secondary">{m.dci}</p>}
                    </td>
                    <td className="px-4 py-3 capitalize text-text-secondary">{m.forme}</td>
                    <td className="px-4 py-3 text-text-secondary">{m.dosage}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${statut === 'rupture' ? 'text-danger' : statut === 'alerte' ? 'text-warning' : 'text-success'}`}>
                        {m.stockActuel}
                      </span>
                      <span className="text-text-secondary text-xs ml-1">{m.unite}s</span>
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary">{m.stockMinimum}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatXOF(m.prixVente)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={statut === 'rupture' ? 'danger' : statut === 'alerte' ? 'warning' : 'success'}
                        dot
                      >
                        {statut === 'rupture' ? 'Rupture' : statut === 'alerte' ? 'Alerte' : 'OK'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEntreeModal(m.id)}
                        title="Entrée de stock"
                        className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors"
                      >
                        <ArrowDownToLine size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {displayList.length === 0 && (
            <div className="text-center py-12 text-text-secondary">
              <Package size={36} className="mx-auto mb-2 opacity-30" />
              <p>Aucun médicament ne correspond aux filtres.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'mouvements' && (
        <div className="bg-white rounded-card border border-border p-12 text-center">
          <Package size={40} className="mx-auto mb-3 opacity-30 text-text-secondary" />
          <p className="text-text-secondary">Historique des mouvements de stock — disponible prochainement.</p>
        </div>
      )}

      {/* Modal entrée stock */}
      <EntreeStockModal
        isOpen={showEntreeModal}
        onClose={() => setShowEntreeModal(false)}
        medicamentId={selectedMedId}
        medicaments={MOCK_MEDICAMENTS}
        onSave={(data) => { console.log('Entrée stock:', data); setShowEntreeModal(false); }}
      />
    </div>
  );
}
