'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';
import NouveauRdvModal from '@/components/rendez-vous/NouveauRdvModal';

// ─── Types & Helpers ────────────────────────────────────────
type StatutRdv = 'planifie' | 'confirme' | 'annule' | 'absent' | 'honore';

const STATUT_COLORS: Record<StatutRdv, { bg: string; text: string; border: string; label: string }> = {
  planifie: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: 'Planifié' },
  confirme: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', label: 'Confirmé' },
  annule: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', label: 'Annulé' },
  absent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'Absent' },
  honore: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: 'Honoré' },
};

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Créneaux 7h-19h, 30min
const CRENEAUX = Array.from({ length: 25 }, (_, i) => {
  const totalMin = 7 * 60 + i * 30;
  const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const m = (totalMin % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
});

// Mock RDVs
const MOCK_RDVS = [
  { id: 'r1', patient: 'Kouassi Ama', motif: 'Suivi HTA', medecin: 'm1', jour: 0, heure: '08:00', duree: 30, statut: 'confirme' as StatutRdv },
  { id: 'r2', patient: 'Traoré Moussa', motif: 'Douleurs thoraciques', medecin: 'm2', jour: 0, heure: '09:00', duree: 60, statut: 'planifie' as StatutRdv },
  { id: 'r3', patient: 'N\'Guessan Brice', motif: 'Consultation initiale', medecin: 'm1', jour: 1, heure: '10:00', duree: 45, statut: 'honore' as StatutRdv },
  { id: 'r4', patient: 'Ouédraogo Fatoumata', motif: 'Résultats analyses', medecin: 'm3', jour: 2, heure: '14:00', duree: 30, statut: 'annule' as StatutRdv },
  { id: 'r5', patient: 'Bamba Ibrahima', motif: 'Fièvre persistante', medecin: 'm2', jour: 3, heure: '08:30', duree: 30, statut: 'planifie' as StatutRdv },
  { id: 'r6', patient: 'Koné Aïcha', motif: 'Suivi grossesse', medecin: 'm1', jour: 4, heure: '11:00', duree: 60, statut: 'confirme' as StatutRdv },
  { id: 'r7', patient: 'Diabaté Paul', motif: 'Contrôle glycémie', medecin: 'm3', jour: 1, heure: '15:00', duree: 30, statut: 'absent' as StatutRdv },
];

const MEDECINS = [
  { id: 'tous', label: 'Tous les médecins' },
  { id: 'm1', label: 'Dr. Koffi Ange' },
  { id: 'm2', label: 'Dr. Diallo Mariam' },
  { id: 'm3', label: 'Dr. Soro Jean' },
];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function heureToMinutes(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

function CRENEAU_INDEX(heure: string): number {
  return CRENEAUX.indexOf(heure);
}

function DUREE_SLOTS(duree: number): number {
  return Math.ceil(duree / 30);
}

// ─── Main Page ─────────────────────────────────────────────
export default function RendezVousPage() {
  const [currentWeek, setCurrentWeek] = useState(() => getWeekStart(new Date()));
  const [medecinFilter, setMedecinFilter] = useState('tous');
  const [showModal, setShowModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ jour: number; heure: string } | null>(null);

  const weekDays = JOURS.map((label, i) => ({
    label,
    date: addDays(currentWeek, i),
  }));

  const filteredRdvs = medecinFilter === 'tous'
    ? MOCK_RDVS
    : MOCK_RDVS.filter(r => r.medecin === medecinFilter);

  // Build a map: jour -> heure -> rdv
  const rdvMap: Record<number, Record<string, typeof MOCK_RDVS[0]>> = {};
  filteredRdvs.forEach(r => {
    if (!rdvMap[r.jour]) rdvMap[r.jour] = {};
    rdvMap[r.jour][r.heure] = r;
  });

  // Slots occupés par un rdv multi-créneaux
  const occupiedSlots = new Set<string>();
  filteredRdvs.forEach(r => {
    const startIdx = CRENEAU_INDEX(r.heure);
    const slots = DUREE_SLOTS(r.duree);
    for (let s = 1; s < slots; s++) {
      const slotHeure = CRENEAUX[startIdx + s];
      if (slotHeure) occupiedSlots.add(`${r.jour}-${slotHeure}`);
    }
  });

  const prevWeek = () => setCurrentWeek(d => addDays(d, -7));
  const nextWeek = () => setCurrentWeek(d => addDays(d, 7));
  const todayWeek = () => setCurrentWeek(getWeekStart(new Date()));

  const weekLabel = `${weekDays[0].date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} — ${weekDays[6].date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      {/* Topbar */}
      <div className="bg-white border-b border-border px-5 py-3 flex items-center gap-4 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-1.5 rounded hover:bg-gray-100 text-text-secondary transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={todayWeek}
            className="px-3 py-1 text-xs font-medium border border-border rounded hover:bg-gray-50 transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={nextWeek}
            className="p-1.5 rounded hover:bg-gray-100 text-text-secondary transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <span className="text-sm font-semibold text-text-primary ml-2">{weekLabel}</span>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <select
            className="border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={medecinFilter}
            onChange={e => setMedecinFilter(e.target.value)}
          >
            {MEDECINS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>

          {/* Légende */}
          <div className="flex items-center gap-2 text-xs">
            {Object.entries(STATUT_COLORS).map(([k, v]) => (
              <span key={k} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${v.bg} ${v.text} ${v.border}`}>
                {v.label}
              </span>
            ))}
          </div>

          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowModal(true)}>
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Agenda Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[900px]">
          {/* Header jours */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-white sticky top-0 z-10">
            <div className="h-12 border-r border-border" />
            {weekDays.map((wd, i) => {
              const isToday = wd.date.getTime() === today.getTime();
              return (
                <div
                  key={i}
                  className={`h-12 flex flex-col items-center justify-center border-r border-border text-sm ${
                    isToday ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className={`font-semibold ${isToday ? 'text-primary' : 'text-text-secondary'}`}>
                    {wd.label}
                  </span>
                  <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-text-secondary'}`}>
                    {wd.date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Créneaux */}
          {CRENEAUX.map((heure, hi) => (
            <div key={heure} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50">
              {/* Label heure */}
              <div className="border-r border-border h-14 flex items-start justify-end pr-2 pt-1">
                {heure.endsWith(':00') && (
                  <span className="text-[10px] text-text-secondary font-medium">{heure}</span>
                )}
              </div>

              {/* Cellules par jour */}
              {weekDays.map((wd, di) => {
                const rdv = rdvMap[di]?.[heure];
                const isOccupied = occupiedSlots.has(`${di}-${heure}`);
                const isToday = wd.date.getTime() === today.getTime();

                if (isOccupied) return <div key={di} className={`border-r border-border/50 h-14 ${isToday ? 'bg-primary/5' : ''}`} />;

                return (
                  <div
                    key={di}
                    className={`border-r border-border/50 h-14 relative group cursor-pointer ${
                      isToday ? 'bg-primary/5' : 'hover:bg-gray-50'
                    } transition-colors`}
                    onClick={() => { setSelectedCell({ jour: di, heure }); setShowModal(true); }}
                  >
                    {rdv && (() => {
                      const colors = STATUT_COLORS[rdv.statut];
                      const slots = DUREE_SLOTS(rdv.duree);
                      return (
                        <div
                          className={`absolute inset-x-0.5 top-0.5 rounded border text-xs p-1 overflow-hidden cursor-pointer z-10 ${colors.bg} ${colors.text} ${colors.border}`}
                          style={{ height: `${slots * 56 - 4}px` }}
                          onClick={e => { e.stopPropagation(); }}
                        >
                          <p className="font-semibold truncate leading-tight">{rdv.patient}</p>
                          <p className="truncate opacity-80">{rdv.motif}</p>
                          <p className="text-[10px] opacity-60 mt-0.5">{rdv.heure} • {rdv.duree}min</p>
                        </div>
                      );
                    })()}
                    {!rdv && (
                      <div className="hidden group-hover:flex items-center justify-center h-full">
                        <Plus size={14} className="text-primary opacity-50" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <NouveauRdvModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedCell(null); }}
        defaultDate={selectedCell ? weekDays[selectedCell.jour]?.date.toISOString().split('T')[0] : ''}
        onSave={(data) => { console.log('Nouveau RDV:', data); }}
      />
    </div>
  );
}
