'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';
import {
  RefreshCw,
  Plus,
  Ambulance,
  Truck,
  Wrench,
  MapPin,
  Play,
  CheckCircle,
  XCircle,
  Route,
  Clock,
  Gauge,
} from 'lucide-react';

// ─── Types locaux ────────────────────────────────────────────────────────────
type StatutVehicule = 'disponible' | 'en_mission' | 'maintenance' | 'hors_service';
type TypeVehicule = 'ambulance' | 'vsl' | 'utilitaire';
type StatutMission = 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
type TypeMission = 'transfert' | 'evacuation' | 'consultation' | 'retour_domicile';

interface Vehicule {
  id: string;
  immatriculation: string;
  type: TypeVehicule;
  marque?: string;
  modele?: string;
  statut: StatutVehicule;
  kilometrage: number;
  seuilEntretienKm?: number;
  dateProchainEntretien?: string;
  entretienRequis?: boolean;
}
interface Mission {
  id: string;
  numero: string;
  vehiculeId: string;
  type: TypeMission;
  origine: string;
  destination: string;
  dateDepart: string;
  dateArrivee?: string;
  chauffeurRef?: string;
  accompagnantMedical: boolean;
  distanceKm?: number;
  cout?: number;
  dureeMinutes?: number;
  statut: StatutMission;
  patient?: { id: string; nom: string; prenom: string; ipp: string } | null;
  vehicule?: { id: string; immatriculation: string; type: TypeVehicule } | null;
}
interface Stats {
  totalVehicules: number;
  vehiculesDisponibles: number;
  entretienRequis: number;
  missionsDuJour: number;
  missionsEnCours: number;
  kmParcourusMois: number;
}

const VEH_STATUT_CFG: Record<StatutVehicule, { color: string; bg: string; border: string }> = {
  disponible:   { color: '#15803D', bg: '#F0FDF4', border: '#86EFAC' },
  en_mission:   { color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' },
  maintenance:  { color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
  hors_service: { color: '#374151', bg: '#F9FAFB', border: '#D1D5DB' },
};
const MIS_STATUT_CFG: Record<StatutMission, { color: string; bg: string }> = {
  planifiee: { color: '#7E22CE', bg: '#F3E8FF' },
  en_cours:  { color: '#1D4ED8', bg: '#DBEAFE' },
  terminee:  { color: '#15803D', bg: '#DCFCE7' },
  annulee:   { color: '#B91C1C', bg: '#FEE2E2' },
};

export default function TransportPage() {
  const t = useTranslations('transport');
  const [tab, setTab] = useState<'parc' | 'missions'>('parc');
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVehicule, setShowVehicule] = useState(false);
  const [showMission, setShowMission] = useState(false);

  const load = useCallback(async () => {
    try {
      const [v, m, s] = await Promise.all([
        apiClient<Vehicule[]>('/transport/vehicules'),
        apiClient<Mission[]>('/transport/missions'),
        apiClient<Stats>('/transport/stats'),
      ]);
      setVehicules(Array.isArray(v) ? v : []);
      setMissions(Array.isArray(m) ? m : []);
      setStats(s ?? null);
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const r = setInterval(load, 30000);
    return () => clearInterval(r);
  }, [load]);

  const disponibles = vehicules.filter((v) => v.statut === 'disponible');

  const missionAction = async (id: string, action: 'demarrer' | 'terminer' | 'annuler') => {
    try {
      await apiClient(`/transport/missions/${id}/${action}`, { method: 'PATCH', body: {} });
    } catch {}
    load();
  };

  return (
    <div style={{ background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#0E3A5F 0%,#12608F 50%,#1478B0 100%)', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 4px 18px rgba(18,96,143,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ambulance size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '.4px' }}>{t('title')}</h1>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{t('subtitle')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load} style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', color: '#fff' }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => setShowVehicule(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13 }}>
              <Plus size={14} /> {t('actions.nouveauVehicule')}
            </button>
            <button onClick={() => setShowMission(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#12608F', fontWeight: 800, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}>
              <Route size={14} /> {t('actions.planifierMission')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          {[
            { label: t('stats.vehicules'), value: stats?.totalVehicules },
            { label: t('stats.disponibles'), value: stats?.vehiculesDisponibles },
            { label: t('stats.missionsJour'), value: stats?.missionsDuJour },
            { label: t('stats.enCours'), value: stats?.missionsEnCours },
            { label: t('stats.kmMois'), value: stats?.kmParcourusMois },
            { label: t('stats.entretien'), value: stats?.entretienRequis },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '10px 14px', borderRight: i < 5 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1.2 }}>{loading ? '…' : s.value ?? 0}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '0 22px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          {(['parc', 'missions'] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: tab === k ? '3px solid #fff' : '3px solid transparent', color: tab === k ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {t(`tabs.${k}`)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 18, animation: 'fadeUp .3s ease' }}>
        {tab === 'parc' ? (
          vehicules.length === 0 && !loading ? (
            <Empty label={t('vehicule.aucun')} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {vehicules.map((v) => (
                <VehiculeCard key={v.id} v={v} t={t} />
              ))}
            </div>
          )
        ) : missions.length === 0 && !loading ? (
          <Empty label={t('mission.aucune')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {missions.map((m) => (
              <MissionRow key={m.id} m={m} t={t} onAction={missionAction} />
            ))}
          </div>
        )}
      </div>

      {showVehicule && <VehiculeModal t={t} onClose={() => setShowVehicule(false)} onSaved={() => { setShowVehicule(false); load(); }} />}
      {showMission && <MissionModal t={t} disponibles={disponibles} onClose={() => setShowMission(false)} onSaved={() => { setShowMission(false); load(); }} />}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ width: 76, height: 76, borderRadius: 22, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Ambulance size={38} color="#12608F" />
      </div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#374151' }}>{label}</p>
    </div>
  );
}

function VehiculeCard({ v, t }: { v: Vehicule; t: ReturnType<typeof useTranslations> }) {
  const cfg = VEH_STATUT_CFG[v.statut];
  const Icon = v.type === 'utilitaire' ? Truck : Ambulance;
  return (
    <div style={{ borderRadius: 14, border: `2px solid ${cfg.border}`, background: cfg.bg, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontFamily: 'monospace' }}>{v.immatriculation}</div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>{t(`typeVehicule.${v.type}`)}{v.marque ? ` · ${v.marque}` : ''}{v.modele ? ` ${v.modele}` : ''}</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: cfg.color, color: '#fff', whiteSpace: 'nowrap' }}>{t(`statutVehicule.${v.statut}`)}</span>
      </div>
      <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}><Gauge size={13} /> {Number(v.kilometrage).toLocaleString()} km</span>
        {v.dateProchainEntretien && (
          <span style={{ fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}><Wrench size={13} /> {new Date(v.dateProchainEntretien).toLocaleDateString()}</span>
        )}
        {v.entretienRequis && (
          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 12, background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', gap: 4 }}><Wrench size={11} /> {t('vehicule.entretienRequis')}</span>
        )}
      </div>
    </div>
  );
}

function MissionRow({ m, t, onAction }: { m: Mission; t: ReturnType<typeof useTranslations>; onAction: (id: string, a: 'demarrer' | 'terminer' | 'annuler') => void }) {
  const cfg = MIS_STATUT_CFG[m.statut];
  const patientNom = m.patient ? `${m.patient.prenom} ${m.patient.nom}` : '—';
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ minWidth: 120 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', fontFamily: 'monospace' }}>{m.numero}</div>
        <div style={{ fontSize: 11, color: '#6B7280' }}>{t(`typeMission.${m.type}`)}</div>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={13} color="#12608F" /> {m.origine} <span style={{ color: '#9CA3AF' }}>→</span> {m.destination}
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>
          {m.vehicule?.immatriculation ?? '—'} · {patientNom}
          {m.dureeMinutes != null && <> · <Clock size={11} style={{ verticalAlign: 'middle' }} /> {m.dureeMinutes} min</>}
          {m.distanceKm != null && <> · {m.distanceKm} km</>}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>{t(`statutMission.${m.statut}`)}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {m.statut === 'planifiee' && (
          <button onClick={() => onAction(m.id, 'demarrer')} style={btnStyle('#1D4ED8')}><Play size={12} /> {t('actions.demarrer')}</button>
        )}
        {(m.statut === 'planifiee' || m.statut === 'en_cours') && (
          <>
            <button onClick={() => onAction(m.id, 'terminer')} style={btnStyle('#15803D')}><CheckCircle size={12} /> {t('actions.terminer')}</button>
            <button onClick={() => onAction(m.id, 'annuler')} style={btnStyle('#B91C1C')}><XCircle size={12} /> {t('actions.annuler')}</button>
          </>
        )}
      </div>
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${color}`, background: '#fff', color, cursor: 'pointer' };
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' };

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><XCircle size={20} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function VehiculeModal({ t, onClose, onSaved }: { t: ReturnType<typeof useTranslations>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, unknown>>({ type: 'ambulance', statut: 'disponible' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    if (!form.immatriculation) return;
    setSaving(true);
    try {
      await apiClient('/transport/vehicules', { method: 'POST', body: form });
      onSaved();
    } catch { setSaving(false); }
  };
  return (
    <ModalShell title={t('form.titreVehicule')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle}>{t('vehicule.immatriculation')} *</label>
          <input style={inputStyle} value={(form.immatriculation as string) ?? ''} onChange={(e) => set('immatriculation', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{t('vehicule.type')}</label>
            <select style={inputStyle} value={form.type as string} onChange={(e) => set('type', e.target.value)}>
              {['ambulance', 'vsl', 'utilitaire'].map((x) => <option key={x} value={x}>{t(`typeVehicule.${x}`)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{t('vehicule.statut')}</label>
            <select style={inputStyle} value={form.statut as string} onChange={(e) => set('statut', e.target.value)}>
              {['disponible', 'maintenance', 'hors_service'].map((x) => <option key={x} value={x}>{t(`statutVehicule.${x}`)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>{t('vehicule.marque')}</label><input style={inputStyle} value={(form.marque as string) ?? ''} onChange={(e) => set('marque', e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>{t('vehicule.modele')}</label><input style={inputStyle} value={(form.modele as string) ?? ''} onChange={(e) => set('modele', e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>{t('vehicule.kilometrage')}</label><input type="number" style={inputStyle} value={(form.kilometrage as number) ?? ''} onChange={(e) => set('kilometrage', e.target.value ? Number(e.target.value) : undefined)} /></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>{t('vehicule.seuilEntretienKm')}</label><input type="number" style={inputStyle} value={(form.seuilEntretienKm as number) ?? ''} onChange={(e) => set('seuilEntretienKm', e.target.value ? Number(e.target.value) : undefined)} /></div>
        </div>
        <div><label style={labelStyle}>{t('vehicule.dateProchainEntretien')}</label><input type="date" style={inputStyle} value={(form.dateProchainEntretien as string) ?? ''} onChange={(e) => set('dateProchainEntretien', e.target.value || undefined)} /></div>
        <button disabled={saving || !form.immatriculation} onClick={submit} style={{ marginTop: 4, padding: '10px', borderRadius: 10, border: 'none', background: '#12608F', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: saving || !form.immatriculation ? 0.6 : 1 }}>{t('actions.enregistrer')}</button>
      </div>
    </ModalShell>
  );
}

function MissionModal({ t, disponibles, onClose, onSaved }: { t: ReturnType<typeof useTranslations>; disponibles: Vehicule[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, unknown>>({ type: 'transfert', accompagnantMedical: false });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.vehiculeId && form.origine && form.destination;
  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await apiClient('/transport/missions', { method: 'POST', body: form });
      onSaved();
    } catch { setSaving(false); }
  };
  return (
    <ModalShell title={t('form.titreMission')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle}>{t('mission.vehicule')} *</label>
          <select style={inputStyle} value={(form.vehiculeId as string) ?? ''} onChange={(e) => set('vehiculeId', e.target.value)}>
            <option value="">{disponibles.length ? t('form.choisirVehicule') : t('form.aucunDispo')}</option>
            {disponibles.map((v) => <option key={v.id} value={v.id}>{v.immatriculation} · {t(`typeVehicule.${v.type}`)}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>{t('mission.type')}</label>
          <select style={inputStyle} value={form.type as string} onChange={(e) => set('type', e.target.value)}>
            {['transfert', 'evacuation', 'consultation', 'retour_domicile'].map((x) => <option key={x} value={x}>{t(`typeMission.${x}`)}</option>)}
          </select>
        </div>
        <div><label style={labelStyle}>{t('mission.patient')} (ID)</label><input style={inputStyle} value={(form.patientId as string) ?? ''} onChange={(e) => set('patientId', e.target.value || undefined)} /></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>{t('mission.origine')} *</label><input style={inputStyle} value={(form.origine as string) ?? ''} onChange={(e) => set('origine', e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>{t('mission.destination')} *</label><input style={inputStyle} value={(form.destination as string) ?? ''} onChange={(e) => set('destination', e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>{t('mission.chauffeur')}</label><input style={inputStyle} value={(form.chauffeurRef as string) ?? ''} onChange={(e) => set('chauffeurRef', e.target.value || undefined)} /></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>{t('mission.distanceKm')}</label><input type="number" style={inputStyle} value={(form.distanceKm as number) ?? ''} onChange={(e) => set('distanceKm', e.target.value ? Number(e.target.value) : undefined)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>{t('mission.cout')}</label><input type="number" style={inputStyle} value={(form.cout as number) ?? ''} onChange={(e) => set('cout', e.target.value ? Number(e.target.value) : undefined)} /></div>
          <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', paddingBottom: 8 }}>
            <input type="checkbox" checked={!!form.accompagnantMedical} onChange={(e) => set('accompagnantMedical', e.target.checked)} /> {t('mission.accompagnantMedical')}
          </label>
        </div>
        <button disabled={saving || !valid} onClick={submit} style={{ marginTop: 4, padding: '10px', borderRadius: 10, border: 'none', background: '#12608F', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: saving || !valid ? 0.6 : 1 }}>{t('actions.planifierMission')}</button>
      </div>
    </ModalShell>
  );
}
