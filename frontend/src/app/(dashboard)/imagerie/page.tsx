'use client';

import { useState } from 'react';
import { Scan, Plus, Clock, CheckCircle, AlertCircle, FileImage } from 'lucide-react';

const TYPES = ['Radiographie', 'Échographie', 'Scanner (TDM)', 'IRM', 'Mammographie', 'Scintigraphie'];

const EXAMENS = [
  { id: 'IMG-001', patient: 'Konan Marie-Ange', age: 34, type: 'Échographie', region: 'Abdomen', medecin: 'Dr. Diallo Amara', statut: 'EN_ATTENTE', date: '2026-07-12', heure: '08:30', urgence: false, resultat: null },
  { id: 'IMG-002', patient: 'Traoré Ibrahim', age: 52, type: 'Scanner (TDM)', region: 'Thorax', medecin: 'Dr. Koné Mamadou', statut: 'EN_COURS', date: '2026-07-12', heure: '09:15', urgence: true, resultat: null },
  { id: 'IMG-003', patient: 'Bah Mariama', age: 28, type: 'IRM', region: 'Cerveau', medecin: 'Dr. Bah Fatoumata', statut: 'TERMINE', date: '2026-07-12', heure: '07:45', urgence: false, resultat: 'Aucune anomalie décelée. Structures cérébrales normales.' },
  { id: 'IMG-004', patient: 'Ouédraogo Paul', age: 67, type: 'Radiographie', region: 'Genou droit', medecin: 'Dr. Touré Ibrahim', statut: 'VALIDE', date: '2026-07-12', heure: '07:00', urgence: false, resultat: 'Arthrose fémoro-tibiale grade II. Ostéophytes marginaux.' },
  { id: 'IMG-005', patient: 'Sanogo Fatoumata', age: 45, type: 'Mammographie', region: 'Seins', medecin: 'Dr. Yao Emmanuel', statut: 'EN_ATTENTE', date: '2026-07-12', heure: '10:30', urgence: false, resultat: null },
  { id: 'IMG-006', patient: 'Coulibaly Adama', age: 38, type: 'Échographie', region: 'Thyroïde', medecin: 'Dr. Diallo Amara', statut: 'TERMINE', date: '2026-07-12', heure: '08:00', urgence: false, resultat: 'Nodule thyroïdien droit 12mm. Surveillance recommandée.' },
];

const statutConfig: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: 'En attente', color: '#E65100', bg: '#FFF3E0' },
  EN_COURS: { label: 'En cours', color: '#1565C0', bg: '#E3F2FD' },
  TERMINE: { label: 'Terminé', color: '#00695C', bg: '#E0F2F1' },
  VALIDE: { label: 'Validé', color: '#2E7D32', bg: '#E8F5E9' },
};

export default function ImagériePage() {
  const [filtre, setFiltre] = useState<string>('TOUS');
  const [selected, setSelected] = useState<typeof EXAMENS[0] | null>(null);

  const filtred = filtre === 'TOUS' ? EXAMENS : EXAMENS.filter(e => e.statut === filtre);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E0F2F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scan size={22} color="#00695C" />
            </div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1A2332' }}>Imagerie Médicale</h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#546E7A' }}>Radiologie, échographie, scanner, IRM — gestion des examens</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', background: '#00695C', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
          <Plus size={16} /> Prescrire un examen
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Examens aujourd\'hui', value: String(EXAMENS.length), color: '#00695C', bg: '#E0F2F1' },
          { label: 'En attente', value: String(EXAMENS.filter(e => e.statut === 'EN_ATTENTE').length), color: '#E65100', bg: '#FFF3E0' },
          { label: 'En cours', value: String(EXAMENS.filter(e => e.statut === 'EN_COURS').length), color: '#1565C0', bg: '#E3F2FD' },
          { label: 'Validés', value: String(EXAMENS.filter(e => e.statut === 'VALIDE').length), color: '#2E7D32', bg: '#E8F5E9' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderLeft: `4px solid ${k.color}` }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: '#546E7A', marginTop: '2px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
        {/* Liste */}
        <div>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {['TOUS', 'EN_ATTENTE', 'EN_COURS', 'TERMINE', 'VALIDE'].map(f => (
              <button key={f} onClick={() => setFiltre(f)}
                style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: filtre === f ? '#00695C' : 'transparent', color: filtre === f ? '#fff' : '#546E7A', borderColor: filtre === f ? '#00695C' : '#B0BEC5' }}>
                {f === 'TOUS' ? 'Tous' : statutConfig[f]?.label || f}
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            {filtred.map((ex, i) => {
              const cfg = statutConfig[ex.statut];
              const isSelected = selected?.id === ex.id;
              return (
                <div key={ex.id} onClick={() => setSelected(isSelected ? null : ex)}
                  style={{ padding: '14px 18px', borderBottom: i < filtred.length - 1 ? '1px solid #F5F7FA' : 'none', cursor: 'pointer', background: isSelected ? '#F0F7FF' : 'transparent', transition: 'background 0.12s' }}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#FAFBFC'; }}
                  onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileImage size={20} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#1A2332' }}>{ex.patient}</span>
                        {ex.urgence && <span style={{ background: '#FFEBEE', color: '#C62828', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px' }}>URGENT</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#546E7A', marginTop: '2px' }}>{ex.type} — {ex.region} | {ex.medecin}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ background: cfg.bg, color: cfg.color, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', display: 'block', marginBottom: '4px' }}>{cfg.label}</span>
                      <span style={{ fontSize: '11px', color: '#90A4AE' }}>{ex.heure}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Détail */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px', minHeight: '200px' }}>
          {selected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F5F7FA' }}>
                <FileImage size={24} color="#00695C" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A2332' }}>{selected.id}</div>
                  <div style={{ fontSize: '12px', color: '#546E7A' }}>{selected.type}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Patient', value: `${selected.patient}, ${selected.age} ans` },
                  { label: 'Région', value: selected.region },
                  { label: 'Prescripteur', value: selected.medecin },
                  { label: 'Date / Heure', value: `${selected.date} à ${selected.heure}` },
                  { label: 'Statut', value: statutConfig[selected.statut].label },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{row.label}</div>
                    <div style={{ fontSize: '13px', color: '#37474F', marginTop: '2px', fontWeight: 500 }}>{row.value}</div>
                  </div>
                ))}
                {selected.resultat && (
                  <div style={{ marginTop: '8px', padding: '12px', background: '#E8F5E9', borderRadius: '8px', borderLeft: '3px solid #2E7D32' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#2E7D32', marginBottom: '6px', textTransform: 'uppercase' }}>Compte-rendu</div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#37474F', lineHeight: 1.6 }}>{selected.resultat}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#90A4AE' }}>
              <Scan size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>Sélectionnez un examen<br />pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
