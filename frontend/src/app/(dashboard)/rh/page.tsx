'use client';

import { useState } from 'react';
import { UserCog, Plus, Search, Users, Calendar, Clock, TrendingUp } from 'lucide-react';

const EMPLOYES = [
  { id: 'EMP-001', nom: 'Dr. Koné Mamadou', poste: 'Chirurgien', service: 'Chirurgie', type: 'CDI', statut: 'ACTIF', conge: false, salaire: '650 000', dateEntree: '2019-03-15', contact: '+225 07 12 34 56' },
  { id: 'EMP-002', nom: 'Dr. Bah Fatoumata', poste: 'Gynécologue', service: 'Gynécologie', type: 'CDI', statut: 'ACTIF', conge: false, salaire: '620 000', dateEntree: '2020-06-01', contact: '+225 07 23 45 67' },
  { id: 'EMP-003', nom: 'Infirmière Sanogo Awa', poste: 'Infirmière chef', service: 'Soins intensifs', type: 'CDI', statut: 'CONGE', conge: true, salaire: '280 000', dateEntree: '2018-09-10', contact: '+225 07 34 56 78' },
  { id: 'EMP-004', nom: 'Traoré Célestine', poste: 'Caissière', service: 'Finance', type: 'CDD', statut: 'ACTIF', conge: false, salaire: '180 000', dateEntree: '2022-01-20', contact: '+225 07 45 67 89' },
  { id: 'EMP-005', nom: 'Dr. Ouédraogo Moussa', poste: 'Biologiste', service: 'Laboratoire', type: 'CDI', statut: 'ACTIF', conge: false, salaire: '580 000', dateEntree: '2017-11-05', contact: '+225 07 56 78 90' },
  { id: 'EMP-006', nom: 'Coulibaly Ahmed', poste: 'Pharmacien', service: 'Pharmacie', type: 'CDI', statut: 'ACTIF', conge: false, salaire: '420 000', dateEntree: '2021-04-12', contact: '+225 07 67 89 01' },
  { id: 'EMP-007', nom: 'Diallo Nathalie', poste: 'Secrétaire médicale', service: 'Accueil', type: 'CDD', statut: 'ACTIF', conge: false, salaire: '160 000', dateEntree: '2023-07-01', contact: '+225 07 78 90 12' },
  { id: 'EMP-008', nom: 'Yao Emmanuel', poste: 'Technicien imagerie', service: 'Imagerie', type: 'CDI', statut: 'ACTIF', conge: false, salaire: '320 000', dateEntree: '2020-02-28', contact: '+225 07 89 01 23' },
];

const CONGES = [
  { employe: 'Infirmière Sanogo Awa', type: 'Congé annuel', debut: '2026-07-10', fin: '2026-07-24', statut: 'APPROUVE', jours: 15 },
  { employe: 'Dr. Koné Mamadou', type: 'Formation médicale', debut: '2026-07-20', fin: '2026-07-22', statut: 'EN_ATTENTE', jours: 3 },
  { employe: 'Traoré Célestine', type: 'Congé maladie', debut: '2026-07-08', fin: '2026-07-12', statut: 'APPROUVE', jours: 5 },
];

export default function RHPage() {
  const [tab, setTab] = useState<'personnel' | 'conges' | 'paie'>('personnel');
  const [search, setSearch] = useState('');

  const filtered = EMPLOYES.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.service.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECEFF1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCog size={22} color="#37474F" />
            </div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1A2332' }}>Ressources Humaines</h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#546E7A' }}>Gestion du personnel, congés et paie</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', background: '#37474F', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
          <Plus size={16} /> Nouvel employé
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total employés', value: '142', sub: '8 services', color: '#37474F', bg: '#ECEFF1', icon: <Users size={20} color="#37474F" /> },
          { label: 'En congé', value: '3', sub: 'Ce mois', color: '#E65100', bg: '#FFF3E0', icon: <Calendar size={20} color="#E65100" /> },
          { label: 'Heures sup. mois', value: '124h', sub: '18 employés concernés', color: '#1565C0', bg: '#E3F2FD', icon: <Clock size={20} color="#1565C0" /> },
          { label: 'Masse salariale', value: '42,3M XOF', sub: 'Ce mois', color: '#2E7D32', bg: '#E8F5E9', icon: <TrendingUp size={20} color="#2E7D32" /> },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `4px solid ${k.color}` }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '11px', color: '#546E7A' }}>{k.label}</div>
              <div style={{ fontSize: '10px', color: '#90A4AE', marginTop: '1px' }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#F5F7FA', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '20px' }}>
        {(['personnel', 'conges', 'paie'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#37474F' : '#90A4AE', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t === 'personnel' ? 'Personnel' : t === 'conges' ? 'Congés & Absences' : 'Paie'}
          </button>
        ))}
      </div>

      {tab === 'personnel' && (
        <>
          <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '360px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un employé…" style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E8EAED', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#F5F7FA' }} />
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F5F7FA' }}>
                  {['Employé', 'Poste', 'Service', 'Contrat', 'Statut', 'Salaire (XOF)', 'Entrée'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={e.id} style={{ borderTop: '1px solid #F5F7FA' }}
                    onMouseEnter={(el) => { (el.currentTarget as HTMLTableRowElement).style.background = '#FAFBFC'; }}
                    onMouseLeave={(el) => { (el.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #0D47A1, #00838F)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                          {e.nom.split(' ').filter(w => !['Dr.', 'Infirmière'].includes(w)).map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#1A2332' }}>{e.nom}</div>
                          <div style={{ fontSize: '11px', color: '#90A4AE' }}>{e.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#37474F' }}>{e.poste}</td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#546E7A' }}>{e.service}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ background: e.type === 'CDI' ? '#E8F5E9' : '#FFF3E0', color: e.type === 'CDI' ? '#2E7D32' : '#E65100', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>{e.type}</span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ background: e.conge ? '#FFF3E0' : '#E8F5E9', color: e.conge ? '#E65100' : '#2E7D32', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                        {e.conge ? '🌴 En congé' : '✓ Actif'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: '#37474F' }}>{e.salaire}</td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: '#90A4AE' }}>{e.dateEntree}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'conges' && (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F5F7FA' }}>
                {['Employé', 'Type', 'Du', 'Au', 'Jours', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONGES.map((c, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 600, fontSize: '13px', color: '#1A2332' }}>{c.employe}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#546E7A' }}>{c.type}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#37474F' }}>{c.debut}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#37474F' }}>{c.fin}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: '13px', color: '#37474F' }}>{c.jours} j</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ background: c.statut === 'APPROUVE' ? '#E8F5E9' : '#FFF3E0', color: c.statut === 'APPROUVE' ? '#2E7D32' : '#E65100', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
                      {c.statut === 'APPROUVE' ? '✓ Approuvé' : '⏳ En attente'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {c.statut === 'EN_ATTENTE' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#E8F5E9', color: '#2E7D32', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Approuver</button>
                        <button style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#FFEBEE', color: '#C62828', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Refuser</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'paie' && (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '24px' }}>
          <div style={{ textAlign: 'center', padding: '40px', color: '#90A4AE' }}>
            <TrendingUp size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#37474F', margin: '0 0 8px' }}>Module de paie — Juillet 2026</p>
            <p style={{ fontSize: '13px', margin: 0 }}>Masse salariale : <strong style={{ color: '#2E7D32' }}>42 380 000 XOF</strong></p>
            <p style={{ fontSize: '12px', marginTop: '6px' }}>142 bulletins à générer pour ce mois</p>
            <button style={{ marginTop: '20px', padding: '10px 24px', borderRadius: '8px', background: '#37474F', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Générer les bulletins de paie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
