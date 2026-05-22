// DTF Studio Helsinki — Gang Sheet Packer
// A3 sheet: 30cm × 42cm

export const A3_WIDTH_CM = 30;
export const A3_HEIGHT_CM = 42;
export const MARGIN_CM = 0.5; // margin between images
export const SHEET_MARGIN_CM = 1; // border margin

// Effective usable area per sheet
const EFFECTIVE_WIDTH = A3_WIDTH_CM - 2 * SHEET_MARGIN_CM;
const EFFECTIVE_HEIGHT = A3_HEIGHT_CM - 2 * SHEET_MARGIN_CM;

// Pricing tiers (€ per A3 sheet)
export const A3_PRICE_TIERS = [
  { minQty: 1,  maxQty: 9,  pricePerSheet: 18.00 },
  { minQty: 10, maxQty: 49, pricePerSheet: 15.50 },
  { minQty: 50, maxQty: Infinity, pricePerSheet: 10.50 },
];

export const SETUP_FEE = 5.00;

export interface ImageDimension {
  widthCm: number;
  heightCm: number;
}

export interface GangSheetResult {
  sheets: number;
  totalItems: number;
  itemsPerSheet: number;
  utilisation: number; // 0–1
  totalAreaCm2: number;
  sheetAreaCm2: number;
  pricePerSheet: number;
  setupFee: number;
  totalEur: number;
}

/**
 * Simple row-based packer: fit as many items per row as possible,
 * track rows per sheet, count sheets needed.
 */
export function packGangSheet(
  imageDims: ImageDimension[],
  quantity: number
): GangSheetResult {
  // Compute items per sheet using a greedy row-fill
  const itemW = imageDims[0]?.widthCm ?? 10;
  const itemH = imageDims[0]?.heightCm ?? 10;
  const paddedW = itemW + MARGIN_CM;
  const paddedH = itemH + MARGIN_CM;

  const itemsPerRow = Math.max(1, Math.floor((EFFECTIVE_WIDTH + MARGIN_CM) / paddedW));
  const rowsPerSheet = Math.max(1, Math.floor((EFFECTIVE_HEIGHT + MARGIN_CM) / paddedH));
  const itemsPerSheet = itemsPerRow * rowsPerSheet;

  const totalItems = imageDims.length * quantity;
  const sheets = Math.max(1, Math.ceil(totalItems / itemsPerSheet));

  const itemArea = itemW * itemH;
  const totalAreaCm2 = itemArea * totalItems;
  const sheetAreaCm2 = EFFECTIVE_WIDTH * EFFECTIVE_HEIGHT;
  const utilisation = Math.min(1, totalAreaCm2 / (sheets * sheetAreaCm2));

  // Get price tier based on quantity
  const tier = A3_PRICE_TIERS.find(t => quantity >= t.minQty && quantity <= t.maxQty)
    ?? A3_PRICE_TIERS[A3_PRICE_TIERS.length - 1];

  const setupFee = SETUP_FEE;
  const totalEur = sheets * tier.pricePerSheet + setupFee;

  return {
    sheets,
    totalItems,
    itemsPerSheet,
    utilisation,
    totalAreaCm2,
    sheetAreaCm2,
    pricePerSheet: tier.pricePerSheet,
    setupFee,
    totalEur,
  };
}

/**
 * Estimate dimensions from a File object (image).
 * Returns default 10×10 cm if no natural dimensions available.
 */
export async function getImageDimensionsCm(file: File): Promise<ImageDimension> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Scale to max 20cm wide, preserving aspect ratio
      const maxW = 20;
      const ratio = img.naturalHeight / img.naturalWidth;
      const widthCm = Math.min(maxW, img.naturalWidth / 100);
      const heightCm = widthCm * ratio;
      URL.revokeObjectURL(url);
      resolve({ widthCm: Math.max(2, widthCm), heightCm: Math.max(2, heightCm) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ widthCm: 10, heightCm: 10 });
    };
    img.src = url;
  });
}
