/* Utilitaire d'export PDF + XLSX partagé sur toutes les pages */

// ─── XLSX ────────────────────────────────────────────────────────────────────
export async function exportXLSX(
  rows: Record<string, unknown>[],
  filename: string,
  sheetName = 'Données',
) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── PDF TABLE ───────────────────────────────────────────────────────────────
export interface PdfColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export async function exportPDF(
  columns: PdfColumn[],
  rows: Record<string, unknown>[],
  title: string,
  filename: string,
  subtitle?: string,
) {
  const { jsPDF } = await import('jspdf');
  // @ts-ignore
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(16);
  doc.setTextColor(13, 71, 161);
  doc.text('SANTAREX ERP', 14, 14);
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(title, 14, 22);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(subtitle, 14, 28);
  }
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    doc.internal.pageSize.width - 14,
    14,
    { align: 'right' },
  );

  // Table
  autoTable(doc, {
    startY: subtitle ? 33 : 27,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => r[c.dataKey] ?? '—')),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [13, 71, 161], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [i, { cellWidth: c.width ?? 'auto' }]),
    ),
  });

  // Footer
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Page ${i} / ${pageCount} — SANTAREX ERP`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 6,
      { align: 'center' },
    );
  }

  doc.save(`${filename}.pdf`);
}

// ─── FICHE PDF (enregistrement unique) ───────────────────────────────────────
export async function exportFichePDF(
  title: string,
  sections: { label: string; fields: { key: string; value: string }[] }[],
  filename: string,
) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.width;

  // Bandeau header
  doc.setFillColor(13, 71, 161);
  doc.rect(0, 0, pw, 28, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('SANTAREX ERP', 14, 11);
  doc.setFontSize(11);
  doc.text(title, 14, 20);
  doc.setFontSize(8);
  doc.text(
    new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    pw - 14,
    20,
    { align: 'right' },
  );

  let y = 38;
  doc.setTextColor(30, 30, 30);

  for (const section of sections) {
    // Section title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 71, 161);
    doc.text(section.label.toUpperCase(), 14, y);
    doc.setDrawColor(13, 71, 161);
    doc.setLineWidth(0.4);
    doc.line(14, y + 2, pw - 14, y + 2);
    y += 8;

    // Fields in 2 columns
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    const col = Math.ceil(section.fields.length / 2);
    for (let i = 0; i < section.fields.length; i++) {
      const f = section.fields[i];
      const x = i < col ? 14 : pw / 2 + 4;
      const row = i < col ? i : i - col;
      const fy = y + row * 10;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(f.key + ' :', x, fy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(f.value || '—', x + 38, fy);
    }
    y += col * 10 + 6;
    if (y > 260) { doc.addPage(); y = 20; }
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('Document généré automatiquement par SANTAREX ERP — confidentiel', pw / 2, 285, { align: 'center' });

  doc.save(`${filename}.pdf`);
}
