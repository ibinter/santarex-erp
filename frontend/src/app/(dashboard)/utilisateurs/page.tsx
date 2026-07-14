'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, UserCheck, UserX, Key,
  Pencil, X, Check, Eye, EyeOff, RefreshCw,
  ShieldCheck, ChevronDown,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

const ROLES = [
  { value: 'admin',       label: 'Administrateur',    color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
  { value: 'medecin',     label: 'Médecin',           color: '#0F766E', bg: '#CCFBF1', border: '#5EEAD4' },
  { value: 'infirmier',   label: 'Infirmier(e)',       color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
  { value: 'caissier',    label: 'Caissier(e)',        color: '#374151', bg: '#F3F4F6', border: '#D1D5DB' },
  { value: 'pharmacien',  label: 'Pharmacien(ne)',     color: '#92400E', bg: '#FEF3C7', border: '#FDE68A' },
  { value: 'laborantin',  label: 'Laborantin(e)',      color: '#5B21B6', bg: '#EDE9FE', border: '#C4B5FD' },
  { value: 'drh',         label: 'DRH',               color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD' },
  { value: 'directeur',   label: 'Directeur',         color: '#9D174D', bg: '#FCE7F3', border: '#F9A8D4' },
];

const AVATAR_COLORS: [string,string][] = [
  ['#1D4ED8','#DBEAFE'],['#7C3AED','#EDE9FE'],['#0F766E','#CCFBF1'],
  ['#B45309','#FEF3C7'],['#9D174D','#FCE7F3'],['#065F46','#D1FAE5'],
  ['#7C2D12','#FEE2E2'],['#1E40AF','#DBEAFE'],
];
function avatarColor(name: string): [string,string] {
  let h=0; for(let i=0;i<name.length;i++) h=((h<<5)-h+name.charCodeAt(i))|0;
  return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];
}

interface UserData {
  id: string; firstName: string; lastName: string;
  email: string; role: string; isActive: boolean; createdAt: string;
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLES.find(r => r.value === role) ?? { label: role, color: '#546E7A', bg: '#F3F4F6', border: '#E5E7EB' };
  return (
    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

function ModalInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = (focus: boolean): React.CSSProperties => ({
  width: '100%', padding: '10px 12px', border: `1.5px solid ${focus ? '#3730A3' : '#E0E8F0'}`,
  borderRadius: 10, fontSize: 13, color: '#1A2332', outline: 'none',
  background: focus ? '#fff' : '#F8FAFC', boxSizing: 'border-box', transition: 'border-color .15s',
});

export default function UtilisateursPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [showPwdModal, setShowPwdModal] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'medecin', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [focusField, setFocusField] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e.message || 'Erreur de chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchS = !q || u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchR = !roleFilter || u.role === roleFilter;
    return matchS && matchR;
  });

  const nbActif = users.filter(u => u.isActive).length;

  const openCreate = () => {
    setEditUser(null);
    setForm({ firstName: '', lastName: '', email: '', role: 'medecin', password: '' });
    setError(''); setShowModal(true);
  };
  const openEdit = (u: UserData) => {
    setEditUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, password: '' });
    setError(''); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.role) { setError('Tous les champs obligatoires doivent être remplis.'); return; }
    if (!editUser && !form.password) { setError('Le mot de passe est obligatoire pour un nouvel utilisateur.'); return; }
    setSaving(true); setError('');
    try {
      if (editUser) {
        await apiClient(`/users/${editUser.id}`, { method: 'PATCH', body: { firstName: form.firstName, lastName: form.lastName, role: form.role } });
        setSuccess('Utilisateur modifié avec succès.');
      } else {
        await apiClient('/users', { method: 'POST', body: form });
        setSuccess('Utilisateur créé avec succès.');
      }
      setShowModal(false); await load(); setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError(e.message || 'Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (u: UserData) => {
    try {
      await apiClient(`/users/${u.id}/toggle-active`, { method: 'PATCH' });
      setSuccess(`Utilisateur ${u.isActive ? 'désactivé' : 'activé'} avec succès.`);
      await load(); setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError(e.message || 'Erreur'); }
  };

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 8) { setError('Le mot de passe doit comporter au moins 8 caractères.'); return; }
    setSaving(true);
    try {
      await apiClient(`/users/${showPwdModal!.id}/reset-password`, { method: 'PATCH', body: { newPassword: newPwd } });
      setSuccess('Mot de passe réinitialisé avec succès.');
      setShowPwdModal(null); setNewPwd(''); setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError(e.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .usr-row:hover  { background: #F5F7FF !important; }
        .usr-row:hover .usr-actions { opacity:1 !important; }
        .role-chip:hover { opacity:.85; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#1E1B4B 0%,#3730A3 55%,#4F46E5 100%)', borderRadius: 18, padding: '22px 26px 18px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(30,27,75,0.4)' }}>
        <div style={{ position: 'absolute', top: -60, right: 50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
        <div style={{ position: 'absolute', bottom: -50, right: 260, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.16)', border: '1.5px solid rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={26} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>Utilisateurs</h1>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {loading ? '…' : `${users.length} compte(s) · ${nbActif} actif(s)`}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={load} disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
              </button>
              <button onClick={openCreate}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#3730A3', fontWeight: 800 }}>
                <Plus size={14}/> Nouvel utilisateur
              </button>
            </div>
          </div>

          {/* Role stats pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            {ROLES.slice(0, 5).map(r => {
              const cnt = users.filter(u => u.role === r.value).length;
              return (
                <div key={r.value} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '4px 11px' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{cnt}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{r.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FEEDBACK ──────────────────────────────────────── */}
      {success && (
        <div style={{ marginBottom: 14, padding: '10px 16px', background: '#D1FAE5', border: '1.5px solid #6EE7B7', borderRadius: 12, color: '#065F46', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, animation: 'fadeUp .2s ease' }}>
          <Check size={15}/> {success}
        </div>
      )}
      {error && !showModal && !showPwdModal && (
        <div style={{ marginBottom: 14, padding: '10px 16px', background: '#FEE2E2', border: '1.5px solid #FECACA', borderRadius: 12, color: '#991B1B', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <X size={15}/> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B' }}><X size={13}/></button>
        </div>
      )}

      {/* ── FILTRES ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou email…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 11, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}/>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setRoleFilter('')}
            style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${!roleFilter ? '#3730A3' : '#E0E8F0'}`, background: !roleFilter ? '#3730A3' : '#fff', color: !roleFilter ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Tous
          </button>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => setRoleFilter(roleFilter === r.value ? '' : r.value)} className="role-chip"
              style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${roleFilter === r.value ? r.color : '#E0E8F0'}`, background: roleFilter === r.value ? r.bg : '#fff', color: roleFilter === r.value ? r.color : '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && (
        <div style={{ fontSize: 12, color: '#90A4AE', fontWeight: 600, marginBottom: 10 }}>
          {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </div>
      )}

      {/* ── TABLE ─────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Depuis', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1.5px solid #EEF2F8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(90deg,#F0F4FA,#E8EEF6)', animation: 'pulse 1.5s ease infinite' }}/>
                      <div style={{ width: 110, height: 13, borderRadius: 4, background: 'linear-gradient(90deg,#F0F4FA,#E8EEF6)', animation: 'pulse 1.5s ease infinite' }}/>
                    </div>
                  </td>
                  {[130, 80, 60, 55, 90].map((w, j) => (
                    <td key={j} style={{ padding: '13px 16px' }}>
                      <div style={{ width: w, height: 13, borderRadius: 4, background: 'linear-gradient(90deg,#F0F4FA,#E8EEF6)', animation: 'pulse 1.5s ease infinite' }}/>
                    </td>
                  ))}
                </tr>
              )) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <Users size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }}/>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#37474F' }}>Aucun utilisateur trouvé</div>
                    <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 4 }}>
                      {search || roleFilter ? 'Modifiez vos filtres' : 'Créez le premier utilisateur'}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(u => {
                const fullName = `${u.firstName}${u.lastName}`;
                const [ac, ab] = avatarColor(fullName);
                const inits = `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
                return (
                  <tr key={u.id} className="usr-row"
                    style={{ borderTop: '1px solid #F0F4FA', transition: 'background .12s' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${ab},${ac}22)`, border: `1.5px solid ${ac}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: ac, flexShrink: 0 }}>
                          {inits}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{u.firstName} {u.lastName}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#546E7A' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}><RoleBadge role={u.role}/></td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: u.isActive ? '#D1FAE5' : '#FEE2E2', color: u.isActive ? '#065F46' : '#991B1B', border: `1px solid ${u.isActive ? '#6EE7B7' : '#FECACA'}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.isActive ? '#10B981' : '#EF4444', display: 'inline-block' }}/>
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: '#90A4AE', whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="usr-actions" style={{ display: 'flex', gap: 5, opacity: 0.7, transition: 'opacity .15s' }}>
                        <button onClick={() => openEdit(u)} title="Modifier"
                          style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Pencil size={13} color="#546E7A"/>
                        </button>
                        <button onClick={() => { setShowPwdModal(u); setNewPwd(''); setError(''); }} title="Réinitialiser mot de passe"
                          style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Key size={13} color="#546E7A"/>
                        </button>
                        <button onClick={() => handleToggle(u)} title={u.isActive ? 'Désactiver' : 'Activer'}
                          style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${u.isActive ? '#FECACA' : '#6EE7B7'}`, background: u.isActive ? '#FEE2E2' : '#D1FAE5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {u.isActive ? <UserX size={13} color="#991B1B"/> : <UserCheck size={13} color="#065F46"/>}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL CRÉER / MODIFIER ──────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,35,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ background: 'linear-gradient(135deg,#1E1B4B,#3730A3)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {editUser ? <Pencil size={16} color="#fff"/> : <Plus size={16} color="#fff"/>}
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                  {editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                </span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <X size={15}/>
              </button>
            </div>

            <div style={{ padding: '22px' }}>
              {error && (
                <div style={{ marginBottom: 14, padding: '10px 14px', background: '#FEE2E2', border: '1.5px solid #FECACA', borderRadius: 10, color: '#991B1B', fontSize: 12, fontWeight: 600 }}>{error}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <ModalInput label="Prénom *">
                    <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                      onFocus={() => setFocusField('fn')} onBlur={() => setFocusField('')}
                      style={inputStyle(focusField === 'fn')}/>
                  </ModalInput>
                  <ModalInput label="Nom *">
                    <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                      onFocus={() => setFocusField('ln')} onBlur={() => setFocusField('')}
                      style={inputStyle(focusField === 'ln')}/>
                  </ModalInput>
                </div>
                {!editUser && (
                  <ModalInput label="Email *">
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      onFocus={() => setFocusField('em')} onBlur={() => setFocusField('')}
                      style={inputStyle(focusField === 'em')}/>
                  </ModalInput>
                )}
                <ModalInput label="Rôle *">
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    style={{ ...inputStyle(false), cursor: 'pointer' }}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </ModalInput>
                {!editUser && (
                  <ModalInput label="Mot de passe *">
                    <div style={{ position: 'relative' }}>
                      <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="Min. 8 caractères"
                        onFocus={() => setFocusField('pw')} onBlur={() => setFocusField('')}
                        style={{ ...inputStyle(focusField === 'pw'), paddingRight: 40 }}/>
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#90A4AE' }}>
                        {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                  </ModalInput>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#546E7A', fontWeight: 600 }}>
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: '#3730A3', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  {saving ? 'Enregistrement…' : editUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RESET PASSWORD ───────────────────────── */}
      {showPwdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,35,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#7F1D1D,#991B1B)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Key size={16} color="#fff"/>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Réinitialiser le mot de passe</span>
              </div>
              <button onClick={() => setShowPwdModal(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <X size={14}/>
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#546E7A' }}>
                Nouveau mot de passe pour <strong style={{ color: '#1A2332' }}>{showPwdModal.firstName} {showPwdModal.lastName}</strong>
              </p>
              {error && <div style={{ marginBottom: 12, padding: '8px 12px', background: '#FEE2E2', borderRadius: 8, color: '#991B1B', fontSize: 12, fontWeight: 600 }}>{error}</div>}
              <div style={{ position: 'relative' }}>
                <input type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  placeholder="Min. 8 caractères"
                  onFocus={() => setFocusField('np')} onBlur={() => setFocusField('')}
                  style={{ ...inputStyle(focusField === 'np'), paddingRight: 40 }}/>
                <button type="button" onClick={() => setShowNewPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#90A4AE' }}>
                  {showNewPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowPwdModal(null)} style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#546E7A', fontWeight: 600 }}>
                  Annuler
                </button>
                <button onClick={handleResetPwd} disabled={saving}
                  style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#991B1B', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  {saving ? '…' : 'Réinitialiser'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
