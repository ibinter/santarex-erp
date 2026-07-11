'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const FORMES = [
  { value: 'comprime', label: 'Comprimé' },
  { value: 'gelule', label: 'Gélule' },
  { value: 'sirop', label: 'Sirop' },
  { value: 'injectable', label: 'Injectable' },
  { value: 'pommade', label: 'Pommade' },
  { value: 'collyre', label: 'Collyre' },
  { value: 'suppositoire', label: 'Suppositoire' },
  { value: 'patch', label: 'Patch' },
  { value: 'spray', label: 'Spray' },
  { value: 'autre', label: 'Autre' },
];

const CATEGORIES = [
  { value: 'antibiotique', label: 'Antibiotique' },
  { value: 'antalgique', label: 'Antalgique' },
  { value: 'antihypertenseur', label: 'Antihypertenseur' },
  { value: 'antipaludeen', label: 'Antipaludéen' },
  { value: 'antiretroviral', label: 'Antirétroviral' },
  { value: 'vaccin', label: 'Vaccin' },
  { value: 'autre', label: 'Autre' },
];

interface FormState {
  nom: string;
  nomCommercial: string;
  dci: string;
  forme: string;
  dosage: string;
  unite: string;
  categorie: string;
  classeTherapeutique: string;
  stockMinimum: string;
  stockMaximum: string;
  prixUnitaireAchat: string;
  prixVente: string;
  ordonnanceRequise: boolean;
  actif: boolean;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  );
}

export default function NouveauMedicamentPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    nom: '', nomCommercial: '', dci: '', forme: 'comprime', dosage: '', unite: 'comprimé',
    categorie: 'antibiotique', classeTherapeutique: '', stockMinimum: '10', stockMaximum: '1000',
    prixUnitaireAchat: '', prixVente: '', ordonnanceRequise: false, actif: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.nom.trim()) errs.nom = 'Le nom est obligatoire';
    if (!form.dosage.trim()) errs.dosage = 'Le dosage est obligatoire';
    if (!form.unite.trim()) errs.unite = 'L\'unité est obligatoire';
    if (Number(form.prixVente) < 0) errs.prixVente = 'Prix invalide';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    router.push('/pharmacie');
  };

  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-3 transition-colors"
          >
            <ArrowLeft size={16} /> Retour à la pharmacie
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Nouveau Médicament</h1>
          <p className="text-sm text-text-secondary mt-0.5">Renseigner les informations du médicament</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identification */}
          <div className="bg-white rounded-card border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4 pb-3 border-b border-border">
              Identification du médicament
            </h2>
            <div className="space-y-4">
              <Input
                label="Nom *"
                placeholder="Ex: Amoxicilline 500mg"
                value={form.nom}
                onChange={set('nom')}
                error={errors.nom}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nom commercial (optionnel)"
                  placeholder="Ex: Clamoxyl"
                  value={form.nomCommercial}
                  onChange={set('nomCommercial')}
                />
                <Input
                  label="DCI (optionnel)"
                  placeholder="Dénomination commune internationale"
                  value={form.dci}
                  onChange={set('dci')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Forme *</label>
                  <select
                    className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.forme}
                    onChange={set('forme')}
                  >
                    {FORMES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Catégorie *</label>
                  <select
                    className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.categorie}
                    onChange={set('categorie')}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Dosage *"
                  placeholder="Ex: 500mg, 5mg/ml"
                  value={form.dosage}
                  onChange={set('dosage')}
                  error={errors.dosage}
                />
                <Input
                  label="Unité *"
                  placeholder="Ex: comprimé, flacon"
                  value={form.unite}
                  onChange={set('unite')}
                  error={errors.unite}
                />
              </div>
              <Input
                label="Classe thérapeutique (optionnel)"
                placeholder="Ex: Bêtalactamine, AINS..."
                value={form.classeTherapeutique}
                onChange={set('classeTherapeutique')}
              />
            </div>
          </div>

          {/* Stock */}
          <div className="bg-white rounded-card border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4 pb-3 border-b border-border">
              Paramètres de stock
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stock minimum"
                type="number"
                min="0"
                value={form.stockMinimum}
                onChange={set('stockMinimum')}
              />
              <Input
                label="Stock maximum"
                type="number"
                min="0"
                value={form.stockMaximum}
                onChange={set('stockMaximum')}
              />
            </div>
          </div>

          {/* Prix */}
          <div className="bg-white rounded-card border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4 pb-3 border-b border-border">
              Tarification
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Prix unitaire achat</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="flex-1 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.prixUnitaireAchat}
                    onChange={set('prixUnitaireAchat')}
                  />
                  <span className="text-xs text-text-secondary font-medium">XOF</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Prix de vente</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className={`flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.prixVente ? 'border-danger' : 'border-border'}`}
                    value={form.prixVente}
                    onChange={set('prixVente')}
                  />
                  <span className="text-xs text-text-secondary font-medium">XOF</span>
                </div>
                {errors.prixVente && <p className="text-xs text-danger mt-1">{errors.prixVente}</p>}
              </div>
            </div>
            {form.prixUnitaireAchat && form.prixVente && Number(form.prixVente) > 0 && (
              <p className="text-xs text-text-secondary mt-3">
                Marge : <span className="font-semibold text-success">
                  {((Number(form.prixVente) - Number(form.prixUnitaireAchat)) / Number(form.prixVente) * 100).toFixed(1)}%
                </span>
                {' '}({(Number(form.prixVente) - Number(form.prixUnitaireAchat)).toLocaleString('fr-FR')} XOF)
              </p>
            )}
          </div>

          {/* Options */}
          <div className="bg-white rounded-card border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4 pb-3 border-b border-border">
              Options
            </h2>
            <div className="space-y-4">
              <Toggle
                checked={form.ordonnanceRequise}
                onChange={v => setForm(f => ({ ...f, ordonnanceRequise: v }))}
                label="Ordonnance requise"
              />
              <Toggle
                checked={form.actif}
                onChange={v => setForm(f => ({ ...f, actif: v }))}
                label="Médicament actif"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" leftIcon={<Save size={16} />} loading={loading}>
              Enregistrer le médicament
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
