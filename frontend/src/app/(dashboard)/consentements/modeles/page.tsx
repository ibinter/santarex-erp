'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type TypeC = 'chirurgie' | 'anesthesie' | 'transfusion' | 'acte_invasif' | 'soins' | 'recherche';
type Modele = { id: string; type: TypeC; titre: string; description?: string; texteModele: string; actif: boolean };

const TYPES: TypeC[] = ['chirurgie', 'anesthesie', 'transfusion', 'acte_invasif', 'soins', 'recherche'];
const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.data ?? r?.items ?? []);

const emptyForm = { type: 'chirurgie' as TypeC, titre: '', description: '', texteModele: '', actif: true };

export default function ModelesConsentementPage() {
  const router = useRouter();
  const t = useTranslations('consentements');
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Modele | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setModeles(unwrap(await apiClient<any>('/consentements/modeles'))); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (m: Modele) => { setEditing(m); setForm({ type: m.type, titre: m.titre, description: m.description || '', texteModele: m.texteModele, actif: m.actif }); setShowForm(true); };

  const save = async () => {
    if (!form.titre.trim() || !form.texteModele.trim()) return;
    setBusy(true);
    try {
      if (editing) {
        await apiClient(`/consentements/modeles/${editing.id}`, { method: 'PATCH', body: form });
      } else {
        await apiClient('/consentements/modeles', { method: 'POST', body: form });
      }
      setShowForm(false);
      await load();
    } finally { setBusy(false); }
  };

  const remove = async (m: Modele) => {
    if (!confirm(t('modeles.confirmDelete'))) return;
    await apiClient(`/consentements/modeles/${m.id}`, { method: 'DELETE' });
    await load();
  };

  const label = { fontSize: 12, fontWeight: 700, color: '#37474F', marginBottom: 6, display: 'block' } as const;
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' } as const;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <button onClick={() => router.push('/consentements')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#546E7A', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>
        <ArrowLeft size={15} /> {t('detail.back')}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} color="#4F46E5" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1A2332' }}>{t('modeles.title')}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#90A4AE' }}>{t('modeles.subtitle')}</p>
          </div>
        </div>
        <button onClick={openNew} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={14} /> {t('modeles.new')}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={label}>{t('modeles.formType')}</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TypeC })} style={inputStyle}>
                {TYPES.map(ty => <option key={ty} value={ty}>{t(`type.${ty}`)}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>{t('modeles.formTitre')}</label>
              <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <label style={label}>{t('modeles.formDescription')}</label>
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }} />
          <label style={label}>{t('modeles.formTexte')}</label>
          <textarea value={form.texteModele} onChange={e => setForm({ ...form, texteModele: e.target.value })} rows={6} style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#37474F', cursor: 'pointer', marginBottom: 14 }}>
            <input type="checkbox" checked={form.actif} onChange={e => setForm({ ...form, actif: e.target.checked })} />
            {t('modeles.actif')}
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('modeles.cancel')}</button>
            <button onClick={save} disabled={busy} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>{t('modeles.save')}</button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)' }}>
                {[t('modeles.colType'), t('modeles.colTitre'), t('modeles.colActif'), ''].map((h, hi) => (
                  <th key={hi} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#3730A3', textTransform: 'uppercase', letterSpacing: '.6px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#90A4AE' }}>{t('list.loading')}</td></tr>
              ) : modeles.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#90A4AE' }}>{t('modeles.empty')}</td></tr>
              ) : modeles.map(m => (
                <tr key={m.id} style={{ borderTop: '1px solid #EEF2FF' }}>
                  <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#4F46E5', whiteSpace: 'nowrap' }}>{t(`type.${m.type}`)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#37474F' }}>{m.titre}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: m.actif ? '#ECFDF5' : '#F1F5F9', color: m.actif ? '#047857' : '#94A3B8' }}>{m.actif ? t('modeles.actif') : t('modeles.inactif')}</span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(m)} title={t('modeles.edit')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1', padding: 6 }}><Pencil size={15} /></button>
                    <button onClick={() => remove(m)} title={t('modeles.delete')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 6 }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
