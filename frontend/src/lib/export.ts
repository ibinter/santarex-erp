'use client';

// ─── XLSX ────────────────────────────────────────────────────────────────────
export async function exportXLSX(
  rows: Record<string, unknown>[],
  filename: string,
  sheetName = 'Données',
) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export interface PdfColumn {
  header: string;
  dataKey: string;
  width?: number;
}

interface StatBox {
  label: string;
  value: string | number;
  color?: [number, number, number]; // RGB
}

function drawHeader(doc: any, title: string, subtitle?: string) {
  const pw = doc.internal.pageSize.width;

  // Navy header band
  doc.setFillColor(10, 23, 48);
  doc.rect(0, 0, pw, 30, 'F');

  // Blue left accent
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 5, 30, 'F');

  // SANTAREX ERP label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text('SANTAREX', 13, 13);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 180, 230);
  doc.text('ERP · Logiciel de Gestion Hospitalière · IBIG Soft', 13, 19);

  // Date top-right
  doc.setFontSize(7.5);
  doc.setTextColor(180, 205, 240);
  doc.text(
    new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    pw - 13, 12, { align: 'right' },
  );
  doc.text('Document généré automatiquement', pw - 13, 19, { align: 'right' });

  // Light separator band
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 30, pw, 20, 'F');

  // Blue left accent (title section)
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 30, 5, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), 13, 42);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 13, 47);
  }
}

function drawStatBoxes(doc: any, stats: StatBox[], startY: number) {
  const pw = doc.internal.pageSize.width;
  const margin = 13;
  const gap = 6;
  const boxW = (pw - margin * 2 - gap * (stats.length - 1)) / stats.length;

  stats.forEach((s, i) => {
    const x = margin + i * (boxW + gap);
    const color = s.color ?? [37, 99, 235];

    // Box background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, startY, boxW, 18, 2, 2, 'F');

    // Left color stripe
    doc.setFillColor(...color);
    doc.roundedRect(x, startY, 3, 18, 1, 1, 'F');
    doc.rect(x + 1.5, startY, 1.5, 18, 'F'); // square right side of stripe

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...color);
    doc.text(String(s.value), x + 7, startY + 10);

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(s.label.toUpperCase(), x + 7, startY + 15.5);
  });

  return startY + 24;
}

function drawFooter(doc: any, pageNum: number, pageCount: number) {
  const pw = doc.internal.pageSize.width;
  const ph = doc.internal.pageSize.height;

  doc.setFillColor(248, 250, 252);
  doc.rect(0, ph - 12, pw, 12, 'F');

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, ph - 12, pw, ph - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Page ${pageNum} / ${pageCount}`, 13, ph - 4.5);
  doc.text('SANTAREX ERP — Confidentiel — © IBIG Soft', pw / 2, ph - 4.5, { align: 'center' });
  doc.text(
    new Date().toLocaleDateString('fr-FR'),
    pw - 13, ph - 4.5, { align: 'right' },
  );
}

// Choisit automatiquement l'orientation : paysage si le tableau ne tient
// pas dans la largeur utile d'une page A4 portrait (~184mm).
function pickOrientation(
  columns: PdfColumn[],
  rows: Record<string, unknown>[],
): 'portrait' | 'landscape' {
  const USABLE_PORTRAIT = 210 - 26; // A4 largeur - marges (13+13)
  const CHAR_MM = 1.6;              // largeur approx. d'un caractère à 8.5pt
  const PAD_MM = 10;               // padding cellule (gauche+droite)
  const WRAP_CAP = 26;            // au-delà, autoTable renvoie le texte à la ligne

  let needed = 0;
  for (const c of columns) {
    if (c.width) { needed += c.width; continue; }
    let maxLen = c.header.length;
    for (const r of rows) {
      const v = String(r[c.dataKey] ?? '');
      if (v.length > maxLen) maxLen = v.length;
    }
    needed += Math.min(maxLen, WRAP_CAP) * CHAR_MM + PAD_MM;
  }
  return needed > USABLE_PORTRAIT ? 'landscape' : 'portrait';
}

// ─── PDF TABLE (liste) ───────────────────────────────────────────────────────
export async function exportPDF(
  columns: PdfColumn[],
  rows: Record<string, unknown>[],
  title: string,
  filename: string,
  subtitle?: string,
  stats?: StatBox[],
) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const orientation = pickOrientation(columns, rows);
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  drawHeader(doc, title, subtitle);

  let startY = 55;

  if (stats && stats.length > 0) {
    startY = drawStatBoxes(doc, stats, startY);
  }

  autoTable(doc, {
    startY,
    margin: { left: 13, right: 13, bottom: 18 },
    head: [columns.map((c) => c.header)],
    body:
      rows.length > 0
        ? rows.map((r) => columns.map((c) => String(r[c.dataKey] ?? '—')))
        : [Array(columns.length).fill('—')],
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      textColor: [30, 41, 59],
      lineColor: [241, 245, 249],
      lineWidth: 0.25,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [10, 23, 48],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [i, { cellWidth: c.width ?? 'auto' }]),
    ),
    didDrawPage: (data: any) => {
      const pageCount = (doc.internal as any).getNumberOfPages();
      drawFooter(doc, data.pageNumber, pageCount);
      // Re-draw header on subsequent pages
      if (data.pageNumber > 1) {
        drawHeader(doc, title, subtitle);
      }
    },
  });

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
  const ph = doc.internal.pageSize.height;

  drawHeader(doc, title);

  let y = 60;
  doc.setTextColor(30, 41, 59);

  for (const section of sections) {
    // Section header
    doc.setFillColor(237, 242, 251);
    doc.rect(13, y - 1, pw - 26, 8, 'F');
    doc.setFillColor(37, 99, 235);
    doc.rect(13, y - 1, 3, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235);
    doc.text(section.label.toUpperCase(), 19, y + 4.5);
    y += 12;

    // Fields 2-column layout
    doc.setFont('helvetica', 'normal');
    const col = Math.ceil(section.fields.length / 2);
    for (let i = 0; i < section.fields.length; i++) {
      const f = section.fields[i];
      const isLeft = i < col;
      const row = isLeft ? i : i - col;
      const x = isLeft ? 13 : pw / 2 + 5;
      const fy = y + row * 9;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(f.key + ' :', x, fy);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(f.value || '—', x + 36, fy);

      // Light underline
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(x, fy + 2, (isLeft ? pw / 2 - 5 : pw - 13), fy + 2);
    }

    y += col * 9 + 8;
    if (y > ph - 30) {
      doc.addPage();
      drawHeader(doc, title);
      y = 58;
    }
  }

  drawFooter(doc, 1, (doc.internal as any).getNumberOfPages());

  doc.save(`${filename}.pdf`);
}
