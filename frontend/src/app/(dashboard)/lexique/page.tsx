'use client';

import { useMemo, useState } from 'react';
import {
  Library, ChevronRight, Search, Globe,
} from 'lucide-react';
import { CATEGORIES, type Lang } from './lexiqueData';

export default function LexiquePage() {
  const [lang, setLang] = useState<Lang>('fr');
  const [activeCat, setActiveCat] = useState('clinique');
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();

  const totalTermes = useMemo(
    () => CATEGORIES.reduce((n, c) => n + c.fr_content.length, 0),
    [],
  );

  const cat = CATEGORIES.find(c => c.id === activeCat)!;
  const cIdx = CATEGORIES.findIndex(c => c.id === activeCat);

  // Recherche plein texte : sur le terme ET la définition (langue courante).
  const matchTerme = (terme: string, def: string) =>
    !q || terme.toLowerCase().includes(q) || def.toLowerCase().includes(q);

  // Catégories filtrées pour la barre latérale (au moins un terme correspondant).
  const filteredCats = q
    ? CATEGORIES.filter(c => {
        const items = lang === 'fr' ? c.fr_content : c.en_content;
        const t = lang === 'fr' ? c.fr : c.en;
        return t.titre.toLowerCase().includes(q) ||
          items.some(i => matchTerme(i.terme, i.def));
      })
    : CATEGORIES;

  // Entrées affichées dans la catégorie active (avec filtre de recherche).
  const catItems = (lang === 'fr' ? cat.fr_content : cat.en_content)
    .filter(i => matchTerme(i.terme, i.def));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden', background: '#F4F6FA' }}>
      <style>{`
        @keyframes lexFadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .lex-nav-btn:hover { background: #E8EEF8 !important; }
      `}</style>

      {/* ── HERO STRIP ────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0A2E6E 0%,#1565C0 55%,#0891B2 100%)', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, boxShadow: '0 2px 12px rgba(10,46,110,0.3)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Library size={20} color="#fff"/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.2px' }}>
            {lang === 'fr' ? 'Lexique SANTAREX ERP' : 'SANTAREX ERP Glossary'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
            {lang === 'fr'
              ? `${totalTermes} termes · ${CATEGORIES.length} catégories`
              : `${totalTermes} terms · ${CATEGORIES.length} categories`}
          </div>
        </div>

        {/* Lang toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 3, gap: 2 }}>
          {(['fr', 'en'] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: lang === l ? '#fff' : 'transparent', color: lang === l ? '#1565C0' : 'rgba(255,255,255,0.8)', transition: 'all .15s' }}>
              <Globe size={11}/> {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ width: 272, flexShrink: 0, background: '#fff', borderRight: '1px solid #E8EEF8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid #EEF2F8' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }}/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'fr' ? 'Rechercher un terme…' : 'Search a term…'}
                style={{ width: '100%', padding: '8px 10px 8px 28px', border: '1.5px solid #E0E8F0', borderRadius: 9, fontSize: 12, outline: 'none', background: '#F8FAFC', color: '#37474F', boxSizing: 'border-box' }}/>
            </div>
          </div>

          {/* Category items */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 8px' }}>
            {filteredCats.map((c) => {
              const t = lang === 'fr' ? c.fr : c.en;
              const items = lang === 'fr' ? c.fr_content : c.en_content;
              const count = q ? items.filter(i => matchTerme(i.terme, i.def)).length : items.length;
              const isActive = c.id === activeCat;
              return (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2, background: isActive ? c.bg : 'transparent', borderLeft: isActive ? `3px solid ${c.color}` : '3px solid transparent', transition: 'all .12s' }}
                  className="lex-nav-btn">
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: isActive ? 'rgba(255,255,255,0.7)' : '#F0F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? c.color : '#90A4AE', flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: isActive ? 800 : 600, color: isActive ? c.color : '#37474F', lineHeight: 1.2 }}>{t.titre}</div>
                    <div style={{ fontSize: 10, color: '#90A4AE', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? c.color : '#90A4AE', background: isActive ? 'rgba(255,255,255,0.6)' : '#F0F4FA', padding: '1px 7px', borderRadius: 10, flexShrink: 0 }}>{count}</span>
                  {isActive && <ChevronRight size={12} color={c.color} style={{ flexShrink: 0 }}/>}
                </button>
              );
            })}
            {filteredCats.length === 0 && (
              <div style={{ padding: '18px 12px', fontSize: 12, color: '#90A4AE', textAlign: 'center' }}>
                {lang === 'fr' ? 'Aucun terme trouvé.' : 'No term found.'}
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px 40px', background: '#F4F6FA' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>

            {/* Category header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, animation: 'lexFadeUp .2s ease' }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: cat.bg, border: `2px solid ${cat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color, flexShrink: 0 }}>
                {cat.icon}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1A2332', letterSpacing: '-0.3px' }}>
                  {lang === 'fr' ? cat.fr.titre : cat.en.titre}
                </h1>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#546E7A' }}>
                  {lang === 'fr' ? cat.fr.desc : cat.en.desc}
                </p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: cat.color, background: cat.bg, border: `1.5px solid ${cat.border}`, padding: '3px 12px', borderRadius: 20, flexShrink: 0 }}>
                {catItems.length} {lang === 'fr' ? 'termes' : 'terms'}
              </span>
            </div>

            {/* Term cards */}
            {catItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'lexFadeUp .25s ease' }}>
                {catItems.map((item, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: '14px 18px', borderLeft: `3px solid ${cat.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0, transform: 'translateY(-1px)' }}/>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: cat.color, lineHeight: 1.35 }}>{item.terme}</h3>
                    </div>
                    <p style={{ margin: '6px 0 0 18px', fontSize: 13, color: '#37474F', lineHeight: 1.7 }}>{item.def}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#90A4AE', fontSize: 13, background: '#fff', borderRadius: 12 }}>
                {lang === 'fr'
                  ? 'Aucun terme de cette catégorie ne correspond à votre recherche.'
                  : 'No term in this category matches your search.'}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1.5px solid #EEF2F8' }}>
              {cIdx > 0 ? (
                <button onClick={() => setActiveCat(CATEGORIES[cIdx - 1].id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  ← {lang === 'fr' ? 'Précédent' : 'Previous'}
                </button>
              ) : <div/>}
              {cIdx < CATEGORIES.length - 1 ? (
                <button onClick={() => setActiveCat(CATEGORIES[cIdx + 1].id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: cat.color, cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 700, boxShadow: `0 4px 14px ${cat.color}40` }}>
                  {lang === 'fr' ? 'Suivant' : 'Next'} →
                </button>
              ) : <div/>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
