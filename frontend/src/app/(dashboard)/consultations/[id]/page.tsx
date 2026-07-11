'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Stethoscope, Activity, Thermometer, Heart,
  Weight, Ruler, Wind, Pill, FlaskConical, CreditCard, Check, Plus,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const MOCK_CONSULTATION = {
  id: 'c001',
  numero: 'CONS-2024-001',
  patient: { id: 'p1', nom: 'Kouassi Ama Bernadette', ipp: 'IPP-00142', age: 42, groupeSanguin: 'A+', allergies: 'Pénicilline' },
  medecin: { nom: 'Koffi Ange', specialite: 'Médecine générale' },
  dateHeure: '2024-06-15T09:30',
  motif: 'Céphalées persistantes depuis 3 jours, résistantes aux antalgiques habituels.',
  anamnese: 'Patiente de 42 ans consultant pour des céphalées frontales intenses débutées il y a 3 jours. Douleur pulsatile 7/10, aggravée par la lumière et les bruits. Nausées associées. Pas de vomissements. Antécédents de migraines depuis l\'adolescence.',
  examenClinique: 'État général conservé. PA : 128/82 mmHg. FC : 76 bpm. Temp : 37.1°C. Examen neurologique : absence de raideur de nuque, signe de Kernig négatif. Fond d\'œil normal. Pas de déficit focal.',
  diagnostic: 'Migraine sans aura (G43.0)',
  codeCIM10: 'G43.0',
  conclusion: 'Migraine sans aura typique. Bonne réponse au Triptan lors des crises antérieures. Recommandation d\'un traitement de fond devant la fréquence des crises.',
  planSoins: '1. Sumatriptan 50mg en cas de crise\n2. Ibuprofène 400mg si crise légère\n3. Eviter les facteurs déclenchants (stress, manque de sommeil)\n4. RDV neurologie pour envisager un traitement de fond',
  constantesVitales: { ta: '128/82', fc: 76, temperature: 37.1, poids: 64, taille: 162, spo2: 98 },
  statut: 'terminee' as const,
  ordonnances: [
    { id: 'o1', numero: 'ORD-2024-0142', statut: 'active' as const, lignes: ['Sumatriptan 50mg — 1 cp si crise, max 2/j', 'Ibuprofène 400mg — 1 cp x3/j si crise légère'] },
  ],
  demandesAnalyses: ['NFS complète', 'VS - CRP'],
};

const CONSTANTES_META = [
  { key: 'ta', label: 'Tension artérielle', unit: 'mmHg', icon: <Activity size={18} />, color: 'text-red-600 bg-red-50 border-red-200' },
  { key: 'fc', label: 'Fréquence cardiaque', unit: 'bpm', icon: <Heart size={18} />, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { key: 'temperature', label: 'Température', unit: '°C', icon: <Thermometer size={18} />, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { key: 'poids', label: 'Poids', unit: 'kg', icon: <Weight size={18} />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { key: 'taille', label: 'Taille', unit: 'cm', icon: <Ruler size={18} />, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { key: 'spo2', label: 'SpO₂', unit: '%', icon: <Wind size={18} />, color: 'text-teal-600 bg-teal-50 border-teal-200' },
];

export default function ConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const c = MOCK_CONSULTATION;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-3 transition-colors"
        >
          <ArrowLeft size={16} /> Retour aux consultations
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary">{c.numero}</h1>
              <Badge variant={c.statut === 'terminee' ? 'success' : c.statut === 'en_cours' ? 'info' : 'neutral'} dot>
                {c.statut === 'en_cours' ? 'En cours' : c.statut === 'terminee' ? 'Terminée' : 'Facturée'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary flex-wrap">
              <span className="flex items-center gap-1"><User size={14} /> {c.patient.nom}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Stethoscope size={14} /> Dr. {c.medecin.nom}</span>
              <span>•</span>
              <span>{new Date(c.dateHeure).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
              <span>à {new Date(c.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {c.statut === 'en_cours' && (
              <Button leftIcon={<Check size={16} />}>Terminer la consultation</Button>
            )}
            {c.statut === 'terminee' && (
              <Button variant="secondary" leftIcon={<CreditCard size={16} />}>Facturer</Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Constantes vitales */}
        <section>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Constantes vitales</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {CONSTANTES_META.map(({ key, label, unit, icon, color }) => {
              const val = (c.constantesVitales as any)[key];
              return (
                <div key={key} className={`rounded-lg border p-3 text-center ${color}`}>
                  <div className="flex justify-center mb-1">{icon}</div>
                  <p className="text-lg font-bold">{val ?? '—'}</p>
                  <p className="text-[10px] font-medium opacity-70">{unit}</p>
                  <p className="text-[10px] mt-0.5 font-medium leading-tight">{label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Motif & Anamnèse */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section className="bg-white rounded-card border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-2">Motif de consultation</h2>
            <p className="text-sm text-text-primary leading-relaxed">{c.motif}</p>
          </section>
          <section className="bg-white rounded-card border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-2">Anamnèse</h2>
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{c.anamnese}</p>
          </section>
        </div>

        {/* Examen clinique */}
        <section className="bg-white rounded-card border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Examen clinique</h2>
          <p className="text-sm text-text-primary leading-relaxed">{c.examenClinique}</p>
        </section>

        {/* Diagnostic */}
        <section className="bg-white rounded-card border border-border p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-2">Diagnostic</h2>
              <p className="text-base font-bold text-primary">{c.diagnostic}</p>
              {c.codeCIM10 && <p className="text-xs text-text-secondary mt-1">Code CIM-10 : {c.codeCIM10}</p>}
            </div>
          </div>
          {c.conclusion && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-1">Conclusion</h3>
              <p className="text-sm text-text-primary leading-relaxed">{c.conclusion}</p>
            </div>
          )}
        </section>

        {/* Plan de soins */}
        <section className="bg-white rounded-card border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Plan de soins</h2>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{c.planSoins}</p>
        </section>

        {/* Ordonnances */}
        <section className="bg-white rounded-card border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Pill size={16} className="text-green-600" /> Ordonnances
            </h2>
            <Button size="sm" variant="secondary" leftIcon={<Plus size={14} />}>
              Nouvelle ordonnance
            </Button>
          </div>
          {c.ordonnances.length > 0 ? (
            <div className="space-y-3">
              {c.ordonnances.map(o => (
                <div key={o.id} className="border border-green-100 bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{o.numero}</span>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <ul className="space-y-1">
                    {o.lignes.map((l, i) => (
                      <li key={i} className="text-xs flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-green-200 text-green-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Aucune ordonnance émise.</p>
          )}
        </section>

        {/* Demandes analyses */}
        <section className="bg-white rounded-card border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <FlaskConical size={16} className="text-purple-600" /> Demandes d'analyses
            </h2>
            <Button size="sm" variant="secondary" leftIcon={<Plus size={14} />}>
              Demander des analyses
            </Button>
          </div>
          {c.demandesAnalyses.length > 0 ? (
            <ul className="flex gap-2 flex-wrap">
              {c.demandesAnalyses.map(a => (
                <li key={a}>
                  <Badge variant="info">{a}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">Aucune analyse demandée.</p>
          )}
        </section>
      </div>
    </div>
  );
}
