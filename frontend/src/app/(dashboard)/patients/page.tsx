'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus, Eye, Edit, MoreHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table, { Column } from '@/components/ui/Table';
import type { Patient, ApiResponse, PaginatedResponse } from '@/types';

const statusBadge: Record<Patient['statut'], { variant: 'success' | 'neutral' | 'danger'; label: string }> = {
  actif: { variant: 'success', label: 'Actif' },
  inactif: { variant: 'neutral', label: 'Inactif' },
  decede: { variant: 'danger', label: 'Décédé' },
};

const bloodGroupColors: Record<string, string> = {
  'A+': 'bg-red-100 text-red-700',
  'A-': 'bg-red-100 text-red-700',
  'B+': 'bg-blue-100 text-blue-700',
  'B-': 'bg-blue-100 text-blue-700',
  'AB+': 'bg-purple-100 text-purple-700',
  'AB-': 'bg-purple-100 text-purple-700',
  'O+': 'bg-green-100 text-green-700',
  'O-': 'bg-green-100 text-green-700',
};

export default function PatientsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, search],
    queryFn: () => api.getPatients({ page, limit, ...(search ? { q: search } : {}) }) as Promise<ApiResponse<PaginatedResponse<Patient>>>,
  });

  const patients: Patient[] = (data as any)?.data ?? [];
  const total: number = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const columns: Column<Patient>[] = [
    {
      key: 'ipp',
      label: 'IPP',
      render: (row) => (
        <span className="font-mono text-xs text-text-secondary bg-gray-100 px-2 py-0.5 rounded">
          {row.ipp}
        </span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom complet',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
            {row.prenom.charAt(0)}{row.nom.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm">
              {row.prenom} {row.nom}
            </p>
            <p className="text-[11px] text-text-secondary capitalize">
              {row.sexe === 'M' ? 'Homme' : row.sexe === 'F' ? 'Femme' : 'Non précisé'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'dateNaissance',
      label: 'Date de naissance',
      render: (row) => (
        <span className="text-sm">
          {new Date(row.dateNaissance).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      render: (row) => (
        <span className="text-sm text-text-secondary">
          {row.telephone || '—'}
        </span>
      ),
    },
    {
      key: 'groupeSanguin',
      label: 'Groupe sanguin',
      render: (row) =>
        row.groupeSanguin ? (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              bloodGroupColors[row.groupeSanguin] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {row.groupeSanguin}
          </span>
        ) : (
          <span className="text-text-secondary text-sm">—</span>
        ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row) => {
        const { variant, label } = statusBadge[row.statut];
        return <Badge variant={variant} dot>{label}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => router.push(`/patients/${row.id}`)}
            className="p-1.5 rounded hover:bg-blue-50 text-primary transition-colors"
            title="Voir le dossier"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => router.push(`/patients/${row.id}/modifier`)}
            className="p-1.5 rounded hover:bg-gray-100 text-text-secondary transition-colors"
            title="Modifier"
          >
            <Edit size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar module="patients" />

      <main className="flex-1 pl-[260px] p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Patients</h1>
            <p className="text-sm text-text-secondary mt-1">
              {isLoading ? '…' : `${total} patient${total > 1 ? 's' : ''} enregistré${total > 1 ? 's' : ''}`}
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<UserPlus size={16} />}
            onClick={() => router.push('/patients/nouveau')}
          >
            Nouveau patient
          </Button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par nom, IPP, téléphone…"
              className="input-field pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Rechercher
          </Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setPage(1);
              }}
            >
              Réinitialiser
            </Button>
          )}
        </form>

        {/* Table */}
        <Table
          columns={columns}
          data={patients}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessage="Aucun patient trouvé"
          emptyIcon={<span>👤</span>}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={total}
          limit={limit}
        />
      </main>
    </div>
  );
}
