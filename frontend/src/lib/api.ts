import type { LoginCredentials, LoginResponse, ApiResponse, PaginatedResponse, Patient } from '@/types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://santarex.ibigsoft.com/api/v1';
const API_BASE = API_URL;

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || 'Erreur réseau';
    throw new Error(msg);
  }

  // Unwrap backend envelope { success, data }
  return (json?.data !== undefined ? json.data : json) as T;
}

export const api = {
  // Auth
  login: (data: LoginCredentials) =>
    fetchApi<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => fetchApi<ApiResponse<{ user: import('@/types').User }>>('/auth/me'),
  logout: () =>
    fetchApi('/auth/logout', { method: 'POST' }),

  // Patients
  getPatients: (params?: { page?: number; limit?: number; q?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetchApi<ApiResponse<PaginatedResponse<Patient>>>(`/patients${qs ? '?' + qs : ''}`);
  },
  searchPatients: (q: string) =>
    fetchApi<ApiResponse<Patient[]>>(`/patients/search?q=${encodeURIComponent(q)}`),
  getPatient: (id: string) =>
    fetchApi<ApiResponse<Patient>>(`/patients/${id}`),
  createPatient: (data: Partial<Patient>) =>
    fetchApi<ApiResponse<Patient>>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePatient: (id: string, data: Partial<Patient>) =>
    fetchApi<ApiResponse<Patient>>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePatient: (id: string) =>
    fetchApi(`/patients/${id}`, { method: 'DELETE' }),

  // Dashboard stats
  getDashboardStats: () =>
    fetchApi<ApiResponse<Record<string, unknown>>>('/dashboard/stats'),

  // DME
  getDme: (patientId: string) =>
    fetchApi(`/dme/${patientId}`),
  getAntecedents: (patientId: string) =>
    fetchApi(`/dme/${patientId}/antecedents`),
  addAntecedent: (patientId: string, data: any) =>
    fetchApi(`/dme/${patientId}/antecedents`, { method: 'POST', body: JSON.stringify(data) }),

  // Consultations
  getConsultations: (params?: any) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return fetchApi(`/consultations${qs ? '?' + qs : ''}`);
  },
  getConsultation: (id: string) =>
    fetchApi(`/consultations/${id}`),
  createConsultation: (data: any) =>
    fetchApi('/consultations', { method: 'POST', body: JSON.stringify(data) }),
  updateConsultation: (id: string, data: any) =>
    fetchApi(`/consultations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Rendez-Vous
  getRdvs: (params?: any) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return fetchApi(`/rendez-vous${qs ? '?' + qs : ''}`);
  },
  createRdv: (data: any) =>
    fetchApi('/rendez-vous', { method: 'POST', body: JSON.stringify(data) }),
  updateRdv: (id: string, data: any) =>
    fetchApi(`/rendez-vous/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getCreneauxDisponibles: (medecinId: string, date: string) =>
    fetchApi(`/rendez-vous/disponibilites?medecinId=${medecinId}&date=${date}`),

  // Pharmacie
  getMedicaments: (params?: any) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return fetchApi(`/pharmacie/medicaments${qs ? '?' + qs : ''}`);
  },
  getMedicament: (id: string) =>
    fetchApi(`/pharmacie/medicaments/${id}`),
  createMedicament: (data: any) =>
    fetchApi('/pharmacie/medicaments', { method: 'POST', body: JSON.stringify(data) }),
  entreeStock: (medicamentId: string, data: any) =>
    fetchApi(`/pharmacie/medicaments/${medicamentId}/entree-stock`, { method: 'POST', body: JSON.stringify(data) }),
  getMedicamentsRupture: () =>
    fetchApi('/pharmacie/medicaments/rupture'),
  getMouvementsStock: (params?: any) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return fetchApi(`/pharmacie/mouvements${qs ? '?' + qs : ''}`);
  },

  // Laboratoire
  getDemandesAnalyse: (params?: any) => fetchApi(`/laboratoire/demandes?${new URLSearchParams(params)}`),
  createDemandeAnalyse: (data: any) => fetchApi('/laboratoire/demandes', { method: 'POST', body: JSON.stringify(data) }),
  getDemandeAnalyse: (id: string) => fetchApi(`/laboratoire/demandes/${id}`),
  marquerPreleve: (id: string) => fetchApi(`/laboratoire/demandes/${id}/prelever`, { method: 'PATCH' }),
  saisirResultats: (id: string, data: any) => fetchApi(`/laboratoire/demandes/${id}/resultats`, { method: 'POST', body: JSON.stringify(data) }),
  validerResultats: (id: string) => fetchApi(`/laboratoire/demandes/${id}/valider`, { method: 'PATCH' }),
  getTypesAnalyse: () => fetchApi('/laboratoire/types-analyse'),

  // Facturation
  getFactures: (params?: any) => fetchApi(`/facturation?${new URLSearchParams(params)}`),
  getFacture: (id: string) => fetchApi(`/facturation/${id}`),
  createFacture: (data: any) => fetchApi('/facturation', { method: 'POST', body: JSON.stringify(data) }),
  addLigneFacture: (factureId: string, data: any) => fetchApi(`/facturation/${factureId}/lignes`, { method: 'POST', body: JSON.stringify(data) }),
  emettreFacture: (id: string) => fetchApi(`/facturation/${id}/emettre`, { method: 'PATCH' }),
  getStatsFacturation: () => fetchApi('/facturation/stats'),

  // Paiements
  createPaiement: (data: any) => fetchApi('/paiements', { method: 'POST', body: JSON.stringify(data) }),
  getStatsCaisse: (date?: string) => fetchApi(`/paiements/stats-caisse${date ? '?date=' + date : ''}`),
  getPaiements: (params?: any) => fetchApi(`/paiements?${new URLSearchParams(params)}`),

  // Urgences
  getUrgencesActives: () => fetchApi('/urgences/actifs'),
  admettreUrgence: (data: any) => fetchApi('/urgences/admettre', { method: 'POST', body: JSON.stringify(data) }),
  mettreAJourTriage: (id: string, data: any) => fetchApi(`/urgences/${id}/triage`, { method: 'PATCH', body: JSON.stringify(data) }),
  sortirUrgence: (id: string, data: any) => fetchApi(`/urgences/${id}/sortir`, { method: 'PATCH', body: JSON.stringify(data) }),
  getStatsUrgences: () => fetchApi('/urgences/stats'),

  // Hospitalisation
  getLitsHospitaliers: (service?: string) => {
    const qs = service ? `?service=${encodeURIComponent(service)}` : '';
    return fetchApi(`/hospitalisation/lits${qs}`);
  },
  getSejours: (params?: any) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return fetchApi(`/hospitalisation/sejours${qs ? '?' + qs : ''}`);
  },
  getSejour: (id: string) => fetchApi(`/hospitalisation/sejours/${id}`),
  admettreHospitalisation: (data: any) =>
    fetchApi('/hospitalisation/admettre', { method: 'POST', body: JSON.stringify(data) }),
  ajouterNoteMedicale: (sejourId: string, data: any) =>
    fetchApi(`/hospitalisation/sejours/${sejourId}/notes`, { method: 'POST', body: JSON.stringify(data) }),
  ajouterPrescription: (sejourId: string, data: any) =>
    fetchApi(`/hospitalisation/sejours/${sejourId}/prescriptions`, { method: 'POST', body: JSON.stringify(data) }),
  updateSoinInfirmier: (sejourId: string, soinId: string, data: any) =>
    fetchApi(`/hospitalisation/sejours/${sejourId}/soins/${soinId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  sortirPatientHospitalise: (sejourId: string, data: any) =>
    fetchApi(`/hospitalisation/sejours/${sejourId}/sortir`, { method: 'PATCH', body: JSON.stringify(data) }),
  getStatsHospitalisation: () => fetchApi('/hospitalisation/stats'),

  // ── SuperAdmin ──────────────────────────────────────────
  superadmin: {
    getDashboard: () => fetchApi<any>('/superadmin/dashboard'),

    // Tenants
    getTenants: (params?: { page?: number; limit?: number }) => {
      const qs = params ? new URLSearchParams(params as any).toString() : '';
      return fetchApi<any>(`/superadmin/tenants${qs ? '?' + qs : ''}`);
    },
    getTenant: (id: string) => fetchApi<any>(`/superadmin/tenants/${id}`),
    createTenant: (data: any) =>
      fetchApi<any>('/superadmin/tenants', { method: 'POST', body: JSON.stringify(data) }),
    updateTenant: (id: string, data: any) =>
      fetchApi<any>(`/superadmin/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    suspendreTenant: (id: string) =>
      fetchApi<any>(`/superadmin/tenants/${id}/suspendre`, { method: 'PATCH' }),
    activerTenant: (id: string) =>
      fetchApi<any>(`/superadmin/tenants/${id}/activer`, { method: 'PATCH' }),
    getTenantStats: () => fetchApi<any>('/superadmin/tenants/stats'),

    // Licences
    getLicences: (params?: { page?: number; limit?: number }) => {
      const qs = params ? new URLSearchParams(params as any).toString() : '';
      return fetchApi<any>(`/superadmin/licences${qs ? '?' + qs : ''}`);
    },
    getLicencesByTenant: (slug: string) =>
      fetchApi<any>(`/superadmin/licences/tenant/${slug}`),
    creerLicence: (data: any) =>
      fetchApi<any>('/superadmin/licences', { method: 'POST', body: JSON.stringify(data) }),
    suspendreLicence: (id: string) =>
      fetchApi<any>(`/superadmin/licences/${id}/suspendre`, { method: 'PATCH' }),
    renouvelerLicence: (id: string, mois = 1) =>
      fetchApi<any>(`/superadmin/licences/${id}/renouveler?mois=${mois}`, { method: 'PATCH' }),

    // Offres SaaS
    getOffres: () => fetchApi<any>('/offres-saas'),
    createOffre: (data: any) =>
      fetchApi<any>('/offres-saas', { method: 'POST', body: JSON.stringify(data) }),
    updateOffre: (id: string, data: any) =>
      fetchApi<any>(`/offres-saas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    // Audit logs
    getAuditLogs: (params?: { page?: number; limit?: number; tenantId?: string; action?: string }) => {
      const qs = params ? new URLSearchParams(params as any).toString() : '';
      return fetchApi<any>(`/audit-logs${qs ? '?' + qs : ''}`);
    },
  },
};

export async function apiClient<T = any>(
  endpoint: string,
  options?: { method?: string; body?: unknown },
): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: options?.method ?? 'GET',
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}
