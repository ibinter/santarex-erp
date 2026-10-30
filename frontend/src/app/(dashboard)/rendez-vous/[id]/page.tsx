'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';

type Rdv = {
  id: string; patientId: string; medecinId: string; dateHeure: string; dureeMinutes?: number;
  motif: string; type: string; statut: string; notes?: string; salle?: string;
};
type Patient = { id: string; nom: string; prenom: string; ipp?: string; telephone?: string };

const STATUTS: Record<string, { label: string; color: string; bg: string }> = {
  planifie:   { label: 'Planifié',   color: '#1565C0', bg: '#E3F2FD' },
  confirme:   { label: 'Confirmé',   color: '#2E7D32', bg: '#E8F5E9' },
  en_attente: { label: 'En attente', color: '#EF6C00', bg: '#FFF3E0' },
  annule:     { label: 'Annulé',     color: '#C62828', bg: '#FFEBEE' },
  reporte:    { label: 'Reporté',    color: '#6A1B9A', bg: '#F3E5F5' },
  honore:     { label: 'Honoré',     color: '#00695C', bg: '#E0F2F1' },
  absent:     { label: 'Absent',     color: '#546E7A', bg: '#ECEFF1' },
};
const TYPES: Record<string, string> = {
  consultation: 'Consultation', suivi: 'Suivi', urgence: 'Urgence', examen: 'Examen', chirurgie: 'Chirurgie', autre: 'Autre',
};

export default function RendezVousDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rdv, setRdv] = useState<Rdv | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await apiClient<Rdv>(`/rendez-vous/${id}`);
      setRdv(r);
      if (r?.patientId) apiClient<Patient>(`/patients/${r.patientId}`).then(setPatient).catch(() => setPatient(null));
    } catch (e: any) {
      setError(e?.message ?? 'Rendez-vous introuvable');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const agir = async (action: 'confirmer' | 'annuler') => {
    setBusy(true); setError(null);
    try { await apiClient(`/rendez-vous/${id}/${action}`, { method: 'PATCH', body: {} }); await load(); }
    catch (e: any) { setError(e?.message ?? 'Action impossible'); }
    finally { setBusy(false); }
  };

  const st = rdv ? (STATUTS[rdv.statut] ?? STATUTS.planifie) : STATUTS.planifie;
  const d = rdv ? new Date(rdv.dateHeure) : null;
  const ligne = (label: string, valeur?: string | null) => (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #F0F4FA', fontSize: 14 }}>
      <div style={{ width: 150, color: '#78909C', fontWeight: 600 }}>{label}</div>
      <div style={{ color: '#1A2332' }}>{valeur || '—'}</div>
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
      <button onClick={() => router.push('/rendez-vous')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={14} /> Retour à l&apos;agenda
      </button>

      {loading && <p style={{ color: '#78909C' }}>Chargement…</p>}

      {error && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, marginBottom: 16, color: '#C62828', fontSize: 13 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {rdv && d && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <CalendarClock size={22} color="#1565C0" />
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: '#1A2332', flex: 1 }}>Rendez-vous</h1>
            <span style={{ padding: '4px 12px', borderRadius: 14, fontSize: 12, fontWeight: 700, color: st.color, background: st.bg }}>{st.label}</span>
          </div>

          {ligne('Patient', patient ? `${patient.prenom} ${patient.nom}${patient.ipp ? ` (${patient.ipp})` : ''}` : undefined)}
          {ligne('Téléphone', patient?.telephone)}
          {ligne('Date', d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }))}
          {ligne('Heure', `${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}${rdv.dureeMinutes ? ` · ${rdv.dureeMinutes} min` : ''}`)}
          {ligne('Motif', rdv.motif)}
          {ligne('Type', TYPES[rdv.type] ?? rdv.type)}
          {ligne('Salle', rdv.salle)}
          {ligne('Notes', rdv.notes)}

          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            {rdv.patientId && (
              <button onClick={() => router.push(`/patients/${rdv.patientId}`)}
                style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#37474F' }}>
                Ouvrir le dossier du patient
              </button>
            )}
            {['planifie', 'en_attente', 'reporte'].includes(rdv.statut) && (
              <button disabled={busy} onClick={() => agir('confirmer')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, border: 'none', background: '#2E7D32', color: '#fff', cursor: busy ? 'default' : 'pointer', fontSize: 13, fontWeight: 700 }}>
                <CheckCircle2 size={15} /> Confirmer
              </button>
            )}
            {!['annule', 'honore', 'absent'].includes(rdv.statut) && (
              <button disabled={busy} onClick={() => agir('annuler')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, border: '1px solid #FFCDD2', background: '#FFF', color: '#C62828', cursor: busy ? 'default' : 'pointer', fontSize: 13, fontWeight: 700 }}>
                <XCircle size={15} /> Annuler le rendez-vous
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
