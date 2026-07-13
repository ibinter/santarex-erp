'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertTriangle, UserPlus } from 'lucide-react';
import { apiClient } from '@/lib/api';

const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const PAYS = [
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

type FormData = {
  nom: string; prenom: string; dateNaissance: string; sexe: string;
  telephone: string; telephoneUrgence: string; adresse: string; ville: string; pays: string;
  groupeSanguin: string; allergies: string; antecedents: string;
  assuranceNom: string; assuranceNumero: string; assuranceTiersPayant: boolean;
};

export default function NouveauPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    nom: '', prenom: '', dateNaissance: '', sexe: 'M',
    telephone: '', telephoneUrgence: '', adresse: '', ville: '', pays: 'CI',
    groupeSanguin: '', allergies: '', antecedents: '',
    assuranceNom: '', assuranceNumero: '', assuranceTiersPayant: false,
  });

  const upd = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenom.trim() || !form.dateNaissance) {
      setError('Nom, prénom et date de naissance sont obligatoires.');
      return;
    }
    setLoading(true); setError(null);
    try {
      await apiClient('/patients', {
        method: 'POST',
        body: {
          nom: form.nom.trim().toUpperCase(),
          prenom: form.prenom.trim(),
          dateNaissance: form.dateNaissance,
          sexe: form.sexe,
          telephone: form.telephone || undefined,
          telephoneUrgence: form.telephoneUrgence || undefined,
          adresse: form.adresse || undefined,
          ville: form.ville || undefined,
          pays: form.pays,
          groupeSanguin: form.groupeSanguin || undefined,
          allergies: form.allergies || undefined,
          antecedents: form.antecedents || undefined,
          assuranceTiersPayant: form.assuranceTiersPayant,
          assuranceNom: form.assuranceNom || undefined,
          assuranceNumero: form.assuranceNumero || undefined,
        },
      });
      router.push('/patients');
    } catch (e: any) {
      setError(e?.message ?? 'Erreur lors de la création du patient');
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#37474F', boxSizing: 'border-box', background: '#FAFAFA' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px', marginBottom: 16 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#1A2332', borderBottom: '2px solid #EFF6FF', paddingBottom: 10 }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/patients')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={20} color="#1565C0" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1A2332' }}>Nouveau patient</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#546E7A' }}>Les champs marqués * sont obligatoires</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Section title="Informations obligatoires">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nom de famille <span style={{ color: '#C62828' }}>*</span></label>
              <input value={form.nom} onChange={e => upd('nom', e.target.value)} placeholder="KOUASSI" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Prénom(s) <span style={{ color: '#C62828' }}>*</span></label>
              <input value={form.prenom} onChange={e => upd('prenom', e.target.value)} placeholder="Amara Jean" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date de naissance <span style={{ color: '#C62828' }}>*</span></label>
              <input type="date" value={form.dateNaissance} onChange={e => upd('dateNaissance', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sexe <span style={{ color: '#C62828' }}>*</span></label>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {[{ v: 'M', l: 'Masculin' }, { v: 'F', l: 'Féminin' }, { v: 'I', l: 'Indéterminé' }].map(o => (
                  <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#37474F' }}>
                    <input type="radio" name="sexe" value={o.v} checked={form.sexe === o.v} onChange={() => upd('sexe', o.v)} />
                    {o.l}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Coordonnées">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Téléphone principal</label>
              <input value={form.telephone} onChange={e => upd('telephone', e.target.value)} placeholder="+225 07 00 00 00 00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Téléphone d'urgence</label>
              <input value={form.telephoneUrgence} onChange={e => upd('telephoneUrgence', e.target.value)} placeholder="+225 05 00 00 00 00" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Adresse</label>
              <input value={form.adresse} onChange={e => upd('adresse', e.target.value)} placeholder="Quartier, rue, numéro…" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Ville</label>
              <input value={form.ville} onChange={e => upd('ville', e.target.value)} placeholder="Abidjan" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Pays</label>
              <select value={form.pays} onChange={e => upd('pays', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {PAYS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section title="Informations médicales">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Groupe sanguin</label>
              <select value={form.groupeSanguin} onChange={e => upd('groupeSanguin', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Non renseigné</option>
                {GROUPES_SANGUINS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Allergies connues</label>
              <textarea value={form.allergies} onChange={e => upd('allergies', e.target.value)} rows={2}
                placeholder="Pénicilline, arachides, latex… (laisser vide si aucune)" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Antécédents médicaux</label>
              <textarea value={form.antecedents} onChange={e => upd('antecedents', e.target.value)} rows={2}
                placeholder="Diabète, hypertension, chirurgies passées…" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        </Section>

        <Section title="Assurance maladie">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nom de l'assurance</label>
              <input value={form.assuranceNom} onChange={e => upd('assuranceNom', e.target.value)} placeholder="NSIA, SUNU, CNPS…" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>N° de police / adhérent</label>
              <input value={form.assuranceNumero} onChange={e => upd('assuranceNumero', e.target.value)} placeholder="ASSU-2024-000000" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <button type="button" onClick={() => upd('assuranceTiersPayant', !form.assuranceTiersPayant)}
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: form.assuranceTiersPayant ? '#1565C0' : '#CFD8DC', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 3, left: form.assuranceTiersPayant ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#37474F' }}>Prise en charge tiers-payant</div>
                  <div style={{ fontSize: 11, color: '#90A4AE' }}>Le patient bénéficie d'une prise en charge directe par l'assurance</div>
                </div>
              </label>
            </div>
          </div>
        </Section>

        {error && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, marginBottom: 16, color: '#C62828', fontSize: 13 }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 32 }}>
          <button type="button" onClick={() => router.push('/patients')}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
            Annuler
          </button>
          <button type="submit" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, background: '#1565C0', border: 'none', cursor: loading ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            <Save size={14} /> {loading ? 'Enregistrement…' : 'Enregistrer le patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
