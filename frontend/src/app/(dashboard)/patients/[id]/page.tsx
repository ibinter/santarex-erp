'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, User, Phone, MapPin, Heart, FlaskConical, FileText,
  Pill, Calendar, Stethoscope, RefreshCw, Edit, ExternalLink
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { exportFichePDF } from '@/lib/export';

type Patient = {
  id: string; ipp?: string; nom: string; prenom: string; sexe?: string;
  dateNaissance?: string; telephone?: string; telephoneUrgence?: string;
  adresse?: string; ville?: string; pays?: string; groupeSanguin?: string;
  allergies?: string; antecedents?: string;
  assuranceTiersPayant?: boolean; assuranceNom?: string; assuranceNumero?: string;
  createdAt?: string;
};
type Consultation = { id: string; createdAt: string; motif?: string; diagnostic?: string; medecin?: { prenom: string; nom: string } };
type Ordonnance = { id: string; createdAt: string; status?: string };
type DemandeLabo = { id: string; createdAt: string; urgence?: boolean; status?: string };
type Facture = { id: string; createdAt: string; montantTotal?: number; status?: string };

function age(dob?: string) {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000)) + ' ans';
}
function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtXOF(v?: number) { return v != null ? v.toLocaleString('fr-FR') + ' XOF' : '—'; }

const SEXE_LABEL: Record<string, string> = { M: 'Masculin', F: 'Féminin', I: 'Indéterminé' };

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [demandes, setDemandes] = useState<DemandeLabo[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'info' | 'consultations' | 'ordonnances' | 'labo' | 'factures'>('info');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    const [p, c, o, d, f] = await Promise.allSettled([
      apiClient<Patient>(`/patients/${id}`),
      apiClient<any>(`/consultations?patientId=${id}&limit=20`),
      apiClient<any>(`/ordonnances?patientId=${id}&limit=20`),
      apiClient<any>(`/laboratoire/demandes?patientId=${id}&limit=20`),
      apiClient<any>(`/facturation?patientId=${id}&limit=20`),
    ]);
    if (p.status === 'rejected') { setError('Patient introuvable'); setLoading(false); return; }
    setPatient(p.value);
    if (c.status === 'fulfilled') { const v = c.value; setConsultations(Array.isArray(v) ? v : v?.items ?? []); }
    if (o.status === 'fulfilled') { const v = o.value; setOrdonnances(Array.isArray(v) ? v : v?.items ?? []); }
    if (d.status === 'fulfilled') { const v = d.value; setDemandes(Array.isArray(v) ? v : v?.items ?? []); }
    if (f.status === 'fulfilled') { const v = f.value; setFactures(Array.isArray(v) ? v : v?.items ?? []); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const TAB_CONFIG = [
    { key: 'info', label: 'Informations', count: null },
    { key: 'consultations', label: 'Consultations', count: consultations.length },
    { key: 'ordonnances', label: 'Ordonnances', count: ordonnances.length },
    { key: 'labo', label: 'Analyses', count: demandes.length },
    { key: 'factures', label: 'Factures', count: factures.length },
  ] as const;

  const handleFichePDF = () => {
    if (!patient) return;
    exportFichePDF(
      `Fiche patient — ${patient.prenom} ${patient.nom}`,
      [
        { label: 'Identité', fields: [
          { key: 'Nom', value: patient.nom || '—' },
          { key: 'Prénom', value: patient.prenom || '—' },
          { key: 'IPP', value: patient.ipp ?? '—' },
          { key: 'Sexe', value: SEXE_LABEL[patient.sexe ?? ''] ?? '—' },
          { key: 'Naissance', value: fmtDate(patient.dateNaissance) },
          { key: 'Âge', value: age(patient.dateNaissance) },
        ]},
        { label: 'Coordonnées', fields: [
          { key: 'Téléphone', value: patient.telephone ?? '—' },
          { key: 'Urgence', value: patient.telephoneUrgence ?? '—' },
          { key: 'Adresse', value: patient.adresse ?? '—' },
          { key: 'Ville', value: patient.ville ?? '—' },
          { key: 'Pays', value: patient.pays ?? '—' },
        ]},
        { label: 'Dossier médical', fields: [
          { key: 'Groupe sanguin', value: patient.groupeSanguin ?? '—' },
          { key: 'Allergies', value: patient.allergies ?? '—' },
          { key: 'Antécédents', value: patient.antecedents ?? '—' },
        ]},
        { label: 'Assurance', fields: [
          { key: 'Assurance', value: patient.assuranceNom ?? '—' },
          { key: 'N° police', value: patient.assuranceNumero ?? '—' },
          { key: 'Tiers payant', value: patient.assuranceTiersPayant ? 'Oui' : 'Non' },
        ]},
      ],
      `patient-${patient.ipp ?? patient.id.slice(0, 8)}`,
    );
  };

  const statusColor = (s?: string) => {
    const m: Record<string, [string, string]> = {
      payee: ['#E8F5E9', '#2E7D32'], partielle: ['#FFF8E1', '#E65100'],
      impayee: ['#FFEBEE', '#C62828'], terminee: ['#E8F5E9', '#2E7D32'],
      en_cours: ['#EFF6FF', '#1565C0'], annulee: ['#F5F5F5', '#757575'],
    };
    return m[s ?? ''] ?? ['#F5F5F5', '#546E7A'];
  };

  if (loading) return (
    <div style={{ padding: 24 }}>
      <div style={{ height: 140, borderRadius: 16, background: 'linear-gradient(135deg,#1565C0,#0D47A1)', marginBottom: 20, animation: 'pulse 1.5s infinite' }} />
      {[1,2,3].map(i => <div key={i} style={{ height: 60, borderRadius: 10, background: '#F0F4F8', marginBottom: 12 }} />)}
    </div>
  );

  if (error || !patient) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <p style={{ color: '#C62828', marginBottom: 16 }}>{error ?? 'Patient introuvable'}</p>
      <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#1565C0', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13 }}>
        <RefreshCw size={13} /> Réessayer
      </button>
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      {/* Back */}
      <button onClick={() => router.push('/patients')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={14} /> Retour aux patients
      </button>

      {/* Hero */}
      <div style={{ borderRadius: 16, background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)', padding: '24px 28px', marginBottom: 16, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, border: '2px solid rgba(255,255,255,0.3)' }}>
              {patient.prenom.charAt(0)}{patient.nom.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{patient.prenom} {patient.nom}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>
                {patient.ipp && <span style={{ marginRight: 12 }}>IPP: {patient.ipp}</span>}
                <span>{SEXE_LABEL[patient.sexe ?? ''] ?? '—'} · {age(patient.dateNaissance)}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={handleFichePDF}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600 }}>
              <FileText size={12} /> Fiche PDF
            </button>
            <button onClick={() => router.push(`/dme/${patient.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600 }}>
              <ExternalLink size={12} /> DME complet
            </button>
            <button onClick={() => router.push(`/patients/${patient.id}/modifier`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600 }}>
              <Edit size={12} /> Modifier
            </button>
          </div>
        </div>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {patient.groupeSanguin && (
            <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)' }}>
              <Heart size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />{patient.groupeSanguin}
            </span>
          )}
          {patient.assuranceTiersPayant && (
            <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(46,125,50,0.4)', fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)' }}>
              Tiers payant {patient.assuranceNom ? `· ${patient.assuranceNom}` : ''}
            </span>
          )}
          {patient.allergies && (
            <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(198,40,40,0.4)', fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)' }}>
              ⚠ Allergies
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '2px solid #E0E0E0', marginBottom: 16, overflowX: 'auto' }}>
        {TAB_CONFIG.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#1565C0' : '#546E7A', borderBottom: `2px solid ${tab === t.key ? '#1565C0' : 'transparent'}`, marginBottom: -2, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.label}
            {t.count != null && t.count > 0 && <span style={{ padding: '1px 7px', borderRadius: 10, background: tab === t.key ? '#EFF6FF' : '#F5F5F5', color: tab === t.key ? '#1565C0' : '#90A4AE', fontSize: 11, fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab: Informations */}
      {tab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} color="#1565C0" /> Coordonnées</h3>
            {[
              { l: 'Téléphone', v: patient.telephone },
              { l: 'Urgence', v: patient.telephoneUrgence },
              { l: 'Adresse', v: [patient.adresse, patient.ville, patient.pays].filter(Boolean).join(', ') || null },
              { l: 'Naissance', v: patient.dateNaissance ? `${fmtDate(patient.dateNaissance)} (${age(patient.dateNaissance)})` : null },
            ].map(row => row.v ? (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>
                <span style={{ color: '#90A4AE', fontWeight: 600 }}>{row.l}</span>
                <span style={{ color: '#37474F', textAlign: 'right', maxWidth: '60%' }}>{row.v}</span>
              </div>
            ) : null)}
          </div>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 8 }}><Heart size={14} color="#C62828" /> Dossier médical</h3>
            {patient.allergies && (
              <div style={{ padding: '8px 12px', background: '#FFEBEE', borderRadius: 8, marginBottom: 10, fontSize: 12, color: '#C62828', borderLeft: '3px solid #C62828' }}>
                <strong>Allergies:</strong> {patient.allergies}
              </div>
            )}
            {patient.antecedents && (
              <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 12, color: '#37474F', borderLeft: '3px solid #1565C0' }}>
                <strong>Antécédents:</strong> {patient.antecedents}
              </div>
            )}
            {!patient.allergies && !patient.antecedents && <p style={{ color: '#CFD8DC', fontSize: 13 }}>Aucune information médicale renseignée</p>}
          </div>
          {patient.assuranceNom && (
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px', gridColumn: '1/-1' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>Assurance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, fontSize: 13 }}>
                {[
                  { l: 'Assurance', v: patient.assuranceNom },
                  { l: 'N° police', v: patient.assuranceNumero },
                  { l: 'Tiers payant', v: patient.assuranceTiersPayant ? 'Oui' : 'Non' },
                ].map(r => (
                  <div key={r.l}>
                    <div style={{ fontSize: 11, color: '#90A4AE', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>{r.l}</div>
                    <div style={{ color: '#37474F', fontWeight: 600 }}>{r.v ?? '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Consultations */}
      {tab === 'consultations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {consultations.length === 0 ? <EmptyState icon={<Stethoscope size={24} />} text="Aucune consultation" /> : consultations.map(c => (
            <div key={c.id} onClick={() => router.push(`/consultations/${c.id}`)}
              style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '14px 18px', cursor: 'pointer', borderLeft: '3px solid #1565C0' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{c.motif ?? 'Consultation'}</div>
                  {c.diagnostic && <div style={{ fontSize: 12, color: '#546E7A', marginTop: 3 }}>{c.diagnostic}</div>}
                  {c.medecin && <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 4 }}>Dr {c.medecin.prenom} {c.medecin.nom}</div>}
                </div>
                <div style={{ fontSize: 11, color: '#90A4AE', flexShrink: 0 }}>{fmtDate(c.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Ordonnances */}
      {tab === 'ordonnances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ordonnances.length === 0 ? <EmptyState icon={<Pill size={24} />} text="Aucune ordonnance" /> : ordonnances.map(o => {
            const [bg, col] = statusColor(o.status);
            return (
              <div key={o.id} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: '#1A2332' }}>Ordonnance du {fmtDate(o.createdAt)}</div>
                <span style={{ padding: '3px 10px', borderRadius: 20, background: bg, color: col, fontSize: 11, fontWeight: 700 }}>{o.status ?? 'créée'}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Analyses */}
      {tab === 'labo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {demandes.length === 0 ? <EmptyState icon={<FlaskConical size={24} />} text="Aucune demande d'analyses" /> : demandes.map(d => {
            const [bg, col] = statusColor(d.status);
            return (
              <div key={d.id} onClick={() => router.push(`/laboratoire/demandes/${d.id}`)}
                style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {d.urgence && <span style={{ fontSize: 10, padding: '2px 8px', background: '#FFEBEE', color: '#C62828', borderRadius: 20, fontWeight: 700 }}>URGENT</span>}
                  <span style={{ fontSize: 13, color: '#1A2332' }}>Demande du {fmtDate(d.createdAt)}</span>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 20, background: bg, color: col, fontSize: 11, fontWeight: 700 }}>{d.status ?? 'en attente'}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Factures */}
      {tab === 'factures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {factures.length === 0 ? <EmptyState icon={<FileText size={24} />} text="Aucune facture" /> : factures.map(f => {
            const [bg, col] = statusColor(f.status);
            return (
              <div key={f.id} onClick={() => router.push(`/facturation/${f.id}`)}
                style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{fmtXOF(f.montantTotal)}</div>
                  <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 2 }}>{fmtDate(f.createdAt)}</div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 20, background: bg, color: col, fontSize: 11, fontWeight: 700 }}>{f.status ?? '—'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center', background: '#fff', borderRadius: 12 }}>
      <div style={{ color: '#CFD8DC', marginBottom: 10 }}>{icon}</div>
      <p style={{ color: '#90A4AE', fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  );
}
