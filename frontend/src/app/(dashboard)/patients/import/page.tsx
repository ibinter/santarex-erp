'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Upload, Download, FileSpreadsheet, ArrowLeft, CheckCircle2,
  AlertTriangle, Copy, X, Loader2, ChevronRight, FileCheck2, Users,
} from 'lucide-react';
import { API_URL } from '@/lib/api';

// ── Types du rapport renvoyé par le backend ──────────────────────────────
type ParsedRow = {
  nom: string; prenom: string; dateNaissance: string; sexe: string;
  telephone?: string; ville?: string; groupeSanguin?: string;
};
type LigneErreur = { ligne: number; erreurs: string[] };
type LigneDoublon = { ligne: number; nom: string; prenom: string; dateNaissance: string; source: 'base' | 'fichier' };
type PreviewResult = {
  totalLignes: number;
  lignesValides: Array<{ ligne: number; data: ParsedRow }>;
  lignesEnErreur: LigneErreur[];
  doublons: LigneDoublon[];
  colonnesReconnues: string[];
  colonnesIgnorees: string[];
};
type ConfirmResult = { crees: number; ignores: number; erreurs: number; detailsErreurs: LigneErreur[] };

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = '.xlsx,.csv';

// Requête multipart authentifiée (apiClient ne gère que le JSON).
async function uploadMultipart<T>(path: string, file: File, extra?: Record<string, string>): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const fd = new FormData();
  fd.append('file', file);
  if (extra) Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message || json?.message || 'Erreur lors de l\'import');
  }
  return (json?.data !== undefined ? json.data : json) as T;
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR'); } catch { return iso; }
}

const STEP_KEYS = ['stepModele', 'stepFichier', 'stepApercu', 'stepImport'];

export default function ImportPatientsPage() {
  const router = useRouter();
  const t = useTranslations('patients.import');
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [doublonsPolicy, setDoublonsPolicy] = useState<'ignorer' | 'creer'>('ignorer');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [loadingModele, setLoadingModele] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = result ? 3 : preview ? 2 : file ? 1 : 0;

  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); };

  const pickFile = (f: File | null | undefined) => {
    setError(null); setPreview(null); setResult(null);
    if (!f) return;
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
    if (ext !== '.xlsx' && ext !== '.csv') { setError(t('errFormat')); return; }
    if (f.size > MAX_BYTES) { setError(t('errTooBig')); return; }
    setFile(f);
  };

  const telechargerModele = useCallback(async () => {
    setLoadingModele(true); setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch(`${API_URL}/imports/patients/modele`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error(t('errDownloadModele'));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'modele-import-patients.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) { setError(e?.message || t('errDownloadModeleGeneric')); }
    finally { setLoadingModele(false); }
  }, []);

  const lancerApercu = useCallback(async () => {
    if (!file) return;
    setLoadingPreview(true); setError(null); setResult(null);
    try {
      const data = await uploadMultipart<PreviewResult>('/imports/patients/preview', file);
      setPreview(data);
    } catch (e: any) { setError(e?.message || t('errAnalyze')); }
    finally { setLoadingPreview(false); }
  }, [file]);

  const confirmer = useCallback(async () => {
    if (!file) return;
    setLoadingConfirm(true); setError(null);
    try {
      const data = await uploadMultipart<ConfirmResult>('/imports/patients/confirmer', file, { doublons: doublonsPolicy });
      setResult(data);
    } catch (e: any) { setError(e?.message || t('errImport')); }
    finally { setLoadingConfirm(false); }
  }, [file, doublonsPolicy]);

  const nbAImporter = preview
    ? (doublonsPolicy === 'creer'
        ? preview.lignesValides.length
        : preview.lignesValides.length - preview.doublons.length)
    : 0;

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0A2E6E 0%,#1565C0 60%,#0288D1 100%)', borderRadius: 18, padding: '20px 26px', marginBottom: 18, boxShadow: '0 8px 28px rgba(13,71,161,0.3)' }}>
        <button onClick={() => router.push('/patients')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 9, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>
          <ArrowLeft size={14} /> {t('back')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSpreadsheet size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('title')}</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* ── STEPPER ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {STEP_KEYS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 13px', borderRadius: 20, background: i <= step ? '#1565C0' : '#fff', border: `1.5px solid ${i <= step ? '#1565C0' : '#E0E8F0'}`, color: i <= step ? '#fff' : '#90A4AE', fontSize: 12, fontWeight: 700 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: i <= step ? 'rgba(255,255,255,0.25)' : '#F0F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{i + 1}</span>
              {t(s)}
            </div>
            {i < STEP_KEYS.length - 1 && <ChevronRight size={14} color="#B0BEC5" />}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFEBEE', border: '1px solid #FFCDD2', color: '#C62828', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600, animation: 'fadeUp .2s ease' }}>
          <AlertTriangle size={16} /> {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#C62828', display: 'flex' }}><X size={16} /></button>
        </div>
      )}

      {/* ── ÉTAPE 1 : MODÈLE + UPLOAD ──────────────────────────────────── */}
      {!result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, marginBottom: 16 }}>
          {/* Modèle */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Download size={17} color="#2E7D32" /></div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1A2332' }}>{t('step1Title')}</div>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#546E7A', lineHeight: 1.5 }}>
              {t('step1Desc')}
            </p>
            <button onClick={telechargerModele} disabled={loadingModele}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: '#2E7D32', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {loadingModele ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={15} />} {t('downloadModele')}
            </button>
          </div>

          {/* Upload */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={17} color="#1565C0" /></div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1A2332' }}>{t('step2Title')}</div>
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]); }}
              onClick={() => inputRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? '#1565C0' : '#CBD5E1'}`, borderRadius: 12, padding: '22px 16px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#EFF6FF' : '#F8FAFC', transition: 'all .15s' }}>
              <input ref={inputRef} type="file" accept={ACCEPT} style={{ display: 'none' }}
                onChange={e => pickFile(e.target.files?.[0])} />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <FileCheck2 size={20} color="#2E7D32" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{file.name}</div>
                    <div style={{ fontSize: 11, color: '#90A4AE' }}>{(file.size / 1024).toFixed(0)} Ko</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); reset(); }} style={{ marginLeft: 6, background: '#FFEBEE', border: 'none', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', color: '#C62828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                </div>
              ) : (
                <>
                  <Upload size={26} color="#90A4AE" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#37474F' }}>{t('dropHere')}</div>
                  <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 3 }}>{t('dropHint')}</div>
                </>
              )}
            </div>
            {file && !preview && (
              <button onClick={lancerApercu} disabled={loadingPreview}
                style={{ marginTop: 12, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 18px', borderRadius: 10, background: '#1565C0', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {loadingPreview ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <FileSpreadsheet size={15} />} {t('analyzeFile')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── ÉTAPE 3 : APERÇU ───────────────────────────────────────────── */}
      {preview && !result && (
        <div style={{ animation: 'fadeUp .25s ease' }}>
          {/* KPI aperçu */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: t('kpiRead'), value: preview.totalLignes, color: '#1565C0', bg: '#EFF6FF', border: '#BBDEFB' },
              { label: t('kpiValid'), value: preview.lignesValides.length, color: '#2E7D32', bg: '#E8F5E9', border: '#C8E6C9' },
              { label: t('kpiDuplicates'), value: preview.doublons.length, color: '#E65100', bg: '#FFF3E0', border: '#FFE0B2' },
              { label: t('kpiErrors'), value: preview.lignesEnErreur.length, color: '#C62828', bg: '#FFEBEE', border: '#FFCDD2' },
            ].map((k, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: `1px solid ${k.border}`, borderLeft: `4px solid ${k.color}` }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: '#546E7A', marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Colonnes reconnues / ignorées */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', fontSize: 12, color: '#546E7A' }}>
            <strong style={{ color: '#2E7D32' }}>{t('recognizedColumns')}</strong> {preview.colonnesReconnues.join(', ') || '—'}
            {preview.colonnesIgnorees.length > 0 && (
              <div style={{ marginTop: 6 }}><strong style={{ color: '#E65100' }}>{t('ignoredColumns')}</strong> {preview.colonnesIgnorees.join(', ')}</div>
            )}
          </div>

          {/* Erreurs */}
          {preview.lignesEnErreur.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#FFEBEE', color: '#C62828', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} /> {t('errorLines', { count: preview.lignesEnErreur.length })}
              </div>
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {preview.lignesEnErreur.map(e => (
                  <div key={e.ligne} style={{ padding: '9px 16px', borderTop: '1px solid #F5F7FA', fontSize: 12, display: 'flex', gap: 10 }}>
                    <span style={{ fontWeight: 800, color: '#C62828', minWidth: 60 }}>{t('line', { n: e.ligne })}</span>
                    <span style={{ color: '#546E7A' }}>{e.erreurs.join(' · ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doublons */}
          {preview.doublons.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#FFF3E0', color: '#E65100', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Copy size={15} /> {t('duplicatesDetected', { count: preview.doublons.length })}
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {preview.doublons.map(d => (
                  <div key={d.ligne} style={{ padding: '9px 16px', borderTop: '1px solid #F5F7FA', fontSize: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#E65100', minWidth: 60 }}>{t('line', { n: d.ligne })}</span>
                    <span style={{ color: '#37474F', fontWeight: 600 }}>{d.prenom} {d.nom}</span>
                    <span style={{ color: '#90A4AE' }}>{fmtDate(d.dateNaissance)}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: d.source === 'base' ? '#FFE0B2' : '#FFECB3', color: '#E65100' }}>
                      {d.source === 'base' ? t('sourceBase') : t('sourceFile')}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F4FA', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#546E7A' }}>{t('whatToDoDuplicates')}</span>
                {([['ignorer', t('duplicateIgnore')], ['creer', t('duplicateImport')]] as const).map(([k, lbl]) => (
                  <button key={k} onClick={() => setDoublonsPolicy(k)}
                    style={{ padding: '5px 14px', borderRadius: 18, border: `1.5px solid ${doublonsPolicy === k ? '#E65100' : '#E0E0E0'}`, background: doublonsPolicy === k ? '#E65100' : '#fff', color: doublonsPolicy === k ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aperçu des lignes valides */}
          {preview.lignesValides.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: 'linear-gradient(90deg,#F8FAFC,#F0F6FF)', fontSize: 13, fontWeight: 800, color: '#37474F', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={15} color="#1565C0" /> {t('validPreview', { count: preview.lignesValides.length })}
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 320 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                  <thead>
                    <tr style={{ background: '#FAFBFC' }}>
                      {[t('colNum'), t('colNom'), t('colPrenom'), t('colNaissance'), t('colSexe'), t('colTelephone'), t('colVille'), t('colGroupe')].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap', borderBottom: '2px solid #E8EEFA', position: 'sticky', top: 0, background: '#FAFBFC' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.lignesValides.slice(0, 100).map(({ ligne, data }) => (
                      <tr key={ligne} style={{ borderTop: '1px solid #F5F7FA' }}>
                        <td style={{ padding: '8px 14px', fontSize: 11, color: '#90A4AE', fontWeight: 700 }}>{ligne}</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#1A2332' }}>{data.nom}</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, color: '#37474F' }}>{data.prenom}</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, color: '#546E7A' }}>{fmtDate(data.dateNaissance)}</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, color: '#546E7A' }}>{data.sexe === 'M' ? 'H' : data.sexe === 'F' ? 'F' : 'I'}</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, color: '#546E7A' }}>{data.telephone || '—'}</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, color: '#546E7A' }}>{data.ville || '—'}</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, color: '#546E7A' }}>{data.groupeSanguin || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.lignesValides.length > 100 && (
                <div style={{ padding: '8px 16px', fontSize: 11, color: '#90A4AE', borderTop: '1px solid #F0F4FA' }}>{t('andMore', { count: preview.lignesValides.length - 100 })}</div>
              )}
            </div>
          )}

          {/* Actions confirmation */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={confirmer} disabled={loadingConfirm || nbAImporter <= 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 10, background: nbAImporter > 0 ? '#2E7D32' : '#B0BEC5', color: '#fff', border: 'none', fontSize: 13, fontWeight: 800, cursor: nbAImporter > 0 ? 'pointer' : 'not-allowed' }}>
              {loadingConfirm ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
              {t('confirmImport', { count: nbAImporter, plural: nbAImporter > 1 ? 's' : '' })}
            </button>
            <button onClick={reset}
              style={{ padding: '12px 20px', borderRadius: 10, background: '#fff', border: '1.5px solid #E0E8F0', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('restart')}
            </button>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 4 : RÉSULTAT ─────────────────────────────────────────── */}
      {result && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center', animation: 'fadeUp .3s ease' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={34} color="#2E7D32" />
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 900, color: '#1A2332' }}>{t('importDone')}</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#546E7A' }}>
            {t('importSummary', { crees: result.crees, ignores: result.ignores, erreurs: result.erreurs })}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 22 }}>
            {[
              { label: t('resultCreated'), value: result.crees, color: '#2E7D32', bg: '#E8F5E9' },
              { label: t('resultIgnored'), value: result.ignores, color: '#E65100', bg: '#FFF3E0' },
              { label: t('resultErrors'), value: result.erreurs, color: '#C62828', bg: '#FFEBEE' },
            ].map((k, i) => (
              <div key={i} style={{ minWidth: 100, padding: '14px 20px', borderRadius: 12, background: k.bg }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: '#546E7A', fontWeight: 700, textTransform: 'uppercase' }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/patients')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10, background: '#1565C0', color: '#fff', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
              <Users size={16} /> {t('viewPatients')}
            </button>
            <button onClick={reset}
              style={{ padding: '11px 20px', borderRadius: 10, background: '#fff', border: '1.5px solid #E0E8F0', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('newImport')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
