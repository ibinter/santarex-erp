'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

type Etape = 'repos' | 'configuration' | 'codes' | 'desactivation';

const carte: React.CSSProperties = {
  background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', marginBottom: 20,
};
const champ: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #CFD8DC', borderRadius: 8, fontSize: 15, boxSizing: 'border-box',
};
const bouton = (couleur: string): React.CSSProperties => ({
  padding: '10px 18px', borderRadius: 8, border: 'none', background: couleur, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
});

/**
 * Double authentification (TOTP) : activation par QR code, codes de secours,
 * désactivation (mot de passe + code). Fonctionne avec Google Authenticator,
 * Microsoft Authenticator, Authy, 1Password…
 */
export default function TwoFactorCard() {
  const [actif, setActif] = useState<boolean | null>(null);
  const [restants, setRestants] = useState(0);
  const [etape, setEtape] = useState<Etape>('repos');
  const [qr, setQr] = useState('');
  const [cle, setCle] = useState('');
  const [code, setCode] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [codesSecours, setCodesSecours] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    try {
      const r: any = await apiClient('/auth/2fa/status');
      const d = r?.data ?? r;
      setActif(!!d?.enabled);
      setRestants(Number(d?.recoveryCodesLeft ?? 0));
    } catch {
      setActif(null);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // Arrivée depuis la connexion « votre établissement exige la double authentification ».
  const [exigee, setExigee] = useState(false);
  useEffect(() => {
    setExigee(new URLSearchParams(window.location.search).get('2fa') === '1');
  }, []);

  async function commencer() {
    setErreur(null); setOccupe(true);
    try {
      const r: any = await apiClient('/auth/2fa/setup', { method: 'POST', body: {} });
      const d = r?.data ?? r;
      setQr(d.qrDataUrl); setCle(d.secret); setCode(''); setEtape('configuration');
    } catch (e: any) {
      setErreur(e?.message ?? 'Impossible de démarrer la configuration');
    } finally { setOccupe(false); }
  }

  async function confirmer() {
    setErreur(null); setOccupe(true);
    try {
      const r: any = await apiClient('/auth/2fa/enable', { method: 'POST', body: { code } });
      const d = r?.data ?? r;
      setCodesSecours(d.recoveryCodes ?? []); setEtape('codes'); setCode('');
      await charger();
    } catch (e: any) {
      setErreur(e?.message ?? 'Code incorrect');
    } finally { setOccupe(false); }
  }

  async function desactiver() {
    setErreur(null); setOccupe(true);
    try {
      await apiClient('/auth/2fa/disable', { method: 'POST', body: { password: motDePasse, code } });
      setMotDePasse(''); setCode(''); setEtape('repos');
      await charger();
    } catch (e: any) {
      setErreur(e?.message ?? 'Impossible de désactiver');
    } finally { setOccupe(false); }
  }

  return (
    <div style={carte} id="double-authentification">
      <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#37474F' }}>🛡️ Double authentification</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#546E7A', lineHeight: 1.5 }}>
        En plus du mot de passe, un code à 6 chiffres généré par une application sur votre téléphone
        est demandé à chaque connexion. Même si votre mot de passe est volé, votre compte reste protégé.
      </p>

      {exigee && actif === false && (
        <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#8D6E00' }}>
          Votre établissement exige la double authentification pour les administrateurs. Activez-la ci-dessous.
        </div>
      )}
      {erreur && (
        <div role="alert" style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#C62828' }}>
          ⚠ {erreur}
        </div>
      )}

      {etape === 'repos' && actif === false && (
        <button style={bouton('#1565C0')} onClick={commencer} disabled={occupe}>Activer la double authentification</button>
      )}

      {etape === 'repos' && actif === true && (
        <div>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: '#2E7D32', fontWeight: 600 }}>
            ✓ Activée — il vous reste {restants} code{restants > 1 ? 's' : ''} de secours.
          </p>
          <button style={bouton('#C62828')} onClick={() => { setErreur(null); setEtape('desactivation'); }}>Désactiver</button>
        </div>
      )}

      {etape === 'configuration' && (
        <div>
          <ol style={{ margin: '0 0 16px', paddingLeft: 20, fontSize: 14, color: '#37474F', lineHeight: 1.7 }}>
            <li>Installez <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong> ou <strong>Authy</strong> sur votre téléphone.</li>
            <li>Scannez ce QR code avec l’application.</li>
            <li>Saisissez ci-dessous le code à 6 chiffres qu’elle affiche.</li>
          </ol>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 16 }}>
            {qr && <img src={qr} alt="QR code à scanner" width={180} height={180} style={{ border: '1px solid #E0E0E0', borderRadius: 8 }} />}
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, color: '#78909C', marginBottom: 4 }}>Impossible de scanner ? Saisissez cette clé dans l’application :</div>
              <code style={{ display: 'block', background: '#F5F7FA', padding: '8px 10px', borderRadius: 6, fontSize: 13, wordBreak: 'break-all', marginBottom: 12 }}>{cle}</code>
              <input
                style={champ} inputMode="numeric" autoComplete="one-time-code" placeholder="Code à 6 chiffres"
                value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))} maxLength={7}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={bouton('#1565C0')} onClick={confirmer} disabled={occupe || code.replace(/\s/g, '').length !== 6}>Activer</button>
            <button style={bouton('#78909C')} onClick={() => { setEtape('repos'); setErreur(null); }}>Annuler</button>
          </div>
        </div>
      )}

      {etape === 'codes' && (
        <div>
          <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 14, color: '#1B5E20', fontWeight: 600 }}>
            ✓ Double authentification activée.
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 14, color: '#37474F', lineHeight: 1.5 }}>
            <strong>Notez ces codes de secours maintenant.</strong> Chacun sert une seule fois si vous perdez votre téléphone.
            Ils ne seront <strong>plus jamais affichés</strong>.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8, marginBottom: 14 }}>
            {codesSecours.map((c) => (
              <code key={c} style={{ background: '#F5F7FA', padding: '8px 10px', borderRadius: 6, fontSize: 14, textAlign: 'center' }}>{c}</code>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={bouton('#1565C0')} onClick={() => navigator.clipboard?.writeText(codesSecours.join('\n'))}>Copier les codes</button>
            <button style={bouton('#2E7D32')} onClick={() => { setCodesSecours([]); setEtape('repos'); }}>J’ai noté mes codes</button>
          </div>
        </div>
      )}

      {etape === 'desactivation' && (
        <div>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: '#37474F' }}>
            Pour désactiver, confirmez avec votre mot de passe et un code de votre application (ou un code de secours).
          </p>
          <div style={{ display: 'grid', gap: 10, maxWidth: 360, marginBottom: 14 }}>
            <input style={champ} type="password" autoComplete="current-password" placeholder="Mot de passe" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
            <input style={champ} placeholder="Code à 6 chiffres ou code de secours" value={code} onChange={(e) => setCode(e.target.value)} maxLength={16} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={bouton('#C62828')} onClick={desactiver} disabled={occupe || !motDePasse || !code}>Désactiver</button>
            <button style={bouton('#78909C')} onClick={() => { setEtape('repos'); setErreur(null); }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
