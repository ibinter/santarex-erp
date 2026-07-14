'use client';

import { useState } from 'react';
import { Building2, Plus, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';

const ECRITURES = [
  { ref: 'EC-2026-0841', date: '2026-07-12', libelle: 'Recettes consultations — Juillet', debit: null, credit: '2 450 000', compte: '706 — Prestations de services', statut: 'VALIDE' },
  { ref: 'EC-2026-0842', date: '2026-07-12', libelle: 'Achat médicaments — Fournisseur PHARMA-CI', debit: '890 000', credit: null, compte: '601 — Achats de marchandises', statut: 'VALIDE' },
  { ref: 'EC-2026-0843', date: '2026-07-12', libelle: 'Salaires infirmiers — Juillet', debit: '4 200 000', credit: null, compte: '641 — Rémunérations du personnel', statut: 'EN_ATTENTE' },
  { ref: 'EC-2026-0844', date: '2026-07-11', libelle: 'Encaissements caisse — Factures réglées', debit: null, credit: '1 780 000', compte: '411 — Clients', statut: 'VALIDE' },
  { ref: 'EC-2026-0845', date: '2026-07-11', libelle: 'Loyer locaux médicaux — Juillet', debit: '850 000', credit: null, compte: '613 — Loyers et charges locatives', statut: 'EN_ATTENTE' },
];

const COMPTES = [
  { code: '706', nom: 'Prestations de services', solde: 128_450_000, type: 'CREDIT' },
  { code: '601', nom: 'Achats de marchandises', solde: 42_300_000, type: 'DEBIT' },
  { code: '641', nom: 'Rémunérations du personnel', solde: 38_900_000, type: 'DEBIT' },
  { code: '411', nom: 'Clients', solde: 18_750_000, type: 'DEBIT' },
  { code: '401', nom: 'Fournisseurs', solde: 9_400_000, type: 'CREDIT' },
  { code: '512', nom: 'Banque', solde: 67_200_000, type: 'DEBIT' },
  { code: '530', nom: 'Caisse', solde: 4_850_000, type: 'DEBIT' },
];

const fmt = (n: number) => n.toLocaleString('fr-FR') + ' XOF';

export default function ComptabilitePage() {
  const [tab, setTab] = useState<'journal' | 'grand-livre' | 'bilan'>('journal');

  const produits = 128_450_000 + 1_780_000;
  const charges = 42_300_000 + 38_900_000 + 850_000;
  const resultat = produits - charges;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} color="#0D47A1" />
            </div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1A2332' }}>Comptabilité</h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#546E7A' }}>Journal des écritures, grand livre et bilan financier</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', background: '#0D47A1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
          <Plus size={16} /> Nouvelle écriture
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Produits (Juillet)', value: fmt(produits), color: '#2E7D32', bg: '#E8F5E9', icon: <TrendingUp size={20} color="#2E7D32" /> },
          { label: 'Charges (Juillet)', value: fmt(charges), color: '#C62828', bg: '#FFEBEE', icon: <TrendingDown size={20} color="#C62828" /> },
          { label: 'Résultat net', value: fmt(resultat), color: resultat > 0 ? '#2E7D32' : '#C62828', bg: resultat > 0 ? '#E8F5E9' : '#FFEBEE', icon: <DollarSign size={20} color={resultat > 0 ? '#2E7D32' : '#C62828'} /> },
          { label: 'Écritures en attente', value: '3', color: '#E65100', bg: '#FFF3E0', icon: <FileText size={20} color="#E65100" /> },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `4px solid ${k.color}` }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: k.color, lineHeight: 1.1 }}>{k.value}</div>
              <div style={{ fontSize: '11px', color: '#546E7A', marginTop: '2px' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#F5F7FA', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '20px' }}>
        {(['journal', 'grand-livre', 'bilan'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0D47A1' : '#90A4AE', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t === 'journal' ? 'Journal' : t === 'grand-livre' ? 'Grand Livre' : 'Bilan'}
          </button>
        ))}
      </div>

      {tab === 'journal' && (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F5F7FA' }}>
                {['Réf.', 'Date', 'Libellé', 'Compte', 'Débit (XOF)', 'Crédit (XOF)', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ECRITURES.map((e, i) => (
                <tr key={e.ref} style={{ borderTop: '1px solid #F5F7FA' }}
                  onMouseEnter={(el) => { (el.currentTarget as HTMLTableRowElement).style.background = '#FAFBFC'; }}
                  onMouseLeave={(el) => { (el.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                  <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#1565C0' }}>{e.ref}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#546E7A' }}>{e.date}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#37474F', fontWeight: 500 }}>{e.libelle}</td>
                  <td style={{ padding: '12px 16px', fontSize: '11px', color: '#90A4AE' }}>{e.compte}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#C62828', textAlign: 'right' }}>{e.debit ? e.debit + ' XOF' : '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#2E7D32', textAlign: 'right' }}>{e.credit ? e.credit + ' XOF' : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: e.statut === 'VALIDE' ? '#E8F5E9' : '#FFF3E0', color: e.statut === 'VALIDE' ? '#2E7D32' : '#E65100', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                      {e.statut === 'VALIDE' ? '✓ Validé' : '⏳ En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'grand-livre' && (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F5F7FA' }}>
                {['Code', 'Compte', 'Solde (XOF)', 'Nature'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPTES.map((c, i) => (
                <tr key={c.code} style={{ borderTop: '1px solid #F5F7FA' }}
                  onMouseEnter={(el) => { (el.currentTarget as HTMLTableRowElement).style.background = '#FAFBFC'; }}
                  onMouseLeave={(el) => { (el.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '14px', color: '#0D47A1' }}>{c.code}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#37474F' }}>{c.nom}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 800, color: c.type === 'CREDIT' ? '#2E7D32' : '#C62828', textAlign: 'right' }}>{c.solde.toLocaleString('fr-FR')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: c.type === 'CREDIT' ? '#E8F5E9' : '#FFEBEE', color: c.type === 'CREDIT' ? '#2E7D32' : '#C62828', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '10px' }}>{c.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bilan' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {[
            { titre: 'ACTIF', couleur: '#C62828', bg: '#FFEBEE', postes: [{ nom: 'Immobilisations corporelles', valeur: 184_500_000 }, { nom: 'Stocks médicaments', valeur: 12_400_000 }, { nom: 'Créances clients', valeur: 18_750_000 }, { nom: 'Banque', valeur: 67_200_000 }, { nom: 'Caisse', valeur: 4_850_000 }] },
            { titre: 'PASSIF', couleur: '#2E7D32', bg: '#E8F5E9', postes: [{ nom: 'Capital social', valeur: 200_000_000 }, { nom: 'Résultat de l\'exercice', valeur: resultat }, { nom: 'Dettes fournisseurs', valeur: 9_400_000 }, { nom: 'Dettes fiscales & sociales', valeur: 14_200_000 }, { nom: 'Emprunts bancaires', valeur: 64_100_000 }] },
          ].map(side => {
            const total = side.postes.reduce((s, p) => s + p.valeur, 0);
            return (
              <div key={side.titre} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <div style={{ background: side.bg, padding: '14px 20px', borderBottom: '1px solid #F5F7FA' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: side.couleur, letterSpacing: '1px' }}>{side.titre}</h3>
                </div>
                <div style={{ padding: '16px' }}>
                  {side.postes.map(p => (
                    <div key={p.nom} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F7FA' }}>
                      <span style={{ fontSize: '13px', color: '#37474F' }}>{p.nom}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#37474F' }}>{p.valeur.toLocaleString('fr-FR')} XOF</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', marginTop: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: side.couleur }}>TOTAL {side.titre}</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: side.couleur }}>{total.toLocaleString('fr-FR')} XOF</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
