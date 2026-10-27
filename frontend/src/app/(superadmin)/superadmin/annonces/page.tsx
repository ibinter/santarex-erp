'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Megaphone, Send, Users, CheckCircle2, AlertTriangle } from 'lucide-react';

type Destinataire = { tenant: string; email: string; prenom: string };

const MODELE = `Nous venons d'ajouter de nouvelles fonctions à SANTAREX :

• Double authentification : protégez votre compte avec une application sur votre téléphone
• Sauvegardes copiées chaque nuit hors du serveur
• Une démonstration pour chaque formule : https://demo.santarex.ibigsoft.com/login

Connectez-vous pour les découvrir. Une question ? Répondez simplement à ce message.`;

const carte: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', marginBottom: 18 };
const champ: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #CFD8DC', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' };
const bouton = (couleur: string, desactive = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, border: 'none',
  background: desactive ? '#B0BEC5' : couleur, color: '#fff', fontWeight: 700, fontSize: 14, cursor: desactive ? 'not-allowed' : 'pointer',
});

/**
 * Annonces de nouveautés par e-mail aux administrateurs des établissements abonnés.
 * Trois garde-fous : aperçu des destinataires, test à sa propre adresse, confirmation « ENVOYER ».
 */
export default function AnnoncesPage() {
  const [destinataires, setDestinataires] = useState<Destinataire[] | null>(null);
  const [sujet, setSujet] = useState('Les nouveautés de SANTAREX');
  const [message, setMessage] = useState(MODELE);
  const [testA, setTestA] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [retour, setRetour] = useState<{ ok: boolean; texte: string } | null>(null);

  const charger = useCallback(async () => {
    try {
      const r: any = await apiClient('/superadmin/annonces/destinataires');
      setDestinataires((r?.data ?? r) as Destinataire[]);
    } catch (e: any) {
      setRetour({ ok: false, texte: e?.message ?? 'Impossible de lire les destinataires' });
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function envoyerTest() {
    setOccupe(true); setRetour(null);
    try {
      const r: any = await apiClient('/superadmin/annonces/test', { method: 'POST', body: { sujet, message, testA } });
      const d = r?.data ?? r;
      setRetour(d?.envoye
        ? { ok: true, texte: `Test envoyé à ${testA}. Vérifiez votre boîte (et les courriers indésirables).` }
        : { ok: false, texte: "Le serveur d'e-mail a refusé le test. Regardez les journaux du serveur." });
    } catch (e: any) {
      setRetour({ ok: false, texte: e?.message ?? 'Échec du test' });
    } finally { setOccupe(false); }
  }

  async function envoyerATous() {
    setOccupe(true); setRetour(null);
    try {
      const r: any = await apiClient('/superadmin/annonces/envoyer', { method: 'POST', body: { sujet, message, confirmation } });
      const d = r?.data ?? r;
      setConfirmation('');
      setRetour({
        ok: (d?.echecs?.length ?? 0) === 0,
        texte: `${d?.envoyes ?? 0} message(s) envoyé(s) sur ${d?.cibles ?? 0}.` + (d?.echecs?.length ? ` Échecs : ${d.echecs.join(', ')}` : ''),
      });
    } catch (e: any) {
      setRetour({ ok: false, texte: e?.message ?? "Échec de l'envoi" });
    } finally { setOccupe(false); }
  }

  const n = destinataires?.length ?? 0;
  const pret = !occupe && sujet.trim() !== '' && message.trim() !== '';

  return (
    <div style={{ padding: 20, maxWidth: 820 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px', fontSize: 22, color: '#0F172A' }}>
        <Megaphone size={22} /> Annonces aux abonnés
      </h1>
      <p style={{ margin: '0 0 18px', color: '#546E7A', fontSize: 14, lineHeight: 1.5 }}>
        Envoyez un e-mail de nouveautés aux administrateurs des établissements abonnés (licence active, essai ou grâce).
        Gratuit : utilise votre serveur d&apos;e-mail. Les comptes de démonstration sont exclus.
      </p>

      <div style={carte}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#37474F', marginBottom: 8 }}>
          <Users size={16} /> Destinataires : {destinataires === null ? '…' : n}
        </div>
        {destinataires && n > 0 && (
          <div style={{ maxHeight: 150, overflow: 'auto', fontSize: 13, color: '#546E7A', lineHeight: 1.6 }}>
            {destinataires.map((d) => <div key={d.email}>{d.prenom} — {d.email} <span style={{ color: '#90A4AE' }}>({d.tenant})</span></div>)}
          </div>
        )}
        {destinataires && n === 0 && <div style={{ fontSize: 13, color: '#90A4AE' }}>Aucun établissement abonné trouvé.</div>}
      </div>

      <div style={carte}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#546E7A', margin: '0 0 6px' }}>SUJET</label>
        <input style={{ ...champ, marginBottom: 14 }} value={sujet} onChange={(e) => setSujet(e.target.value)} maxLength={150} />
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#546E7A', margin: '0 0 6px' }}>MESSAGE</label>
        <textarea style={{ ...champ, minHeight: 220, resize: 'vertical', lineHeight: 1.5 }} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} />
        <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 6 }}>
          Une ligne vide sépare les paragraphes. Une ligne qui commence par « • » devient une puce. Chaque personne est saluée par son prénom.
        </div>
      </div>

      <div style={carte}>
        <div style={{ fontWeight: 700, color: '#37474F', marginBottom: 10 }}>1. Relisez-vous : envoyez-vous un test</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input style={{ ...champ, flex: 1, minWidth: 220 }} type="email" placeholder="votre@adresse.com" value={testA} onChange={(e) => setTestA(e.target.value)} />
          <button style={bouton('#1565C0', !pret || !testA.includes('@'))} disabled={!pret || !testA.includes('@')} onClick={envoyerTest}>
            <Send size={15} /> Envoyer un test
          </button>
        </div>
      </div>

      <div style={{ ...carte, border: '1.5px solid #FFCDD2' }}>
        <div style={{ fontWeight: 700, color: '#C62828', marginBottom: 6 }}>2. Envoi à tous les abonnés ({n})</div>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#546E7A' }}>
          Cette action ne peut pas être annulée. Tapez <strong>ENVOYER</strong> pour la confirmer.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input style={{ ...champ, flex: 1, minWidth: 160, maxWidth: 220 }} placeholder="ENVOYER" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          <button style={bouton('#C62828', !pret || confirmation !== 'ENVOYER' || n === 0)} disabled={!pret || confirmation !== 'ENVOYER' || n === 0} onClick={envoyerATous}>
            <Send size={15} /> Envoyer à {n} établissement(s)
          </button>
        </div>
      </div>

      {retour && (
        <div role="status" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 10, fontSize: 14,
          background: retour.ok ? '#E8F5E9' : '#FFEBEE', border: `1px solid ${retour.ok ? '#A5D6A7' : '#FFCDD2'}`, color: retour.ok ? '#1B5E20' : '#C62828' }}>
          {retour.ok ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} <span>{retour.texte}</span>
        </div>
      )}
    </div>
  );
}
