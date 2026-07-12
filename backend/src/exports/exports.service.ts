import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as ExcelJS from 'exceljs';

// Fix pdfmake fonts
(PdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;

@Injectable()
export class ExportsService {
  private readonly brandBlue = '#0D47A1';
  private readonly brandTeal = '#00838F';

  private headerStyle() {
    return { fontSize: 10, bold: true, color: '#FFFFFF', fillColor: this.brandBlue };
  }

  private buildDocDefinition(content: any[], title: string): any {
    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: { font: 'Roboto', fontSize: 10, color: '#333333' },
      header: {
        columns: [
          { text: 'SANTAREX ERP', style: { fontSize: 14, bold: true, color: this.brandBlue }, margin: [40, 15, 0, 0] },
          { text: `IBIG SOFT — ibigsoft.com`, alignment: 'right', fontSize: 8, color: '#999999', margin: [0, 20, 40, 0] },
        ],
      },
      footer: (currentPage: number, pageCount: number) => ({
        text: `${title} — Page ${currentPage} / ${pageCount} — Généré le ${new Date().toLocaleDateString('fr-FR')}`,
        alignment: 'center', fontSize: 8, color: '#999999', margin: [0, 10, 0, 0],
      }),
      content,
    };
  }

  async genererPdfFacture(facture: any): Promise<Buffer> {
    const lignes = (facture.lignes ?? []).map((l: any) => [
      { text: l.libelle ?? '', fontSize: 9 },
      { text: String(l.quantite ?? 1), alignment: 'center', fontSize: 9 },
      { text: `${(l.prixUnitaire ?? 0).toLocaleString('fr-FR')} FCFA`, alignment: 'right', fontSize: 9 },
      { text: `${l.remise ?? 0}%`, alignment: 'center', fontSize: 9 },
      { text: `${(l.total ?? 0).toLocaleString('fr-FR')} FCFA`, alignment: 'right', bold: true, fontSize: 9 },
    ]);

    const content: any[] = [
      { text: `FACTURE N° ${facture.numero}`, style: { fontSize: 18, bold: true, color: this.brandBlue }, margin: [0, 0, 0, 4] },
      { text: `Date d'émission : ${facture.dateEmission ? new Date(facture.dateEmission).toLocaleDateString('fr-FR') : '—'}`, fontSize: 9, color: '#666666', margin: [0, 0, 0, 20] },
      {
        columns: [
          {
            stack: [
              { text: 'ÉTABLISSEMENT', fontSize: 8, bold: true, color: '#999999' },
              { text: facture.nomEtablissement ?? 'Clinique SANTAREX', bold: true, margin: [0, 2, 0, 0] },
              { text: facture.adresseEtablissement ?? '', fontSize: 9, color: '#666666' },
            ],
          },
          {
            stack: [
              { text: 'PATIENT', fontSize: 8, bold: true, color: '#999999' },
              { text: facture.patient ? `${facture.patient.nom} ${facture.patient.prenom}` : '—', bold: true, margin: [0, 2, 0, 0] },
              { text: `IPP : ${facture.patient?.ipp ?? '—'}`, fontSize: 9, color: '#666666' },
              { text: `Tél : ${facture.patient?.telephone ?? '—'}`, fontSize: 9, color: '#666666' },
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 20],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Désignation', ...this.headerStyle() },
              { text: 'Qté', ...this.headerStyle(), alignment: 'center' },
              { text: 'Prix unitaire', ...this.headerStyle(), alignment: 'right' },
              { text: 'Remise', ...this.headerStyle(), alignment: 'center' },
              { text: 'Total', ...this.headerStyle(), alignment: 'right' },
            ],
            ...lignes,
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#E5E7EB',
          fillColor: (rowIndex: number) => rowIndex === 0 ? this.brandBlue : (rowIndex % 2 === 0 ? '#F9FAFB' : null),
        },
        margin: [0, 0, 0, 20],
      },
      {
        alignment: 'right',
        stack: [
          { columns: [{ text: 'Sous-total', width: '*' }, { text: `${(facture.sousTotal ?? 0).toLocaleString('fr-FR')} FCFA`, width: 120, alignment: 'right' }] },
          facture.tiersPayant ? { columns: [{ text: `Part assurance (${facture.assuranceNom ?? ''})`, width: '*', color: '#666666' }, { text: `- ${(facture.partAssurance ?? 0).toLocaleString('fr-FR')} FCFA`, width: 120, alignment: 'right', color: '#666666' }] } : null,
          { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 200, y2: 4, lineWidth: 0.5, lineColor: '#E5E7EB' }], margin: [0, 4, 0, 4] },
          { columns: [{ text: 'TOTAL À PAYER', bold: true, color: this.brandBlue, fontSize: 13 }, { text: `${(facture.resteAPayer ?? facture.total ?? 0).toLocaleString('fr-FR')} FCFA`, width: 120, alignment: 'right', bold: true, color: this.brandBlue, fontSize: 13 }] },
        ].filter(Boolean),
        margin: [0, 0, 0, 20],
      },
      {
        table: {
          widths: ['*'],
          body: [[{ text: `Statut : ${facture.statut?.toUpperCase() ?? '—'} | Montant payé : ${(facture.montantPaye ?? 0).toLocaleString('fr-FR')} FCFA | Reste à payer : ${(facture.resteAPayer ?? 0).toLocaleString('fr-FR')} FCFA`, fontSize: 9, color: '#1E40AF', fillColor: '#EFF6FF', margin: [8, 6, 8, 6] }]],
        },
        layout: 'noBorders',
      },
    ];

    const doc = this.buildDocDefinition(content, `Facture ${facture.numero}`);
    return new Promise((resolve, reject) => {
      const pdfDoc = (PdfMake as any).createPdf(doc);
      pdfDoc.getBuffer((buf: Buffer) => resolve(buf), reject);
    });
  }

  async genererPdfOrdonnance(consultation: any, patient: any): Promise<Buffer> {
    const ordonnances = consultation.ordonnances ?? [];

    const content: any[] = [
      { text: 'ORDONNANCE MÉDICALE', style: { fontSize: 16, bold: true, color: this.brandBlue }, margin: [0, 0, 0, 4] },
      { text: `N° ${consultation.numero} — ${new Date(consultation.dateConsultation).toLocaleDateString('fr-FR')}`, fontSize: 9, color: '#666666', margin: [0, 0, 0, 20] },
      {
        columns: [
          {
            stack: [
              { text: 'MÉDECIN', fontSize: 8, bold: true, color: '#999999' },
              { text: consultation.medecin ? `Dr. ${consultation.medecin.nom} ${consultation.medecin.prenom}` : '—', bold: true, margin: [0, 2, 0, 0] },
              { text: consultation.medecin?.specialite ?? '', fontSize: 9, color: '#666666' },
            ],
          },
          {
            stack: [
              { text: 'PATIENT', fontSize: 8, bold: true, color: '#999999' },
              { text: patient ? `${patient.nom} ${patient.prenom}` : '—', bold: true, margin: [0, 2, 0, 0] },
              { text: `Né(e) le : ${patient?.dateNaissance ? new Date(patient.dateNaissance).toLocaleDateString('fr-FR') : '—'}`, fontSize: 9, color: '#666666' },
              { text: `IPP : ${patient?.ipp ?? '—'}`, fontSize: 9, color: '#666666' },
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 16],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: this.brandTeal }], margin: [0, 0, 0, 16] },
    ];

    if (ordonnances.length === 0) {
      content.push({ text: 'Aucune prescription.', color: '#999999', italics: true });
    } else {
      ordonnances.forEach((ord: any, i: number) => {
        const lignes = ord.lignes ?? [];
        content.push({ text: `Ordonnance ${i + 1} / ${ordonnances.length}`, bold: true, color: this.brandBlue, fontSize: 11, margin: [0, 0, 0, 8] });
        lignes.forEach((l: any, j: number) => {
          content.push({
            stack: [
              { text: `${j + 1}. ${l.medicamentNom ?? ''}`, bold: true },
              { text: `   ${l.dosage ?? ''} — ${l.posologie ?? ''}`, fontSize: 9, color: '#555555' },
              { text: `   Durée : ${l.duree ?? '—'} | Quantité : ${l.quantite ?? 1}`, fontSize: 9, color: '#888888' },
            ],
            margin: [0, 0, 0, 8],
          });
        });
      });
    }

    content.push(
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#E5E7EB' }], margin: [0, 20, 0, 12] },
      {
        columns: [
          { text: `Diagnostic : ${consultation.diagnostic ?? '—'}`, fontSize: 9, color: '#555555', width: '*' },
          { stack: [{ text: 'Signature & cachet', fontSize: 9, color: '#999999' }, { canvas: [{ type: 'rect', x: 0, y: 5, w: 100, h: 50, lineWidth: 0.5, lineColor: '#E5E7EB' }] }], width: 120, alignment: 'right' },
        ],
      },
    );

    const doc = this.buildDocDefinition(content, `Ordonnance ${consultation.numero}`);
    return new Promise((resolve, reject) => {
      const pdfDoc = (PdfMake as any).createPdf(doc);
      pdfDoc.getBuffer((buf: Buffer) => resolve(buf), reject);
    });
  }

  async genererXlsxPatients(patients: any[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SANTAREX ERP — IBIG SOFT';
    const ws = wb.addWorksheet('Patients', { views: [{ state: 'frozen', ySplit: 1 }] });

    ws.columns = [
      { header: 'IPP', key: 'ipp', width: 14 },
      { header: 'Nom', key: 'nom', width: 18 },
      { header: 'Prénom', key: 'prenom', width: 18 },
      { header: 'Date naissance', key: 'dateNaissance', width: 16 },
      { header: 'Sexe', key: 'sexe', width: 8 },
      { header: 'Téléphone', key: 'telephone', width: 16 },
      { header: 'Ville', key: 'ville', width: 16 },
      { header: 'Groupe sanguin', key: 'groupeSanguin', width: 14 },
      { header: 'Assurance', key: 'assuranceNom', width: 16 },
      { header: 'Statut', key: 'statut', width: 12 },
      { header: 'Créé le', key: 'createdAt', width: 16 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } };
    headerRow.height = 24;
    headerRow.alignment = { vertical: 'middle' };

    patients.forEach((p, i) => {
      const row = ws.addRow({
        ipp: p.ipp,
        nom: p.nom,
        prenom: p.prenom,
        dateNaissance: p.dateNaissance ? new Date(p.dateNaissance).toLocaleDateString('fr-FR') : '',
        sexe: p.sexe === 'M' ? 'Masculin' : p.sexe === 'F' ? 'Féminin' : 'Indéterminé',
        telephone: p.telephone ?? '',
        ville: p.ville ?? '',
        groupeSanguin: p.groupeSanguin ?? '',
        assuranceNom: p.assuranceNom ?? '',
        statut: p.statut,
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '',
      });
      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
      }
    });

    ws.autoFilter = { from: 'A1', to: 'K1' };
    return wb.xlsx.writeBuffer() as Promise<Buffer>;
  }

  async genererXlsxStock(medicaments: any[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SANTAREX ERP — IBIG SOFT';
    const ws = wb.addWorksheet('Stock Pharmacie', { views: [{ state: 'frozen', ySplit: 1 }] });

    ws.columns = [
      { header: 'Code', key: 'code', width: 12 },
      { header: 'Médicament', key: 'nom', width: 28 },
      { header: 'Forme', key: 'forme', width: 14 },
      { header: 'Dosage', key: 'dosage', width: 14 },
      { header: 'Stock actuel', key: 'stockActuel', width: 14 },
      { header: 'Stock min', key: 'stockMinimum', width: 12 },
      { header: 'Stock max', key: 'stockMaximum', width: 12 },
      { header: 'Prix vente (FCFA)', key: 'prixVente', width: 18 },
      { header: 'Catégorie', key: 'categorie', width: 18 },
      { header: 'Statut stock', key: 'statutStock', width: 14 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00838F' } };
    headerRow.height = 24;
    headerRow.alignment = { vertical: 'middle' };

    medicaments.forEach((m, i) => {
      const enRupture = m.stockActuel <= m.stockMinimum;
      const row = ws.addRow({
        code: m.code,
        nom: m.nom,
        forme: m.forme,
        dosage: m.dosage,
        stockActuel: m.stockActuel,
        stockMinimum: m.stockMinimum,
        stockMaximum: m.stockMaximum,
        prixVente: m.prixVente,
        categorie: m.categorie,
        statutStock: enRupture ? 'RUPTURE' : 'OK',
      });
      if (enRupture) {
        row.getCell('statutStock').font = { bold: true, color: { argb: 'FF991B1B' } };
        row.getCell('stockActuel').font = { bold: true, color: { argb: 'FFEF4444' } };
      } else if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
      }
    });

    ws.autoFilter = { from: 'A1', to: 'J1' };
    return wb.xlsx.writeBuffer() as Promise<Buffer>;
  }
}
