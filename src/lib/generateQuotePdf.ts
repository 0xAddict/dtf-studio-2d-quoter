// DTF Studio Helsinki — Quote PDF Generator using pdf-lib
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { A3_WIDTH_CM, A3_HEIGHT_CM, SHEET_MARGIN_CM, MARGIN_CM } from './gangSheet';
import type { GangSheetResult } from './gangSheet';

// A3 in points (1 cm = 28.3465 pt)
const CM_TO_PT = 28.3465;
const A3_W_PT = A3_WIDTH_CM * CM_TO_PT;   // 850.39pt
const A3_H_PT = A3_HEIGHT_CM * CM_TO_PT;  // 1190.55pt

export interface QuoteInfo {
  quoteId: string;
  customerName: string;
  customerEmail: string;
  koko: { widthCm: number; heightCm: number };
  materiaali: string;
  quantity: number;
  notes: string;
  gangSheet: GangSheetResult;
  files: File[];
}

export async function generateQuotePdf(info: QuoteInfo): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // --- Page 1: Quote summary ---
  const summaryPage = pdfDoc.addPage([A3_W_PT, A3_H_PT]);
  const { width, height } = summaryPage.getSize();

  // Header bar
  summaryPage.drawRectangle({
    x: 0, y: height - 80,
    width, height: 80,
    color: rgb(0.07, 0.07, 0.07),
  });
  summaryPage.drawText('DTF Studio Helsinki', {
    x: 30, y: height - 52,
    size: 28, font: helveticaBold, color: rgb(1, 1, 1),
  });
  summaryPage.drawText('Tarjous / Tilausvahvistus', {
    x: 30, y: height - 72,
    size: 12, font: helvetica, color: rgb(0.7, 0.7, 0.7),
  });

  // Quote ID top-right
  summaryPage.drawText(`Tarjous #${info.quoteId}`, {
    x: width - 200, y: height - 50,
    size: 11, font: helveticaBold, color: rgb(1, 1, 1),
  });
  summaryPage.drawText(new Date().toLocaleDateString('fi-FI'), {
    x: width - 200, y: height - 70,
    size: 10, font: helvetica, color: rgb(0.7, 0.7, 0.7),
  });

  let y = height - 120;

  const row = (label: string, value: string, yPos: number, bold = false) => {
    summaryPage.drawText(label, {
      x: 40, y: yPos, size: 11,
      font: bold ? helveticaBold : helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    summaryPage.drawText(value, {
      x: 240, y: yPos, size: 11,
      font: bold ? helveticaBold : helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });
  };

  // Section: Asiakas
  summaryPage.drawText('Asiakkaan tiedot', {
    x: 40, y, size: 14, font: helveticaBold, color: rgb(0.1, 0.1, 0.1),
  });
  y -= 25;
  row('Nimi:', info.customerName, y); y -= 20;
  row('Sähköposti:', info.customerEmail, y); y -= 30;

  // Divider
  summaryPage.drawLine({
    start: { x: 40, y }, end: { x: width - 40, y },
    thickness: 0.5, color: rgb(0.8, 0.8, 0.8),
  });
  y -= 25;

  // Section: Tilauksen tiedot
  summaryPage.drawText('Tilauksen tiedot', {
    x: 40, y, size: 14, font: helveticaBold, color: rgb(0.1, 0.1, 0.1),
  });
  y -= 25;
  row('Koko (leveys × korkeus):', `${info.koko.widthCm} × ${info.koko.heightCm} cm`, y); y -= 20;
  row('Materiaali:', materiaaliLabel(info.materiaali), y); y -= 20;
  row('Kappalemäärä:', `${info.quantity} kpl`, y); y -= 20;
  row('Tiedostoja:', `${info.files.length} kpl`, y); y -= 20;
  if (info.notes) {
    row('Lisätiedot:', info.notes, y); y -= 20;
  }
  y -= 10;

  // Divider
  summaryPage.drawLine({
    start: { x: 40, y }, end: { x: width - 40, y },
    thickness: 0.5, color: rgb(0.8, 0.8, 0.8),
  });
  y -= 25;

  // Section: Hintalaskelma
  summaryPage.drawText('Hintalaskelma', {
    x: 40, y, size: 14, font: helveticaBold, color: rgb(0.1, 0.1, 0.1),
  });
  y -= 25;
  row('A3-arkkeja:', `${info.gangSheet.sheets} kpl`, y); y -= 20;
  row('Yksikköhinta (A3):', `${info.gangSheet.pricePerSheet.toFixed(2)} €`, y); y -= 20;
  row('Käyttöaste:', `${(info.gangSheet.utilisation * 100).toFixed(0)} %`, y); y -= 20;
  row('Asennusmaksu:', `${info.gangSheet.setupFee.toFixed(2)} €`, y); y -= 20;

  // Total box
  y -= 10;
  summaryPage.drawRectangle({
    x: 40, y: y - 10, width: width - 80, height: 40,
    color: rgb(0.07, 0.07, 0.07), borderRadius: 4,
  });
  summaryPage.drawText('Yhteensä (ALV 0%):', {
    x: 55, y: y + 6, size: 13, font: helveticaBold, color: rgb(1, 1, 1),
  });
  summaryPage.drawText(`${info.gangSheet.totalEur.toFixed(2)} €`, {
    x: width - 140, y: y + 6, size: 16, font: helveticaBold, color: rgb(0.4, 0.9, 0.5),
  });

  // Footer
  summaryPage.drawText('DTF Studio Helsinki · hello@dtfstudio.fi · dtfstudio.fi', {
    x: 40, y: 30, size: 9, font: helvetica, color: rgb(0.5, 0.5, 0.5),
  });

  // --- Page 2: Gang sheet layout preview ---
  const layoutPage = pdfDoc.addPage([A3_W_PT, A3_H_PT]);

  // Sheet border
  layoutPage.drawRectangle({
    x: 10, y: 10,
    width: A3_W_PT - 20, height: A3_H_PT - 20,
    borderColor: rgb(0.3, 0.3, 0.3),
    borderWidth: 1,
    color: rgb(0.97, 0.97, 0.97),
  });

  // Title
  layoutPage.drawText('Gang Sheet Preview — A3 (30 × 42 cm)', {
    x: 20, y: A3_H_PT - 30,
    size: 11, font: helveticaBold, color: rgb(0.2, 0.2, 0.2),
  });

  // Draw image placeholders on the gang sheet
  const marginPt = SHEET_MARGIN_CM * CM_TO_PT;
  const imgMarginPt = MARGIN_CM * CM_TO_PT;
  const imgW = info.koko.widthCm * CM_TO_PT;
  const imgH = info.koko.heightCm * CM_TO_PT;
  const paddedW = imgW + imgMarginPt;
  const paddedH = imgH + imgMarginPt;
  const effectiveW = (A3_WIDTH_CM - 2 * SHEET_MARGIN_CM) * CM_TO_PT;
  const effectiveH = (A3_HEIGHT_CM - 2 * SHEET_MARGIN_CM) * CM_TO_PT;

  const cols = Math.max(1, Math.floor((effectiveW + imgMarginPt) / paddedW));
  const rows = Math.max(1, Math.floor((effectiveH + imgMarginPt) / paddedH));

  const totalToDraw = Math.min(info.gangSheet.totalItems, cols * rows);

  // Try to embed first image if PNG/JPG
  let embeddedImg: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  const firstImgFile = info.files[0];
  if (firstImgFile) {
    try {
      const buf = await firstImgFile.arrayBuffer();
      if (firstImgFile.type === 'image/png') {
        embeddedImg = await pdfDoc.embedPng(buf);
      } else if (firstImgFile.type === 'image/jpeg') {
        embeddedImg = await pdfDoc.embedJpg(buf);
      }
    } catch { /* fall back to placeholder */ }
  }

  let count = 0;
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (count >= totalToDraw) break outer;
      const x = marginPt + c * paddedW;
      const y = A3_H_PT - marginPt - (r + 1) * paddedH + imgMarginPt;

      if (embeddedImg) {
        layoutPage.drawImage(embeddedImg, { x, y, width: imgW, height: imgH });
      } else {
        layoutPage.drawRectangle({
          x, y, width: imgW, height: imgH,
          color: rgb(0.85, 0.85, 0.95),
          borderColor: rgb(0.5, 0.5, 0.7),
          borderWidth: 0.5,
        });
        layoutPage.drawText(`Kuva ${count + 1}`, {
          x: x + 4, y: y + imgH / 2 - 5,
          size: Math.max(6, Math.min(10, imgH / 4)),
          font: helvetica, color: rgb(0.3, 0.3, 0.5),
        });
      }
      count++;
    }
  }

  // Footer
  layoutPage.drawText(`Arkkeja yhteensä: ${info.gangSheet.sheets} | Käyttöaste: ${(info.gangSheet.utilisation * 100).toFixed(0)}%`, {
    x: 20, y: 15, size: 9, font: helvetica, color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

function materiaaliLabel(val: string): string {
  const map: Record<string, string> = {
    cotton: 'Puuvilla',
    polyester: 'Polyesteri',
    blend: 'Sekoitekangas',
  };
  return map[val] ?? val;
}
