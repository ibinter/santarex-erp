'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Pill, RefreshCw, AlertTriangle, Edit, Package, TrendingDown, Calendar, ClipboardList } from 'lucide-react';
import { apiClient } from '@/lib/api';

type Medicament = {
  id: string; nom: string; dci?: string; forme?: string; dosage?: string;
  categorie?: string; fabricant?: string; prixVente?: number; prixAchat?: number;
  stockActuel?: number; stockMinimum?: number; dateExpiration?: string;
  ordonnanceRequise?: boolean; description?: string; actif?: boolean;
  createdAt?: string; updatedAt?: string;
};

const FORME_LABELS: Record<string, string> = {
  comprime: 'Comprimé', gelule: 'Gélule', sirop: 'Sirop', injectable: 'Injectable',
  pommade: 'Pommade', collyre: 'Collyre', suppositoire: 'Suppositoire',
  patch: 'Patch', spray: 'Spray', autre: 'Autre',
};
const CAT_LABELS: Record<string, string> = {
  antibiotique: 'Antibiotique', antalgique: 'Antalgique', antihypertenseur: 'Antihypertenseur',
  antipaludeen: 'Antipaludéen', antiretroviral: 'Antirétroviral', vaccin: 'Vaccin',
  cardiovasculaire: 'Cardiovasculaire', diabetologie: 'Diabétologie', autre: 'Autre',
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
  const id = params?.id as string;

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
      setError(e?.message ?? 'Médicament introuvable');
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
      <p style={{ color: '#C62828', marginBottom: 16 }}>{error ?? 'Médicament introuvable'}</p>
      <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#00695C', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13 }}>
        <RefreshCw size={13} /> Réessayer
      </button>
    </div>
  );

  const stockBas = (med.stockActuel ?? 0) <= (med.stockMinimum ?? 0);
  const stockNul = (med.stockActuel ?? 0) === 0;
  const expired = isExpired(med.dateExpiration);
  const soon = expiresSoon(med.dateExpiration);

  return (
    <div style={{ padding: 16, maxWidth: 820, margin: '0 auto' }}>
      <button onClick={() => router.push('/pharmacie')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={14} /> Retour à la pharmacie
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
              {med.dci && <div style={{ fontSize: 13, opacity: 0.85, marginTop: 3 }}>DCI: {med.dci}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {med.forme && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700 }}>{FORME_LABELS[med.forme] ?? med.forme}</span>}
                {med.dosage && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', fontSize: 11 }}>{med.dosage}</span>}
                {med.ordonnanceRequise && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,100,0,0.4)', fontSize: 11, fontWeight: 700 }}>Ordonnance requise</span>}
                {!med.actif && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.3)', fontSize: 11, fontWeight: 700 }}>Inactif</span>}
              </div>
            </div>
          </div>
          <button onClick={() => router.push(`/pharmacie/medicaments/${med.id}/modifier`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
            <Edit size={12} /> Modifier
          </button>
        </div>
      </div>

      {/* Alertes */}
      {(stockNul || expired || soon || stockBas) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {stockNul && <Alert color="#C62828" bg="#FFEBEE" border="#FFCDD2" icon={<AlertTriangle size={14} />} text="Rupture de stock — aucune unité disponible" />}
          {!stockNul && stockBas && <Alert color="#E65100" bg="#FFF3E0" border="#FFE0B2" icon={<TrendingDown size={14} />} text={`Stock faible : ${med.stockActuel} unités (seuil : ${med.stockMinimum})`} />}
          {expired && <Alert color="#C62828" bg="#FFEBEE" border="#FFCDD2" icon={<Calendar size={14} />} text={`Médicament périmé depuis le ${fmtDate(med.dateExpiration)}`} />}
          {!expired && soon && <Alert color="#E65100" bg="#FFF3E0" border="#FFE0B2" icon={<Calendar size={14} />} text={`Expiration proche : ${fmtDate(med.dateExpiration)}`} />}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Stock & Prix */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px 22px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={14} color="#00695C" /> Stock & Prix
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { l: 'Stock actuel', v: med.stockActuel != null ? `${med.stockActuel} unités` : '—', warn: stockBas },
              { l: 'Stock minimum', v: med.stockMinimum != null ? `${med.stockMinimum} unités` : '—', warn: false },
              { l: 'Prix de vente', v: fmtXOF(med.prixVente), warn: false },
              { l: "Prix d'achat", v: fmtXOF(med.prixAchat), warn: false },
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
            <ClipboardList size={14} color="#1565C0" /> Informations
          </h2>
          {[
            { l: 'Catégorie', v: CAT_LABELS[med.categorie ?? ''] ?? med.categorie ?? '—' },
            { l: 'Fabricant', v: med.fabricant ?? '—' },
            { l: "Date d'expiration", v: fmtDate(med.dateExpiration) },
            { l: 'Ordonnance', v: med.ordonnanceRequise ? 'Requise' : 'Non requise' },
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
            <h2 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>Description & Notes</h2>
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
