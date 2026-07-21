'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Détecte, à partir de la réponse de SARA, les cas où elle indique ne pas
 * pouvoir répondre — afin de proposer l'ouverture d'un ticket de support.
 */
const UNKNOWN_PATTERNS = [
  'je ne sais pas',
  'je ne peux pas répondre',
  'je ne suis pas en mesure',
  'je ne dispose pas',
  "je n'ai pas d'information",
  "je n'ai pas cette information",
  'contactez le support',
  'contacter le support',
  "i don't know",
  'i cannot answer',
  "i'm not able",
  'i am not able',
  'contact support',
];

function looksUnanswered(text: string): boolean {
  const t = text.toLowerCase();
  return UNKNOWN_PATTERNS.some((p) => t.includes(p));
}

const SARA_AVATAR = (
  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
    style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)' }}>
    S
  </div>
);

export default function AiChat() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis SARA, votre assistante SANTAREX. Comment puis-je vous aider ?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showSupport]);

  const openSupport = () => {
    setOpen(false);
    router.push('/support');
  };

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    const history = [...messages, { role: 'user' as const, content: q }];
    setMessages(history);
    setInput('');
    setLoading(true);
    setShowSupport(false);

    const token = localStorage.getItem('access_token');
    let assistantMsg = '';

    try {
      const res = await fetch(`${API_URL}/ai-assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: history }),
      });

      // Erreurs renvoyées en JSON (hors flux SSE) : quota et service désactivé.
      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: j?.message || "Vous avez atteint le quota d'assistance IA pour aujourd'hui. Réessayez demain ou contactez votre administrateur.",
        }]);
        setShowSupport(true);
        return;
      }
      if (res.status === 403) {
        const j = await res.json().catch(() => ({}));
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: j?.message || "L'assistant IA est désactivé pour cet établissement. Contactez votre administrateur pour l'activer.",
        }]);
        setShowSupport(true);
        return;
      }
      if (!res.ok) {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'Le service IA est momentanément indisponible. Réessayez dans un instant.',
        }]);
        setShowSupport(true);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter((l) => l.startsWith('data:'));
        for (const line of lines) {
          const raw = line.slice(5).trim();
          if (raw === '[DONE]') break;
          try {
            const { text, error } = JSON.parse(raw);
            if (error) { assistantMsg = error; break; }
            if (text) {
              assistantMsg += text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantMsg };
                return updated;
              });
            }
          } catch {}
        }
      }

      // Si SARA ne sait pas répondre, proposer l'ouverture d'un ticket support.
      if (!assistantMsg || looksUnanswered(assistantMsg)) {
        setShowSupport(true);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Erreur de connexion au service IA.' }]);
      setShowSupport(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)' }}
        title="Assistante SARA"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        )}
      </button>

      {/* Fenêtre chat */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '440px', background: '#fff', border: '1px solid #e5e7eb' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)' }}>
            {SARA_AVATAR}
            <div>
              <p className="text-sm font-bold leading-tight">SARA</p>
              <p className="text-xs opacity-80">Assistante SANTAREX</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ background: '#F5F7FA' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.role === 'assistant' && SARA_AVATAR}
                <div
                  className="max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed"
                  style={m.role === 'user'
                    ? { background: '#0D47A1', color: 'white' }
                    : { background: 'white', color: '#1f2937', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                >
                  {m.content || <span className="opacity-50">…</span>}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2">
                {SARA_AVATAR}
                <div className="bg-white rounded-xl px-3 py-2 text-sm text-gray-400 shadow-sm">…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Action support — proposée quand SARA ne sait pas répondre */}
          {showSupport && (
            <div className="px-3 py-2 border-t bg-amber-50">
              <button
                onClick={openSupport}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ouvrir un ticket support
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t bg-white">
            <input
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
              placeholder="Votre question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
              style={{ background: '#0D47A1' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
