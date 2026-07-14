'use client';

import { useState } from 'react';
import { Building2, Plus, TrendingUp, TrendingDown, DollarSign, FileText, BookOpen, BarChart3, Scale } from 'lucide-react';

const ECRITURES = [
  { ref: 'EC-2026-0841', date: '2026-07-12', libelle: 'Recettes consultations — Juillet',         debit: null,        credit: '2 450 000', compte: '706 — Prestations de services',       statut: 'VALIDE' },
  { ref: 'EC-2026-0842', date: '2026-07-12', libelle: 'Achat médicaments — Fournisseur PHARMA-CI', debit: '890 000',   credit: null,        compte: '601 — Achats de marchandises',        statut: 'VALIDE' },
  { ref: 'EC-2026-0843', date: '2026-07-12', libelle: 'Salaires infirmiers — Juillet',             debit: '4 200 000', credit: null,        compte: '641 — Rémunérations du personnel',   statut: 'EN_ATTENTE' },
  { ref: 'EC-2026-0844', date: '2026-07-11', libelle: 'Encaissements caisse — Factures réglées',   debit: null,        credit: '1 780 000', compte: '411 — Clients',                       statut: 'VALIDE' },
  { ref: 'EC-2026-0845', date: '2026-07-11', libelle: 'Loyer locaux médicaux — Juillet',           debit: '850 000',   credit: null,        compte: '613 — Loyers et charges locatives',  statut: 'EN_ATTENTE' },
];

const COMPTES = [
  { code: '706', nom: 'Prestations de services',     solde: 128_450_000, type: 'CREDIT' },
  { code: '601', nom: 'Achats de marchandises',       solde:  42_300_000, type: 'DEBIT' },
  { code: '641', nom: 'Rémunérations du personnel',   solde:  38_900_000, type: 'DEBIT' },
  { code: '411', nom: 'Clients',                      solde:  18_750_000, type: 'DEBIT' },
  { code: '401', nom: 'Fournisseurs',                 solde:   9_400_000, type: 'CREDIT' },
  { code: '512', nom: 'Banque',                       solde:  67_200_000, type: 'DEBIT' },
  { code: '530', nom: 'Caisse',                       solde:   4_850_000, type: 'DEBIT' },
];

const COMPTE_TYPE_COLORS: Record<string, [string, string, string]> = {
  '7': ['#065F46', '#D1FAE5', '#A7F3D0'],
  '6': ['#991B1B', '#FEE2E2', '#FECACA'],
  '4': ['#1E40AF', '#DBEAFE', '#BFDBFE'],
  '5': ['#5B21B6', '#EDE9FE', '#DDD6FE'],
};
function compteStyle(code: string): [string, string, string] {
  return COMPTE_TYPE_COLORS[code.charAt(0)] ?? ['#374151', '#F3F4F6', '#E5E7EB'];
}

const fmt = (n: number) => n.toLocaleString('fr-FR') + ' XOF';

const BILAN_DATA = {
  actif: [
    { nom: 'Immobilisations corporelles', valeur: 184_500_000 },
    { nom: 'Stocks médicaments',           valeur:  12_400_000 },
    { nom: 'Créances clients',             valeur:  18_750_000 },
    { nom: 'Banque',                       valeur:  67_200_000 },
    { nom: 'Caisse',                       valeur:   4_850_000 },
  ],
  passif: (resultat: number) => [
    { nom: 'Capital social',               valeur: 200_000_000 },
    { nom: "Résultat de l'exercice",       valeur: resultat },
    { nom: 'Dettes fournisseurs',          valeur:   9_400_000 },
    { nom: 'Dettes fiscales & sociales',   valeur:  14_200_000 },
    { nom: 'Emprunts bancaires',           valeur:  64_100_000 },
  ],
};

export default function ComptabilitePage() {
  const [tab, setTab] = useState<'journal' | 'grand-livre' | 'bilan'>('journal');

  const produits = 128_450_000 + 1_780_000;
  const charges  = 42_300_000 + 38_900_000 + 850_000;
  const resultat = produits - charges;
  const nbAttente = ECRITURES.filter(e => e.statut === 'EN_ATTENTE').length;

  const tabs = [
    { key: 'journal',     label: 'Journal',    icon: <BookOpen size={14}/> },
    { key: 'grand-livre', label: 'Grand Livre', icon: <BarChart3 size={14}/> },
    { key: 'bilan',       label: 'Bilan',       icon: <Scale size={14}/> },
  ] as const;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100%{opacity:1}50%{opacity:.4} }
        .ec-row:hover { background: #F8FAFF !important; }
        .gl-row:hover { background: #F8F8FF !important; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#1A1A2E 0%,#16213E 50%,#0F3460 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(15,52,96,0.4)' }}>
        <div style={{ position: 'absolute', top: -70, right: 50,  width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>
        <div style={{ position: 'absolute', bottom: -50, right: 280, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}/>
        {/* decorative ledger lines */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,255,255,0.025) 28px,rgba(255,255,255,0.025) 29px)' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={26} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>Comptabilité</h1>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                  Journal des écritures · Grand livre · Bilan financier
                </p>
              </div>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#0F3460', fontWeight: 800 }}>
              <Plus size={14}/> Nouvelle écriture
            </button>
          </div>

          {/* KPI pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {[
              { label: 'Produits juillet',    val: fmt(produits), icon: <TrendingUp size={11}/> },
              { label: 'Charges juillet',     val: fmt(charges),  icon: <TrendingDown size={11}/> },
              { label: 'Résultat net',        val: fmt(resultat), icon: <DollarSign size={11}/> },
              { label: 'En attente',          val: nbAttente,     icon: <FileText size={11}/> },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '5px 12px' }}>
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{s.val}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Produits (Juillet)', value: fmt(produits), color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0', icon: <TrendingUp size={20} color="#065F46"/> },
          { label: 'Charges (Juillet)',  value: fmt(charges),  color: '#991B1B', bg: '#FEE2E2', border: '#FECACA', icon: <TrendingDown size={20} color="#991B1B"/> },
          { label: 'Résultat net',       value: fmt(resultat), color: resultat > 0 ? '#065F46' : '#991B1B', bg: resultat > 0 ? '#D1FAE5' : '#FEE2E2', border: resultat > 0 ? '#A7F3D0' : '#FECACA', icon: <DollarSign size={20} color={resultat > 0 ? '#065F46' : '#991B1B'}/> },
          { label: 'Écritures en attente', value: nbAttente,  color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', icon: <FileText size={20} color="#92400E"/> },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', border: `1.5px solid ${k.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: k.color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
              <div style={{ fontSize: 11, color: '#78909C', marginTop: 3, fontWeight: 600 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABS ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, background: '#E8EEF8', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#0F3460' : '#78909C', boxShadow: tab === t.key ? '0 1px 6px rgba(0,0,0,0.12)' : 'none', transition: 'all .15s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── JOURNAL ───────────────────────────────────────────── */}
      {tab === 'journal' && (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Réf.', 'Date', 'Libellé', 'Compte', 'Débit (XOF)', 'Crédit (XOF)', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1.5px solid #EEF2F8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ECRITURES.map(e => {
                  const valide = e.statut === 'VALIDE';
                  return (
                    <tr key={e.ref} className="ec-row"
                      style={{ borderTop: '1px solid #F0F4FA', transition: 'background .15s', borderLeft: `3px solid ${valide ? '#A7F3D0' : '#FDE68A'}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#1E40AF', background: '#DBEAFE', padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace' }}>{e.ref}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>{e.date}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#1A2332', fontWeight: 600, maxWidth: 260 }}>{e.libelle}</td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: '#90A4AE', fontFamily: 'monospace' }}>{e.compte}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: e.debit ? '#991B1B' : '#CFD8DC', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {e.debit ? e.debit + ' XOF' : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: e.credit ? '#065F46' : '#CFD8DC', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {e.credit ? e.credit + ' XOF' : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: valide ? '#D1FAE5' : '#FEF3C7', color: valide ? '#065F46' : '#92400E' }}>
                          {valide ? '✓ Validé' : '⏳ En attente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GRAND LIVRE ───────────────────────────────────────── */}
      {tab === 'grand-livre' && (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1.5px solid #EEF2F8' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Plan comptable SYSCOHADA</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Code', 'Intitulé du compte', 'Solde (XOF)', 'Nature'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #EEF2F8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPTES.map(c => {
                  const [tc, tbg, tborder] = compteStyle(c.code);
                  return (
                    <tr key={c.code} className="gl-row"
                      style={{ borderTop: '1px solid #F0F4FA', transition: 'background .15s' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: tc, background: tbg, border: `1.5px solid ${tborder}`, padding: '3px 10px', borderRadius: 7, fontFamily: 'monospace' }}>{c.code}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{c.nom}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 900, color: c.type === 'CREDIT' ? '#065F46' : '#991B1B', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {c.solde.toLocaleString('fr-FR')} XOF
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: c.type === 'CREDIT' ? '#D1FAE5' : '#FEE2E2', color: c.type === 'CREDIT' ? '#065F46' : '#991B1B' }}>
                          {c.type === 'CREDIT' ? '↑ CRÉDIT' : '↓ DÉBIT'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BILAN ─────────────────────────────────────────────── */}
      {tab === 'bilan' && (
        <div style={{ animation: 'fadeUp .25s ease' }}>
          {/* Équilibre indicateur */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Scale size={18} color="#0F3460"/>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>Bilan au 31 juillet 2026</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '3px 12px', borderRadius: 20 }}>
              ✓ Équilibré
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { titre: 'ACTIF',  couleur: '#991B1B', bg: '#FEE2E2', accent: '#FECACA', postes: BILAN_DATA.actif },
              { titre: 'PASSIF', couleur: '#065F46', bg: '#D1FAE5', accent: '#A7F3D0', postes: BILAN_DATA.passif(resultat) },
            ].map(side => {
              const total = side.postes.reduce((s, p) => s + p.valeur, 0);
              return (
                <div key={side.titre} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ background: `linear-gradient(135deg,${side.couleur},${side.bg})`, padding: '14px 20px' }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: side.titre === 'ACTIF' ? '#fff' : side.couleur, letterSpacing: '1.5px' }}>{side.titre}</h3>
                    <div style={{ fontSize: 11, color: side.titre === 'ACTIF' ? 'rgba(255,255,255,0.7)' : side.couleur, marginTop: 2, opacity: 0.8 }}>
                      Total : {total.toLocaleString('fr-FR')} XOF
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px' }}>
                    {side.postes.map(p => {
                      const pct = Math.round((p.valeur / total) * 100);
                      return (
                        <div key={p.nom} style={{ padding: '10px 0', borderBottom: '1px solid #F0F4FA' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: '#37474F', fontWeight: 600 }}>{p.nom}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: side.couleur, fontVariantNumeric: 'tabular-nums' }}>{p.valeur.toLocaleString('fr-FR')} XOF</span>
                          </div>
                          <div style={{ height: 4, background: '#F0F4FA', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: side.accent, borderRadius: 2 }}/>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 2px', marginTop: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: side.couleur }}>TOTAL {side.titre}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: side.couleur, fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString('fr-FR')} XOF</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
