'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  X, RefreshCw, CheckCircle2, XCircle, Award, HelpCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

// ── Types alignés sur l'API backend (moteur de quiz academie) ────────────────
interface QuizQuestionPublique {
  id: string;
  question: string;
  options: string[];
  multiple: boolean;
}

interface QuizPublic {
  ressourceId: string;
  titre: string;
  description: string | null;
  seuilReussite: number;
  nombreQuestions: number;
  questions: QuizQuestionPublique[];
}

interface QuizCorrectionQuestion {
  questionId: string;
  question: string;
  options: string[];
  reponseUtilisateur: number[];
  bonnesReponses: number[];
  correct: boolean;
  explication: string;
}

interface QuizResultat {
  ressourceId: string;
  score: number;
  total: number;
  pourcentage: number;
  seuilReussite: number;
  reussi: boolean;
  statut: 'termine' | 'en_cours' | string;
  corrige: QuizCorrectionQuestion[];
}

interface QuizModalProps {
  ressourceId: string;
  titre: string;
  /** Appelé après soumission avec le statut de progression renvoyé. */
  onComplete: (statut: 'termine' | 'en_cours') => void;
  onClose: () => void;
}

export default function QuizModal({ ressourceId, titre, onComplete, onClose }: QuizModalProps) {
  const t = useTranslations('academie');
  const [quiz, setQuiz] = useState<QuizPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reponses, setReponses] = useState<Record<string, number[]>>({});
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<QuizResultat | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const q = await apiClient<QuizPublic>(`/academie/quiz/${ressourceId}`);
      setQuiz(q);
      setReponses({});
      setResultat(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t('quiz.loadError'));
    } finally {
      setLoading(false);
    }
  }, [ressourceId, t]);

  useEffect(() => { charger(); }, [charger]);

  const toggleOption = useCallback((q: QuizQuestionPublique, index: number) => {
    setReponses(prev => {
      const actuel = prev[q.id] ?? [];
      if (q.multiple) {
        const existe = actuel.includes(index);
        return { ...prev, [q.id]: existe ? actuel.filter(i => i !== index) : [...actuel, index] };
      }
      return { ...prev, [q.id]: [index] };
    });
  }, []);

  const toutRepondu = quiz ? quiz.questions.every(q => (reponses[q.id]?.length ?? 0) > 0) : false;

  const soumettre = useCallback(async () => {
    if (!quiz) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const payload = { reponses: quiz.questions.map(q => ({ questionId: q.id, options: reponses[q.id] ?? [] })) };
      const res = await apiClient<QuizResultat>(`/academie/quiz/${ressourceId}/soumettre`, {
        method: 'POST', body: payload,
      });
      setResultat(res);
      onComplete(res.statut === 'termine' ? 'termine' : 'en_cours');
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t('quiz.submitError'));
    } finally {
      setEnvoi(false);
    }
  }, [quiz, reponses, ressourceId, onComplete, t]);

  const rejouer = useCallback(() => {
    setResultat(null);
    setReponses({});
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '5vh 16px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}
      >
        {/* ── En-tête ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 20px', borderBottom: '1px solid #EEF2F7',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: '#EDE9FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <HelpCircle size={18} color="#7C3AED" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2332', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titre}</div>
            {quiz && (
              <div style={{ fontSize: 12, color: '#78909C' }}>
                {t('quiz.questionsCount', { count: quiz.nombreQuestions })} · {t('quiz.passThreshold', { seuil: quiz.seuilReussite })}
              </div>
            )}
          </div>
          <button onClick={onClose} aria-label={t('quiz.close')} style={{
            border: 'none', background: 'transparent', cursor: 'pointer', color: '#546E7A', padding: 4,
          }}>
            <X size={20} />
          </button>
        </div>

        {/* ── Corps ────────────────────────────────────────────────────── */}
        <div style={{ padding: 20, maxHeight: '68vh', overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: 30, textAlign: 'center', color: '#546E7A' }}>
              <RefreshCw size={20} className="spin" style={{ marginBottom: 8 }} />
              <div>{t('quiz.loading')}</div>
            </div>
          )}

          {!loading && erreur && !resultat && (
            <div style={{ padding: 16, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              {erreur}
              <button onClick={charger} style={{ marginLeft: 10, ...btnLien }}>{t('retry')}</button>
            </div>
          )}

          {/* ── Résultat / corrigé ─────────────────────────────────────── */}
          {resultat ? (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 12, marginBottom: 18,
                background: resultat.reussi ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${resultat.reussi ? '#BBF7D0' : '#FECACA'}`,
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                  background: resultat.reussi ? '#DCFCE7' : '#FEE2E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {resultat.reussi
                    ? <Award size={24} color="#15803D" />
                    : <XCircle size={24} color="#B91C1C" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: resultat.reussi ? '#15803D' : '#B91C1C' }}>
                    {resultat.reussi ? t('quiz.passed') : t('quiz.failed')}
                  </div>
                  <div style={{ fontSize: 13, color: '#546E7A', marginTop: 2 }}>
                    {t('quiz.scoreLine', { score: resultat.score, total: resultat.total, pourcentage: resultat.pourcentage })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {resultat.corrige.map((c, qi) => (
                  <div key={c.questionId} style={{
                    borderRadius: 10, border: `1px solid ${c.correct ? '#BBF7D0' : '#FECACA'}`,
                    background: c.correct ? '#F0FDF4' : '#FEF2F2', padding: 14,
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      {c.correct
                        ? <CheckCircle2 size={16} color="#15803D" style={{ marginTop: 2, flexShrink: 0 }} />
                        : <XCircle size={16} color="#B91C1C" style={{ marginTop: 2, flexShrink: 0 }} />}
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>
                        {qi + 1}. {c.question}
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {c.options.map((opt, oi) => {
                        const estBonne = c.bonnesReponses.includes(oi);
                        const estChoisie = c.reponseUtilisateur.includes(oi);
                        const couleurBg = estBonne ? '#DCFCE7' : (estChoisie ? '#FEE2E2' : '#fff');
                        const couleurBord = estBonne ? '#86EFAC' : (estChoisie ? '#FCA5A5' : '#E5E9F0');
                        return (
                          <div key={oi} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 12.5, color: '#334155',
                            background: couleurBg, border: `1px solid ${couleurBord}`,
                            borderRadius: 8, padding: '6px 10px',
                          }}>
                            <span style={{ flex: 1 }}>{opt}</span>
                            {estBonne && <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>{t('quiz.correctTag')}</span>}
                            {!estBonne && estChoisie && <span style={{ fontSize: 11, fontWeight: 700, color: '#B91C1C' }}>{t('quiz.yourAnswerTag')}</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12.5, color: '#475569', lineHeight: 1.5, background: '#fff', borderRadius: 8, padding: '8px 10px', border: '1px solid #EEF2F7' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>{t('quiz.explanation')} </span>{c.explication}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // ── Questions (passage) ─────────────────────────────────────
            !loading && quiz && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {quiz.questions.map((q, qi) => (
                  <div key={q.id} style={{ borderRadius: 10, border: '1px solid #EEF2F7', padding: 14 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1A2332', marginBottom: 4 }}>
                      {qi + 1}. {q.question}
                    </div>
                    {q.multiple && (
                      <div style={{ fontSize: 11, color: '#7C3AED', marginBottom: 8 }}>{t('quiz.multipleHint')}</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {q.options.map((opt, oi) => {
                        const choisi = (reponses[q.id] ?? []).includes(oi);
                        return (
                          <label key={oi} style={{
                            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                            fontSize: 13, color: '#334155',
                            background: choisi ? '#EFF6FF' : '#F8FAFC',
                            border: `1px solid ${choisi ? '#93C5FD' : '#EEF2F7'}`,
                            borderRadius: 8, padding: '9px 12px',
                          }}>
                            <input
                              type={q.multiple ? 'checkbox' : 'radio'}
                              name={q.id}
                              checked={choisi}
                              onChange={() => toggleOption(q, oi)}
                              style={{ accentColor: '#0D47A1', cursor: 'pointer' }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {erreur && (
                  <div style={{ fontSize: 12.5, color: '#B91C1C' }}>{erreur}</div>
                )}
              </div>
            )
          )}
        </div>

        {/* ── Pied ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '14px 20px', borderTop: '1px solid #EEF2F7', background: '#FBFCFE',
        }}>
          {resultat ? (
            <>
              <button onClick={rejouer} style={btnSecondaire}>{t('quiz.retry')}</button>
              <button onClick={onClose} style={btnPrimaire}>{t('quiz.close')}</button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={btnSecondaire}>{t('quiz.cancel')}</button>
              <button
                onClick={soumettre}
                disabled={!toutRepondu || envoi || loading}
                style={{ ...btnPrimaire, opacity: (!toutRepondu || envoi || loading) ? 0.5 : 1, cursor: (!toutRepondu || envoi) ? 'not-allowed' : 'pointer' }}
              >
                {envoi ? t('quiz.submitting') : t('quiz.submit')}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const btnLien: React.CSSProperties = {
  border: 'none', background: 'transparent', color: '#0D47A1', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline',
};

const btnPrimaire: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#fff', background: '#0D47A1',
  borderRadius: 8, padding: '9px 18px', border: 'none', cursor: 'pointer',
};

const btnSecondaire: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#0D47A1', background: '#EFF6FF',
  border: '1px solid #BFDBFE', borderRadius: 8, padding: '9px 18px', cursor: 'pointer',
};
