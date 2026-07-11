'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Eye, FileText, CreditCard } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';

type StatutConsultation = 'en_cours' | 'terminee' | 'facturee';

const MOCK_CONSULTATIONS = [
  {
    id: 'c001', numero: 'CONS-2024-001', patient: { nom: 'Kouassi Ama', ipp: 'IPP-00142' },
    medecin: 'Dr. Koffi Ange', dateHeure: '2024-06-15T09:30', motif: 'Céphalées persistantes',
    diagnostic: 'Migraine sans aura', statut: 'terminee' as StatutConsultation,
  },
  {
    id: 'c002', numero: 'CONS-2024-002', patient: { nom: 'Traoré Moussa', ipp: 'IPP-00087' },
    medecin: 'Dr. Diallo Mariam', dateHeure: '2024-06-15T10:00', motif: 'Douleurs thoraciques',
    diagnostic: 'En cours', statut: 'en_cours' as StatutConsultation,
  },
  {
    id: 'c003', numero: 'CONS-2024-003', patient: { nom: 'N\'Guessan Brice', ipp: 'IPP-00215' },
    medecin: 'Dr. Koffi Ange', dateHeure: '2024-06-14T14:15', motif: 'Suivi HTA',
    diagnostic: 'HTA équilibrée', statut: 'facturee' as StatutConsultation,
  },
  {
    id: 'c004', numero: 'CONS-2024-004', patient: { nom: 'Ouédraogo Fatoumata', ipp: 'IPP-00312' },
    medecin: 'Dr. Soro Jean', dateHeure: '2024-06-14T11:30', motif: 'Fièvre + toux',
    diagnostic: 'Pneumonie bactérienne', statut: 'facturee' as StatutConsultation,
  },
  {
    id: 'c005', numero: 'CONS-2024-005', patient: { nom: 'Bamba Ibrahima', ipp: 'IPP-00098' },
    medecin: 'Dr. Diallo Mariam', dateHeure: '2024-06-15T11:00', motif: 'Consultation initiale',
    diagnostic: '', statut: 'en_cours' as StatutConsultation,
  },
];

const STATUT_META: Record<StatutConsultation, { label: string; badge: 'info' | 'success' | 'neutral' }> = {
  en_cours: { label: 'En cours', badge: 'info' },
  terminee: { label: 'Terminée', badge: 'success' },
  facturee: { label: 'Facturée', badge: 'neutral' },
};

const MEDECINS = ['Tous les médecins', 'Dr. Koffi Ange', 'Dr. Diallo Mariam', 'Dr. Soro Jean'];

export default function ConsultationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [medecin, setMedecin] = useState('Tous les médecins');
  const [statut, setStatut] = useState<StatutConsultation | 'tous'>('tous');

  const filtered = MOCK_CONSULTATIONS.filter(c => {
    const matchSearch =
      !search ||
      c.patient.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.patient.ipp.toLowerCase().includes(search.toLowerCase()) ||
      c.numero.toLowerCase().includes(search.toLowerCase());
    const matchMedecin = medecin === 'Tous les médecins' || c.medecin === medecin;
    const matchStatut = statut === 'tous' || c.statut === statut;
    return matchSearch && matchMedecin && matchStatut;
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Consultations</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {filtered.length} consultation{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={() => router.push('/consultations/nouvelle')}
        >
          Nouvelle Consultation
        </Button>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-border rounded-card p-4 mb-5 flex gap-3 flex-wrap items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Rechercher patient, IPP, numéro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Médecin</label>
          <select
            className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={medecin}
            onChange={e => setMedecin(e.target.value)}
          >
            {MEDECINS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Statut</label>
          <select
            className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={statut}
            onChange={e => setStatut(e.target.value as any)}
          >
            <option value="tous">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="facturee">Facturée</option>
          </select>
        </div>
        <Button variant="secondary" size="sm" leftIcon={<Filter size={14} />}>
          Plus de filtres
        </Button>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-border rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">N°</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Médecin</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Date / Heure</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Motif</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Diagnostic</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">{c.numero}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-text-primary">{c.patient.nom}</p>
                  <p className="text-xs text-text-secondary">{c.patient.ipp}</p>
                </td>
                <td className="px-4 py-3 text-text-primary">{c.medecin}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {new Date(c.dateHeure).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {new Date(c.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </td>
                <td className="px-4 py-3 max-w-[150px] truncate">{c.motif}</td>
                <td className="px-4 py-3 max-w-[150px] truncate">
                  {c.diagnostic || <span className="text-text-secondary italic">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUT_META[c.statut].badge} dot>
                    {STATUT_META[c.statut].label}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      title="Voir le détail"
                      onClick={() => router.push(`/consultations/${c.id}`)}
                      className="p-1.5 rounded hover:bg-blue-50 text-primary transition-colors"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      title="Ordonnance"
                      className="p-1.5 rounded hover:bg-green-50 text-success transition-colors"
                    >
                      <FileText size={15} />
                    </button>
                    {c.statut === 'terminee' && (
                      <button
                        title="Facturer"
                        className="p-1.5 rounded hover:bg-amber-50 text-warning transition-colors"
                      >
                        <CreditCard size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <FileText size={36} className="mx-auto mb-2 opacity-30" />
            <p>Aucune consultation ne correspond aux filtres.</p>
          </div>
        )}
      </div>
    </div>
  );
}
