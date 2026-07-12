'use client';

import { useState } from 'react';
import { Settings, Building, Shield, Bell, Users, Globe, Palette, Database, Save } from 'lucide-react';

const SECTIONS = [
  { id: 'etablissement', label: 'Établissement', icon: <Building size={16} /> },
  { id: 'securite', label: 'Sécurité & Accès', icon: <Shield size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'utilisateurs', label: 'Utilisateurs & Rôles', icon: <Users size={16} /> },
  { id: 'langue', label: 'Langue & Région', icon: <Globe size={16} /> },
  { id: 'apparence', label: 'Apparence', icon: <Palette size={16} /> },
  { id: 'sauvegarde', label: 'Sauvegardes', icon: <Database size={16} /> },
];

const ROLES = [
  { nom: 'Super Administrateur', permissions: ['Tout accès', 'Gestion système'], count: 1, color: '#C62828' },
  { nom: 'Administrateur', permissions: ['Gestion utilisateurs', 'Rapports', 'Paramètres'], count: 2, color: '#0D47A1' },
  { nom: 'Médecin', permissions: ['DME', 'Consultations', 'Ordonnances', 'Labo'], count: 18, color: '#00838F' },
  { nom: 'Infirmier(e)', permissions: ['Soins', 'Hospitalisation', 'Urgences'], count: 42, color: '#2E7D32' },
  { nom: 'Pharmacien', permissions: ['Pharmacie', 'Stocks', 'Dispensation'], count: 5, color: '#E65100' },
  { nom: 'Biologiste', permissions: ['Laboratoire', 'Résultats', 'Validation'], count: 4, color: '#6A1B9A' },
  { nom: 'Caissier(e)', permissions: ['Facturation', 'Paiements', 'Caisse'], count: 8, color: '#37474F' },
  { nom: 'Technicien Imagerie', permissions: ['Imagerie', 'Examens', 'Comptes-rendus'], count: 3, color: '#00695C' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: value ? '#0D47A1' : '#B0BEC5', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', top: '3px', left: value ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

export default function ParametresPage() {
  const [section, setSection] = useState('etablissement');
  const [saved, setSaved] = useState(false);

  // Paramètres état
  const [nomEtab, setNomEtab] = useState('Clinique Saint-Joseph');
  const [ville, setVille] = useState('Abidjan');
  const [pays, setPays] = useState('Côte d\'Ivoire');
  const [tel, setTel] = useState('+225 27 20 32 45 67');
  const [email, setEmail] = useState('contact@clinique-saintjoseph.ci');
  const [notifStock, setNotifStock] = useState(true);
  const [notifRdv, setNotifRdv] = useState(true);
  const [notifLabo, setNotifLabo] = useState(true);
  const [notifFacture, setNotifFacture] = useState(false);
  const [twoFa, setTwoFa] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={22} color="#546E7A" />
            </div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1A2332' }}>Paramètres</h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#546E7A' }}>Configuration de l'établissement et préférences système</p>
        </div>
        <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', background: saved ? '#2E7D32' : '#0D47A1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'background 0.3s' }}>
          <Save size={15} /> {saved ? '✓ Enregistré !' : 'Enregistrer'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        {/* Menu latéral */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '8px', height: 'fit-content' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: section === s.id ? 600 : 400, background: section === s.id ? '#EFF6FF' : 'transparent', color: section === s.id ? '#0D47A1' : '#546E7A', textAlign: 'left', marginBottom: '2px', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { if (section !== s.id) (e.currentTarget as HTMLButtonElement).style.background = '#F5F7FA'; }}
              onMouseLeave={(e) => { if (section !== s.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
              <span style={{ color: section === s.id ? '#0D47A1' : '#90A4AE' }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '24px' }}>
          {section === 'etablissement' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#1A2332' }}>Informations de l'établissement</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Nom de l\'établissement', value: nomEtab, onChange: setNomEtab },
                  { label: 'Ville', value: ville, onChange: setVille },
                  { label: 'Pays', value: pays, onChange: setPays },
                  { label: 'Téléphone', value: tel, onChange: setTel },
                  { label: 'Email', value: email, onChange: setEmail },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{f.label}</label>
                    <input value={f.value} onChange={e => f.onChange(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8EAED', borderRadius: '8px', fontSize: '13px', color: '#37474F', outline: 'none', background: '#FAFBFC', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#1976D2'; e.currentTarget.style.background = '#fff'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E8EAED'; e.currentTarget.style.background = '#FAFBFC'; }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', padding: '16px', background: '#EFF6FF', borderRadius: '10px', borderLeft: '4px solid #0D47A1' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#0D47A1', marginBottom: '4px' }}>Identifiant Tenant</div>
                <div style={{ fontSize: '13px', color: '#37474F', fontFamily: 'monospace' }}>clinique-saint-joseph</div>
                <div style={{ fontSize: '11px', color: '#546E7A', marginTop: '4px' }}>Identifiant unique de votre établissement — non modifiable</div>
              </div>
            </div>
          )}

          {section === 'securite' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#1A2332' }}>Sécurité & Contrôle d'accès</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Authentification à 2 facteurs (2FA)', desc: 'Exige un code TOTP en plus du mot de passe', value: twoFa, onChange: setTwoFa },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#F5F7FA', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#37474F' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: '#90A4AE', marginTop: '3px' }}>{item.desc}</div>
                    </div>
                    <Toggle value={item.value} onChange={item.onChange} />
                  </div>
                ))}
                <div style={{ padding: '16px', background: '#F5F7FA', borderRadius: '10px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#37474F', marginBottom: '8px' }}>Expiration de session (minutes)</label>
                  <input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E8EAED', borderRadius: '8px', fontSize: '13px', width: '120px', outline: 'none' }} />
                </div>
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#1A2332' }}>Préférences de notifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Alertes de stock critique', desc: 'Notifier quand un médicament passe sous le seuil', value: notifStock, onChange: setNotifStock },
                  { label: 'Rappels de rendez-vous', desc: 'Rappel 1h avant chaque rendez-vous', value: notifRdv, onChange: setNotifRdv },
                  { label: 'Résultats de laboratoire', desc: 'Notifier quand les résultats sont disponibles', value: notifLabo, onChange: setNotifLabo },
                  { label: 'Factures impayées', desc: 'Alerte quotidienne sur les impayés > 7 jours', value: notifFacture, onChange: setNotifFacture },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F5F7FA', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#37474F' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: '#90A4AE', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                    <Toggle value={item.value} onChange={item.onChange} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'utilisateurs' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#1A2332' }}>Rôles & Permissions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ROLES.map(r => (
                  <div key={r.nom} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#F5F7FA', borderRadius: '10px', borderLeft: `4px solid ${r.color}` }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: r.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={16} color={r.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#1A2332' }}>{r.nom}</div>
                      <div style={{ fontSize: '11px', color: '#90A4AE', marginTop: '2px' }}>{r.permissions.join(' · ')}</div>
                    </div>
                    <span style={{ background: r.color + '22', color: r.color, fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', flexShrink: 0 }}>
                      {r.count} utilisateur{r.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'langue' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#1A2332' }}>Langue & Région</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Langue de l\'interface', options: ['Français', 'English'], selected: 'Français' },
                  { label: 'Devise', options: ['XOF (Franc CFA)', 'EUR (Euro)', 'USD (Dollar)'], selected: 'XOF (Franc CFA)' },
                  { label: 'Format de date', options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], selected: 'DD/MM/YYYY' },
                  { label: 'Fuseau horaire', options: ['Africa/Abidjan (UTC+0)', 'Africa/Dakar (UTC+0)', 'Africa/Lagos (UTC+1)'], selected: 'Africa/Abidjan (UTC+0)' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{f.label}</label>
                    <select defaultValue={f.selected} style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8EAED', borderRadius: '8px', fontSize: '13px', color: '#37474F', outline: 'none', background: '#FAFBFC' }}>
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(section === 'apparence' || section === 'sauvegarde') && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
              <Settings size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#546E7A', margin: '0 0 8px' }}>
                {section === 'apparence' ? 'Personnalisation de l\'interface' : 'Gestion des sauvegardes'}
              </p>
              <p style={{ fontSize: '13px', margin: 0 }}>Cette section sera disponible prochainement.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
