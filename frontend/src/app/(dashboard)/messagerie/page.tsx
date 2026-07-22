'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

interface Participant {
  id: string;
  nom: string;
  role: string;
}
interface Conversation {
  id: string;
  sujet?: string;
  type: 'direct' | 'groupe';
  participants: Participant[];
  participantsIds: string[];
  dateDernierMessage?: string;
  dernierMessageApercu?: string;
  nonLus: number;
}
interface Message {
  id: string;
  conversationId: string;
  auteurId: string;
  auteurNom: string;
  contenu: string;
  dateEnvoi: string;
  estMoi: boolean;
}
interface Destinataire {
  id: string;
  nom: string;
  email: string;
  role: string;
}

export default function MessageriePage() {
  const t = useTranslations('messagerie');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const filRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await apiClient<Conversation[]>('/messagerie/conversations');
      setConversations(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const ouvrir = async (conv: Conversation) => {
    setSelected(conv);
    try {
      const data = await apiClient<Message[]>(`/messagerie/conversations/${conv.id}/messages`);
      setMessages(data);
      await apiClient(`/messagerie/conversations/${conv.id}/lu`, { method: 'PATCH' });
      fetchConversations();
    } catch {}
  };

  useEffect(() => {
    if (filRef.current) filRef.current.scrollTop = filRef.current.scrollHeight;
  }, [messages]);

  const envoyer = async () => {
    if (!selected || !texte.trim()) return;
    setLoading(true);
    try {
      await apiClient(`/messagerie/conversations/${selected.id}/messages`, {
        method: 'POST',
        body: { contenu: texte },
      });
      setTexte('');
      const data = await apiClient<Message[]>(`/messagerie/conversations/${selected.id}/messages`);
      setMessages(data);
      fetchConversations();
    } catch {} finally {
      setLoading(false);
    }
  };

  const titreConv = (c: Conversation) => {
    if (c.sujet) return c.sujet;
    // Afficher les noms des participants (pour un direct, l'autre personne).
    const noms = c.participants.map((p) => p.nom).filter(Boolean);
    return noms.length ? noms.join(', ') : t('conversation');
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold shadow transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)' }}
        >
          {t('newConversation')}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Liste des conversations */}
        <div className="lg:col-span-1 bg-white rounded-xl overflow-y-auto" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {conversations.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm px-4">{t('empty')}</div>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => ouvrir(c)}
              className={`px-4 py-3 cursor-pointer border-l-4 transition-colors hover:bg-gray-50 ${
                selected?.id === c.id ? 'border-blue-500 bg-blue-50/40' : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-800 truncate">{titreConv(c)}</p>
                {c.nonLus > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white flex-shrink-0"
                    style={{ background: '#0D47A1' }}>
                    {c.nonLus}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {c.dernierMessageApercu || t('noMessage')}
              </p>
            </div>
          ))}
        </div>

        {/* Fil de messages */}
        <div className="lg:col-span-2 bg-white rounded-xl flex flex-col min-h-0" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              {t('selectConversation')}
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-900 text-sm">{titreConv(selected)}</p>
                <p className="text-xs text-gray-400">
                  {selected.participants.map((p) => p.nom).join(' · ')}
                </p>
              </div>
              <div ref={filRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                {messages.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">{t('noMessage')}</p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.estMoi ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      m.estMoi ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {!m.estMoi && (
                        <p className="text-[10px] font-semibold opacity-70 mb-0.5">{m.auteurNom}</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{m.contenu}</p>
                      <p className={`text-[10px] mt-1 ${m.estMoi ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(m.dateEnvoi).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input
                  value={texte}
                  onChange={(e) => setTexte(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                  placeholder={t('messagePlaceholder')}
                  className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-blue-400"
                />
                <button
                  onClick={envoyer}
                  disabled={loading || !texte.trim()}
                  className="px-4 py-2 rounded-full text-white text-sm font-semibold disabled:opacity-40"
                  style={{ background: '#0D47A1' }}
                >
                  {t('send')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showNew && (
        <NewConversationModal
          onClose={() => setShowNew(false)}
          onCreated={(conv) => {
            setShowNew(false);
            fetchConversations();
            ouvrir(conv);
          }}
        />
      )}
    </div>
  );
}

function NewConversationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (conv: Conversation) => void;
}) {
  const t = useTranslations('messagerie');
  const [destinataires, setDestinataires] = useState<Destinataire[]>([]);
  const [recherche, setRecherche] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const data = await apiClient<Destinataire[]>(
          `/messagerie/destinataires${recherche ? `?q=${encodeURIComponent(recherche)}` : ''}`,
        );
        setDestinataires(data);
      } catch {}
    }, 250);
    return () => clearTimeout(timer);
  }, [recherche]);

  const toggle = (id: string) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const creer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const conv = await apiClient<Conversation>('/messagerie/conversations', {
        method: 'POST',
        body: {
          participantsIds: selectedIds,
          sujet: sujet.trim() || undefined,
          message: message.trim() || undefined,
        },
      });
      onCreated(conv);
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-4">{t('modal.title')}</h2>
        <form onSubmit={creer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('modal.recipients')}</label>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={t('modal.searchPlaceholder')}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 mb-2"
            />
            <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
              {destinataires.length === 0 && (
                <p className="text-xs text-gray-400 px-3 py-3 text-center">{t('modal.noRecipient')}</p>
              )}
              {destinataires.map((d) => (
                <label key={d.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(d.id)}
                    onChange={() => toggle(d.id)}
                  />
                  <span className="text-sm text-gray-800">{d.nom}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{d.role}</span>
                </label>
              ))}
            </div>
          </div>
          {selectedIds.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t('modal.subject')}</label>
              <input
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder={t('modal.subjectPlaceholder')}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('modal.message')}</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('modal.messagePlaceholder')}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50">
              {t('modal.cancel')}
            </button>
            <button type="submit" disabled={loading || selectedIds.length === 0}
              className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)' }}>
              {loading ? t('modal.creating') : t('modal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
