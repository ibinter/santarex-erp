'use client';

import { useState } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Users, CreditCard, Activity, Download } from 'lucide-react';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul'];
const PATIENTS_DATA = [142, 158, 171, 163, 189, 203, 247];
const RECETTES_DATA = [32.4, 38.1, 41.2, 37.8, 48.5, 52.1, 58.4];
const CONSULTATIONS_DATA = [284, 312, 298, 341, 378, 401, 89];

const SERVICES_DATA = [
  { service: 'Consultations', pct: 35, valeur: '20,4M XOF', color: '#0D47A1' },
  { service: 'Hospitalisation', pct: 28, valeur: '16,4M XOF', color: '#1565C0' },
  { service: 'Pharmacie', pct: 18, valeur: '10,5M XOF', color: '#00838F' },
  { service: 'Laboratoire', pct: 12, valeur: '7,0M XOF', color: '#6A1B9A' },
  { service: 'Imagerie', pct: 7, valeur: '4,1M XOF', color: '#00695C' },
];

function MiniBar({ data, color, max }: { data: number[]; color: string; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '100%', background: i === data.length - 1 ? color : color + '55', borderRadius: '4px 4px 0 0', height: `${(v / max) * 70}px`, minHeight: '4px', transition: 'height 0.3s ease' }} />
          <span style={{ fontSize: '9px', color: '#90A4AE' }}>{MOIS[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportingPage() {
  const [periode, setPeriode] = useState<'mois' | 'trimestre' | 'annee'>('mois');

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={22} color="#1565C0" />
            </div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1A2332' }}>Reporting & Business Intelligence</h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#546E7A' }}>Tableaux de bord, indicateurs clés et rapports d'activité</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#F5F7FA', padding: '4px', borderRadius: '10px' }}>
            {(['mois', 'trimestre', 'annee'] as const).map(p => (
              <button key={p} onClick={() => setPeriode(p)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: periode === p ? '#fff' : 'transparent', color: periode === p ? '#1565C0' : '#90A4AE', boxShadow: periode === p ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                {p === 'mois' ? 'Mois' : p === 'trimestre' ? 'Trimestre' : 'Année'}
              </button>
            ))}
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', background: '#1565C0', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            <Download size={14} /> Exporter PDF
          </button>
        </div>
      </div>

      {/* KPIs row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Patients pris en charge', value: '247', trend: '+21.7%', up: true, sub: 'vs mois précédent', color: '#0D47A1', bg: '#EFF6FF', icon: <Users size={20} color="#0D47A1" /> },
          { label: 'Recettes totales', value: '58,4M XOF', trend: '+12.1%', up: true, sub: 'vs mois précédent', color: '#2E7D32', bg: '#E8F5E9', icon: <CreditCard size={20} color="#2E7D32" /> },
          { label: 'Taux d\'occupation lits', value: '72,5%', trend: '+5.2%', up: true, sub: '87 / 120 lits', color: '#1565C0', bg: '#E3F2FD', icon: <Activity size={20} color="#1565C0" /> },
          { label: 'Satisfaction patients', value: '94,2%', trend: '+1.8%', up: true, sub: 'Sur 186 avis', color: '#00838F', bg: '#E0F7FA', icon: <TrendingUp size={20} color="#00838F" /> },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#E8F5E9', padding: '2px 8px', borderRadius: '20px' }}>
                <TrendingUp size={10} color="#2E7D32" />
                <span style={{ fontSize: '10px', color: '#2E7D32', fontWeight: 700 }}>{k.trend}</span>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '12px', color: '#546E7A', marginTop: '2px' }}>{k.label}</div>
              <div style={{ fontSize: '10px', color: '#90A4AE', marginTop: '2px' }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {[
          { titre: 'Patients par mois', data: PATIENTS_DATA, max: 300, color: '#0D47A1', unite: '' },
          { titre: 'Recettes (M XOF)', data: RECETTES_DATA, max: 70, color: '#2E7D32', unite: 'M' },
          { titre: 'Consultations', data: CONSULTATIONS_DATA, max: 450, color: '#00838F', unite: '' },
        ].map((chart, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#37474F', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{chart.titre}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: chart.color, marginBottom: '14px' }}>
              {chart.data[chart.data.length - 1]}{chart.unite}
            </div>
            <MiniBar data={chart.data} color={chart.color} max={chart.max} />
          </div>
        ))}
      </div>

      {/* Répartition des recettes + Tableau de bord par service */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '16px' }}>
        {/* Répartition */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#37474F', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Répartition des recettes</div>
          {SERVICES_DATA.map((s, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#37474F', fontWeight: 500 }}>{s.service}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: s.color }}>{s.valeur}</span>
              </div>
              <div style={{ height: '8px', background: '#F5F7FA', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: '10px', color: '#90A4AE', marginTop: '2px' }}>{s.pct}% du total</div>
            </div>
          ))}
        </div>

        {/* Rapports disponibles */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#37474F', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rapports disponibles</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { titre: 'Rapport d\'activité médicale', desc: 'Consultations, actes, diagnostics', date: '01 Juillet 2026', color: '#0D47A1', bg: '#EFF6FF' },
              { titre: 'Rapport financier mensuel', desc: 'Recettes, dépenses, résultat', date: '01 Juillet 2026', color: '#2E7D32', bg: '#E8F5E9' },
              { titre: 'Tableau de bord DRH', desc: 'Personnel, absences, heures sup.', date: '01 Juillet 2026', color: '#37474F', bg: '#ECEFF1' },
              { titre: 'Rapport pharmacie & stocks', desc: 'Mouvements, ruptures, valorisation', date: '01 Juillet 2026', color: '#E65100', bg: '#FFF3E0' },
              { titre: 'Rapport épidémiologique', desc: 'Maladies, tendances, alertes', date: '30 Juin 2026', color: '#6A1B9A', bg: '#F3E5F5' },
              { titre: 'Rapport qualité soins', desc: 'Satisfaction, incidents, indicateurs', date: '30 Juin 2026', color: '#00695C', bg: '#E0F2F1' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '14px', borderRadius: '10px', background: r.bg, cursor: 'pointer', border: `1px solid ${r.color}22` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: r.color, marginBottom: '4px' }}>{r.titre}</div>
                <div style={{ fontSize: '11px', color: '#546E7A', marginBottom: '8px' }}>{r.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: '#90A4AE' }}>Généré le {r.date}</span>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: r.color, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>
                    <Download size={10} /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
