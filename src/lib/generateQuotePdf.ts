// DTF Studio Helsinki — Quote PDF Generator using pdf-lib
// Brand tokens: paper #f4e4bc, ink #1a1a1a, crimson #b22222
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { A3_WIDTH_CM, A3_HEIGHT_CM, SHEET_MARGIN_CM, MARGIN_CM } from './gangSheet';
import type { GangSheetResult } from './gangSheet';

// A3 in points (1 cm = 28.3465 pt)
export const CM_TO_PT = 28.3465;
const A3_W_PT = A3_WIDTH_CM * CM_TO_PT;   // 850.39pt
const A3_H_PT = A3_HEIGHT_CM * CM_TO_PT;  // 1190.55pt

// Brand colours (rgb values 0–1)
const PAPER   = rgb(0.957, 0.894, 0.737); // #f4e4bc
const PAPER_2 = rgb(0.910, 0.847, 0.690); // #e8d8b0
const INK     = rgb(0.102, 0.102, 0.102); // #1a1a1a
const CRIMSON = rgb(0.698, 0.133, 0.133); // #b22222
const INK_SOFT = rgb(0.267, 0.259, 0.239); // #44423d

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

/**
 * Fetch the brand logo from /brand/logo.png (public assets).
 * Returns null if unavailable (graceful fallback).
 */
async function fetchLogoBytes(): Promise<ArrayBuffer | null> {
  try {
    // Try public/brand/logo.png via relative URL (works in browser)
    const resp = await fetch('/brand/logo.png');
    if (resp.ok) {
      return resp.arrayBuffer();
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateQuotePdf(info: QuoteInfo): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Attempt to load brand logo
  const logoBytes = await fetchLogoBytes();
  let logoImg: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  if (logoBytes) {
    try {
      logoImg = await pdfDoc.embedPng(logoBytes);
    } catch { /* logo unavailable — fallback to text header */ }
  }

  // ── Page 1: Quote summary ──────────────────────────────────────────────────
  const summaryPage = pdfDoc.addPage([A3_W_PT, A3_H_PT]);
  const { width, height } = summaryPage.getSize();

  // Manila paper background
  summaryPage.drawRectangle({ x: 0, y: 0, width, height, color: PAPER });

  // Header bar — ink bg
  const HEADER_H = 90;
  summaryPage.drawRectangle({
    x: 0, y: height - HEADER_H,
    width, height: HEADER_H,
    color: INK,
  });

  // Crimson rule below header (2pt)
  summaryPage.drawRectangle({
    x: 0, y: height - HEADER_H - 2,
    width, height: 2,
    color: CRIMSON,
  });

  // Logo in header (top-left)
  const LOGO_H = 30;
  const LOGO_W = 80;
  if (logoImg) {
    // Fit logo proportionally
    const logoDims = logoImg.scale(1);
    const aspect = logoDims.width / logoDims.height;
    const drawW = Math.min(LOGO_W, LOGO_H * aspect);
    const drawH = drawW / aspect;
    summaryPage.drawImage(logoImg, {
      x: 30,
      y: height - HEADER_H + (HEADER_H - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  } else {
    // Fallback: text logo
    summaryPage.drawText('DTF Studio Helsinki', {
      x: 30, y: height - HEADER_H + 30,
      size: 18, font: helveticaBold,
      color: rgb(0.957, 0.894, 0.737),
    });
    summaryPage.drawText('DTF STUDIO HELSINKI · KONALA', {
      x: 30, y: height - HEADER_H + 14,
      size: 9, font: helvetica,
      color: rgb(0.910, 0.847, 0.690),
    });
  }

  // Mono kicker in header
  summaryPage.drawText('DTF STUDIO HELSINKI · KONALA', {
    x: logoImg ? 130 : 30,
    y: height - HEADER_H + 14,
    size: 9, font: helvetica,
    color: rgb(0.910, 0.847, 0.690),
  });

  // Quote ID top-right of header
  summaryPage.drawText(`#${info.quoteId}`, {
    x: width - 180, y: height - HEADER_H + 50,
    size: 14, font: helveticaBold,
    color: rgb(0.957, 0.894, 0.737),
  });
  summaryPage.drawText(new Date().toLocaleDateString('fi-FI'), {
    x: width - 180, y: height - HEADER_H + 30,
    size: 10, font: helvetica,
    color: rgb(0.910, 0.847, 0.690),
  });
  summaryPage.drawText('TARJOUS / TILAUSVAHVISTUS', {
    x: width - 180, y: height - HEADER_H + 15,
    size: 8, font: helvetica,
    color: rgb(0.698, 0.133, 0.133),
  });

  let y = height - HEADER_H - 40;

  const rowLabel = (label: string, value: string, yPos: number) => {
    summaryPage.drawText(label, {
      x: 40, y: yPos, size: 11,
      font: helvetica, color: INK_SOFT,
    });
    summaryPage.drawText(value, {
      x: 240, y: yPos, size: 11,
      font: helveticaBold, color: INK,
    });
  };

  // Section: Asiakas
  summaryPage.drawText('ASIAKKAAN TIEDOT', {
    x: 40, y, size: 9, font: helveticaBold,
    color: CRIMSON,
  });
  y -= 6;
  summaryPage.drawRectangle({ x: 40, y, width: 60, height: 2, color: CRIMSON });
  y -= 20;
  rowLabel('Nimi:', info.customerName || '—', y); y -= 20;
  rowLabel('Sähköposti:', info.customerEmail, y); y -= 30;

  // Divider
  summaryPage.drawLine({
    start: { x: 40, y }, end: { x: width - 40, y },
    thickness: 1, color: PAPER_2,
  });
  y -= 25;

  // Section: Tilauksen tiedot
  summaryPage.drawText('TILAUKSEN TIEDOT', {
    x: 40, y, size: 9, font: helveticaBold, color: CRIMSON,
  });
  y -= 6;
  summaryPage.drawRectangle({ x: 40, y, width: 60, height: 2, color: CRIMSON });
  y -= 20;
  rowLabel('Koko (leveys × korkeus):', `${info.koko.widthCm} × ${info.koko.heightCm} cm`, y); y -= 20;
  rowLabel('Materiaali:', materiaaliLabel(info.materiaali), y); y -= 20;
  rowLabel('Kappalemäärä:', `${info.quantity} kpl`, y); y -= 20;
  rowLabel('Tiedostoja:', `${info.files.length} kpl`, y); y -= 20;
  if (info.notes) {
    rowLabel('Lisätiedot:', info.notes.slice(0, 60), y); y -= 20;
  }
  y -= 10;

  // Divider
  summaryPage.drawLine({
    start: { x: 40, y }, end: { x: width - 40, y },
    thickness: 1, color: PAPER_2,
  });
  y -= 25;

  // Section: Hintalaskelma
  summaryPage.drawText('HINTALASKELMA', {
    x: 40, y, size: 9, font: helveticaBold, color: CRIMSON,
  });
  y -= 6;
  summaryPage.drawRectangle({ x: 40, y, width: 60, height: 2, color: CRIMSON });
  y -= 20;
  rowLabel('A3-arkkeja:', `${info.gangSheet.sheets} kpl`, y); y -= 20;
  rowLabel('Yksikköhinta (A3):', `${info.gangSheet.pricePerSheet.toFixed(2)} €`, y); y -= 20;
  rowLabel('Käyttöaste:', `${(info.gangSheet.utilisation * 100).toFixed(0)} %`, y); y -= 20;
  rowLabel('Asennusmaksu:', `${info.gangSheet.setupFee.toFixed(2)} €`, y); y -= 20;

  // Total box — ink bg, manila text
  y -= 10;
  summaryPage.drawRectangle({
    x: 40, y: y - 10, width: width - 80, height: 50,
    color: INK,
  });
  // Crimson top border on total box
  summaryPage.drawRectangle({
    x: 40, y: y + 38, width: width - 80, height: 2,
    color: CRIMSON,
  });
  summaryPage.drawText('YHTEENSÄ (ALV 0%)', {
    x: 55, y: y + 18, size: 9, font: helveticaBold,
    color: rgb(0.910, 0.847, 0.690),
  });
  summaryPage.drawText(`${info.gangSheet.totalEur.toFixed(2)} €`, {
    x: width - 160, y: y + 14, size: 20, font: helveticaBold,
    color: rgb(0.957, 0.894, 0.737),
  });

  // Footer — mono kicker style
  summaryPage.drawRectangle({
    x: 0, y: 0, width, height: 40,
    color: PAPER_2,
  });
  summaryPage.drawText('DTF Studio Helsinki · Konala · hello@dtfstudio.fi · dtfstudio.fi', {
    x: 40, y: 14, size: 9, font: helvetica, color: INK_SOFT,
  });

  // ── Page 2: Gang sheet layout preview ────────────────────────────────────
  const layoutPage = pdfDoc.addPage([A3_W_PT, A3_H_PT]);

  // Manila paper background
  layoutPage.drawRectangle({ x: 0, y: 0, width: A3_W_PT, height: A3_H_PT, color: PAPER });

  // Page 2 header
  const P2_HEADER_H = 60;
  layoutPage.drawRectangle({
    x: 0, y: A3_H_PT - P2_HEADER_H, width: A3_W_PT, height: P2_HEADER_H, color: INK,
  });
  // Crimson rule below header
  layoutPage.drawRectangle({
    x: 0, y: A3_H_PT - P2_HEADER_H - 2, width: A3_W_PT, height: 2, color: CRIMSON,
  });

  // Logo on page 2
  if (logoImg) {
    const logoDims = logoImg.scale(1);
    const aspect = logoDims.width / logoDims.height;
    const drawW = Math.min(60, 24 * aspect);
    const drawH = drawW / aspect;
    layoutPage.drawImage(logoImg, {
      x: 20,
      y: A3_H_PT - P2_HEADER_H + (P2_HEADER_H - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  layoutPage.drawText('GANG SHEET ESIKATSELU', {
    x: logoImg ? 100 : 20,
    y: A3_H_PT - 30,
    size: 11, font: helveticaBold,
    color: rgb(0.957, 0.894, 0.737),
  });
  layoutPage.drawText('A3 (30 × 42 cm)', {
    x: logoImg ? 100 : 20,
    y: A3_H_PT - 46,
    size: 9, font: helvetica,
    color: CRIMSON,
  });

  // Sheet border
  layoutPage.drawRectangle({
    x: 10, y: 50,
    width: A3_W_PT - 20, height: A3_H_PT - P2_HEADER_H - 12 - 50,
    borderColor: INK,
    borderWidth: 1,
    color: rgb(0.980, 0.945, 0.890), // slightly lighter manila
  });

  // Draw image placeholders on the gang sheet
  // SIZING FIX: use cm → pt conversion, NOT raw pixel dimensions
  const marginPt = SHEET_MARGIN_CM * CM_TO_PT;
  const imgMarginPt = MARGIN_CM * CM_TO_PT;

  // Use customer's requested cm dimensions, scaled to PDF points
  const imgW = info.koko.widthCm * CM_TO_PT;   // Q3.1 / Q3.2: cm → pt
  const imgH = info.koko.heightCm * CM_TO_PT;  // Q3.1 / Q3.2: cm → pt
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

  // Y offset to start drawing below page 2 header
  const sheetTop = A3_H_PT - P2_HEADER_H - 12;

  let count = 0;
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (count >= totalToDraw) break outer;
      const x = marginPt + c * paddedW;
      // Y in PDF coords (bottom-up): start from sheetTop and go down
      const y = sheetTop - marginPt - (r + 1) * paddedH + imgMarginPt;

      if (embeddedImg) {
        // Scale image to fit requested cm dimensions (preserving aspect ratio)
        const embedDims = embeddedImg.scale(1);
        const embedAspect = embedDims.width / embedDims.height;
        const targetAspect = info.koko.widthCm / info.koko.heightCm;

        let drawW = imgW;
        let drawH = imgH;
        // Fit by shortest dimension, letterbox if aspect differs >5%
        if (Math.abs(embedAspect - targetAspect) > 0.05) {
          if (embedAspect > targetAspect) {
            // Image wider than target: fit by width
            drawW = imgW;
            drawH = imgW / embedAspect;
          } else {
            // Image taller than target: fit by height
            drawH = imgH;
            drawW = imgH * embedAspect;
          }
        }
        // Center within the target box
        const offsetX = (imgW - drawW) / 2;
        const offsetY = (imgH - drawH) / 2;

        layoutPage.drawImage(embeddedImg, {
          x: x + offsetX,
          y: y + offsetY,
          width: drawW,   // Q3.2: cm→pt, NOT raw px
          height: drawH,
        });
      } else {
        // Placeholder rectangle in brand colors
        layoutPage.drawRectangle({
          x, y, width: imgW, height: imgH,  // Q3.2: cm→pt
          color: PAPER_2,
          borderColor: INK,
          borderWidth: 0.5,
        });
        layoutPage.drawText(`${count + 1}`, {
          x: x + imgW / 2 - 4,
          y: y + imgH / 2 - 4,
          size: Math.max(6, Math.min(14, imgH / 4)),
          font: helveticaBold,
          color: INK_SOFT,
        });
      }
      count++;
    }
  }

  // Page 2 footer
  layoutPage.drawRectangle({ x: 0, y: 0, width: A3_W_PT, height: 50, color: PAPER_2 });
  layoutPage.drawText(
    `Arkkeja yhteensä: ${info.gangSheet.sheets}  ·  Koko: ${info.koko.widthCm}×${info.koko.heightCm} cm  ·  Käyttöaste: ${(info.gangSheet.utilisation * 100).toFixed(0)}%`,
    { x: 20, y: 18, size: 9, font: helvetica, color: INK_SOFT }
  );

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
