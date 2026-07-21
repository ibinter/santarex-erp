'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Pill, RefreshCw, AlertTriangle, Edit, Package, TrendingDown, Calendar, ClipboardList, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { exportFichePDF } from '@/lib/export';

type Medicament = {
  id: string; nom: string; dci?: string; forme?: string; dosage?: string;
  categorie?: string; fabricant?: string; prixVente?: number; prixAchat?: number;
  stockActuel?: number; stockMinimum?: number; dateExpiration?: string;
  ordonnanceRequise?: boolean; description?: string; actif?: boolean;
  createdAt?: string; updatedAt?: string;
};

function fmtXOF(v?: number) { return v != null ? v.toLocaleString('fr-FR') + ' XOF' : '—'; }
function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function isExpired(d?: string) { return d ? new Date(d) < new Date() : false; }
function expiresSoon(d?: string) {
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff > 0 && diff < 90 * 24 * 3600 * 1000;
}

export default function MedicamentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('pharmacie');
  const id = params?.id as string;
  const formeLabel = (f?: string) => f ? t(('formes.' + f) as any) : '—';
  const catLabel = (c?: string) => c ? t(('categories.' + c) as any) : '—';

  const [med, setMed] = useState<Medicament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const data = await apiClient<Medicament>(`/pharmacie/medicaments/${id}`);
      setMed(data);
    } catch (e: any) {
      setError(e?.message ?? t('detail.errNotFound'));
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ height: 120, borderRadius: 14, background: '#F0F4F8', marginBottom: 16 }} />
      {[1,2,3].map(i => <div key={i} style={{ height: 60, borderRadius: 10, background: '#F0F4F8', marginBottom: 12 }} />)}
    </div>
  );

  if (error || !med) return (
    <div style={{ padding: 32, textAlign: 'center', maxWidth: 500, margin: '60px auto' }}>
      <p style={{ color: '#C62828', marginBottom: 16 }}>{error ?? t('detail.errNotFound')}</p>
      <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#00695C', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13 }}>
        <RefreshCw size={13} /> {t('detail.retry')}
      </button>
    </div>
  );

  const stockBas = (med.stockActuel ?? 0) <= (med.stockMinimum ?? 0);
  const stockNul = (med.stockActuel ?? 0) === 0;
  const expired = isExpired(med.dateExpiration);
  const soon = expiresSoon(med.dateExpiration);

  const handleFichePDF = () => {
    exportFichePDF(
      t('fiche.titlePrefix', { nom: med.nom }),
      [
        { label: t('fiche.sectionIdentification'), fields: [
          { key: t('fiche.fNom'), value: med.nom || '—' },
          { key: t('fiche.fDci'), value: med.dci ?? '—' },
          { key: t('fiche.fForme'), value: formeLabel(med.forme) },
          { key: t('fiche.fDosage'), value: med.dosage ?? '—' },
          { key: t('fiche.fCategorie'), value: catLabel(med.categorie) },
          { key: t('fiche.fFabricant'), value: med.fabricant ?? '—' },
          { key: t('fiche.fOrdonnance'), value: med.ordonnanceRequise ? t('fiche.requise') : t('fiche.nonRequise') },
          { key: t('fiche.fStatut'), value: med.actif === false ? t('fiche.inactif') : t('fiche.actif') },
        ]},
        { label: t('fiche.sectionStockPrix'), fields: [
          { key: t('fiche.fStockActuel'), value: med.stockActuel != null ? t('fiche.unites', { count: med.stockActuel }) : '—' },
          { key: t('fiche.fStockMinimum'), value: med.stockMinimum != null ? t('fiche.unites', { count: med.stockMinimum }) : '—' },
          { key: t('fiche.fPrixVente'), value: fmtXOF(med.prixVente) },
          { key: t('fiche.fPrixAchat'), value: fmtXOF(med.prixAchat) },
          { key: t('fiche.fExpiration'), value: fmtDate(med.dateExpiration) },
        ]},
        ...(med.description ? [{ label: t('fiche.sectionDescription'), fields: [{ key: t('fiche.fNotes'), value: med.description }] }] : []),
      ],
      `medicament-${med.id.slice(0, 8)}`,
    );
  };

  return (
    <div style={{ padding: 16, maxWidth: 820, margin: '0 auto' }}>
      <button onClick={() => router.push('/pharmacie')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={14} /> {t('detail.back')}
      </button>

      {/* Hero */}
      <div style={{ borderRadius: 14, background: 'linear-gradient(135deg,#00695C,#00897B)', padding: '22px 26px', marginBottom: 16, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
              <Pill size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{med.nom}</h1>
              {med.dci && <div style={{ fontSize: 13, opacity: 0.85, marginTop: 3 }}>{t('detail.dciPrefix', { dci: med.dci })}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {med.forme && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700 }}>{formeLabel(med.forme)}</span>}
                {med.dosage && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', fontSize: 11 }}>{med.dosage}</span>}
                {med.ordonnanceRequise && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,100,0,0.4)', fontSize: 11, fontWeight: 700 }}>{t('detail.ordonnanceRequise')}</span>}
                {!med.actif && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.3)', fontSize: 11, fontWeight: 700 }}>{t('detail.inactif')}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={handleFichePDF}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600 }}>
              <FileText size={12} /> {t('detail.fichePdf')}
            </button>
            <button onClick={() => router.push(`/pharmacie/medicaments/${med.id}/modifier`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600 }}>
              <Edit size={12} /> {t('detail.edit')}
            </button>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {(stockNul || expired || soon || stockBas) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {stockNul && <Alert color="#C62828" bg="#FFEBEE" border="#FFCDD2" icon={<AlertTriangle size={14} />} text={t('detail.alertRupture')} />}
          {!stockNul && stockBas && <Alert color="#E65100" bg="#FFF3E0" border="#FFE0B2" icon={<TrendingDown size={14} />} text={t('detail.alertStockBas', { stock: med.stockActuel ?? 0, min: med.stockMinimum ?? 0 })} />}
          {expired && <Alert color="#C62828" bg="#FFEBEE" border="#FFCDD2" icon={<Calendar size={14} />} text={t('detail.alertExpired', { date: fmtDate(med.dateExpiration) })} />}
          {!expired && soon && <Alert color="#E65100" bg="#FFF3E0" border="#FFE0B2" icon={<Calendar size={14} />} text={t('detail.alertExpiresSoon', { date: fmtDate(med.dateExpiration) })} />}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Stock & Prix */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px 22px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={14} color="#00695C" /> {t('detail.sectionStockPrix')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { l: t('detail.labelStockActuel'), v: med.stockActuel != null ? t('detail.unites', { count: med.stockActuel }) : '—', warn: stockBas },
              { l: t('detail.labelStockMinimum'), v: med.stockMinimum != null ? t('detail.unites', { count: med.stockMinimum }) : '—', warn: false },
              { l: t('detail.labelPrixVente'), v: fmtXOF(med.prixVente), warn: false },
              { l: t('detail.labelPrixAchat'), v: fmtXOF(med.prixAchat), warn: false },
            ].map(item => (
              <div key={item.l} style={{ padding: '10px 12px', borderRadius: 8, background: item.warn ? '#FFF3E0' : '#F8FAFC' }}>
                <div style={{ fontSize: 10, color: '#90A4AE', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{item.l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.warn ? '#E65100' : '#1A2332', fontVariantNumeric: 'tabular-nums' }}>{item.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Informations */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px 22px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={14} color="#1565C0" /> {t('detail.sectionInformations')}
          </h2>
          {[
            { l: t('detail.labelCategorie'), v: catLabel(med.categorie) },
            { l: t('detail.labelFabricant'), v: med.fabricant ?? '—' },
            { l: t('detail.labelDateExpiration'), v: fmtDate(med.dateExpiration) },
            { l: t('detail.labelOrdonnance'), v: med.ordonnanceRequise ? t('detail.ordonnanceRequise2') : t('detail.ordonnanceNonRequise') },
          ].map(row => (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>
              <span style={{ color: '#90A4AE', fontWeight: 600 }}>{row.l}</span>
              <span style={{ color: '#37474F', fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{row.v}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        {med.description && (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px 22px', gridColumn: '1/-1' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{t('detail.sectionDescription')}</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#37474F', lineHeight: 1.7 }}>{med.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Alert({ color, bg, border, icon, text }: { color: string; bg: string; border: string; icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: bg, border: `1px solid ${border}`, borderRadius: 9, color, fontSize: 13, fontWeight: 600 }}>
      {icon} {text}
    </div>
  );
}
