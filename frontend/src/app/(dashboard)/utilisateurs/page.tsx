'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, UserCheck, UserX, Key, Pencil, X, Check, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api';

const ROLES = [
  { value: 'admin', label: 'Administrateur', color: '#0D47A1', bg: '#EFF6FF' },
  { value: 'medecin', label: 'Médecin', color: '#00838F', bg: '#E0F7FA' },
  { value: 'infirmier', label: 'Infirmier(e)', color: '#2E7D32', bg: '#E8F5E9' },
  { value: 'caissier', label: 'Caissier(e)', color: '#37474F', bg: '#ECEFF1' },
  { value: 'pharmacien', label: 'Pharmacien(ne)', color: '#E65100', bg: '#FFF3E0' },
  { value: 'laborantin', label: 'Laborantin(e)', color: '#6A1B9A', bg: '#F3E5F5' },
  { value: 'drh', label: 'DRH', color: '#1565C0', bg: '#E3F2FD' },
  { value: 'directeur', label: 'Directeur', color: '#880E4F', bg: '#FCE4EC' },
];

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLES.find(r => r.value === role) ?? { label: role, color: '#546E7A', bg: '#ECEFF1' };
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function Initials({ firstName, lastName, color }: { firstName: string; lastName: string; color: string }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
      {(firstName?.[0] ?? '').toUpperCase()}{(lastName?.[0] ?? '').toUpperCase()}
    </div>
  );
}

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

  // Form state
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'medecin', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const roleColor = (role: string) => ROLES.find(r => r.value === role)?.color ?? '#546E7A';

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setEditUser(null);
    setForm({ firstName: '', lastName: '', email: '', role: 'medecin', password: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (u: UserData) => {
    setEditUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, password: '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.role) {
      setError('Tous les champs obligatoires doivent être remplis.');
      return;
    }
    if (!editUser && !form.password) {
      setError('Le mot de passe est obligatoire pour un nouvel utilisateur.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editUser) {
        await apiClient(`/users/${editUser.id}`, { method: 'PATCH', body: { firstName: form.firstName, lastName: form.lastName, role: form.role } });
        setSuccess('Utilisateur modifié avec succès.');
      } else {
        await apiClient('/users', { method: 'POST', body: form });
        setSuccess('Utilisateur créé avec succès.');
      }
      setShowModal(false);
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (u: UserData) => {
    try {
      await apiClient(`/users/${u.id}/toggle-active`, { method: 'PATCH' });
      setSuccess(`Utilisateur ${u.isActive ? 'désactivé' : 'activé'} avec succès.`);
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Erreur');
    }
  };

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 8) { setError('Le mot de passe doit comporter au moins 8 caractères.'); return; }
    setSaving(true);
    try {
      await apiClient(`/users/${showPwdModal!.id}/reset-password`, { method: 'PATCH', body: { newPassword: newPwd } });
      setSuccess('Mot de passe réinitialisé avec succès.');
      setShowPwdModal(null);
      setNewPwd('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1300px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} color="#0D47A1" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1A2332' }}>Utilisateurs</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#546E7A' }}>{users.length} compte(s) dans l'établissement</p>
          </div>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '8px', background: '#0D47A1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
          <Plus size={15} />
          Nouvel utilisateur
        </button>
      </div>

      {/* Feedback */}
      {success && (
        <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '8px', color: '#2E7D32', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={15} /> {success}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '8px', color: '#C62828', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <X size={15} /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#C62828' }}><X size={13} /></button>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '13px', color: '#37474F', background: '#fff', cursor: 'pointer' }}>
          <option value="">Tous les rôles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Depuis', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0F0F0' }} />
                        <div style={{ width: 100, height: 14, background: '#F0F0F0', borderRadius: 4 }} />
                      </div>
                    </td>
                    {[120, 80, 60, 60, 80].map((w, j) => (
                      <td key={j} style={{ padding: '12px 16px' }}>
                        <div style={{ width: w, height: 14, background: '#F0F0F0', borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#90A4AE', fontSize: '13px' }}>
                    <Users size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                    {search || roleFilter ? 'Aucun résultat pour ce filtre' : 'Aucun utilisateur trouvé'}
                  </td>
                </tr>
              ) : filtered.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid #F5F7FA' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Initials firstName={u.firstName} lastName={u.lastName} color={roleColor(u.role)} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>{u.firstName} {u.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#546E7A' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: u.isActive ? '#E8F5E9' : '#FFEBEE', color: u.isActive ? '#2E7D32' : '#C62828' }}>
                      {u.isActive ? '● Actif' : '○ Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '11px', color: '#90A4AE', whiteSpace: 'nowrap' }}>
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(u)} title="Modifier" style={{ padding: '5px', borderRadius: '6px', border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Pencil size={13} color="#546E7A" />
                      </button>
                      <button onClick={() => { setShowPwdModal(u); setNewPwd(''); setError(''); }} title="Réinitialiser mot de passe" style={{ padding: '5px', borderRadius: '6px', border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Key size={13} color="#546E7A" />
                      </button>
                      <button onClick={() => handleToggle(u)} title={u.isActive ? 'Désactiver' : 'Activer'} style={{ padding: '5px', borderRadius: '6px', border: `1px solid ${u.isActive ? '#FFCDD2' : '#A5D6A7'}`, background: u.isActive ? '#FFEBEE' : '#E8F5E9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {u.isActive ? <UserX size={13} color="#C62828" /> : <UserCheck size={13} color="#2E7D32" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal création / modification */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A2332' }}>
                {editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: '#F5F7FA', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            {error && <div style={{ marginBottom: '14px', padding: '8px 12px', background: '#FFEBEE', borderRadius: '6px', color: '#C62828', fontSize: '12px' }}>{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#546E7A', display: 'block', marginBottom: '4px' }}>Prénom *</label>
                  <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #E0E0E0', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#546E7A', display: 'block', marginBottom: '4px' }}>Nom *</label>
                  <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #E0E0E0', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>
              {!editUser && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#546E7A', display: 'block', marginBottom: '4px' }}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #E0E0E0', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              )}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#546E7A', display: 'block', marginBottom: '4px' }}>Rôle *</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #E0E0E0', fontSize: '13px', background: '#fff' }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {!editUser && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#546E7A', display: 'block', marginBottom: '4px' }}>Mot de passe *</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 8 caractères" style={{ width: '100%', padding: '8px 36px 8px 10px', borderRadius: '7px', border: '1px solid #E0E0E0', fontSize: '13px', boxSizing: 'border-box' }} />
                    <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#90A4AE' }}>
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '7px', border: '1px solid #E0E0E0', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#546E7A' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: '7px', border: 'none', background: '#0D47A1', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {saving ? 'Enregistrement…' : editUser ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal reset password */}
      {showPwdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1A2332' }}>Réinitialiser le mot de passe</h2>
              <button onClick={() => setShowPwdModal(null)} style={{ border: 'none', background: '#F5F7FA', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={15} /></button>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#546E7A' }}>
              Nouveau mot de passe pour <strong>{showPwdModal.firstName} {showPwdModal.lastName}</strong>
            </p>
            {error && <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#FFEBEE', borderRadius: '6px', color: '#C62828', fontSize: '12px' }}>{error}</div>}
            <div style={{ position: 'relative' }}>
              <input type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 caractères" style={{ width: '100%', padding: '8px 36px 8px 10px', borderRadius: '7px', border: '1px solid #E0E0E0', fontSize: '13px', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setShowNewPwd(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#90A4AE' }}>
                {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPwdModal(null)} style={{ padding: '7px 14px', borderRadius: '7px', border: '1px solid #E0E0E0', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#546E7A' }}>Annuler</button>
              <button onClick={handleResetPwd} disabled={saving} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', background: '#C62828', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {saving ? '…' : 'Réinitialiser'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
