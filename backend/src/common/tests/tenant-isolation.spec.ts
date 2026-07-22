import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { PatientsService } from '../../patients/patients.service';
import { Patient, PatientStatut } from '../../patients/entities/patient.entity';

import { FacturationService } from '../../facturation/facturation.service';
import { Facture } from '../../facturation/entities/facture.entity';
import { LigneFacture } from '../../facturation/entities/ligne-facture.entity';

import { HospitalisationService } from '../../hospitalisation/hospitalisation.service';
import { Lit } from '../../hospitalisation/entities/lit.entity';
import { Sejour, StatutSejour, TypeSortie } from '../../hospitalisation/entities/sejour.entity';
import { NoteEvolution } from '../../hospitalisation/entities/note-evolution.entity';
import { SoinInfirmier } from '../../hospitalisation/entities/soin-infirmier.entity';
import { User } from '../../users/entities/user.entity';

import {
  assertTenantScoped,
  isTenantScoped,
} from '../tenant-scope.util';

/**
 * tenant-isolation.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests d'ISOLATION MULTI-SOCIÉTÉ (multi-tenant) pour les services métier clés.
 *
 * SANTAREX est multi-tenant : chaque entité porte un `tenantId` et l'isolation
 * repose sur le filtrage `tenantId` dans chaque service. Ces tests utilisent des
 * repositories TypeORM MOCKÉS (aucune vraie DB) et encodent l'invariant :
 *
 *   (a) findOne d'une ressource du tenant A, appelé avec le tenantId B → NotFound ;
 *   (b) findAll ne renvoie QUE les ressources du tenant courant (filtre tenantId) ;
 *   (c) une mutation (update / sortie) ne s'applique JAMAIS cross-tenant.
 *
 * Le fake repository ci-dessous ne fait correspondre une ligne QUE si TOUTES les
 * clés scalaires de la clause `where` (dont `tenantId`) correspondent. Ainsi, un
 * service qui oublierait `tenantId` ferait ÉCHOUER ces tests (une ressource d'un
 * autre tenant deviendrait visible), ce qui est exactement l'objectif.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Fake repository TypeORM piloté par un "store" en mémoire
// ─────────────────────────────────────────────────────────────────────────────

type Row = Record<string, any>;

/** Vrai si toutes les clés scalaires de `where` correspondent à `row`. */
function matches(row: Row, where: Row): boolean {
  return Object.keys(where).every((key) => {
    const expected = where[key];
    // On ignore les opérateurs/objets complexes (Between, In, ...) : les tests
    // ci-dessous n'en seedent pas et se concentrent sur id/tenantId/statut.
    if (expected !== null && typeof expected === 'object') return true;
    return row[key] === expected;
  });
}

/**
 * Crée un mock de Repository<T> adossé à un tableau de lignes partagé.
 * Implémente le sous-ensemble utilisé par les services testés.
 */
function makeRepo(store: Row[]) {
  const repo = {
    __store: store,

    findOne: jest.fn(async ({ where }: { where: Row }) => {
      const found = store.find((r) => matches(r, where));
      return found ?? null;
    }),

    find: jest.fn(async (opts: { where?: Row } = {}) => {
      const where = opts.where ?? {};
      return store.filter((r) => matches(r, where));
    }),

    findAndCount: jest.fn(async (opts: { where?: Row } = {}) => {
      const where = opts.where ?? {};
      const data = store.filter((r) => matches(r, where));
      return [data, data.length] as [Row[], number];
    }),

    count: jest.fn(async (opts: { where?: Row } = {}) => {
      const where = opts.where ?? {};
      return store.filter((r) => matches(r, where)).length;
    }),

    create: jest.fn((x: Row) => ({ ...x })),

    save: jest.fn(async (entity: Row) => {
      const idx = store.findIndex((r) => r.id === entity.id);
      if (idx >= 0) {
        store[idx] = { ...store[idx], ...entity };
        return store[idx];
      }
      store.push(entity);
      return entity;
    }),

    update: jest.fn(async (id: string, patch: Row) => {
      const idx = store.findIndex((r) => r.id === id);
      if (idx >= 0) store[idx] = { ...store[idx], ...patch };
      return { affected: idx >= 0 ? 1 : 0 };
    }),
  };
  return repo;
}

const TENANT_A = 'clinique-a';
const TENANT_B = 'clinique-b';

// ─────────────────────────────────────────────────────────────────────────────
// PatientsService
// ─────────────────────────────────────────────────────────────────────────────

describe('Isolation multi-tenant — PatientsService', () => {
  let service: PatientsService;
  let store: Row[];
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    store = [
      { id: 'pat-a', tenantId: TENANT_A, nom: 'Kouassi', prenom: 'Awa', statut: PatientStatut.ACTIF },
      { id: 'pat-b', tenantId: TENANT_B, nom: 'Traore', prenom: 'Sekou', statut: PatientStatut.ACTIF },
    ];
    repo = makeRepo(store);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(Patient), useValue: repo },
      ],
    }).compile();

    service = module.get(PatientsService);
  });

  it('(a) findOne : accéder à un patient du tenant A avec le tenantId B → NotFound', async () => {
    await expect(service.findOne('pat-a', TENANT_B)).rejects.toBeInstanceOf(NotFoundException);
    // Le service DOIT avoir passé tenantId dans la clause where.
    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'pat-a', tenantId: TENANT_B }) }),
    );
  });

  it('(a bis) findOne : le même patient est bien accessible depuis SON tenant', async () => {
    const patient = await service.findOne('pat-a', TENANT_A);
    expect(patient.id).toBe('pat-a');
    expect(patient.tenantId).toBe(TENANT_A);
  });

  it('(b) findAll : ne renvoie que les patients du tenant courant', async () => {
    const resA = await service.findAll(TENANT_A, { page: 1, limit: 20 });
    expect(resA.data.map((p) => p.id)).toEqual(['pat-a']);
    expect(resA.total).toBe(1);

    const resB = await service.findAll(TENANT_B, { page: 1, limit: 20 });
    expect(resB.data.map((p) => p.id)).toEqual(['pat-b']);

    // Le filtre a bien inclus tenantId.
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT_A }) }),
    );
  });

  it('(c) update : impossible de modifier un patient d’un autre tenant (NotFound + aucune mutation)', async () => {
    await expect(
      service.update('pat-a', { nom: 'PIRATÉ' } as any, TENANT_B),
    ).rejects.toBeInstanceOf(NotFoundException);

    // La ligne du tenant A est intacte.
    expect(store.find((r) => r.id === 'pat-a')!.nom).toBe('Kouassi');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('(c bis) softDelete : impossible de désactiver un patient d’un autre tenant', async () => {
    await expect(service.softDelete('pat-a', TENANT_B)).rejects.toBeInstanceOf(NotFoundException);
    expect(store.find((r) => r.id === 'pat-a')!.statut).toBe(PatientStatut.ACTIF);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FacturationService
// ─────────────────────────────────────────────────────────────────────────────

describe('Isolation multi-tenant — FacturationService', () => {
  let service: FacturationService;
  let store: Row[];
  let factureRepo: ReturnType<typeof makeRepo>;
  let ligneRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    store = [
      { id: 'fac-a', tenantId: TENANT_A, numero: 'FAC-2026-00001', statut: 'brouillon', lignes: [], montantTTC: 1000, montantPaye: 0, partAssurance: 0, tauxTVA: 0 },
      { id: 'fac-b', tenantId: TENANT_B, numero: 'FAC-2026-00001', statut: 'brouillon', lignes: [], montantTTC: 2000, montantPaye: 0, partAssurance: 0, tauxTVA: 0 },
    ];
    factureRepo = makeRepo(store);
    ligneRepo = makeRepo([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacturationService,
        { provide: getRepositoryToken(Facture), useValue: factureRepo },
        { provide: getRepositoryToken(LigneFacture), useValue: ligneRepo },
      ],
    }).compile();

    service = module.get(FacturationService);
  });

  it('(a) findOne : facture du tenant A inaccessible depuis le tenant B → NotFound', async () => {
    await expect(service.findOne('fac-a', TENANT_B)).rejects.toBeInstanceOf(NotFoundException);
    expect(factureRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'fac-a', tenantId: TENANT_B }) }),
    );
  });

  it('(a bis) findOne : accessible depuis son propre tenant', async () => {
    const f = await service.findOne('fac-a', TENANT_A);
    expect(f.id).toBe('fac-a');
  });

  it('(c) update : impossible de modifier une facture d’un autre tenant (NotFound, aucune écriture)', async () => {
    await expect(
      service.update('fac-a', { notes: 'PIRATÉ' } as any, TENANT_B),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(factureRepo.update).not.toHaveBeenCalled();
    expect(store.find((r) => r.id === 'fac-a')!.notes).toBeUndefined();
  });

  it('(c bis) emettre : impossible d’émettre une facture d’un autre tenant', async () => {
    await expect(service.emettre('fac-a', TENANT_B)).rejects.toBeInstanceOf(NotFoundException);
    expect(store.find((r) => r.id === 'fac-a')!.statut).toBe('brouillon');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HospitalisationService
// ─────────────────────────────────────────────────────────────────────────────

describe('Isolation multi-tenant — HospitalisationService', () => {
  let service: HospitalisationService;
  let sejourStore: Row[];
  let litStore: Row[];
  let sejourRepo: ReturnType<typeof makeRepo>;
  let litRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    sejourStore = [
      { id: 'sej-a', tenantId: TENANT_A, numero: 'HSP-2026-00001', patientId: 'p1', litId: 'lit-a', statut: StatutSejour.ACTIF, dateHeureAdmission: new Date('2026-07-01T08:00:00Z') },
      { id: 'sej-b', tenantId: TENANT_B, numero: 'HSP-2026-00001', patientId: 'p2', litId: 'lit-b', statut: StatutSejour.ACTIF, dateHeureAdmission: new Date('2026-07-02T08:00:00Z') },
    ];
    litStore = [
      { id: 'lit-a', tenantId: TENANT_A, numero: 'A1', statut: 'occupe', sejourActuelId: 'sej-a' },
      { id: 'lit-b', tenantId: TENANT_B, numero: 'B1', statut: 'occupe', sejourActuelId: 'sej-b' },
    ];
    sejourRepo = makeRepo(sejourStore);
    litRepo = makeRepo(litStore);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospitalisationService,
        { provide: getRepositoryToken(Lit), useValue: litRepo },
        { provide: getRepositoryToken(Sejour), useValue: sejourRepo },
        { provide: getRepositoryToken(NoteEvolution), useValue: makeRepo([]) },
        { provide: getRepositoryToken(SoinInfirmier), useValue: makeRepo([]) },
        { provide: getRepositoryToken(Patient), useValue: makeRepo([]) },
        { provide: getRepositoryToken(User), useValue: makeRepo([]) },
      ],
    }).compile();

    service = module.get(HospitalisationService);
  });

  it('(a) findOne : séjour du tenant A inaccessible depuis le tenant B → NotFound', async () => {
    await expect(service.findOne('sej-a', TENANT_B)).rejects.toBeInstanceOf(NotFoundException);
    expect(sejourRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'sej-a', tenantId: TENANT_B }) }),
    );
  });

  it('(b) findSejoursActifs : filtre bien par tenantId', async () => {
    const actifsA = await service.findSejoursActifs(TENANT_A);
    expect(actifsA.map((s) => s.id)).toEqual(['sej-a']);

    expect(sejourRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT_A }) }),
    );
  });

  it('(c) sortirPatient : impossible de faire sortir le séjour d’un autre tenant (NotFound, séjour intact)', async () => {
    await expect(
      service.sortirPatient('sej-a', { typeSortie: TypeSortie.GUERI } as any, TENANT_B),
    ).rejects.toBeInstanceOf(NotFoundException);

    const sej = sejourStore.find((r) => r.id === 'sej-a')!;
    expect(sej.statut).toBe(StatutSejour.ACTIF);
    expect(sej.dateHeureSortie).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Garde-fou tenant-scope.util
// ─────────────────────────────────────────────────────────────────────────────

describe('Garde-fou — assertTenantScoped / isTenantScoped', () => {
  it('isTenantScoped : vrai seulement si tenantId présent et cohérent', () => {
    expect(isTenantScoped({ id: 'x', tenantId: TENANT_A }, TENANT_A)).toBe(true);
    expect(isTenantScoped({ id: 'x' }, TENANT_A)).toBe(false);
    expect(isTenantScoped({ id: 'x', tenantId: TENANT_B }, TENANT_A)).toBe(false);
    expect(isTenantScoped({ id: 'x', tenantId: TENANT_A }, undefined)).toBe(false);
  });

  it('isTenantScoped : sur un tableau OR, CHAQUE branche doit être scoppée', () => {
    expect(
      isTenantScoped([{ a: 1, tenantId: TENANT_A }, { b: 2, tenantId: TENANT_A }], TENANT_A),
    ).toBe(true);
    expect(
      isTenantScoped([{ a: 1, tenantId: TENANT_A }, { b: 2 }], TENANT_A),
    ).toBe(false);
  });

  it('assertTenantScoped : lève une Error par défaut si le tenant manque', () => {
    expect(() => assertTenantScoped({ id: 'x' }, TENANT_A)).toThrow(/non isolée|tenant/i);
  });

  it('assertTenantScoped : ne lève pas quand la clause est correctement scoppée', () => {
    expect(assertTenantScoped({ id: 'x', tenantId: TENANT_A }, TENANT_A)).toBe(true);
  });

  it('assertTenantScoped : mode "warn" journalise sans lever', () => {
    const logger = { warn: jest.fn() };
    const ok = assertTenantScoped({ id: 'x' }, TENANT_A, { mode: 'warn', logger });
    expect(ok).toBe(false);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
