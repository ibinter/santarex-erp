'use client';

import { useState } from 'react';
import {
  BookOpen, ChevronRight, Search, Globe, Download, Lightbulb,
} from 'lucide-react';
import { SECTIONS, type Lang } from './guideData';
import { genererGuidePdf } from './guidePdf';


export default function GuidePage() {
  const [lang, setLang] = useState<Lang>('fr');
  const [activeSection, setActiveSection] = useState('demarrage');
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await genererGuidePdf(lang);
    } catch (err) {
      console.error('Erreur lors de la génération du PDF du guide', err);
      alert(lang === 'fr'
        ? "La génération du PDF a échoué. Veuillez réessayer."
        : 'PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const section = SECTIONS.find(s => s.id === activeSection)!;
  const content = lang === 'fr' ? section.fr_content : section.en_content;
  const sIdx = SECTIONS.findIndex(s => s.id === activeSection);

  const filteredSections = search
    ? SECTIONS.filter(s => {
        const t = lang === 'fr' ? s.fr : s.en;
        const items = lang === 'fr' ? s.fr_content : s.en_content;
        return t.titre.toLowerCase().includes(search.toLowerCase()) ||
          items.some(i => i.titre.toLowerCase().includes(search.toLowerCase()) || i.texte.toLowerCase().includes(search.toLowerCase()));
      })
    : SECTIONS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden', background: '#F4F6FA' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes guideSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .guide-nav-btn:hover { background: #E8EEF8 !important; }
      `}</style>

      {/* ── HERO STRIP ────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0A2E6E 0%,#1565C0 55%,#0891B2 100%)', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, boxShadow: '0 2px 12px rgba(10,46,110,0.3)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={20} color="#fff"/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.2px' }}>
            {lang === 'fr' ? 'Guide utilisateur SANTAREX ERP' : 'SANTAREX ERP User Guide'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
            {lang === 'fr' ? `${SECTIONS.length} chapitres · Section ${sIdx + 1}/${SECTIONS.length}` : `${SECTIONS.length} chapters · Section ${sIdx + 1}/${SECTIONS.length}`}
          </div>
        </div>
        {/* Download PDF */}
        <button onClick={handleDownloadPdf} disabled={downloading}
          title={lang === 'fr' ? 'Télécharger le guide au format PDF' : 'Download the guide as PDF'}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.35)', cursor: downloading ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', transition: 'all .15s', opacity: downloading ? 0.75 : 1 }}>
          <Download size={13} style={downloading ? { animation: 'guideSpin 1s linear infinite' } : undefined}/>
          {downloading
            ? (lang === 'fr' ? 'Génération…' : 'Generating…')
            : (lang === 'fr' ? 'Télécharger le guide (PDF)' : 'Download guide (PDF)')}
        </button>

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
        <div style={{ width: 256, flexShrink: 0, background: '#fff', borderRight: '1px solid #E8EEF8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid #EEF2F8' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }}/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'fr' ? 'Rechercher…' : 'Search…'}
                style={{ width: '100%', padding: '8px 10px 8px 28px', border: '1.5px solid #E0E8F0', borderRadius: 9, fontSize: 12, outline: 'none', background: '#F8FAFC', color: '#37474F', boxSizing: 'border-box' }}/>
            </div>
          </div>

          {/* Nav items */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 8px' }}>
            {filteredSections.map((s, i) => {
              const t = lang === 'fr' ? s.fr : s.en;
              const isActive = s.id === activeSection;
              return (
                <button key={s.id} onClick={() => { setActiveSection(s.id); setSearch(''); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2, background: isActive ? s.bg : 'transparent', borderLeft: isActive ? `3px solid ${s.color}` : '3px solid transparent', transition: 'all .12s' }}
                  className="guide-nav-btn">
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: isActive ? 'rgba(255,255,255,0.7)' : '#F0F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? s.color : '#90A4AE', flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: isActive ? 800 : 600, color: isActive ? s.color : '#37474F', lineHeight: 1.2 }}>{t.titre}</div>
                    <div style={{ fontSize: 10, color: '#90A4AE', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                  </div>
                  {isActive && <ChevronRight size={12} color={s.color} style={{ flexShrink: 0 }}/>}
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid #EEF2F8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#90A4AE', fontWeight: 600, marginBottom: 5 }}>
              <span>{lang === 'fr' ? 'Progression' : 'Progress'}</span>
              <span>{sIdx + 1}/{SECTIONS.length}</span>
            </div>
            <div style={{ height: 4, background: '#EEF2F8', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((sIdx + 1) / SECTIONS.length) * 100}%`, background: `linear-gradient(90deg,#1565C0,#0891B2)`, borderRadius: 2, transition: 'width .3s ease' }}/>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px 40px', background: '#F4F6FA' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, animation: 'fadeUp .2s ease' }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: section.bg, border: `2px solid ${section.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: section.color, flexShrink: 0 }}>
                {section.icon}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1A2332', letterSpacing: '-0.3px' }}>
                  {lang === 'fr' ? section.fr.titre : section.en.titre}
                </h1>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#546E7A' }}>
                  {lang === 'fr' ? section.fr.desc : section.en.desc}
                </p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: section.color, background: section.bg, border: `1.5px solid ${section.border}`, padding: '3px 12px', borderRadius: 20, flexShrink: 0 }}>
                {sIdx + 1} / {SECTIONS.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp .25s ease' }}>
              {content.map((item, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  {/* Card header */}
                  <div style={{ background: section.bg, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1.5px solid ${section.border}` }}>
                    <span style={{ width: 24, height: 24, borderRadius: 8, background: section.color, color: '#fff', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: section.color }}>{item.titre}</h3>
                  </div>
                  {/* Card body */}
                  <div style={{ padding: '16px 20px' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#37474F', lineHeight: 1.8 }}>{item.texte}</p>

                    {/* Étapes numérotées (facultatif) */}
                    {item.etapes && item.etapes.length > 0 && (
                      <ol style={{ margin: '14px 0 0', paddingLeft: 0, listStyle: 'none', counterReset: 'guide-step', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {item.etapes.map((etape, ei) => (
                          <li key={ei} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <span style={{ width: 20, height: 20, borderRadius: 6, background: section.bg, border: `1.5px solid ${section.border}`, color: section.color, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                              {ei + 1}
                            </span>
                            <span style={{ fontSize: 12.5, color: '#455A64', lineHeight: 1.6 }}>{etape}</span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {/* Encadré astuce (facultatif) */}
                    {item.astuce && (
                      <div style={{ margin: '14px 0 0', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 13px', borderRadius: 10, background: '#FFF7E6', border: '1px solid #FCD98A', borderLeft: '3px solid #F59E0B' }}>
                        <Lightbulb size={15} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }}/>
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>
                            {lang === 'fr' ? 'Astuce' : 'Tip'}
                          </div>
                          <div style={{ fontSize: 12.5, color: '#78500A', lineHeight: 1.6 }}>{item.astuce}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1.5px solid #EEF2F8' }}>
              {sIdx > 0 ? (
                <button onClick={() => setActiveSection(SECTIONS[sIdx - 1].id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  ← {lang === 'fr' ? 'Précédent' : 'Previous'}
                </button>
              ) : <div/>}
              {sIdx < SECTIONS.length - 1 ? (
                <button onClick={() => setActiveSection(SECTIONS[sIdx + 1].id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: section.color, cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 700, boxShadow: `0 4px 14px ${section.color}40` }}>
                  {lang === 'fr' ? 'Suivant' : 'Next'} →
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: '#D1FAE5', border: '1.5px solid #6EE7B7', fontSize: 13, color: '#065F46', fontWeight: 700 }}>
                  ✓ {lang === 'fr' ? 'Guide terminé !' : 'Guide complete!'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
