'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, User, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

export interface PatientLite {
  id: string;
  nom: string;
  prenom: string;
  ipp?: string;
  dateNaissance?: string;
  telephone?: string;
}

interface PatientSearchProps {
  onSelect: (patient: PatientLite) => void;
  selected?: PatientLite | null;
  placeholder?: string;
  accent?: string;          // couleur d'accent (par défaut bleu SANTAREX)
  autoFocus?: boolean;
  disabled?: boolean;
}

function unwrapList(res: any): PatientLite[] {
  if (Array.isArray(res)) return res;
  return res?.data?.data ?? res?.data ?? res?.items ?? [];
}

function ageLabel(dob?: string): string {
  if (!dob) return '';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) y--;
  if (y < 2) {
    let m = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (now.getDate() < d.getDate()) m--;
    return `${Math.max(0, m)} mois`;
  }
  return `${y} ans`;
}

/**
 * Recherche patient RÉUTILISABLE et fluide, branchée sur la recherche SERVEUR
 * (`/patients/search?q=`) — cherche dans TOUTE la base (pas seulement les 100
 * premiers chargés). Debounce, navigation clavier, sélection en chip.
 * À utiliser partout où l'on doit choisir un patient.
 */
export default function PatientSearch({
  onSelect,
  selected,
  placeholder = 'Rechercher un patient (nom, IPP, téléphone)…',
  accent = '#1565C0',
  autoFocus = false,
  disabled = false,
}: PatientSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientLite[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 1) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await apiClient<any>(`/patients/search?q=${encodeURIComponent(q.trim())}&limit=8`);
      setResults(unwrapList(res));
      setActive(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => doSearch(query), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  // Fermer au clic extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const pick = (p: PatientLite) => {
    onSelect(p);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) pick(results[active]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  // Vue "patient sélectionné" (chip)
  if (selected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1.5px solid ${accent}40`, background: `${accent}0D`, borderRadius: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 13 }}>
          {(selected.prenom?.[0] ?? '') + (selected.nom?.[0] ?? '')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1A2332' }}>{selected.prenom} {selected.nom}</div>
          <div style={{ fontSize: 11, color: '#78909C', display: 'flex', gap: 8 }}>
            {selected.ipp && <span style={{ fontFamily: 'monospace' }}>IPP {selected.ipp}</span>}
            {ageLabel(selected.dateNaissance) && <span>{ageLabel(selected.dateNaissance)}</span>}
          </div>
        </div>
        {!disabled && (
          <button onClick={() => onSelect(null as any)} title="Changer de patient"
            style={{ background: '#fff', border: '1.5px solid #E0E8F0', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78909C', flexShrink: 0 }}>
            <X size={15} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
        <input
          value={query}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          style={{ width: '100%', padding: '11px 36px 11px 36px', borderRadius: 10, border: `1.5px solid ${open ? accent : '#E0E8F0'}`, fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff', transition: 'border .15s' }}
        />
        {loading && <Loader2 size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: accent, animation: 'pspin 1s linear infinite' }} />}
        {!loading && query && <X size={15} onClick={() => { setQuery(''); setResults([]); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', cursor: 'pointer' }} />}
      </div>
      <style>{`@keyframes pspin{to{transform:translateY(-50%) rotate(360deg)}}`}</style>

      {open && (query.length >= 1) && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #E8EEF8', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.14)', zIndex: 100, maxHeight: 320, overflowY: 'auto' }}>
          {loading && results.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: 12, color: '#90A4AE', textAlign: 'center' }}>Recherche…</div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: 12, color: '#90A4AE', textAlign: 'center' }}>Aucun patient trouvé pour « {query} »</div>
          )}
          {results.map((p, i) => (
            <div key={p.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(p)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: i === active ? `${accent}12` : '#fff', borderBottom: '1px solid #F5F7FA' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#F0F4FA', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{p.prenom} {p.nom}</div>
                <div style={{ fontSize: 11, color: '#90A4AE', display: 'flex', gap: 10 }}>
                  {p.ipp && <span style={{ fontFamily: 'monospace' }}>IPP {p.ipp}</span>}
                  {p.telephone && <span>{p.telephone}</span>}
                  {ageLabel(p.dateNaissance) && <span>{ageLabel(p.dateNaissance)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
