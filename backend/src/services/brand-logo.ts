import fs from "node:fs";
import path from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

// Shared by invoices and inline email attachments; works from src and dist.
export const BRAND_LOGO_PATH = path.resolve(__dirname, "../../public/hivra-soft-logo.png");

export type PdfLogo = { width: number; height: number; rgb: Buffer; alpha: Buffer };
let cachedLogo: PdfLogo | undefined;

// Decode the bundled, non-interlaced 8-bit RGBA PNG, preserving its alpha
// channel as a PDF soft mask. PNG bytes cannot be embedded as JPEG/DCT data.
export function loadPdfLogo(): PdfLogo {
  if (cachedLogo) return cachedLogo;
  const png = fs.readFileSync(BRAND_LOGO_PATH);
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error("Invalid brand logo PNG");
  }
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (png[24] !== 8 || png[25] !== 6 || png[26] !== 0 || png[27] !== 0 || png[28] !== 0) {
    throw new Error("Brand logo must be a non-interlaced 8-bit RGBA PNG");
  }
  const chunks: Buffer[] = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    if (png.toString("ascii", offset + 4, offset + 8) === "IDAT") {
      chunks.push(png.subarray(offset + 8, offset + 8 + length));
    }
    offset += length + 12;
  }
  const stride = width * 4;
  const decoded = inflateSync(Buffer.concat(chunks));
  if (decoded.length !== (stride + 1) * height) throw new Error("Invalid logo pixel data");
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = decoded[y * (stride + 1)];
    if (filter > 4) throw new Error("Invalid PNG filter");
    for (let x = 0; x < stride; x++) {
      const index = y * stride + x;
      const left = x >= 4 ? pixels[index - 4] : 0;
      const up = y > 0 ? pixels[index - stride] : 0;
      const upperLeft = y > 0 && x >= 4 ? pixels[index - stride - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      if (filter === 2) predictor = up;
      if (filter === 3) predictor = Math.floor((left + up) / 2);
      if (filter === 4) {
        const p = left + up - upperLeft;
        const a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - upperLeft);
        predictor = a <= b && a <= c ? left : b <= c ? up : upperLeft;
      }
      pixels[index] = (decoded[y * (stride + 1) + 1 + x] + predictor) & 255;
    }
  }
  const rgb = Buffer.alloc(width * height * 3);
  const alpha = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i++) {
    pixels.copy(rgb, i * 3, i * 4, i * 4 + 3);
    alpha[i] = pixels[i * 4 + 3];
  }
  cachedLogo = { width, height, rgb: deflateSync(rgb), alpha: deflateSync(alpha) };
  return cachedLogo;
}
