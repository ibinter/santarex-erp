'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, X } from 'lucide-react';
import { api } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Patient } from '@/types';

type FormData = Omit<Patient, 'id' | 'ipp' | 'createdAt' | 'updatedAt'> & {
  allergies: string;
  antecedents: string;
};

const initialForm: FormData = {
  nom: '',
  prenom: '',
  dateNaissance: '',
  sexe: 'M',
  telephone: '',
  telephoneUrgence: '',
  adresse: '',
  ville: '',
  pays: 'CI',
  groupeSanguin: '',
  allergies: '',
  antecedents: '',
  assuranceNom: '',
  assuranceNumero: '',
  assuranceTiersPayant: false,
  statut: 'actif',
};

const groupesSanguins = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const pays = [
  { code: 'CI', label: "Côte d'Ivoire" },
  { code: 'SN', label: 'Sénégal' },
  { code: 'ML', label: 'Mali' },
  { code: 'BF', label: 'Burkina Faso' },
  { code: 'GH', label: 'Ghana' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'CM', label: 'Cameroun' },
  { code: 'TG', label: 'Togo' },
  { code: 'BJ', label: 'Bénin' },
  { code: 'GN', label: 'Guinée' },
  { code: 'FR', label: 'France' },
];

export default function NouveauPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.nom.trim()) newErrors.nom = 'Le nom est obligatoire.';
    if (!form.prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire.';
    if (!form.dateNaissance) newErrors.dateNaissance = 'La date de naissance est obligatoire.';
    if (!form.sexe) newErrors.sexe = 'Le sexe est obligatoire.';
    if (form.telephone && !/^\+?[\d\s\-()]{7,20}$/.test(form.telephone)) {
      newErrors.telephone = 'Numéro de téléphone invalide.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGlobalError(null);

    try {
      await api.createPatient(form);
      router.push('/patients');
    } catch (err: unknown) {
      setGlobalError((err as Error).message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar module="patients" />

      <main className="flex-1 pl-[260px] p-6 max-w-[1100px]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors"
            aria-label="Retour"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Nouveau patient</h1>
            <p className="text-sm text-text-secondary">
              Remplissez les informations du patient. Les champs marqués * sont obligatoires.
            </p>
          </div>
        </div>

        {globalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          {/* Section 1 : Informations obligatoires */}
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="section-title">Informations obligatoires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom de famille"
                name="nom"
                value={form.nom}
                onChange={(e) => setField('nom', e.target.value)}
                error={errors.nom}
                placeholder="KOUASSI"
                required
              />
              <Input
                label="Prénom(s)"
                name="prenom"
                value={form.prenom}
                onChange={(e) => setField('prenom', e.target.value)}
                error={errors.prenom}
                placeholder="Amara Jean"
                required
              />
              <Input
                label="Date de naissance"
                name="dateNaissance"
                type="date"
                value={form.dateNaissance}
                onChange={(e) => setField('dateNaissance', e.target.value)}
                error={errors.dateNaissance}
                required
              />
              <div>
                <label className="label">
                  Sexe <span className="text-danger">*</span>
                </label>
                <div className="flex items-center gap-6 mt-2">
                  {[
                    { value: 'M', label: 'Masculin' },
                    { value: 'F', label: 'Féminin' },
                    { value: 'I', label: 'Indéterminé' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer text-sm text-text-primary"
                    >
                      <input
                        type="radio"
                        name="sexe"
                        value={opt.value}
                        checked={form.sexe === opt.value}
                        onChange={() => setField('sexe', opt.value as 'M' | 'F' | 'I')}
                        className="accent-primary w-4 h-4"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.sexe && <p className="error-text">{errors.sexe}</p>}
              </div>
            </div>
          </div>

          {/* Section 2 : Coordonnées */}
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="section-title">Coordonnées</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Téléphone principal"
                name="telephone"
                type="tel"
                value={form.telephone || ''}
                onChange={(e) => setField('telephone', e.target.value)}
                error={errors.telephone}
                placeholder="+225 07 00 00 00 00"
              />
              <Input
                label="Téléphone d'urgence"
                name="telephoneUrgence"
                type="tel"
                value={form.telephoneUrgence || ''}
                onChange={(e) => setField('telephoneUrgence', e.target.value)}
                placeholder="+225 05 00 00 00 00"
              />
              <Input
                label="Adresse"
                name="adresse"
                value={form.adresse || ''}
                onChange={(e) => setField('adresse', e.target.value)}
                placeholder="Quartier, rue, numéro…"
                containerClassName="sm:col-span-2"
              />
              <Input
                label="Ville"
                name="ville"
                value={form.ville || ''}
                onChange={(e) => setField('ville', e.target.value)}
                placeholder="Abidjan"
              />
              <div>
                <label className="label">Pays</label>
                <select
                  value={form.pays}
                  onChange={(e) => setField('pays', e.target.value)}
                  className="input-field"
                >
                  {pays.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3 : Informations médicales */}
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="section-title">Informations médicales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Groupe sanguin</label>
                <select
                  value={form.groupeSanguin || ''}
                  onChange={(e) => setField('groupeSanguin', e.target.value)}
                  className="input-field"
                >
                  <option value="">Non renseigné</option>
                  {groupesSanguins.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                {/* spacer */}
              </div>

              <div className="sm:col-span-2">
                <label className="label">Allergies connues</label>
                <textarea
                  value={form.allergies}
                  onChange={(e) => setField('allergies', e.target.value)}
                  rows={3}
                  placeholder="Pénicilline, arachides, latex… (laisser vide si aucune)"
                  className="input-field resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Antécédents médicaux</label>
                <textarea
                  value={form.antecedents}
                  onChange={(e) => setField('antecedents', e.target.value)}
                  rows={3}
                  placeholder="Diabète, hypertension, chirurgies passées…"
                  className="input-field resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4 : Assurance */}
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="section-title">Assurance maladie</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom de l'assurance"
                name="assuranceNom"
                value={form.assuranceNom || ''}
                onChange={(e) => setField('assuranceNom', e.target.value)}
                placeholder="NSIA, SUNU, CNPS…"
              />
              <Input
                label="Numéro de police / adhérent"
                name="assuranceNumero"
                value={form.assuranceNumero || ''}
                onChange={(e) => setField('assuranceNumero', e.target.value)}
                placeholder="ASSU-2024-000000"
              />
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setField('assuranceTiersPayant', !form.assuranceTiersPayant)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      form.assuranceTiersPayant ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        form.assuranceTiersPayant ? 'translate-x-5' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Prise en charge tiers-payant</p>
                    <p className="text-xs text-text-secondary">
                      Le patient bénéficie d'une prise en charge directe par l'assurance.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Button
              type="button"
              variant="ghost"
              leftIcon={<X size={16} />}
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              leftIcon={<Save size={16} />}
            >
              Enregistrer le patient
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
