import QRCode from "qrcode";

const qrCache = new Map<string, string>();

/**
 * Generates a base64 Data URL for a given text using `qrcode` locally.
 * Caches results to prevent redundant generations.
 */
export async function getQRCodeDataUrl(
  text: string,
  options?: { width?: number; margin?: number }
): Promise<string> {
  if (!text) return "";
  
  const width = options?.width ?? 220;
  const cacheKey = `${text}_${width}`;
  
  if (qrCache.has(cacheKey)) {
    return qrCache.get(cacheKey)!;
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      margin: options?.margin ?? 1,
      width: width,
      errorCorrectionLevel: "M",
    });
    qrCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error("Error generating QR code locally:", err);
    return "";
  }
}

/**
 * Synchronous lookup for cached QR code data URL
 */
export function getCachedQRCodeDataUrl(text: string, width: number = 220): string | null {
  if (!text) return null;
  const cacheKey = `${text}_${width}`;
  return qrCache.get(cacheKey) || null;
}
