'use client';

import { useState, useEffect, useCallback } from 'react';
import { Award, CheckCircle, AlertTriangle, XCircle, RefreshCw, Calendar, Building2, CreditCard, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

type LicenceInfo = {
  valide: boolean;
  message: string;
  licence?: {
    id: string; type?: string; statut?: string;
    dateDebut?: string; dateFin?: string;
    maxUtilisateurs?: number; maxPatients?: number;
    modules?: string[];
  };
};

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function joursRestants(dateFin?: string) {
  if (!dateFin) return null;
  const diff = new Date(dateFin).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const TYPE_LABELS: Record<string, [string, string, string]> = {
  demo:        ['#546E7A', '#ECEFF1', 'Démo'],
  starter:     ['#00695C', '#E0F2F1', 'Starter'],
  professional:['#1565C0', '#EFF6FF', 'Professional'],
  enterprise:  ['#4527A0', '#EDE7F6', 'Enterprise'],
};

const MODULE_LABELS: Record<string, string> = {
  patients: 'Patients', consultations: 'Consultations', facturation: 'Facturation',
  pharmacie: 'Pharmacie', laboratoire: 'Laboratoire', hospitalisation: 'Hospitalisation',
  urgences: 'Urgences', imagerie: 'Imagerie', rh: 'Ressources Humaines',
  reporting: 'Reporting & BI', ia: 'Assistant IA (SARA)',
};

export default function LicencePage() {
  const [info, setInfo] = useState<LicenceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const user = getCurrentUser();
      const tenantSlug = (user as any)?.tenantSlug ?? user?.tenantId ?? 'clinique-saint-joseph';
      const data = await apiClient<LicenceInfo>(`/superadmin/licences/tenant/${tenantSlug}/verifier`);
      setInfo(data);
    } catch (e: any) {
      setError(e?.message ?? 'Impossible de vérifier la licence');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const jours = joursRestants(info?.licence?.dateFin);
  const alerteExpiration = jours != null && jours <= 30 && jours > 0;
  const expire = jours != null && jours <= 0;

  if (loading) return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700, margin: '0 auto' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: 12, background: '#F0F4F8', animation: 'pulse 1.5s infinite' }} />)}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 32, textAlign: 'center', maxWidth: 500, margin: '60px auto' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <XCircle size={26} color="#C62828" />
      </div>
      <p style={{ color: '#C62828', fontSize: 14, marginBottom: 16 }}>{error}</p>
      <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, background: '#1565C0', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13 }}>
        <RefreshCw size={13} /> Réessayer
      </button>
    </div>
  );

  const licence = info?.licence;
  const typeKey = licence?.type ?? 'starter';
  const [tColor, tBg, tLabel] = TYPE_LABELS[typeKey] ?? ['#546E7A', '#ECEFF1', typeKey];

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: tBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Award size={22} color={tColor} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: '#1A2332' }}>Licence & Abonnement</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#546E7A' }}>Statut de votre abonnement SANTAREX ERP</p>
        </div>
        <button onClick={load} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 12, color: '#546E7A', fontWeight: 600 }}>
          <RefreshCw size={12} /> Vérifier
        </button>
      </div>

      {/* Status card */}
      <div style={{ borderRadius: 16, padding: '22px 26px', marginBottom: 16, background: info?.valide && !expire ? 'linear-gradient(135deg,#1B5E20,#2E7D32)' : expire ? 'linear-gradient(135deg,#B71C1C,#C62828)' : alerteExpiration ? 'linear-gradient(135deg,#E65100,#F57C00)' : 'linear-gradient(135deg,#B71C1C,#C62828)', color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          {info?.valide && !expire
            ? <CheckCircle size={32} />
            : <XCircle size={32} />}
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>
              {expire ? 'Licence expirée' : info?.valide ? 'Licence active' : 'Licence invalide'}
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{info?.message}</div>
          </div>
          <div style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)' }}>
            {tLabel}
          </div>
        </div>
        {jours != null && !expire && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
            <Clock size={14} />
            {jours === 1 ? '1 jour restant' : `${jours} jours restants`}
          </div>
        )}
      </div>

      {/* Alerte expiration imminente */}
      {alerteExpiration && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 18px', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#E65100' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Attention : votre licence expire dans {jours} jour(s).</strong>
            <div style={{ marginTop: 4, color: '#BF360C' }}>Contactez IBIGSOFT pour renouveler votre abonnement avant la date d'expiration afin d'éviter toute interruption de service.</div>
          </div>
        </div>
      )}

      {/* Details grid */}
      {licence && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          {[
            { icon: <Calendar size={16} color="#1565C0" />, label: "Début d'abonnement", value: fmtDate(licence.dateDebut) },
            { icon: <Calendar size={16} color={expire ? '#C62828' : '#2E7D32'} />, label: "Expiration", value: fmtDate(licence.dateFin) },
            { icon: <Building2 size={16} color="#6A1B9A" />, label: "Utilisateurs autorisés", value: licence.maxUtilisateurs != null ? `${licence.maxUtilisateurs} comptes` : 'Illimité' },
            { icon: <CreditCard size={16} color="#E65100" />, label: "Patients autorisés", value: licence.maxPatients != null ? `${licence.maxPatients.toLocaleString('fr-FR')} patients` : 'Illimité' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#90A4AE', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2332' }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modules */}
      {licence?.modules && licence.modules.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px', marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#1A2332', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modules inclus</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {Object.entries(MODULE_LABELS).map(([key, label]) => {
              const included = licence.modules!.includes(key);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: included ? '#E8F5E9' : '#FAFAFA', border: `1px solid ${included ? '#A5D6A7' : '#E0E0E0'}` }}>
                  <CheckCircle size={13} color={included ? '#2E7D32' : '#CFD8DC'} />
                  <span style={{ fontSize: 12, color: included ? '#1B5E20' : '#BDBDBD', fontWeight: included ? 600 : 400 }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact */}
      <div style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid #E0E0E0', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>Besoin de renouveler ou mettre à niveau ?</div>
          <div style={{ fontSize: 12, color: '#546E7A', marginTop: 3 }}>Contactez IBIGSOFT pour gérer votre abonnement SANTAREX ERP.</div>
        </div>
        <a href="mailto:contact@ibigsoft.com"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 9, background: '#1565C0', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
          Contacter le support
        </a>
      </div>
    </div>
  );
}
