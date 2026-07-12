import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Medicament } from '../pharmacie/entities/medicament.entity';

export interface SearchResult {
  type: 'patient' | 'medicament' | 'facture' | 'consultation';
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Medicament) private readonly medicamentRepo: Repository<Medicament>,
  ) {}

  async search(q: string, tenantId: string): Promise<{ results: SearchResult[]; total: number }> {
    if (!q || q.length < 2) return { results: [], total: 0 };

    const term = `%${q}%`;
    const LIMIT = 5;

    const [patients, medicaments] = await Promise.all([
      this.patientRepo.find({
        where: [
          { tenantId, nom: ILike(term) },
          { tenantId, prenom: ILike(term) },
          { tenantId, ipp: ILike(term) },
          { tenantId, telephone: ILike(term) },
        ],
        take: LIMIT,
        order: { nom: 'ASC' },
      }),
      this.medicamentRepo.find({
        where: [
          { tenantId, nom: ILike(term) },
          { tenantId, code: ILike(term) },
          { tenantId, dci: ILike(term) },
        ],
        take: LIMIT,
        order: { nom: 'ASC' },
      }),
    ]);

    // Recherche raw pour factures et consultations (pas d'entités TypeORM dans ce module)
    const manager = this.patientRepo.manager;
    const factures = await manager.query(
      `SELECT id, numero, "createdAt" FROM factures
       WHERE "tenantId" = $1 AND numero ILIKE $2 LIMIT $3`,
      [tenantId, term, LIMIT],
    ).catch(() => []);

    const consultations = await manager.query(
      `SELECT id, numero, motif, "dateConsultation" FROM consultations
       WHERE "tenantId" = $1 AND (numero ILIKE $2 OR motif ILIKE $2) LIMIT $3`,
      [tenantId, term, LIMIT],
    ).catch(() => []);

    const results: SearchResult[] = [
      ...patients.map((p) => ({
        type: 'patient' as const,
        id: p.id,
        label: `${p.nom} ${p.prenom}`,
        sublabel: `IPP: ${p.ipp} · ${p.telephone ?? ''}`,
        href: `/dme/${p.id}`,
      })),
      ...medicaments.map((m) => ({
        type: 'medicament' as const,
        id: m.id,
        label: m.nom,
        sublabel: `${m.forme} · ${m.dosage} · Stock: ${m.stockActuel}`,
        href: `/pharmacie/medicaments`,
      })),
      ...factures.map((f: any) => ({
        type: 'facture' as const,
        id: f.id,
        label: `Facture ${f.numero}`,
        sublabel: new Date(f.createdAt).toLocaleDateString('fr-FR'),
        href: `/facturation/${f.id}`,
      })),
      ...consultations.map((c: any) => ({
        type: 'consultation' as const,
        id: c.id,
        label: `Consultation ${c.numero}`,
        sublabel: c.motif ?? '',
        href: `/consultations/${c.id}`,
      })),
    ];

    return { results, total: results.length };
  }
}
