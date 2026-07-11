'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  FlaskConical,
  Pill,
  CreditCard,
  Package,
  BarChart2,
  Settings,
  UserCog,
  LayoutGrid,
  ClipboardList,
  LogOut,
  UserPlus,
  Siren,
  BedDouble,
} from 'lucide-react';
import clsx from 'clsx';

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface SidebarModule {
  id: string;
  label: string;
  items: SidebarItem[];
}

const moduleMap: Record<string, SidebarModule> = {
  patients: {
    id: 'patients',
    label: 'Gestion Patients',
    items: [
      { label: 'Liste des patients', href: '/patients', icon: <Users size={18} /> },
      { label: 'Nouveau patient', href: '/patients/nouveau', icon: <Users size={18} /> },
      { label: 'Recherche avancée', href: '/patients/recherche', icon: <Users size={18} /> },
    ],
  },
  consultations: {
    id: 'consultations',
    label: 'Consultations',
    items: [
      { label: 'Agenda', href: '/consultations/agenda', icon: <Calendar size={18} /> },
      { label: 'Consultations du jour', href: '/consultations', icon: <Stethoscope size={18} /> },
      { label: 'Ordonnances', href: '/consultations/ordonnances', icon: <Pill size={18} /> },
    ],
  },
  pharmacie: {
    id: 'pharmacie',
    label: 'Pharmacie',
    items: [
      { label: 'Stock médicaments', href: '/pharmacie/stock', icon: <Package size={18} /> },
      { label: 'Ventes', href: '/pharmacie/ventes', icon: <CreditCard size={18} /> },
      { label: 'Commandes', href: '/pharmacie/commandes', icon: <Package size={18} /> },
    ],
  },
  laboratoire: {
    id: 'laboratoire',
    label: 'Laboratoire',
    items: [
      { label: 'Demandes analyses', href: '/laboratoire', icon: <FlaskConical size={18} /> },
      { label: 'Résultats', href: '/laboratoire/resultats', icon: <FlaskConical size={18} /> },
    ],
  },
  caisse: {
    id: 'caisse',
    label: 'Caisse & Facturation',
    items: [
      { label: 'Caisse du jour', href: '/caisse', icon: <CreditCard size={18} /> },
      { label: 'Factures', href: '/caisse/factures', icon: <CreditCard size={18} /> },
      { label: 'Paiements', href: '/caisse/paiements', icon: <CreditCard size={18} /> },
      { label: 'Remboursements', href: '/caisse/remboursements', icon: <CreditCard size={18} /> },
    ],
  },
  facturation: {
    id: 'facturation',
    label: 'Facturation',
    items: [
      { label: 'Toutes les factures', href: '/caisse/factures', icon: <CreditCard size={18} /> },
      { label: 'Impayées', href: '/caisse/factures?statut=impaye', icon: <CreditCard size={18} /> },
      { label: 'Tiers-payant', href: '/caisse/tiers-payant', icon: <CreditCard size={18} /> },
    ],
  },
  rh: {
    id: 'rh',
    label: 'Ressources Humaines',
    items: [
      { label: 'Personnel', href: '/rh/personnel', icon: <UserCog size={18} /> },
      { label: 'Plannings', href: '/rh/plannings', icon: <Calendar size={18} /> },
      { label: 'Congés', href: '/rh/conges', icon: <Calendar size={18} /> },
    ],
  },
  rapports: {
    id: 'rapports',
    label: 'Rapports & BI',
    items: [
      { label: 'Tableau de bord', href: '/rapports', icon: <BarChart2 size={18} /> },
      { label: 'Activité médicale', href: '/rapports/activite', icon: <BarChart2 size={18} /> },
    ],
  },
  dme: {
    id: 'dme',
    label: 'Dossier Médical (DME)',
    items: [
      { label: 'Rechercher un patient', href: '/patients', icon: <Users size={18} /> },
      { label: 'Antécédents', href: '/dme/antecedents', icon: <Stethoscope size={18} /> },
      { label: 'Documents médicaux', href: '/dme/documents', icon: <FlaskConical size={18} /> },
    ],
  },
  'rendez-vous': {
    id: 'rendez-vous',
    label: 'Rendez-Vous',
    items: [
      { label: 'Agenda semaine', href: '/rendez-vous', icon: <Calendar size={18} /> },
      { label: 'Mes rendez-vous', href: '/rendez-vous/mes-rdv', icon: <Calendar size={18} /> },
    ],
  },
  urgences: {
    id: 'urgences',
    label: '🚨 Urgences',
    items: [
      { label: 'Tableau de bord', href: '/urgences', icon: <LayoutDashboard size={18} /> },
      { label: 'Admettre un patient', href: '/urgences', icon: <UserPlus size={18} /> },
      { label: 'Statistiques', href: '/urgences/stats', icon: <BarChart2 size={18} /> },
    ],
  },
  hospitalisation: {
    id: 'hospitalisation',
    label: '🛏️ Hospitalisation',
    items: [
      { label: 'Plan des lits', href: '/hospitalisation', icon: <LayoutGrid size={18} /> },
      { label: 'Séjours actifs', href: '/hospitalisation', icon: <ClipboardList size={18} /> },
      { label: 'Admissions', href: '/hospitalisation', icon: <UserPlus size={18} /> },
      { label: 'Sorties du jour', href: '/hospitalisation', icon: <LogOut size={18} /> },
    ],
  },
};

interface SidebarProps {
  module?: string;
}

export default function Sidebar({ module }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const currentModule = module ? moduleMap[module] : null;

  if (!currentModule) return null;

  return (
    <aside
      className={clsx(
        'fixed left-0 top-16 bottom-0 z-30 bg-white border-r border-border flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-[260px]'
      )}
    >
      {/* Module title + back button */}
      <div
        className={clsx(
          'flex items-center border-b border-border',
          collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3 justify-between'
        )}
      >
        {!collapsed && (
          <div>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors mb-1"
            >
              <ChevronLeft size={14} />
              Dashboard
            </Link>
            <p className="text-sm font-semibold text-text-primary">{currentModule.label}</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded hover:bg-gray-100 text-text-secondary transition-colors flex-shrink-0"
          aria-label={collapsed ? 'Développer' : 'Réduire'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="flex flex-col gap-0.5 px-2">
          {currentModule.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-blue-50 text-primary font-semibold'
                      : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                  )}
                >
                  <span
                    className={clsx(
                      'flex-shrink-0',
                      isActive ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'
                    )}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-danger text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom settings link */}
      {!collapsed && (
        <div className="border-t border-border p-3">
          <Link
            href="/parametres"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors"
          >
            <Settings size={16} />
            Paramètres du module
          </Link>
        </div>
      )}
    </aside>
  );
}
