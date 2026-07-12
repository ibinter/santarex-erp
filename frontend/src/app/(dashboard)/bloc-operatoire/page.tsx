'use client';

import { useState } from 'react';
import { Scissors, Clock, User, CheckCircle, AlertCircle, Plus, Calendar } from 'lucide-react';

const SALLES = [
  { id: 'S1', nom: 'Salle 1 — Chirurgie générale', statut: 'EN_COURS', intervention: 'Appendicectomie', medecin: 'Dr. Koné Mamadou', debut: '08:30', duree: '90 min', patient: 'Traoré Ibrahima' },
  { id: 'S2', nom: 'Salle 2 — Orthopédie', statut: 'DISPONIBLE', intervention: null, medecin: null, debut: null, duree: null, patient: null },
  { id: 'S3', nom: 'Salle 3 — Gynécologie', statut: 'PROGRAMMEE', intervention: 'Césarienne', medecin: 'Dr. Bah Fatoumata', debut: '11:00', duree: '120 min', patient: 'Diallo Mariam' },
  { id: 'S4', nom: 'Salle 4 — Chirurgie cardiaque', statut: 'NETTOYAGE', intervention: null, medecin: null, debut: null, duree: null, patient: null },
];

const PROGRAMMEES = [
  { heure: '11:00', salle: 'S3', type: 'Césarienne', patient: 'Diallo Mariam', medecin: 'Dr. Bah Fatoumata', duree: '120 min', urgence: false },
  { heure: '13:30', salle: 'S1', type: 'Hernioplastie inguinale', patient: 'Ouédraogo Paul', medecin: 'Dr. Koné Mamadou', duree: '75 min', urgence: false },
  { heure: '15:00', salle: 'S2', type: 'Ostéosynthèse fracture', patient: 'Sanogo Kader', medecin: 'Dr. Touré Ibrahim', duree: '180 min', urgence: true },
  { heure: '16:30', salle: 'S4', type: 'Thyroïdectomie partielle', patient: 'Coulibaly Awa', medecin: 'Dr. Yao Emmanuel', duree: '90 min', urgence: false },
];

const statutConfig: Record<string, { label: string; color: string; bg: string }> = {
  EN_COURS: { label: 'En cours', color: '#1565C0', bg: '#E3F2FD' },
  DISPONIBLE: { label: 'Disponible', color: '#2E7D32', bg: '#E8F5E9' },
  PROGRAMMEE: { label: 'Programmée', color: '#E65100', bg: '#FFF3E0' },
  NETTOYAGE: { label: 'Nettoyage', color: '#546E7A', bg: '#ECEFF1' },
};

export default function BlocOperatoirePage() {
  const [tab, setTab] = useState<'salles' | 'programme'>('salles');

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECEFF1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scissors size={22} color="#37474F" />
            </div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1A2332' }}>Bloc Opératoire</h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#546E7A' }}>Gestion des salles et programmation des interventions</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', background: '#0D47A1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
          <Plus size={16} /> Nouvelle intervention
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Salles disponibles', value: '1 / 4', color: '#2E7D32', bg: '#E8F5E9', icon: <CheckCircle size={20} color="#2E7D32" /> },
          { label: 'En cours', value: '1', color: '#1565C0', bg: '#E3F2FD', icon: <Scissors size={20} color="#1565C0" /> },
          { label: 'Programmées aujourd\'hui', value: '4', color: '#E65100', bg: '#FFF3E0', icon: <Calendar size={20} color="#E65100" /> },
          { label: 'Durée moy. intervention', value: '118 min', color: '#37474F', bg: '#ECEFF1', icon: <Clock size={20} color="#37474F" /> },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `4px solid ${k.color}` }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '11px', color: '#546E7A' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#F5F7FA', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '20px' }}>
        {(['salles', 'programme'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0D47A1' : '#546E7A', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t === 'salles' ? 'État des salles' : 'Programme du jour'}
          </button>
        ))}
      </div>

      {tab === 'salles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {SALLES.map(s => {
            const cfg = statutConfig[s.statut];
            return (
              <div key={s.id} style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', overflow: 'hidden', border: s.statut === 'EN_COURS' ? '2px solid #1565C0' : '2px solid transparent' }}>
                <div style={{ padding: '14px 18px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A2332' }}>{s.nom}</div>
                    <div style={{ fontSize: '11px', color: '#546E7A', marginTop: '2px' }}>Salle {s.id}</div>
                  </div>
                  <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>{cfg.label}</span>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  {s.statut === 'DISPONIBLE' || s.statut === 'NETTOYAGE' ? (
                    <p style={{ margin: 0, fontSize: '13px', color: '#90A4AE', fontStyle: 'italic' }}>{s.statut === 'NETTOYAGE' ? 'Nettoyage en cours — disponible sous 30 min' : 'Aucune intervention planifiée'}</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Scissors size={14} color="#546E7A" />
                        <span style={{ fontSize: '13px', color: '#37474F', fontWeight: 600 }}>{s.intervention}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <User size={14} color="#546E7A" />
                        <span style={{ fontSize: '12px', color: '#546E7A' }}>{s.patient} — {s.medecin}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Clock size={14} color="#546E7A" />
                        <span style={{ fontSize: '12px', color: '#546E7A' }}>Début : {s.debut} | Durée estimée : {s.duree}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'programme' && (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F5F7FA' }}>
                {['Heure', 'Salle', 'Intervention', 'Patient', 'Chirurgien', 'Durée', 'Priorité'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROGRAMMEES.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFC'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1A2332', fontSize: '14px' }}>{p.heure}</td>
                  <td style={{ padding: '14px 16px' }}><span style={{ background: '#E3F2FD', color: '#1565C0', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>{p.salle}</span></td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#37474F', fontWeight: 600 }}>{p.type}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#546E7A' }}>{p.patient}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#546E7A' }}>{p.medecin}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#546E7A' }}>{p.duree}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: p.urgence ? '#FFEBEE' : '#E8F5E9', color: p.urgence ? '#C62828' : '#2E7D32', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                      {p.urgence ? '🔴 URGENCE' : '🟢 Programmé'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
