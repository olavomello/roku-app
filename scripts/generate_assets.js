import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

/**
 * Creates a valid PNG Buffer with a custom styled Roku channel icon/splash art.
 */
export function createRokuAssetPng(width, height, isIcon = true) {
  const rowLength = 1 + width * 3;
  const rawData = Buffer.alloc(rowLength * height);

  const bgR = 15, bgG = 23, bgB = 42; // #0F172A (Dark Navy)
  const accentR = 225, accentG = 29, accentB = 72; // #E11D48 (Crimson Red)
  const whiteR = 255, whiteG = 255, whiteB = 255;
  const cardR = 30, cardG = 41, cardB = 59; // #1E293B

  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const playSize = Math.floor(Math.min(width, height) * 0.22);
  const circleRadius = Math.floor(Math.min(width, height) * 0.32);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter 0

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;

      let r = bgR, g = bgG, b = bgB;

      // Top and bottom accent border bars
      if (y < Math.max(3, Math.floor(height * 0.04)) || y > height - Math.max(3, Math.floor(height * 0.04))) {
        r = accentR; g = accentG; b = accentB;
      } else {
        const dx = x - cx;
        const dy = y - cy;
        const distSq = dx * dx + dy * dy;

        // Draw Outer Circle Emblem
        if (distSq <= circleRadius * circleRadius) {
          const ringThickness = Math.max(4, Math.floor(circleRadius * 0.12));
          if (distSq >= (circleRadius - ringThickness) * (circleRadius - ringThickness)) {
            r = accentR; g = accentG; b = accentB;
          } else {
            r = cardR; g = cardG; b = cardB;
          }
        }

        // Draw Play Triangle (pointing right)
        const xMin = cx - Math.floor(playSize * 0.5);
        const xMax = cx + Math.floor(playSize * 0.8);
        if (x >= xMin && x <= xMax) {
          const halfH = Math.floor(((xMax - x) / (xMax - xMin)) * playSize);
          if (y >= cy - halfH && y <= cy + halfH) {
            r = whiteR; g = whiteG; b = whiteB;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(2, 9); // color type 2 (RGB)
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // IDAT chunk
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createPngChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createPngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcValue = zlib.crc32(crcInput);
  crcBuf.writeUInt32BE(crcValue >>> 0, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

export function generateRokuAssets() {
  const assetsDir = path.join(process.cwd(), 'assets', 'images');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const assets = [
    { name: 'icon_hd.png', width: 290, height: 218, isIcon: true },
    { name: 'icon_fhd.png', width: 540, height: 405, isIcon: true }, // Correct FHD 4:3 size
    { name: 'splash_hd.png', width: 1280, height: 720, isIcon: false },
    { name: 'splash_fhd.png', width: 1920, height: 1080, isIcon: false },
  ];

  for (const asset of assets) {
    const filePath = path.join(assetsDir, asset.name);
    const pngBuf = createRokuAssetPng(asset.width, asset.height, asset.isIcon);
    fs.writeFileSync(filePath, pngBuf);
    console.log(`🎨 Generated Roku asset: assets/images/${asset.name} (${asset.width}x${asset.height})`);
  }
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  generateRokuAssets();
}
