'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

const FORMES = ['comprime','gelule','sirop','injectable','pommade','collyre','suppositoire','patch','spray','autre'];
const CATEGORIES = ['antibiotique','antalgique','antihypertenseur','antidiabetique','antipaludeen','antiretroviral','vaccin','autre'];

type FormData = {
  nom: string; nomCommercial: string; dci: string; forme: string; dosage: string; unite: string; categorie: string;
  prixVente: string; stockMinimum: string; prescriptionRequise: boolean;
};

export default function ModifierMedicamentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('pharmacie');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    nom: '', nomCommercial: '', dci: '', forme: 'comprime', dosage: '', unite: 'boîte', categorie: 'autre',
    prixVente: '', stockMinimum: '10', prescriptionRequise: false,
  });

  const upd = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    apiClient<any>(`/pharmacie/medicaments/${id}`)
      .then((m) => setForm({
        nom: m?.nom ?? '', nomCommercial: m?.nomCommercial ?? '', dci: m?.dci ?? '', forme: m?.forme ?? 'comprime',
        dosage: m?.dosage ?? '', unite: m?.unite ?? 'boîte', categorie: m?.categorie ?? 'autre',
        prixVente: m?.prixVente != null ? String(m.prixVente) : '', stockMinimum: String(m?.stockMinimum ?? 10),
        prescriptionRequise: !!m?.prescriptionRequise,
      }))
      .catch((e) => setError(e?.message ?? 'Médicament introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) { setError(t('form.errNom')); return; }
    setSaving(true); setError(null);
    try {
      await apiClient(`/pharmacie/medicaments/${id}`, {
        method: 'PUT',
        body: {
          nom: form.nom.trim(),
          nomCommercial: form.nomCommercial || undefined,
          dci: form.dci || undefined,
          forme: form.forme,
          dosage: form.dosage.trim() || '-',
          unite: form.unite.trim() || 'boîte',
          categorie: form.categorie,
          prixVente: form.prixVente ? parseFloat(form.prixVente) : undefined,
          stockMinimum: parseInt(form.stockMinimum) || 10,
          prescriptionRequise: form.prescriptionRequise,
        },
      });
      router.push(`/pharmacie/medicaments/${id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Enregistrement impossible');
    } finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#37474F', boxSizing: 'border-box', background: '#FAFAFA' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 };

  return (
    <div style={{ padding: 16, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push(`/pharmacie/medicaments/${id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
          <ArrowLeft size={14} /> {t('form.back')}
        </button>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1A2332' }}>Modifier le médicament</h1>
      </div>

      {loading ? <p style={{ color: '#78909C' }}>{t('list.loading')}</p> : (
        <form onSubmit={handleSubmit} noValidate style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>{t('form.labelNom')} <span style={{ color: '#C62828' }}>*</span></label>
              <input value={form.nom} onChange={(e) => upd('nom', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelFabricant')}</label>
              <input value={form.nomCommercial} onChange={(e) => upd('nomCommercial', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelDci')}</label>
              <input value={form.dci} onChange={(e) => upd('dci', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelDosage')}</label>
              <input value={form.dosage} onChange={(e) => upd('dosage', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelForme')}</label>
              <select value={form.forme} onChange={(e) => upd('forme', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {FORMES.map((f) => <option key={f} value={f}>{t(('formes.' + f) as any)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelCategorie')}</label>
              <select value={form.categorie} onChange={(e) => upd('categorie', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{t(('categories.' + c) as any)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelPrixVente')}</label>
              <input type="number" min={0} value={form.prixVente} onChange={(e) => upd('prixVente', e.target.value)} style={{ ...inputStyle, textAlign: 'right' }} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelStockMinimum')}</label>
              <input type="number" min={0} value={form.stockMinimum} onChange={(e) => upd('stockMinimum', e.target.value)} style={{ ...inputStyle, textAlign: 'right' }} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, fontSize: 13, color: '#37474F', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.prescriptionRequise} onChange={(e) => upd('prescriptionRequise', e.target.checked)} />
            {t('form.labelOrdonnance')}
          </label>

          {error && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, marginTop: 16, color: '#C62828', fontSize: 13 }}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => router.push(`/pharmacie/medicaments/${id}`)}
              style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
              {t('form.cancel')}
            </button>
            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, background: '#00695C', border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 700 }}>
              <Save size={14} /> {saving ? t('form.saving') : t('form.save')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
