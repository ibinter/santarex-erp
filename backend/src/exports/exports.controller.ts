import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Medicament } from '../pharmacie/entities/medicament.entity';

@ApiTags('Exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exports')
export class ExportsController {
  constructor(
    private readonly exportsService: ExportsService,
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Medicament) private readonly medicamentRepo: Repository<Medicament>,
  ) {}

  @Get('factures/:id/pdf')
  @ApiOperation({ summary: 'Télécharger une facture en PDF' })
  async facturePdf(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    // Import inline pour éviter la dépendance circulaire
    const { FacturationModule } = await import('../facturation/facturation.module');
    const facture = await this.patientRepo.manager
      .createQueryBuilder()
      .select('f')
      .from('factures', 'f')
      .leftJoinAndSelect('f.patient' as any, 'patient')
      .where('f.id = :id AND f.tenantId = :tenantId', { id, tenantId: user.tenantId })
      .getOne()
      .catch(() => null);

    // Fallback: requête raw
    const raw = await this.patientRepo.manager.query(
      `SELECT f.*, p.nom, p.prenom, p.ipp, p.telephone
       FROM factures f LEFT JOIN patients p ON p.id = f."patientId"
       WHERE f.id = $1 AND f."tenantId" = $2 LIMIT 1`,
      [id, user.tenantId],
    ).catch(() => []);

    const factureData = raw[0] ?? { numero: id, lignes: [] };
    const lignesRaw = await this.patientRepo.manager.query(
      `SELECT * FROM lignes_facture WHERE "factureId" = $1`,
      [id],
    ).catch(() => []);

    factureData.lignes = lignesRaw;
    if (raw[0]) {
      factureData.patient = { nom: raw[0].nom, prenom: raw[0].prenom, ipp: raw[0].ipp, telephone: raw[0].telephone };
    }

    const buf = await this.exportsService.genererPdfFacture(factureData);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-${factureData.numero ?? id}.pdf"`,
      'Content-Length': buf.length,
    });
    res.end(buf);
  }

  @Get('patients/xlsx')
  @ApiOperation({ summary: 'Exporter la liste des patients en XLSX' })
  async patientsXlsx(@CurrentUser() user: any, @Res() res: Response) {
    const patients = await this.patientRepo.find({
      where: { tenantId: user.tenantId },
      order: { nom: 'ASC' },
      take: 5000,
    });
    const buf = await this.exportsService.genererXlsxPatients(patients);
    const date = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="patients-${date}.xlsx"`,
    });
    res.end(buf);
  }

  @Get('pharmacie/stock/xlsx')
  @ApiOperation({ summary: 'Exporter le stock pharmacie en XLSX' })
  async stockXlsx(@CurrentUser() user: any, @Res() res: Response) {
    const medicaments = await this.medicamentRepo.find({
      where: { tenantId: user.tenantId },
      order: { nom: 'ASC' },
      take: 5000,
    });
    const buf = await this.exportsService.genererXlsxStock(medicaments);
    const date = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="stock-pharmacie-${date}.xlsx"`,
    });
    res.end(buf);
  }
}
