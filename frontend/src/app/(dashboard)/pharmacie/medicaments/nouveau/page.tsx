'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Pill, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

const FORMES = ['comprime','gelule','sirop','injectable','pommade','collyre','suppositoire','patch','spray','autre'];

const CATEGORIES = ['antibiotique','antalgique','antihypertenseur','antipaludeen','antiretroviral','vaccin','cardiovasculaire','diabetologie','autre'];

type FormData = {
  nom: string; dci: string; forme: string; dosage: string; categorie: string;
  fabricant: string; prixVente: string; stockActuel: string; stockMinimum: string;
  dateExpiration: string; ordonnanceRequise: boolean; description: string;
};

export default function NouveauMedicamentPage() {
  const router = useRouter();
  const t = useTranslations('pharmacie');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    nom: '', dci: '', forme: 'comprime', dosage: '', categorie: 'autre',
    fabricant: '', prixVente: '', stockActuel: '0', stockMinimum: '10',
    dateExpiration: '', ordonnanceRequise: false, description: '',
  });

  const upd = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) { setError(t('form.errNom')); return; }
    setLoading(true); setError(null);
    try {
      await apiClient('/pharmacie/medicaments', {
        method: 'POST',
        body: {
          nom: form.nom.trim(),
          dci: form.dci || undefined,
          forme: form.forme,
          dosage: form.dosage || undefined,
          categorie: form.categorie,
          fabricant: form.fabricant || undefined,
          prixVente: form.prixVente ? parseFloat(form.prixVente) : undefined,
          stockActuel: parseInt(form.stockActuel) || 0,
          stockMinimum: parseInt(form.stockMinimum) || 10,
          dateExpiration: form.dateExpiration || undefined,
          ordonnanceRequise: form.ordonnanceRequise,
          description: form.description || undefined,
        },
      });
      router.push('/pharmacie');
    } catch (e: any) {
      setError(e?.message ?? t('form.errCreate'));
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#37474F', boxSizing: 'border-box', background: '#FAFAFA' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px', marginBottom: 16 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#1A2332', borderBottom: '2px solid #E0F2F1', paddingBottom: 10 }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/pharmacie')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
          <ArrowLeft size={14} /> {t('form.back')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#E0F2F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pill size={18} color="#00695C" />
          </div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1A2332' }}>{t('form.title')}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Section title={t('form.sectionIdentification')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>{t('form.labelNom')} <span style={{ color: '#C62828' }}>*</span></label>
              <input value={form.nom} onChange={e => upd('nom', e.target.value)} placeholder={t('form.phNom')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelDci')}</label>
              <input value={form.dci} onChange={e => upd('dci', e.target.value)} placeholder={t('form.phDci')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelForme')}</label>
              <select value={form.forme} onChange={e => upd('forme', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {FORMES.map(f => <option key={f} value={f}>{t(('formes.' + f) as any)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelDosage')}</label>
              <input value={form.dosage} onChange={e => upd('dosage', e.target.value)} placeholder={t('form.phDosage')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelCategorie')}</label>
              <select value={form.categorie} onChange={e => upd('categorie', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{t(('categories.' + c) as any)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelFabricant')}</label>
              <input value={form.fabricant} onChange={e => upd('fabricant', e.target.value)} placeholder={t('form.phFabricant')} style={inputStyle} />
            </div>
          </div>
        </Section>

        <Section title={t('form.sectionStockPrix')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>{t('form.labelPrixVente')}</label>
              <input type="number" min={0} value={form.prixVente} onChange={e => upd('prixVente', e.target.value)} placeholder={t('form.phPrix')} style={{ ...inputStyle, textAlign: 'right' }} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelStockActuel')}</label>
              <input type="number" min={0} value={form.stockActuel} onChange={e => upd('stockActuel', e.target.value)} style={{ ...inputStyle, textAlign: 'right' }} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelStockMinimum')}</label>
              <input type="number" min={0} value={form.stockMinimum} onChange={e => upd('stockMinimum', e.target.value)} style={{ ...inputStyle, textAlign: 'right' }} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.labelDateExpiration')}</label>
              <input type="date" value={form.dateExpiration} onChange={e => upd('dateExpiration', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <button type="button" onClick={() => upd('ordonnanceRequise', !form.ordonnanceRequise)}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: form.ordonnanceRequise ? '#00695C' : '#CFD8DC', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 3, left: form.ordonnanceRequise ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#37474F' }}>{t('form.labelOrdonnance')}</div>
                <div style={{ fontSize: 11, color: '#90A4AE' }}>{t('form.ordonnanceHint')}</div>
              </div>
            </label>
          </div>
        </Section>

        <Section title={t('form.sectionDescription')}>
          <textarea value={form.description} onChange={e => upd('description', e.target.value)} rows={3}
            placeholder={t('form.phDescription')}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </Section>

        {error && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, marginBottom: 16, color: '#C62828', fontSize: 13 }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 32 }}>
          <button type="button" onClick={() => router.push('/pharmacie')}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
            {t('form.cancel')}
          </button>
          <button type="submit" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, background: '#00695C', border: 'none', cursor: loading ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            <Save size={14} /> {loading ? t('form.saving') : t('form.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
